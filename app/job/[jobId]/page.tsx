import React from "react";
import { notFound } from "next/navigation";
import EquipmentSidebar from "@/components/equipment/EquipmentSidebar";
import RackDrawingsView from "@/components/rack/RackDrawingsView";
import { getJob } from "@/api/jobs";

interface JobPageProps {
  params: Promise<{
    jobId: string;
  }>;
}

export default async function JobPage(props: JobPageProps) {
  const { jobId } = await props.params;
  const jobIdNum = parseInt(jobId, 10);
  if (isNaN(jobIdNum)) {
    notFound();
  }
  const job = await getJob(jobIdNum);

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
