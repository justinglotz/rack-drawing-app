import { z } from "zod";

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
  id: z.number(),
  jobId: z.number(),
  equipmentCatalogId: z.number().nullish(),
  rackDrawingId: z.number().nullish(),
  parentId: z.number().nullish(),
  name: z.string(),
  displayNameOverride: z.string().nullish(),
  rackUnits: z.number(),
  quantity: z.number(),
  flexResourceId: z.string(),
  flexSection: z.string(),
  isFromPullsheet: z.boolean(),
  notes: z.string().nullish(),
  side: z.string().nullish(),
  startPosition: z.number().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PullsheetItem = z.infer<typeof pullsheetItemSchema>;
