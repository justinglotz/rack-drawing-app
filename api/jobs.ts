import { apiFetch } from "./client";
import { jobSchema, Job } from "@/types/jobTypes";

export async function getJob(jobId: number): Promise<Job> {
  return apiFetch(`/jobs/${jobId}`, jobSchema);
}
