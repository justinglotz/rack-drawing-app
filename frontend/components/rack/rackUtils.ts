import type { RackItem } from "./RackDrawing";

/**
 * Short label for the kind of rack, e.g. "Double-Wide" or "Fly Rack".
 * Fly racks and rollovers are detected from the rack's name.
 */
export function rackKind(
  rack: { name: string; isDoubleWide: boolean },
  { short = false }: { short?: boolean } = {},
): string {
  if (rack.isDoubleWide) return short ? "Double" : "Double-Wide";
  if (/\bfly\b/i.test(rack.name)) return short ? "Fly" : "Fly Rack";
  if (/\broll[-\s]?over\b/i.test(rack.name)) return "Rollover";
  return short ? "Single" : "Single-Wide";
}

/**
 * Check if a position range overlaps with any existing rack items.
 * Useful for collision detection when placing items.
 */
export function hasOverlap(
  start: number,
  end: number,
  items: RackItem[],
  excludeId: number | null,
): boolean {
  return items.some(
    (item) => item.id !== excludeId && start <= item.endU && end >= item.startU,
  );
}
