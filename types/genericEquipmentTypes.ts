import { z } from "zod";

export const genericEquipmentSchema = z.object({
  id: z.number(),
  name: z.string(),
  displayName: z.string().nullish(),
  category: z.string(),
  rackUnits: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type GenericEquipment = z.infer<typeof genericEquipmentSchema>;
