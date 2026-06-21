import { apiFetch } from "./client";
import { rackDrawingWithItemsSchema, rackDrawingSchema, RackDrawingWithItems, RackDrawing } from "@/types/rackDrawingTypes";
import { z } from "zod";

export async function getRackDrawings(jobId: number): Promise<RackDrawingWithItems[]> {
  return apiFetch(`/jobs/${jobId}/rack-drawings`, z.array(rackDrawingWithItemsSchema));
}

export async function updateRackName(
  jobId: number,
  rackId: number,
  name: string,
): Promise<RackDrawing> {
  return apiFetch(`/jobs/${jobId}/rack-drawings/${rackId}`, rackDrawingSchema, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}
