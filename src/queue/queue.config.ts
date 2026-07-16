import { Queue } from "bullmq"

export const jobQueue = new Queue("job-queue", {
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    maxRetriesPerRequest: null
  }
});