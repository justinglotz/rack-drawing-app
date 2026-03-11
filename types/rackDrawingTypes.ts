import { z } from "zod";

export const sideSchema = z.enum([
  "FRONT",
  "BACK",
  "FRONT_LEFT",
  "FRONT_RIGHT",
  "BACK_LEFT",
  "BACK_RIGHT",
]);

export type Side = z.infer<typeof sideSchema>;

export const rackDrawingSchema = z.object({
  id: z.number().int().positive(),
  jobId: z.number().int().positive(),
  name: z.string(),
  totalSpaces: z.number().int().positive(),
  isDoubleWide: z.boolean(),
  flexSection: z.string(),
  displayOrder: z.number().int().min(0),
  notes: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type RackDrawing = z.infer<typeof rackDrawingSchema>;

export const placedItemSchema = z.object({
  id: z.number().int().positive(),
  name: z.string(),
  displayNameOverride: z.string().nullish(),
  rackUnits: z.number().int().positive(),
  side: sideSchema.nullish(),
  startPosition: z.number().int().min(1).nullish(),
  category: z.string().nullish(),
});

export type PlacedItem = z.infer<typeof placedItemSchema>;

export const rackDrawingWithItemsSchema = rackDrawingSchema.extend({
  placedItems: z.array(placedItemSchema).default([]),
});

export type RackDrawingWithItems = z.infer<typeof rackDrawingWithItemsSchema>;
