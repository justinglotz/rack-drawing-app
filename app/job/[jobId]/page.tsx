import React from "react";
import { notFound } from "next/navigation";
import JobLayout from "@/components/job/JobLayout";
import { getJob } from "@/api/jobs";

interface JobPageProps {
  params: {
    jobId: string;
  };
}

export default async function JobPage({ params }: JobPageProps) {
  const { jobId } = await params;

  // Validate jobId is strictly digits-only (no partial matches like "12abc")
  if (!/^\d+$/.test(jobId)) {
    notFound();
  }

  const jobIdNum = parseInt(jobId, 10);
  // Ensure jobId is a positive integer
  if (jobIdNum <= 0) {
    notFound();
  }

  let job;
  try {
    job = await getJob(jobIdNum);
  } catch (error) {
    // Check if error has a status property (from apiFetch)
    if (
      error instanceof Error &&
      "status" in error &&
      (error as Error & { status: number }).status === 404
    ) {
      notFound();
    }
    throw error;
  }

  return <JobLayout jobId={jobIdNum} jobName={job.name} />;
}
