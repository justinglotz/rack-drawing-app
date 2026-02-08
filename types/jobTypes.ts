export interface Job {
  id: number,
  name: string,
  description?: string,
  flexPullsheetId: string,
  lastSyncedAt?: string,
  createdAt: string
}
