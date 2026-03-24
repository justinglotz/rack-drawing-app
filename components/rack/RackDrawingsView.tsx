"use client";

import { useState, useMemo } from "react";
import { useRackDrawings, useUpdateRackName } from "@/hooks/useRackDrawings";
import { PlacedItem } from "@/types/rackDrawingTypes";
import RackDrawing, { RackItem } from "./RackDrawing";
import { Button } from "@/components/ui/button";
import { DragDropProvider } from "@dnd-kit/react";
import type { Side } from "@/types/rackDrawingTypes";
import { useMovePlacedItem } from "@/hooks/usePullsheetItems";
interface RackDrawingsViewProps {
  jobId: number;
  tourShow: string;
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

  // Separate placed from unplaced and calculate unplaced positions
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

  // Convert unplaced items using calculated positions
  const unplacedRackItems = unplaced.map(({ item, position }) =>
    toRackItem(item, position, defaultSide),
  );

  return [...placed, ...unplacedRackItems];
}

export default function RackDrawingsView({
  jobId,
  tourShow,
}: RackDrawingsViewProps) {
  const { data: racks, isLoading, error } = useRackDrawings(jobId);
  const updateRackNameMutation = useUpdateRackName(jobId);
  const [activeRackId, setActiveRackId] = useState<number | null>(null);
  const [dragState, setDragState] = useState<{
    itemId: number | null;
    dropId: string | null;
  }>({ itemId: null, dropId: null });
  const movePlacedItemMutation = useMovePlacedItem(jobId, activeRackId ?? 0);

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

  // Use first rack if activeRackId not set
  const displayRackId = activeRackId ?? sortedRacks[0]?.id;
  const activeRack = sortedRacks.find((r) => r.id === displayRackId);

  if (!activeRack) {
    return null;
  }

  // Filter out items with 0 RU (cables, docs, etc.) - they shouldn't render in the rack
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
  const frontLeftItems = frontItems.filter(
    (item) => item.side === "FRONT_LEFT",
  );
  const frontRightItems = frontItems.filter(
    (item) => item.side === "FRONT_RIGHT",
  );
  const backLeftItems = backItems.filter((item) => item.side === "BACK_LEFT");
  const backRightItems = backItems.filter((item) => item.side === "BACK_RIGHT");
  const allItems = [...frontItems, ...backItems];
  const draggedItem = allItems.find((item) => item.id === dragState.itemId);
  const draggedItemSize = draggedItem
    ? draggedItem.endU - draggedItem.startU + 1
    : null;

  const [hoveredSide, hoveredUStr] = dragState.dropId?.split("-") ?? [];
  const hoveredU = hoveredUStr ? parseInt(hoveredUStr) : null;

  return (
    <DragDropProvider
      onDragOver={({ operation }) => {
        setDragState({
          itemId: (operation.source?.id as number) ?? null,
          dropId: (operation.target?.id as string) ?? null,
        });
      }}
      onDragEnd={({ operation }) => {
        const itemId = operation.source?.id as number;
        const dropId = operation.target?.id as string;

        if (itemId && dropId && draggedItemSize !== null) {
          const [side, uStr] = dropId.split("-");
          let startPosition = parseInt(uStr);

          // Prevent item from extending beyond rack boundary
          const maxValidPosition = activeRack.totalSpaces - draggedItemSize + 1;
          if (startPosition > maxValidPosition) {
            startPosition = maxValidPosition;
          }

          movePlacedItemMutation.mutate({
            itemId,
            startPosition,
            side: side as Side,
          });
        }

        setDragState({ itemId: null, dropId: null });
      }}
    >
      <div className="space-y-6">
        {/* Tabs */}
        {sortedRacks.length > 1 && (
          <div className="flex gap-2 border-b border-border">
            {sortedRacks.map((rack) => (
              <Button
                key={rack.id}
                variant={displayRackId === rack.id ? "default" : "ghost"}
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
          frontLeftItems={frontLeftItems}
          frontRightItems={frontRightItems}
          backLeftItems={backLeftItems}
          backRightItems={backRightItems}
          draggedItemSize={draggedItemSize}
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
    </DragDropProvider>
  );
}
