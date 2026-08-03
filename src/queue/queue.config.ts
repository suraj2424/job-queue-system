import { Queue } from "bullmq"
import { config } from "../config/env";

export const jobQueue = new Queue("job-queue", {
  connection: {
    host: config.redis.host,
    port: Number(config.redis.port),
    maxRetriesPerRequest: null
  }
});