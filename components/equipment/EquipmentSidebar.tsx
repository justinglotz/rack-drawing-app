"use client";

import { ChevronDown, ChevronRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { useUnplacedItems } from "@/hooks/usePullsheetItems";
import { useGenericEquipment } from "@/hooks/useGenericEquipment";

// Shared interface for rendering both PullsheetItem and GenericEquipment
interface EquipmentDisplayItem {
  id: number;
  name: string;
  displayName?: string | null;
  rackUnits: number;
  quantity: number;
}

interface EquipmentSection {
  label: string;
  items: EquipmentDisplayItem[];
}

function SectionGroup({ section }: { section: EquipmentSection }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
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
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-1.5 mx-1 rounded cursor-grab text-sm text-foreground hover:bg-secondary/70 transition-colors group"
            >
              <span className="flex-1">{item.displayName || item.name}</span>
              <span className="text-[10px] text-muted-foreground font-mono">
                x{item.quantity}
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">
                {item.rackUnits}U
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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

  // Group pullsheet items by flexSection, filtering by rackUnits if needed
  const groupedPullsheetItems = new Map<string, EquipmentDisplayItem[]>();
  if (pullsheetItems) {
    pullsheetItems.forEach((item) => {
      // Filter: show items with rackUnits > 0, or all items if showAllItems is true
      if (showAllItems || item.rackUnits > 0) {
        if (!groupedPullsheetItems.has(item.flexSection)) {
          groupedPullsheetItems.set(item.flexSection, []);
        }
        const items = groupedPullsheetItems.get(item.flexSection);
        if (items) {
          // Map PullsheetItem to EquipmentDisplayItem
          items.push({
            id: item.id,
            name: item.name,
            displayName: item.displayNameOverride,
            rackUnits: item.rackUnits,
            quantity: item.quantity,
          });
        }
      }
    });
  }

  const pullsheetSections: EquipmentSection[] = Array.from(
    groupedPullsheetItems.entries()
  ).map(([label, items]) => ({ label, items }));

  // Group generic items by category
  const groupedGenericItems = new Map<string, EquipmentDisplayItem[]>();
  if (genericEquipment) {
    genericEquipment.forEach((item) => {
      if (!groupedGenericItems.has(item.category)) {
        groupedGenericItems.set(item.category, []);
      }
      const items = groupedGenericItems.get(item.category);
      if (items) {
        // Map GenericEquipment to EquipmentDisplayItem
        items.push({
          id: item.id,
          name: item.name,
          displayName: item.displayName,
          rackUnits: item.rackUnits,
          quantity: 1,
        });
      }
    });
  }

  const genericSections: EquipmentSection[] = Array.from(
    groupedGenericItems.entries()
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
