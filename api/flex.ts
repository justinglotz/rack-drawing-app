import { apiFetch } from "./client";
import { flexImportResponseSchema, FlexImportResponse } from "@/types/flexTypes";
import { pullsheetItemSchema, PullsheetItem } from "@/types/jobTypes";
import { Side, placedItemResponseSchema } from "@/types/rackDrawingTypes";
import { z } from "zod";

export async function importFlexUrl(url: string): Promise<FlexImportResponse> {
  return apiFetch('/pullsheet/import', flexImportResponseSchema, { method: 'POST', body: JSON.stringify({ flexUrl: url }) });
}

export async function getUnplacedItems(jobId: number): Promise<PullsheetItem[]> {
  return apiFetch(`/jobs/${jobId}/pullsheet-items/unplaced`, z.array(pullsheetItemSchema));
}

export async function movePlacedItem(
  jobId: number,
  itemId: number,
  rackDrawingId: number,
  startPosition: number,
  side: Side,
): Promise<void> {
  await apiFetch(`/jobs/${jobId}/pullsheet-items/${itemId}/move`, placedItemResponseSchema, {
    method: "PATCH",
    body: JSON.stringify({ startPosition, side }),
  });
}
