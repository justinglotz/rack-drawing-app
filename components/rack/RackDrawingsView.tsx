"use client";

import { useState, useMemo } from "react";
import { useRackDrawings } from "@/hooks/useRackDrawings";
import { PlacedItem } from "@/types/rackDrawingTypes";
import RackDrawing, { RackItem } from "./RackDrawing";
import { Button } from "@/components/ui/button";

interface RackDrawingsViewProps {
  jobId: number;
  tourShow: string;
}

function toRackItem(item: PlacedItem, defaultStartPosition?: number): RackItem {
  const side = item.side ?? "FRONT";
  const startPosition = item.startPosition ?? defaultStartPosition ?? 1;

  return {
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
  sideFilter: "FRONT" | "BACK"
): RackItem[] {
  const placed: RackItem[] = [];
  const unplaced: Array<{ item: PlacedItem; position: number }> = [];

  // Separate placed from unplaced and calculate unplaced positions
  let currentUnplacedPos = 1;
  for (const item of items) {
    const side = item.side ?? "FRONT";
    if (side.includes(sideFilter)) {
      if (item.startPosition !== null && item.startPosition !== undefined) {
        placed.push(toRackItem(item));
      } else {
        unplaced.push({ item, position: currentUnplacedPos });
        currentUnplacedPos += item.rackUnits;
      }
    }
  }

  // Convert unplaced items using calculated positions
  const unplacedRackItems = unplaced.map(({ item, position }) =>
    toRackItem(item, position)
  );

  return [...placed, ...unplacedRackItems];
}

export default function RackDrawingsView({
  jobId,
  tourShow,
}: RackDrawingsViewProps) {
  const { data: racks, isLoading, error } = useRackDrawings(jobId);
  const [activeRackId, setActiveRackId] = useState<number | null>(null);

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

  // Use first rack if activeRackId not set
  const displayRackId = activeRackId ?? sortedRacks[0]?.id;
  const activeRack = sortedRacks.find((r) => r.id === displayRackId);

  if (!activeRack) {
    return null;
  }

  const frontItems = transformItemsWithPositioning(activeRack.placedItems, "FRONT");
  const backItems = transformItemsWithPositioning(activeRack.placedItems, "BACK");

  return (
    <div className="space-y-6">
      {/* Tabs */}
      {sortedRacks.length > 1 && (
        <div className="flex gap-2 border-b border-border">
          {sortedRacks.map((rack) => (
            <Button
              key={rack.id}
              variant={activeRackId === rack.id ? "default" : "ghost"}
              onClick={() => setActiveRackId(rack.id)}
              className="rounded-b-none"
            >
              {rack.name}
            </Button>
          ))}
        </div>
      )}

      {/* Rack Drawing */}
      <RackDrawing
        name={activeRack.name}
        totalSpaces={activeRack.totalSpaces}
        isDoubleWide={activeRack.isDoubleWide}
        tourShow={tourShow}
        frontItems={frontItems}
        backItems={backItems}
        notes={activeRack.notes ?? undefined}
      />
    </div>
  );
}
