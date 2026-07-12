"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { JobWithRacks } from "@/types/jobTypes";

// Flip this on once #13 (sourcing a real leave date from Flex) lands.
export const SHOW_LEAVE_DATE = false;

const MAX_VISIBLE_RACKS = 4;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatLeaveDateLabel(isoDate: string): string {
  const dt = new Date(isoDate);
  const weekday = WEEKDAYS[dt.getUTCDay()];
  const month = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate();
  const year = String(dt.getUTCFullYear()).slice(2);
  return `${weekday}, ${month}/${day}/${year}`;
}

function rackMeta(rack: JobWithRacks["rackDrawings"][number]): string {
  return `${rack.totalSpaces}U · ${rack.isDoubleWide ? "Double-Wide" : "Single-Wide"}`;
}

interface JobCardProps {
  job: JobWithRacks;
}

export default function JobCard({ job }: JobCardProps) {
  const router = useRouter();
  const visibleRacks = job.rackDrawings.slice(0, MAX_VISIBLE_RACKS);
  const extraRackCount = Math.max(0, job.rackDrawings.length - MAX_VISIBLE_RACKS);

  const openJob = () => router.push(`/job/${job.id}`);
  const openRack = (rackId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/job/${job.id}?rack=${rackId}`);
  };

  return (
    <div
      onClick={openJob}
      title="Open rack drawing"
      className={cn(
        "cursor-pointer rounded-[10px] border border-border bg-card p-3.5",
        "transition-[box-shadow,transform] duration-150 ease-out",
        "hover:shadow-[0_4px_12px_0_rgb(0_0_0_/_0.08)] hover:-translate-y-px",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-h-[35px] text-sm leading-[1.25] font-semibold text-foreground">
          {job.name}
        </div>
        <div className="shrink-0 rounded-full border border-[oklch(0.88_0_0)] bg-muted px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-muted-foreground">
          {job.rackDrawings.length} {job.rackDrawings.length === 1 ? "rack" : "racks"}
        </div>
      </div>

      {SHOW_LEAVE_DATE && (
        <div className="-mx-3.5 mt-2 flex items-baseline gap-1.5 border-y border-[oklch(0.85_0.05_250)] bg-[oklch(0.94_0.03_250)] px-3.5 py-1.5">
          <span className="text-xs font-bold text-[oklch(0.35_0.09_250)]">
            {job.leaveDate ? formatLeaveDateLabel(job.leaveDate) : "—"}
          </span>
          <span className="text-[10px] font-medium text-[oklch(0.45_0.07_250)]">
            leave date
          </span>
        </div>
      )}

      <div className="mt-2.5 flex flex-col gap-1.5">
        {visibleRacks.map((rack) => (
          <div
            key={rack.id}
            onClick={(e) => openRack(rack.id, e)}
            title="Open rack drawing"
            className={cn(
              "flex items-baseline justify-between gap-2 rounded-md border border-[oklch(0.88_0_0)] bg-muted px-2 py-1.5",
              "cursor-pointer transition-colors duration-100 ease-out",
              "hover:bg-[oklch(0.93_0_0)] hover:border-[oklch(0.7_0_0)]",
            )}
          >
            <span className="text-[11px] leading-tight font-medium text-foreground">
              {rack.name}
            </span>
            <span className="font-mono text-[10px] leading-tight whitespace-nowrap text-muted-foreground">
              {rackMeta(rack)}
            </span>
          </div>
        ))}
        {extraRackCount > 0 && (
          <div className="px-2 py-0.5 text-[11px] text-muted-foreground">
            +{extraRackCount} more
          </div>
        )}
      </div>
    </div>
  );
}
