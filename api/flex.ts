import { apiFetch } from "./client";
import { flexImportResponseSchema, FlexImportResponse } from "@/types/flexTypes";

export async function importFlexUrl(url: string): Promise<FlexImportResponse> {
  return apiFetch('/pullsheet/import', flexImportResponseSchema, { method: 'POST', body: JSON.stringify({ flexUrl: url }) });
}
