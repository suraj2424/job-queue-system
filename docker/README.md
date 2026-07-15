We will run **only PostgreSQL and Redis** via Docker for now. Not the entire app. Just the databases.

Now start both services:

```bash
docker compose -f docker/docker-compose.yml up -d
```

```
-f    → points to our compose file location
-d    → runs in background (detached mode)
```

---

Verify both are running:

```bash
docker ps
```

You should see:
```
jobqueue-postgres   → running
jobqueue-redis      → running
```

---