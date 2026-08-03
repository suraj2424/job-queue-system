import jobRepository from "../repositories/job.repository";
import jobProducer from "../queue/job.producer";
import { JobStatus } from "@prisma/client";
import type { CreateJobDTO } from "../types/job.types";

class JobService {
  async createJob(job: CreateJobDTO) {
    // Step 1: save in database
    const createdJob = await jobRepository.create({
      type: job.type,
      payload: job.payload
    })

    // Step 2: Push into BullMQ
    await jobProducer.addJob({
      id: createdJob.id,
      type: createdJob.type,
      payload: createdJob.payload as Record<string,unknown>
    })

    await jobRepository.update(createdJob.id, {
      status: JobStatus.QUEUED
    })

    const latestJob = await jobRepository.findById(createdJob.id);
    
    return latestJob;
  }
}

export default new JobService();