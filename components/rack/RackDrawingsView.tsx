"use client";

import { useMemo } from "react";
import { useRackDrawings, useUpdateRackName } from "@/hooks/useRackDrawings";
import { PlacedItem } from "@/types/rackDrawingTypes";
import RackDrawing, { RackItem } from "./RackDrawing";
import { Button } from "@/components/ui/button";
import type { Side } from "@/types/rackDrawingTypes";

interface RackDrawingsViewProps {
  jobId: number;
  tourShow: string;
  activeRackId: number | null;
  onActiveRackChange: (id: number) => void;
  draggedItemSize: number | null;
  draggedItemId: number | null;
  hoveredDropId: string | null;
}

function toRackItem(
  item: PlacedItem,
  defaultStartPosition?: number,
  defaultSide?: Side,
): RackItem {
  const side = item.side ?? defaultSide ?? "FRONT";
  const startPosition = item.startPosition ?? defaultStartPosition ?? 1;

  return {
    id: item.id,
    name: item.displayNameOverride || item.name,
    startU: startPosition,
    endU: startPosition + item.rackUnits - 1,
    side,
    category: (item.category ?? "default") as
      | "power"
      | "wireless"
      | "network"
      | "console"
      | "generic"
      | "default",
  };
}

function transformItemsWithPositioning(
  items: PlacedItem[],
  sideFilter: "FRONT" | "BACK",
  isDoubleWide: boolean,
): RackItem[] {
  const defaultSide: Side = isDoubleWide
    ? sideFilter === "FRONT"
      ? "FRONT_LEFT"
      : "BACK_LEFT"
    : sideFilter;

  const placed: RackItem[] = [];
  const unplaced: Array<{ item: PlacedItem; position: number }> = [];

  let currentUnplacedPos = 1;
  for (const item of items) {
    const side = item.side ?? "FRONT";
    if (side.includes(sideFilter)) {
      if (item.startPosition !== null && item.startPosition !== undefined) {
        placed.push(toRackItem(item, undefined, defaultSide));
      } else {
        unplaced.push({ item, position: currentUnplacedPos });
        currentUnplacedPos += item.rackUnits;
      }
    }
  }

  const unplacedRackItems = unplaced.map(({ item, position }) =>
    toRackItem(item, position, defaultSide),
  );

  return [...placed, ...unplacedRackItems];
}

export default function RackDrawingsView({
  jobId,
  tourShow,
  activeRackId,
  onActiveRackChange,
  draggedItemSize,
  draggedItemId,
  hoveredDropId,
}: RackDrawingsViewProps) {
  const { data: racks, isLoading, error } = useRackDrawings(jobId);
  const updateRackNameMutation = useUpdateRackName(jobId);

  const sortedRacks = useMemo(() => {
    if (!racks) return [];
    return [...racks].sort((a, b) => a.displayOrder - b.displayOrder);
  }, [racks]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading rack drawings...</p>
      </div>
    );
  }

  if (error) {
    console.log(error);
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-destructive">Failed to load rack drawings</p>
      </div>
    );
  }

  if (!racks || racks.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">No rack drawings available</p>
      </div>
    );
  }

  const displayRackId = activeRackId ?? sortedRacks[0]?.id;
  const activeRack = sortedRacks.find((r) => r.id === displayRackId);

  if (!activeRack) {
    return null;
  }

  const itemsWithRU = activeRack.placedItems.filter(
    (item) => item.rackUnits > 0,
  );

  const frontItems = transformItemsWithPositioning(
    itemsWithRU,
    "FRONT",
    activeRack.isDoubleWide,
  );
  const backItems = transformItemsWithPositioning(
    itemsWithRU,
    "BACK",
    activeRack.isDoubleWide,
  );
  const frontLeftItems = frontItems.filter((item) => item.side === "FRONT_LEFT");
  const frontRightItems = frontItems.filter((item) => item.side === "FRONT_RIGHT");
  const backLeftItems = backItems.filter((item) => item.side === "BACK_LEFT");
  const backRightItems = backItems.filter((item) => item.side === "BACK_RIGHT");

  const [hoveredSide, hoveredUStr] = hoveredDropId?.split("-") ?? [];
  const hoveredU = hoveredUStr ? parseInt(hoveredUStr) : null;

  return (
    <div className="space-y-6">
      {sortedRacks.length > 1 && (
        <div className="flex gap-2 border-b border-border">
          {sortedRacks.map((rack) => (
            <Button
              key={rack.id}
              variant={displayRackId === rack.id ? "default" : "ghost"}
              onClick={() => onActiveRackChange(rack.id)}
              className="rounded-b-none"
            >
              {rack.name}
            </Button>
          ))}
        </div>
      )}

      <RackDrawing
        name={activeRack.name}
        totalSpaces={activeRack.totalSpaces}
        isDoubleWide={activeRack.isDoubleWide}
        tourShow={tourShow}
        frontItems={frontItems}
        backItems={backItems}
        frontLeftItems={frontLeftItems}
        frontRightItems={frontRightItems}
        backLeftItems={backLeftItems}
        backRightItems={backRightItems}
        draggedItemSize={draggedItemSize}
        draggedItemId={draggedItemId}
        hoveredU={hoveredU}
        hoveredSide={(hoveredSide as Side) ?? null}
        notes={activeRack.notes ?? undefined}
        rackId={activeRack.id}
        onNameChange={(newName) =>
          updateRackNameMutation.mutateAsync({
            rackId: activeRack.id,
            name: newName,
          })
        }
      />
    </div>
  );
}
