# job-queue-system

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run dev
```

This project was created using `bun init` in bun v1.3.6. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.


# Project Basics

## Main Overview
- Create Job (Email, Image Processing, or Report Generation)
- it will get scheduled
- worker starts
- worker completes the job

# Setup

1. initial prisma generation
```bash
bunx prisma init
```

2. Create the table in DB
```bash
bunx prisma migrate dev --name init
```




## Create two `postgres` and `redis` docker containers.



# Quesetions
# Initial Design
## Interviewer: "How would you know if your system is overloaded?"
"I track two separate timestamps — `createdAt` when the job enters, and `startedAt` when a worker picks it up. If the gap between them grows, it means jobs are waiting too long in the queue, signaling I need to scale up workers."


# Service Layer
## Q1. Why save to the database before pushing to the queue?
Answer:
- The database is the source of truth. Persisting the job first ensures that even if queue insertion fails, the job isn't lost and can be retried later.

## Q2. Why update the status after queue insertion?
Answer:
- A job should only be marked as QUEUED after BullMQ successfully accepts it. Updating the status earlier could leave the database inconsistent if the queue operation fails.

