import { z } from "zod";
import { sideSchema } from "./rackDrawingTypes";

export const jobSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullish(),
  flexPullsheetId: z.string(),
  lastSyncedAt: z.string().nullish(),
  createdAt: z.string(),
});

export type Job = z.infer<typeof jobSchema>;

export const pullsheetItemSchema = z.object({
  id: z.number().int().positive(),
  jobId: z.number().int().positive(),
  equipmentCatalogId: z.number().int().positive().nullish(),
  genericEquipmentId: z.number().int().positive().nullish(),
  rackDrawingId: z.number().int().positive().nullish(),
  parentId: z.number().int().positive().nullish(),
  name: z.string(),
  displayNameOverride: z.string().nullish(),
  rackUnits: z.number().int().positive(),
  quantity: z.number().int().positive(),
  flexResourceId: z.string(),
  flexSection: z.string(),
  isFromPullsheet: z.boolean(),
  notes: z.string().nullish(),
  side: sideSchema.nullish(),
  startPosition: z.number().int().min(1).nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PullsheetItem = z.infer<typeof pullsheetItemSchema>;
