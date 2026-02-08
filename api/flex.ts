import { apiFetch } from "./client";
import { FlexImportResponse } from "@/types/flexTypes";

export async function importFlexUrl(url: string): Promise<FlexImportResponse> {
  return apiFetch('/pullsheet/import', { method: 'POST', body: JSON.stringify({ flexUrl: url }) });
}
