/**
 * displayNameOverride is null when an item has never been renamed for a specific
 * rack — in that case it inherits the catalog/generic-equipment displayName live,
 * so a global rename is reflected everywhere without cascading writes.
 */
export function effectiveDisplayName(item: {
  displayNameOverride: string | null;
  equipmentCatalog?: { displayName: string } | null;
  genericEquipment?: { displayName: string | null } | null;
}): string | null {
  return item.displayNameOverride ?? item.equipmentCatalog?.displayName ?? item.genericEquipment?.displayName ?? null;
}
