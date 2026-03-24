import type { RackItem } from "./RackDrawing";

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
