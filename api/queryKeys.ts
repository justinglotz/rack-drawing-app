export const queryKeys = {
  jobs: {
    all: ["jobs"] as const,
    detail: (id: string) => ["jobs", id] as const,
  },
  pullsheetItems: {
    all: ["pullsheetItems"] as const,
    byJob: (jobId: number) => ["pullsheetItems", jobId] as const,
    unplaced: (jobId: number) => ["pullsheetItems", jobId, "unplaced"] as const,
  },
  genericEquipment: {
    all: ["genericEquipment"] as const,
  },
} as const;
