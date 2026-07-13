"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateJobDates } from "@/hooks/useJobs";
import type { JobWithRacks } from "@/types/jobTypes";

export const SHOW_DATES = true;

type DateField = "prepDate" | "leaveDate";

const DATE_FIELD_LABELS: Record<DateField, string> = {
  prepDate: "prep date",
  leaveDate: "leave date",
};

const MAX_VISIBLE_RACKS = 4;
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function formatDateLabel(isoDate: string): string {
  const dt = new Date(isoDate);
  const weekday = WEEKDAYS[dt.getUTCDay()];
  const month = dt.getUTCMonth() + 1;
  const day = dt.getUTCDate();
  const year = String(dt.getUTCFullYear()).slice(2);
  return `${weekday}, ${month}/${day}/${year}`;
}

function toDateInputValue(isoDate: string | null | undefined): string {
  if (!isoDate) return "";
  return isoDate.slice(0, 10);
}

function rackMeta(rack: JobWithRacks["rackDrawings"][number]): string {
  return `${rack.totalSpaces}U · ${rack.isDoubleWide ? "Double-Wide" : "Single-Wide"}`;
}

function EditDateDialog({
  open,
  onOpenChange,
  jobId,
  field,
  currentValue,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  field: DateField;
  currentValue: string | null | undefined;
}) {
  const [value, setValue] = useState(() => toDateInputValue(currentValue));
  const updateDates = useUpdateJobDates();
  const label = DATE_FIELD_LABELS[field];

  const handleSave = () => {
    updateDates.mutate(
      { jobId, [field]: value || null },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="capitalize">Edit {label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={updateDates.isPending}
          />
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={updateDates.isPending}
              className="flex-1"
            >
              Save
            </Button>
            {currentValue && (
              <Button
                variant="outline"
                onClick={() => {
                  setValue("");
                  updateDates.mutate(
                    { jobId, [field]: null },
                    { onSuccess: () => onOpenChange(false) },
                  );
                }}
                disabled={updateDates.isPending}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DateStripe({
  job,
  field,
  onEdit,
}: {
  job: JobWithRacks;
  field: DateField;
  onEdit: () => void;
}) {
  const value = job[field];
  return (
    <div className="group/date -mx-3.5 flex items-baseline gap-1.5 border-b border-[oklch(0.85_0.05_250)] bg-[oklch(0.94_0.03_250)] px-3.5 py-1.5 first:border-t">
      <span className="text-xs font-bold text-[oklch(0.35_0.09_250)]">
        {value ? formatDateLabel(value) : "—"}
      </span>
      <span className="text-[10px] font-medium text-[oklch(0.45_0.07_250)]">
        {DATE_FIELD_LABELS[field]}
      </span>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onEdit();
        }}
        className="ml-auto rounded p-0.5 opacity-0 transition-opacity hover:bg-foreground/10 group-hover/date:opacity-100"
        title={`Edit ${DATE_FIELD_LABELS[field]}`}
      >
        <Pencil className="h-3 w-3 text-[oklch(0.45_0.07_250)]" />
      </button>
    </div>
  );
}

interface JobCardProps {
  job: JobWithRacks;
}

export default function JobCard({ job }: JobCardProps) {
  const router = useRouter();
  const [editingField, setEditingField] = useState<DateField | null>(null);
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
        "hover:shadow-[0_4px_12px_0_rgb(0_0_0/0.08)] hover:-translate-y-px",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-h-8.75 text-sm leading-tight font-semibold text-foreground">
          {job.name}
        </div>
        <div className="shrink-0 rounded-full border border-[oklch(0.88_0_0)] bg-muted px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-muted-foreground">
          {job.rackDrawings.length} {job.rackDrawings.length === 1 ? "rack" : "racks"}
        </div>
      </div>

      {SHOW_DATES && (
        <div className="mt-2">
          <DateStripe job={job} field="prepDate" onEdit={() => setEditingField("prepDate")} />
          <DateStripe job={job} field="leaveDate" onEdit={() => setEditingField("leaveDate")} />
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

      {SHOW_DATES && editingField && (
        <EditDateDialog
          open={!!editingField}
          onOpenChange={(open) => !open && setEditingField(null)}
          jobId={job.id}
          field={editingField}
          currentValue={job[editingField]}
        />
      )}
    </div>
  );
}
