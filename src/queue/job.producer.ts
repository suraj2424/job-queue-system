import type { JobsOptions } from "bullmq";
import { jobQueue } from "./queue.config";
import type { QueueJob } from "../types/job.types";

class JobProducer{
  async addJob(job: QueueJob, options?: JobsOptions) {
    return await jobQueue.add(
      job.type, // BullMQ job name
      job, // job data
      options
    );
  }
}

export default new JobProducer();

