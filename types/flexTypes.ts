import { Job } from "./jobTypes";

interface FlexImportMetadata {
  rackDrawingsCreated: number,
  pullsheetItemsCreated: number;
}

export interface FlexImportResponse {
  data: Job
  metadata: FlexImportMetadata
}
