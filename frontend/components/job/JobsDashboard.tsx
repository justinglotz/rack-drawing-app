"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useJobs } from "@/hooks/useJobs";
import JobCard, { SHOW_LEAVE_DATE } from "./JobCard";
import type { JobWithRacks } from "@/types/jobTypes";

type SortMode = "name" | "leave";

function sortJobs(jobs: JobWithRacks[], sort: SortMode): JobWithRacks[] {
  const sorted = [...jobs];
  if (sort === "leave") {
    sorted.sort((a, b) => {
      if (!a.leaveDate && !b.leaveDate) return a.name.localeCompare(b.name);
      if (!a.leaveDate) return 1;
      if (!b.leaveDate) return -1;
      return a.leaveDate.localeCompare(b.leaveDate);
    });
  } else {
    sorted.sort((a, b) => a.name.localeCompare(b.name));
  }
  return sorted;
}

export default function JobsDashboard() {
  const { data: jobs, isLoading } = useJobs();
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortMode>("name");

  const visibleJobs = useMemo(() => {
    const list = jobs ?? [];
    const filtered = query
      ? list.filter((job) => job.name.toLowerCase().includes(query.toLowerCase()))
      : list;
    return sortJobs(filtered, sort);
  }, [jobs, query, sort]);

  return (
    <div className="min-h-screen bg-[oklch(0.965_0_0)] p-8">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <div className="text-xl font-bold tracking-[-0.01em] text-foreground">Jobs</div>
          <div className="text-xs text-muted-foreground">
            {jobs ? `${visibleJobs.length} jobs` : " "}
          </div>
        </div>
        <Button size="sm" className="h-8" asChild>
          <Link href="/import">Import Job</Link>
        </Button>
      </div>

      <div className="mb-5 flex items-center gap-2.5">
        <Input
          type="text"
          placeholder="Search jobs…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 max-w-65 flex-1"
        />
        {SHOW_LEAVE_DATE && (
          <>
            <span className="ml-auto text-[11px] font-medium text-muted-foreground">
              Sort by
            </span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortMode)}
              className="h-8 cursor-pointer rounded-md border border-border bg-card px-2 text-sm text-foreground"
            >
              <option value="name">Name</option>
              <option value="leave">Leave Date</option>
            </select>
          </>
        )}
      </div>

      {!isLoading && visibleJobs.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {visibleJobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {!isLoading && jobs && visibleJobs.length === 0 && (
        <div className="py-12.5 text-center text-sm text-muted-foreground">
          No jobs match &quot;{query}&quot;
        </div>
      )}
    </div>
  );
}
