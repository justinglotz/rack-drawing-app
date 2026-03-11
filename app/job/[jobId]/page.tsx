import React from "react";
import { notFound } from "next/navigation";
import EquipmentSidebar from "@/components/equipment/EquipmentSidebar";
import RackDrawingsView from "@/components/rack/RackDrawingsView";
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

  return (
    <div className="flex h-screen overflow-hidden">
      <EquipmentSidebar jobId={jobIdNum} />
      <main className="flex-1 overflow-auto bg-background flex flex-col">
        <header className="border-b border-border px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">{job.name}</h1>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          <RackDrawingsView jobId={jobIdNum} tourShow={job.name} />
        </div>
      </main>
    </div>
  );
}
