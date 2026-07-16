export type JobType = 
  | "EMAIL"
  | "IMAGE_PROCESSING"
  | "REPORT_GENERATION";

export interface CreateJobDTO {
  type: JobType;
  payload: Record<string, unknown>;
}

export interface QueueJob {
  id: string;
  type: JobType;
  payload: Record<string, unknown>;
}
