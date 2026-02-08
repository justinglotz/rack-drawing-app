export const queryKeys = {
  flexJobs: {
    all: ["flex-jobs"] as const,
    detail: (id: string) => ["flex-jobs", id] as const,
  },
} as const;
