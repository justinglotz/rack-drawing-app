import React from "react";

interface JobPageProps {
  params: Promise<{
    jobId: string;
  }>;
}

export default async function JobPage({ params }: JobPageProps) {
  const { jobId } = await params;

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Job Details</h1>
      <div className="bg-card border rounded-lg p-6">
        <p className="text-lg">
          <span className="font-semibold">Job ID:</span> {jobId}
        </p>
      </div>
    </div>
  );
}
