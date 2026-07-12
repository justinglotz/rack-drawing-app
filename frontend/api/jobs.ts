import { z } from "zod";
import { apiFetch } from "./client";
import { jobSchema, jobWithRacksSchema, Job, JobWithRacks } from "@/types/jobTypes";

export async function getJob(jobId: number): Promise<Job> {
  return apiFetch(`/jobs/${jobId}`, jobSchema);
}

export async function getJobs(): Promise<JobWithRacks[]> {
  return apiFetch(`/jobs`, z.array(jobWithRacksSchema));
}
