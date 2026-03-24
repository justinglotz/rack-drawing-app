import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import type { Side } from "@/types/rackDrawingTypes";
import { useDraggable, useDroppable } from "@dnd-kit/react";

export interface RackItem {
  id: number;
  name: string;
  startU: number;
  endU: number;
  side: Side;
  italic?: boolean;
  category?:
    | "power"
    | "wireless"
    | "network"
    | "console"
    | "generic"
    | "default";
}

export interface RackDrawingProps {
  name: string;
  totalSpaces: number;
  isDoubleWide?: boolean;
  tourShow: string;
  frontItems: RackItem[];
  backItems: RackItem[];
  frontLeftItems?: RackItem[];
  frontRightItems?: RackItem[];
  backLeftItems?: RackItem[];
  backRightItems?: RackItem[];
  notes?: string;
  rackId?: number;
  draggedItemSize?: number | null;
  hoveredU?: number | null;
  hoveredSide?: Side | null;
  onNameChange?: (newName: string) => Promise<unknown>;
}

const ROW_HEIGHT = 32;

const categoryColors: Record<string, string> = {
  power: "bg-rack-item-power",
  wireless: "bg-rack-item-wireless",
  network: "bg-rack-item-network",
  console: "bg-rack-item-console",
  generic: "bg-rack-item-generic",
  default: "bg-rack-item-default",
};

function getItemPosition(): { left: string; width: string } {
  return { left: "0", width: "100%" };
}

