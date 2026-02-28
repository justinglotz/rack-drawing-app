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
