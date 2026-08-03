# Job Queue System

A production-grade, distributed job queue system built with **TypeScript**, **Bun**, **Express**, **BullMQ**, **Redis**, and **PostgreSQL**. Designed for reliability, observability, and horizontal scalability.

---

## Architecture Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│   Express   │────▶│  PostgreSQL │────▶│    BullMQ   │
│  (HTTP)     │     │   API       │     │  (Source of │     │    Queue    │
└─────────────┘     └─────────────┘     │   Truth)    │     │    (Redis)  │
                                        └─────────────┘     └──────┬──────┘
                                                                     │
                                               ┌─────────────────────┘
                                               ▼
                                        ┌─────────────┐
                                        │   Workers   │
                                        │ (BullMQ     │
                                        │  Workers)   │
                                        └──────┬──────┘
                                               │
                    ┌──────────────────────────┼──────────────────────────┐
                    ▼                          ▼                          ▼
            ┌───────────────┐          ┌───────────────┐          ┌───────────────┐
            │EmailProcessor │          │ImageProcessor │          │ReportProcessor│
            └───────────────┘          └───────────────┘          └───────────────┘
```

### Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **DB-first persistence** | Job is saved to PostgreSQL *before* queue insertion. Guarantees no job loss if Redis is temporarily unavailable. |
| **Status transition: PENDING → QUEUED** | Status only flips to `QUEUED` after BullMQ acknowledges the job. Prevents phantom "queued" jobs if enqueue fails. |
| **Optimistic locking via `attempts` / `maxAttempts`** | Built-in retry semantics; workers increment `attempts` on failure, move to `DEAD_LETTERED` after exhaustion. |
| **Separate timestamps (`createdAt`, `queuedAt`, `startedAt`, `completedAt`)** | Enables SLA monitoring, queue-depth alerting, and bottleneck detection. |
| **Typed job payloads via `Json` + DTOs** | Type-safe contracts between API, queue, and workers. |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | **Bun** (v1.3+) |
| API Framework | **Express 5** (TypeScript) |
| Queue | **BullMQ 5** (Redis-backed) |
| Database | **PostgreSQL** via **Prisma ORM** |
| Config | **dotenv** (12-factor) |
| Observability | Structured console logging (ready for Pino/Winston) |

---

## Project Structure

```
src/
├─ api/
│  └─ routes/
│     ├─ health.routes.ts    # Health / readiness endpoints
│     └─ job.routes.ts       # POST /jobs
├─ config/
│  ├─ env.ts                 # Validated environment config
│  └─ redis.ts               # Redis connection helper
├─ controllers/
│  └─ job.controller.ts      # Request/response handling
├─ db/
│  └─ prisma.ts              # Prisma client singleton (pg adapter)
├─ queue/
│  ├─ job.producer.ts        # Enqueue jobs into BullMQ
│  └─ queue.config.ts        # BullMQ Queue instance
├─ repositories/
│  └─ job.repository.ts      # Data access (create, find, update)
├─ services/
│  └─ job.service.ts         # Business logic (orchestration)
├─ types/
│  └─ job.types.ts           # Shared DTOs & discriminated unions
├─ workers/
│  ├─ worker.manager.ts      # BullMQ Worker bootstrap
│  └─ processors/
│     ├─ email.processor.ts
│     ├─ image.processor.ts
│     └─ report.processor.ts
├─ index.ts                  # App entrypoint (Express + Worker)
└─ (generated Prisma client)
```

---

## Getting Started

### Prerequisites

- **Bun** ≥ 1.3
- **PostgreSQL** ≥ 15
- **Redis** ≥ 7

### Environment Variables

Create a `.env` file at the project root:

```bash
# Application
PORT=3000
NODE_ENV=development

# PostgreSQL (Prisma uses DATABASE_URL)
DATABASE_URL="postgresql://user:pass@localhost:5432/job_queue?schema=public"

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Installation & Setup

```bash
# 1. Install dependencies
bun install

# 2. Generate Prisma Client
bunx prisma generate

# 3. Run migrations (creates tables + indexes)
bunx prisma migrate dev --name init

# 4. Start the API + Worker (single process for dev)
bun run dev
```

The server starts on `http://localhost:3000` and the worker begins polling `job-queue` immediately.

---

## API Reference

### Create a Job

```http
POST /jobs
Content-Type: application/json

{
  "type": "EMAIL",                    # EMAIL | IMAGE_PROCESSING | REPORT_GENERATION
  "payload": {                        # Arbitrary JSON, validated per type
    "to": "user@example.com",
    "subject": "Welcome",
    "body": "Hello!"
  }
}
```

#### Success Response (201)

```json
{
  "success": true,
  "data": {
    "id": "c1a2b3d4-...",
    "type": "EMAIL",
    "status": "QUEUED",
    "payload": { "to": "user@example.com", "subject": "Welcome", "body": "Hello!" },
    "result": null,
    "error": null,
    "attempts": 0,
    "maxAttempts": 3,
    "workerId": null,
    "queuedAt": "2025-01-15T10:30:00.000Z",
    "startedAt": null,
    "completedAt": null,
    "failedAt": null,
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2025-01-15T10:30:00.000Z"
  }
}
```