function NumberColumn({ rackSize }: { rackSize: number }) {
  return (
    <div>
      {Array.from({ length: rackSize }, (_, i) => (
        <div
          key={i}
          className={`flex items-center justify-center text-[11px] font-mono text-rack-number border-b border-rack-border ${
            i % 2 === 0 ? "bg-rack-row" : "bg-rack-row-alt"
          }`}
          style={{ height: ROW_HEIGHT }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

function DraggableRackItem({ item }: { item: RackItem }) {
  const { ref } = useDraggable({ id: item.id });
  const span = item.endU - item.startU + 1;
  const colorClass = categoryColors[item.category ?? "default"];
  const { left, width } = getItemPosition();

  return (
    <div
      ref={ref}
      className={`absolute ${colorClass} border border-foreground/30 flex items-center justify-center text-sm font-medium text-foreground/90 z-10`}
      style={{
        top: (item.startU - 1) * ROW_HEIGHT,
        height: span * ROW_HEIGHT,
        left,
        width,
      }}
    >
      <span className={item.italic ? "italic text-muted-foreground" : ""}>
        {item.name}
      </span>
    </div>
  );
}

function DroppableRow({ index, side }: { index: number; side: Side }) {
  const { ref } = useDroppable({
    id: `${side}-${index + 1}`,
  });

  return (
    <div
      ref={ref}
      className={`absolute left-0 right-0 border-b border-rack-border ${
        index % 2 === 0 ? "bg-rack-row" : "bg-rack-row-alt"
      }`}
      style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT }}
    />
  );
}

function RackColumn({
  items,
  rackSize,
  side,
  draggedItemSize,
  hoveredU,
}: {
  items: RackItem[];
  rackSize: number;
  side: Side;
  draggedItemSize?: number | null;
  hoveredU?: number | null;
}) {
  // Determine if item should be positioned in left or right lane
  const previewStart = hoveredU ?? null;
  const maxValidPosition = draggedItemSize ? rackSize - draggedItemSize + 1 : null;
  const clampedPreviewStart =
    previewStart && maxValidPosition ? Math.min(previewStart, maxValidPosition) : previewStart;
  const previewEnd =
    clampedPreviewStart && draggedItemSize
      ? clampedPreviewStart + draggedItemSize - 1
      : null;

  return (
    <div className="relative" style={{ height: rackSize * ROW_HEIGHT }}>
      {Array.from({ length: rackSize }, (_, i) => (
        <DroppableRow key={i} index={i} side={side} />
      ))}
      {clampedPreviewStart && previewEnd && (
        <div
          className="absolute left-0 right-0 bg-rack-drop-target z-20 pointer-events-none"
          style={{
            top: (clampedPreviewStart - 1) * ROW_HEIGHT,
            height: (previewEnd - clampedPreviewStart + 1) * ROW_HEIGHT,
          }}
        />
      )}
      {items.map((item) => (
        <DraggableRackItem key={item.id} item={item} />
      ))}
    </div>
  );
}

export default function RackDrawing({
  name,
  totalSpaces,
  isDoubleWide,
  tourShow,
  frontItems,
  backItems,
  frontLeftItems,
  frontRightItems,
  backLeftItems,
  backRightItems,
  notes,
  rackId,
  onNameChange,
  draggedItemSize,
  hoveredU,
  hoveredSide,
}: RackDrawingProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(name);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditName(name);
  }, [name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (!editName.trim() || editName === name || !onNameChange) {
      setIsEditing(false);
      setEditName(name);
      return;
    }

    setIsSaving(true);
    try {
      await onNameChange(editName.trim());
      setIsEditing(false);
    } catch {
      setEditName(name);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditName(name);
    }
  };

  if (isDoubleWide) {
    return (
      <div
        className={`bg-card border border-border rounded-xl overflow-hidden shadow-lg print:shadow-none ${isDoubleWide ? "max-w-6xl" : "max-w-4xl"}`}
      >
        {/* Header */}
        <div className="grid grid-cols-2 border-b border-border">
          <div className="p-5 border-r border-border">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Type
            </div>
            <div className="text-base font-semibold text-foreground mt-1">
              {totalSpaces}-Space {isDoubleWide ? "Double-Wide" : "Single-Wide"}{" "}
              Rack
            </div>
          </div>
          <div className="p-5 group">
            <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
              Rack
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  ref={inputRef}
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isSaving}
                  className="flex-1 px-2 py-1 bg-muted border border-border rounded text-base font-semibold text-foreground disabled:opacity-50"
                />
                <button
                  onClick={handleSave}
                  disabled={isSaving || !editName.trim() || editName === name}
                  className="p-1.5 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  title="Save"
                >
                  <Check className="h-4 w-4 text-green-600" />
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(name);
                  }}
                  disabled={isSaving}
                  className="p-1.5 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                  title="Cancel"
                >
                  <X className="h-4 w-4 text-destructive" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 mt-1">
                <div className="text-base font-semibold text-primary">
                  {name}
                </div>
                {onNameChange && rackId && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted print:hidden"
                    title="Rename rack"
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
        {/* Tour/Show */}
        <div className="px-5 py-4 border-b border-border bg-rack-header">
          <div className="text-xl font-semibold text-foreground">
            {tourShow}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-1">
            Tour/Show
          </div>
        </div>
        {/* Column headers + Rack body */}
        <div className="flex gap-6 p-4">
          {/* Front panel */}
          <div className="flex-1 border border-border rounded overflow-hidden">
            <div className="text-center py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-rack-header border-b border-border">
              Front
            </div>
            <div className="grid grid-cols-[2.5rem_1fr_1fr]">
              <div className="border-r border-rack-border">
                <NumberColumn rackSize={totalSpaces} />
              </div>
              <div className="border-r border-rack-border">
                <RackColumn
                  items={frontLeftItems ?? []}
                  rackSize={totalSpaces}
                  side="FRONT_LEFT"
                  draggedItemSize={draggedItemSize}
                  hoveredU={hoveredSide === "FRONT_LEFT" ? hoveredU : null}
                />
              </div>
              <div>
                <RackColumn
                  items={frontRightItems ?? []}
                  rackSize={totalSpaces}
                  side="FRONT_RIGHT"
                  draggedItemSize={draggedItemSize}
                  hoveredU={hoveredSide === "FRONT_RIGHT" ? hoveredU : null}
                />
              </div>
            </div>
          </div>

          {/* Back panel */}
          <div className="flex-1 border border-border rounded overflow-hidden">
            <div className="text-center py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground bg-rack-header border-b border-border">
              Back
            </div>
            <div className="grid grid-cols-[2.5rem_1fr_1fr]">
              <div className="border-r border-rack-border">
                <NumberColumn rackSize={totalSpaces} />
              </div>
              <div className="border-r border-rack-border">
                <RackColumn
                  items={backLeftItems ?? []}
                  rackSize={totalSpaces}
                  side="BACK_LEFT"
                  draggedItemSize={draggedItemSize}
                  hoveredU={hoveredSide === "BACK_LEFT" ? hoveredU : null}
                />
              </div>
              <div>
                <RackColumn
                  items={backRightItems ?? []}
                  rackSize={totalSpaces}
                  side="BACK_RIGHT"
                  draggedItemSize={draggedItemSize}
                  hoveredU={hoveredSide === "BACK_RIGHT" ? hoveredU : null}
                />
              </div>
            </div>
          </div>
        </div>
        {/* Notes */}
        {notes && (
          <div className="border-t-2 border-foreground/30 p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Additional Info
            </div>
            <div className="text-sm text-foreground font-mono">{notes}</div>
          </div>
        )}
      </div>
    );
  }
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-lg max-w-4xl print:shadow-none">
      {/* Header */}
      <div className="grid grid-cols-2 border-b border-border">
        <div className="p-5 border-r border-border">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            Type
          </div>
          <div className="text-base font-semibold text-foreground mt-1">
            {totalSpaces}-Space {isDoubleWide ? "Double-Wide" : "Single-Wide"}{" "}
            Rack
          </div>
        </div>
        <div className="p-5 group">
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
            Rack
          </div>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                ref={inputRef}
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                className="flex-1 px-2 py-1 bg-muted border border-border rounded text-base font-semibold text-foreground disabled:opacity-50"
              />
              <button
                onClick={handleSave}
                disabled={isSaving || !editName.trim() || editName === name}
                className="p-1.5 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                title="Save"
              >
                <Check className="h-4 w-4 text-green-600" />
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditName(name);
                }}
                disabled={isSaving}
                className="p-1.5 rounded-full hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                title="Cancel"
              >
                <X className="h-4 w-4 text-destructive" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 mt-1">
              <div className="text-base font-semibold text-primary">{name}</div>
              {onNameChange && rackId && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted print:hidden"
                  title="Rename rack"
                >
                  <Pencil className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tour/Show */}
      <div className="px-5 py-4 border-b border-border bg-rack-header">
        <div className="text-xl font-semibold text-foreground">{tourShow}</div>
        <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mt-1">
          Tour/Show
        </div>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[2.5rem_1fr_2rem_1fr] border-b border-border bg-rack-header">
        <div />
        <div className="text-center py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Front
        </div>
        <div />
        <div className="text-center py-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Back
        </div>
      </div>

      {/* Rack body */}
      <div className="grid grid-cols-[2.5rem_1fr_2rem_1fr]">
        <div className="border-r border-rack-border">
          <NumberColumn rackSize={totalSpaces} />
        </div>
        <div>
          <RackColumn
            items={frontItems}
            rackSize={totalSpaces}
            side="FRONT"
            draggedItemSize={draggedItemSize}
            hoveredU={hoveredSide === "FRONT" ? hoveredU : null}
          />
        </div>
        <div className="border-l border-r border-rack-border">
          <NumberColumn rackSize={totalSpaces} />
        </div>
        <div>
          <RackColumn
            items={backItems}
            rackSize={totalSpaces}
            side="BACK"
            draggedItemSize={draggedItemSize}
            hoveredU={hoveredSide === "BACK" ? hoveredU : null}
          />
        </div>
      </div>

      {/* Notes */}
      {notes && (
        <div className="border-t-2 border-foreground/30 p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Additional Info
          </div>
          <div className="text-sm text-foreground font-mono">{notes}</div>
        </div>
      )}
    </div>
  );
}
