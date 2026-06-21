"use client";

import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useUnplacedItems } from "@/hooks/usePullsheetItems";
import { useGenericEquipment } from "@/hooks/useGenericEquipment";
import { useDraggable } from "@dnd-kit/react";
import { PullsheetItem } from "@/types/jobTypes";

// A grouped row: N unplaced records of the same equipment type collapsed into one
interface GroupedItem {
  representativeId: number;
  flexResourceId: string;
  name: string;
  displayName?: string | null;
  rackUnits: number;
  count: number;
  parentId?: number | null;
  children?: GroupedItem[];
  sourceType: "pullsheet" | "generic";
  // For generic items the representativeId is the genericEquipmentId
}

interface EquipmentSection {
  label: string;
  items: GroupedItem[];
}

function DraggablePullsheetRow({
  item,
  depth,
  isHighlighted,
  onMouseEnter,
  onMouseLeave,
}: {
  item: GroupedItem;
  depth: number;
  isHighlighted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { ref } = useDraggable({
    id: `sidebar-pullsheet-${item.representativeId}`,
    data: { rackUnits: item.rackUnits, itemId: item.representativeId },
  });

  return (
    <div
      ref={ref}
      style={{
        paddingLeft: `${12 + depth * 16}px`,
        ...(depth > 0 && {
          borderLeft: "2px solid hsl(var(--primary) / 0.2)",
        }),
      }}
      className={`flex items-center gap-2 py-1.5 mx-1 rounded cursor-grab text-sm text-foreground transition-colors group ${
        isHighlighted ? "bg-primary/10" : "hover:bg-secondary/70"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="flex-1">{item.displayName || item.name}</span>
      <span className="text-[10px] text-muted-foreground font-mono">
        x{item.count}
      </span>
      {item.rackUnits > 0 && (
        <span className="text-[10px] text-muted-foreground font-mono">
          {item.rackUnits}U
        </span>
      )}
    </div>
  );
}

function DraggableGenericRow({
  item,
  depth,
  isHighlighted,
  onMouseEnter,
  onMouseLeave,
}: {
  item: GroupedItem;
  depth: number;
  isHighlighted: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}) {
  const { ref } = useDraggable({
    id: `sidebar-generic-${item.representativeId}`,
    data: { rackUnits: item.rackUnits, genericEquipmentId: item.representativeId },
  });

  return (
    <div
      ref={ref}
      style={{
        paddingLeft: `${12 + depth * 16}px`,
        ...(depth > 0 && {
          borderLeft: "2px solid hsl(var(--primary) / 0.2)",
        }),
      }}
      className={`flex items-center gap-2 py-1.5 mx-1 rounded cursor-grab text-sm text-foreground transition-colors group ${
        isHighlighted ? "bg-primary/10" : "hover:bg-secondary/70"
      }`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <span className="flex-1">{item.displayName || item.name}</span>
      {item.rackUnits > 0 && (
        <span className="text-[10px] text-muted-foreground font-mono">
          {item.rackUnits}U
        </span>
      )}
    </div>
  );
}

function ItemRow({
  item,
  depth = 0,
  hoveredItemId,
  onHoverChange,
}: {
  item: GroupedItem;
  depth?: number;
  hoveredItemId: string | null;
  onHoverChange: (id: string | null) => void;
}) {
  const rowId = `${item.sourceType}-${item.representativeId}`;
  const parentRowId = item.parentId ? `${item.sourceType}-${item.parentId}` : null;

  const isHighlighted =
    hoveredItemId === rowId ||
    (parentRowId !== null && hoveredItemId === parentRowId) ||
    (item.children?.some((c) => `${c.sourceType}-${c.representativeId}` === hoveredItemId) ?? false);

  const sharedProps = {
    item,
    depth,
    isHighlighted,
    onMouseEnter: () => onHoverChange(rowId),
    onMouseLeave: () => onHoverChange(null),
  };

  return (
    <>
      {item.sourceType === "pullsheet" ? (
        <DraggablePullsheetRow {...sharedProps} />
      ) : (
        <DraggableGenericRow {...sharedProps} />
      )}
      {item.children?.map((child) => (
        <ItemRow
          key={`${child.sourceType}-${child.representativeId}`}
          item={child}
          depth={depth + 1}
          hoveredItemId={hoveredItemId}
          onHoverChange={onHoverChange}
        />
      ))}
    </>
  );
}

function SectionGroup({ section }: { section: EquipmentSection }) {
  const [open, setOpen] = useState(false);
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:bg-secondary/50 transition-colors"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5" />
        )}
        {section.label}
        <span className="ml-auto text-[10px] font-normal opacity-60">
          {section.items.length}
        </span>
      </button>
      {open && (
        <div className="pb-1">
          {section.items.map((item) => (
            <ItemRow
              key={`${item.sourceType}-${item.representativeId}`}
              item={item}
              hoveredItemId={hoveredItemId}
              onHoverChange={setHoveredItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Group pullsheet items by flexResourceId within each section, building a hierarchy
function groupPullsheetItems(
  items: PullsheetItem[],
  showAllItems: boolean,
): Map<string, GroupedItem[]> {
  const grouped = new Map<string, GroupedItem[]>();

  // Group all records by flexResourceId to get counts and representative IDs
  const byFlexId = new Map<string, PullsheetItem[]>();
  for (const item of items) {
    const key = item.flexResourceId || item.name;
    if (!byFlexId.has(key)) byFlexId.set(key, []);
    byFlexId.get(key)!.push(item);
  }

  // Build a map of flexResourceId → GroupedItem (root items only) keyed by parentId
  // We need to find root items and their children
  const rootItems = items.filter((i) => !i.parentId && (showAllItems || i.rackUnits > 0));

  // Group children by parentId's flexResourceId → representative parentId
  // We need the representative (lowest id) of the parent group to look up parentId
  const representativeByFlexId = new Map<string, number>();
  for (const [flexId, group] of byFlexId) {
    const sorted = [...group].sort((a, b) => a.id - b.id);
    representativeByFlexId.set(flexId, sorted[0]!.id);
  }

  // Build GroupedItem for a given flexResourceId + items
  const buildGroupedItem = (
    flexId: string,
    records: PullsheetItem[],
    parentId: number | null,
  ): GroupedItem => {
    const sorted = [...records].sort((a, b) => a.id - b.id);
    const rep = sorted[0]!;
    return {
      representativeId: rep.id,
      flexResourceId: flexId,
      name: rep.name,
      displayName: rep.displayNameOverride,
      rackUnits: rep.rackUnits,
      count: records.length,
      parentId,
      sourceType: "pullsheet",
      children: [],
    };
  };

  // Track which flexIds we've already emitted as roots (to avoid duplicates)
  const emittedRoots = new Set<string>();

  for (const rootItem of rootItems) {
    const flexId = rootItem.flexResourceId || rootItem.name;
    if (emittedRoots.has(flexId)) continue;
    emittedRoots.add(flexId);

    const section = rootItem.flexSection;
    if (!grouped.has(section)) grouped.set(section, []);

    const records = byFlexId.get(flexId) ?? [rootItem];
    const groupedItem = buildGroupedItem(flexId, records, null);

    // Find children of this group (items whose parentId is one of the representative's records)
    // Children link to the first/representative parent record
    const repId = groupedItem.representativeId;
    const childItems = items.filter((i) => i.parentId === repId);

    if (childItems.length > 0) {
      const childByFlexId = new Map<string, PullsheetItem[]>();
      for (const child of childItems) {
        const key = child.flexResourceId || child.name;
        if (!childByFlexId.has(key)) childByFlexId.set(key, []);
        childByFlexId.get(key)!.push(child);
      }

      for (const [childFlexId, childRecords] of childByFlexId) {
        groupedItem.children!.push(buildGroupedItem(childFlexId, childRecords, repId));
      }
    }

    grouped.get(section)!.push(groupedItem);
  }

  return grouped;
}

interface EquipmentSidebarProps {
  jobId: number;
}

export default function EquipmentSidebar({ jobId }: EquipmentSidebarProps) {
  const [showAllItems, setShowAllItems] = useState(false);
  const { data: pullsheetItems, isLoading, error } = useUnplacedItems(jobId);
  const {
    data: genericEquipment,
    isLoading: isLoadingGeneric,
    error: genericError,
  } = useGenericEquipment();

  useEffect(() => {
    if (error) console.log("Pullsheet items error:", error);
  }, [error]);

  useEffect(() => {
    if (genericError) console.log("Generic equipment error:", genericError);
  }, [genericError]);

  const groupedPullsheetItems = pullsheetItems
    ? groupPullsheetItems(pullsheetItems, showAllItems)
    : new Map<string, GroupedItem[]>();

  const pullsheetSections: EquipmentSection[] = Array.from(
    groupedPullsheetItems.entries(),
  ).map(([label, items]) => ({ label, items }));

  // Generic items: always one per entry (no per-unit tracking needed)
  const groupedGenericItems = new Map<string, GroupedItem[]>();
  if (genericEquipment) {
    for (const item of genericEquipment) {
      if (!groupedGenericItems.has(item.category)) {
        groupedGenericItems.set(item.category, []);
      }
      groupedGenericItems.get(item.category)!.push({
        representativeId: item.id,
        flexResourceId: String(item.id),
        name: item.name,
        displayName: item.displayName,
        rackUnits: item.rackUnits,
        count: 1,
        sourceType: "generic",
      });
    }
  }

  const genericSections: EquipmentSection[] = Array.from(
    groupedGenericItems.entries(),
  ).map(([label, items]) => ({ label, items }));

  return (
    <aside className="w-64 min-w-[16rem] bg-sidebar border-r border-sidebar-border flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-sidebar-border space-y-2">
        <h2 className="text-sm font-semibold text-foreground tracking-wide">
          Equipment
        </h2>
        <p className="text-[11px] text-muted-foreground">
          Drag items to the rack
        </p>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showAllItems}
            onChange={(e) => setShowAllItems(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-muted-foreground"
          />
          <span className="text-[11px] text-muted-foreground">
            Show all items
          </span>
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <div className="px-4 py-4 text-xs text-destructive">
            Failed to load equipment items
          </div>
        )}

        {!isLoading && !error && (
          <>
            <div className="py-2">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                Pullsheet Items
              </div>
              {pullsheetSections.length > 0 ? (
                pullsheetSections.map((section) => (
                  <SectionGroup key={section.label} section={section} />
                ))
              ) : (
                <div className="px-3 py-2 text-[11px] text-muted-foreground">
                  No items
                </div>
              )}
            </div>

            <div className="border-t border-sidebar-border py-2">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-primary">
                Generic Items
              </div>
              {isLoadingGeneric && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                </div>
              )}
              {genericError && (
                <div className="px-4 py-2 text-xs text-destructive">
                  Failed to load generic items
                </div>
              )}
              {!isLoadingGeneric && !genericError && (
                <>
                  {genericSections.length > 0 ? (
                    genericSections.map((section) => (
                      <SectionGroup key={section.label} section={section} />
                    ))
                  ) : (
                    <div className="px-3 py-2 text-[11px] text-muted-foreground">
                      No items
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
