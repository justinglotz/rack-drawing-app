"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DragDropProvider } from "@dnd-kit/react";
import { toast } from "sonner";
import EquipmentSidebar from "@/components/equipment/EquipmentSidebar";
import RackDrawingsView from "@/components/rack/RackDrawingsView";
import { useRackDrawings } from "@/hooks/useRackDrawings";
import { usePlacePullsheetItem, useMovePlacedItem, usePlaceGenericEquipment } from "@/hooks/usePullsheetItems";
import { hasOverlap } from "@/components/rack/rackUtils";
import type { RackItem } from "@/components/rack/RackDrawing";
import type { Side } from "@/types/rackDrawingTypes";

interface JobLayoutProps {
  jobId: number;
  jobName: string;
  initialRackId?: number | null;
}

interface DragState {
  draggedItemId: number | null;
  draggedItemSize: number | null;
  dropId: string | null;
}

export default function JobLayout({ jobId, jobName, initialRackId }: JobLayoutProps) {
  const [activeRackId, setActiveRackId] = useState<number | null>(initialRackId ?? null);
  const [dragState, setDragState] = useState<DragState>({
    draggedItemId: null,
    draggedItemSize: null,
    dropId: null,
  });

  const { data: racks } = useRackDrawings(jobId);
  const placePullsheetItemMutation = usePlacePullsheetItem(jobId);
  const placeGenericEquipmentMutation = usePlaceGenericEquipment(jobId);
  const movePlacedItemMutation = useMovePlacedItem(jobId, activeRackId ?? 0);

  const sortedRacks = useMemo(() => {
    if (!racks) return [];
    return [...racks].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [racks]);

  const displayRackId = activeRackId ?? sortedRacks[0]?.id;
  const activeRack = sortedRacks.find((r) => r.id === displayRackId);

  // Flat list of rack items with positions — used for overlap detection on drag
  const allRackItems = useMemo((): RackItem[] => {
    if (!activeRack) return [];
    return activeRack.placedItems
      .filter((item) => item.rackUnits > 0 && item.startPosition !== null)
      .map((item) => ({
        id: item.id,
        name: item.displayNameOverride ?? item.name,
        startU: item.startPosition!,
        endU: item.startPosition! + item.rackUnits - 1,
        side: (item.side ?? "FRONT") as Side,
      }));
  }, [activeRack]);

  return (
    <DragDropProvider
      onDragOver={({ operation }) => {
        const sourceId = operation.source?.id;
        const targetId = (operation.target?.id as string) ?? null;

        if (typeof sourceId === "string" && sourceId.startsWith("sidebar-")) {
          const data = operation.source?.data as { rackUnits: number };
          setDragState({
            draggedItemId: null,
            draggedItemSize: data?.rackUnits ?? null,
            dropId: targetId,
          });
        } else {
          const numId = sourceId as number;
          const placedItem = activeRack?.placedItems.find((i) => i.id === numId);
          setDragState({
            draggedItemId: numId ?? null,
            draggedItemSize: placedItem?.rackUnits ?? null,
            dropId: targetId,
          });
        }
      }}
      onDragEnd={({ operation }) => {
        const sourceId = operation.source?.id;
        const dropId = (operation.target?.id as string) ?? null;

        if (sourceId && dropId && dragState.draggedItemSize === 0) {
          toast.info("This item is not rack-mounted and can't be placed in the rack.");
          setDragState({ draggedItemId: null, draggedItemSize: null, dropId: null });
          return;
        }

        if (sourceId && dropId && dragState.draggedItemSize !== null && activeRack) {
          const [sideStr, uStr] = dropId.split("-");
          const side = sideStr as Side;
          let startPosition = parseInt(uStr);

          const maxValidPosition = activeRack.totalSpaces - dragState.draggedItemSize + 1;
          if (startPosition > maxValidPosition) {
            startPosition = maxValidPosition;
          }
          const endPosition = startPosition + dragState.draggedItemSize - 1;
          const sideItems = allRackItems.filter((item) => item.side === side);

          if (typeof sourceId === "string" && sourceId.startsWith("sidebar-pullsheet-")) {
            const itemId = parseInt(sourceId.replace("sidebar-pullsheet-", ""));
            if (!hasOverlap(startPosition, endPosition, sideItems, null)) {
              placePullsheetItemMutation.mutate({ itemId, rackDrawingId: activeRack.id, startPosition, side });
            }
          } else if (typeof sourceId === "string" && sourceId.startsWith("sidebar-generic-")) {
            const genericEquipmentId = parseInt(sourceId.replace("sidebar-generic-", ""));
            if (!hasOverlap(startPosition, endPosition, sideItems, null)) {
              placeGenericEquipmentMutation.mutate({ genericEquipmentId, rackDrawingId: activeRack.id, startPosition, side });
            }
          } else {
            const itemId = sourceId as number;
            if (!hasOverlap(startPosition, endPosition, sideItems, itemId)) {
              movePlacedItemMutation.mutate({ itemId, startPosition, side });
            }
          }
        }

        setDragState({ draggedItemId: null, draggedItemSize: null, dropId: null });
      }}
    >
      <div className="flex h-screen overflow-hidden">
        <EquipmentSidebar jobId={jobId} />
        <main className="flex-1 overflow-auto bg-background flex flex-col">
          <header className="border-b border-border px-6 py-4">
            <Link
              href="/"
              className="mb-2 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="size-4" />
              Jobs
            </Link>
            <h1 className="text-2xl font-bold text-foreground">{jobName}</h1>
          </header>
          <div className="flex-1 p-6 overflow-auto">
            <RackDrawingsView
              jobId={jobId}
              tourShow={jobName}
              activeRackId={activeRackId}
              onActiveRackChange={setActiveRackId}
              draggedItemSize={dragState.draggedItemSize}
              draggedItemId={dragState.draggedItemId}
              hoveredDropId={dragState.dropId}
            />
          </div>
        </main>
      </div>
    </DragDropProvider>
  );
}
