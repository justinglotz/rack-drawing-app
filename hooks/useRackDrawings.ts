import { useQuery } from "@tanstack/react-query";
import { getRackDrawings } from "@/api/rackDrawings";
import { queryKeys } from "@/api/queryKeys";

export function useRackDrawings(jobId: number) {
  return useQuery({
    queryKey: queryKeys.rackDrawings.byJob(jobId),
    queryFn: () => getRackDrawings(jobId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
