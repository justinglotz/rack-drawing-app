import { parseFlexData } from "./flexParser.js";
import type { ParsedData } from "./flexParser.js";

const flexApiBaseurl = process.env.FLEX_BASE_API_URL;

function flexHeaders() {
  return {
    'X-Auth-Token': `${process.env.FLEX_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchFlexPullsheetRaw(pullsheetId: string): Promise<any> {
  const response = await fetch(`${flexApiBaseurl}/line-item/${pullsheetId}/row-data/?_dc=1770171196563&codeList=quantity&codeList=upstreamLink&codeList=note&codeList=isVirtual&node=root`, {
    headers: flexHeaders(),
  });

  if (!response.ok) {
    throw new Error(`Error fetching data from Flex API: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchFlexPullsheetData(pullsheetId: string): Promise<ParsedData> {
  const raw = await fetchFlexPullsheetRaw(pullsheetId);
  return parseFlexData(raw);
}

// "Leave Date" custom field defined on the Pull Sheet element definition in
// this Flex account. Custom field IDs are per-definition (not per-element),
// so this is stable across every pull sheet import.
const LEAVE_DATE_CUSTOM_FIELD_ID = '1d571f6a-3a34-11ed-92b7-06f14c448575';

export interface FlexPullsheetDates {
  prepDate: Date | null;
  leaveDate: Date | null;
}

// Both dates live directly on the pull sheet element itself: prepDate is the
// built-in plannedStartDate (captioned "Prep Date" in this account), and
// leaveDate is a custom field surfaced via header-data.
export async function fetchFlexPullsheetDates(pullsheetId: string): Promise<FlexPullsheetDates> {
  const [keyInfoRes, headerDataRes] = await Promise.all([
    fetch(`${flexApiBaseurl}/element/${pullsheetId}/key-info`, { headers: flexHeaders() }),
    fetch(`${flexApiBaseurl}/element/${pullsheetId}/header-data?codeList=${LEAVE_DATE_CUSTOM_FIELD_ID}`, { headers: flexHeaders() }),
  ]);

  if (!keyInfoRes.ok) {
    throw new Error(`Error fetching Flex element key-info: ${keyInfoRes.statusText}`);
  }
  if (!headerDataRes.ok) {
    throw new Error(`Error fetching Flex element header-data: ${headerDataRes.statusText}`);
  }

  const keyInfo = await keyInfoRes.json();
  const headerData = await headerDataRes.json();

  const leaveDateMs = headerData?.[LEAVE_DATE_CUSTOM_FIELD_ID]?.data;

  return {
    prepDate: keyInfo?.plannedStartDate ? new Date(keyInfo.plannedStartDate) : null,
    leaveDate: leaveDateMs ? new Date(Number(leaveDateMs)) : null,
  };
}
