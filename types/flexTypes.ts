import { z } from "zod";
import { jobSchema } from "./jobTypes";

const flexImportMetadataSchema = z.object({
  rackDrawingsCreated: z.number(),
  pullsheetItemsCreated: z.number(),
});

export const flexImportResponseSchema = z.object({
  data: jobSchema,
  metadata: flexImportMetadataSchema,
});

export type FlexImportResponse = z.infer<typeof flexImportResponseSchema>;
