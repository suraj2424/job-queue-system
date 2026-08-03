import type { Request, Response } from "express";
import jobService from "../services/job.service";

class JobController {
  async createJob(req: Request, res: Response) {
    try {
      const job = await jobService.createJob(req.body);

      if (!job) {
        return res.status(500).json({
          success: false,
          message: "Failed to retrieve created job."
        });
      }

      return res.status(201).json({
        success: true,
        data: job
      })
    } catch (e) {
      console.log(e);
      return res.status(500).json({
        success: false,
        message: "Failed to create job."
      });
    }
  }
}

export default new JobController();