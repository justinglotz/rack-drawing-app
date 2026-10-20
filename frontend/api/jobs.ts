import { z } from "zod";
import { apiFetch } from "./client";
import { jobSchema, jobWithRacksSchema, Job, JobWithRacks } from "@/types/jobTypes";

export async function getJob(jobId: number): Promise<Job> {
  return apiFetch(`/jobs/${jobId}`, jobSchema);
}

export async function getJobs(): Promise<JobWithRacks[]> {
  return apiFetch(`/jobs`, z.array(jobWithRacksSchema));
}

export async function updateJobDates(
  jobId: number,
  dates: { prepDate?: string | null; leaveDate?: string | null },
): Promise<Job> {
  return apiFetch(`/jobs/${jobId}`, jobSchema, {
    method: "PATCH",
    body: JSON.stringify(dates),
  });
}
