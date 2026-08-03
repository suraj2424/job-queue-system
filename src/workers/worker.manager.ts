import { Worker } from "bullmq";
import emailProcessor from "./processors/email.processor";
import { config } from "../config/env";

const worker = new Worker(
    "job-queue",
    async (job) => {
      if (job.name === "EMAIL") {
        await emailProcessor.process(job);
      }
    },
    {
        connection: {
            host: config.redis.host,
            port: Number(config.redis.port),
        },
    }
);

worker.on("ready", () => {
    console.log("✅ Worker is ready.");
});

worker.on("error", (error) => {
    console.error("Worker Error:", error);
});

export default worker;