import { apiFetch } from "./client";
import { rackDrawingWithItemsSchema, RackDrawingWithItems } from "@/types/rackDrawingTypes";
import { z } from "zod";

export async function getRackDrawings(jobId: number): Promise<RackDrawingWithItems[]> {
  return apiFetch(`/jobs/${jobId}/rack-drawings`, z.array(rackDrawingWithItemsSchema));
}
