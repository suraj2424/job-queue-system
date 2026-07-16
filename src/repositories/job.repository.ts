import { JobStatus, JobType } from "@prisma/client";
import prisma from "../db/prisma";

class JobRepository {
  async create(data: {
    type: JobType;
    payload: object;
    maxAttempts?: number
  }) {
    return prisma.job.create({
      data: {
        type: data.type,
        payload: data.payload,
        maxAttempts: data.maxAttempts ?? 3,
        status: JobStatus.PENDING,
      }
    })
  }

  async findById(id: string) {
    return prisma.job.findUnique({
      where: {
        id
      }
    })
  }

  async update(id: string, data: Partial<{
    status: JobStatus,
    startedAt: Date;
    completedAt: Date;
    failedAt: Date;
    workedId: string;
    result: object;
    error: string;
    attempts: number
  }>) {
    return prisma.job.update({
      where: {
        id
      },
      data,
    })
  }
  
}

export default new JobRepository();