#### Error Response (400 / 500)

```json
{ "success": false, "message": "Invalid job type" }
```

### Health Check

```http
GET /
```

```json
{
  "message": "Job Queue System API is running",
  "endpoints": {
    "POST /jobs": "Create a new job",
    "GET /": "Health check"
  }
}
```

---

## Job Lifecycle & Statuses

```
PENDING ──(enqueued)──▶ QUEUED ──(worker picks up)──▶ PROCESSING
                                                              │
                                                 ┌────────────┴────────────┐
                                                 ▼                         ▼
                                            COMPLETED                 FAILED
                                                 │                         │
                                                 │              (attempts < maxAttempts)
                                                 │                         │
                                                 └───────────┬─────────────┘
                                                             ▼
                                                      (re-queued)
                                                             │
                                              ┌──────────────┴──────────────┐
                                              ▼                             ▼
                                         QUEUED                        DEAD_LETTERED
```

| Status | Meaning |
|--------|---------|
| `PENDING` | Row created, not yet pushed to queue |
| `QUEUED` | Accepted by BullMQ, waiting for worker |
| `PROCESSING` | Worker actively executing |
| `COMPLETED` | Finished successfully; `result` populated |
| `FAILED` | Error thrown; `error` populated, `attempts` incremented |
| `DEAD_LETTERED` | `attempts >= maxAttempts`; requires manual intervention |

---

## Workers & Processors

Each job type has a dedicated processor under `src/workers/processors/`.

### Adding a New Job Type

1. **Extend `JobType` enum** in `prisma/schema.prisma`
2. **Run migration**: `bunx prisma migrate dev --name add_<type>`
3. **Create processor** in `src/workers/processors/<type>.processor.ts`:
   ```ts
   export class MyProcessor {
     async process(job: Job) {
       // 1. Update status → PROCESSING, set startedAt
       // 2. Execute business logic
       // 3. On success: update → COMPLETED, set result, completedAt
       // 4. On error: update → FAILED, set error, increment attempts
     }
   }
   ```
4. **Register in `worker.manager.ts`**:
   ```ts
   if (job.name === "MY_TYPE") {
     await myProcessor.process(job);
   }
   ```
5. **Add DTO validation** in `src/types/job.types.ts` (optional but recommended).

---

## Observability & Operations

### Key Metrics to Monitor

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| Queue depth (`QUEUED` count) | `prisma.job.count({ where: { status: 'QUEUED' }})` | > 10k |
| Avg wait time (`startedAt - queuedAt`) | DB aggregation | > 30s |
| Failure rate (`FAILED` / total) | DB aggregation | > 5% |
| Dead-letter count | `prisma.job.count({ where: { status: 'DEAD_LETTERED' }})` | > 0 |
| Worker lag (BullMQ `waiting` vs `active`) | BullMQ metrics | growing |

### Useful Prisma Queries

```bash
# Stuck jobs (queued > 5 min, no worker picked up)
bunx prisma db execute --stdin <<'SQL'
SELECT * FROM "Job"
WHERE status = 'QUEUED' AND "queuedAt" < NOW() - INTERVAL '5 minutes';
SQL

# Retry dead-lettered jobs (reset for reprocessing)
bunx prisma db execute --stdin <<'SQL'
UPDATE "Job"
SET status = 'QUEUED', attempts = 0, error = NULL, "failedAt" = NULL
WHERE status = 'DEAD_LETTERED';
SQL
```

---

## Production Checklist

- [ ] **Enable structured logging** (Pino/Winston) with correlation IDs
- [ ] **Add request validation** (Zod/Valibot) in `job.routes.ts`
- [ ] **Implement graceful shutdown** (SIGTERM → drain worker, close Prisma, close Redis)
- [ ] **Configure BullMQ `maxRetriesPerRequest: null`** (already set) + `removeOnComplete/removeOnFail` limits
- [ ] **Set up Redis persistence** (AOF/RDB) + replication
- [ ] **Run PostgreSQL with connection pooling** (PgBouncer) for high concurrency
- [ ] **Add API authentication/authorization** (JWT, API keys)
- [ ] **Implement rate limiting** (express-rate-limit)
- [ ] **Add OpenTelemetry tracing** (BullMQ + Express + Prisma instrumentations)
- [ ] **Write integration tests** (Testcontainers for Postgres/Redis)
- [ ] **Containerize** (multi-stage Dockerfile, `bun` base image)
- [ ] **Deploy with health checks** (`GET /` for liveness, DB+Redis ping for readiness)

---

## Scripts

```bash
bun run dev          # Watch mode (API + Worker)
bun run build        # Compile (if using bun build)
bunx prisma studio   # Visual DB browser
bunx prisma migrate deploy  # Production migrations
```

---

## License

MIT — feel free to use, modify, and distribute.