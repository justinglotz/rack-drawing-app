import { useQuery } from "@tanstack/react-query";
import { getUnplacedItems } from "@/api/flex";
import { queryKeys } from "@/api/queryKeys";

export function useUnplacedItems(jobId: number) {
  return useQuery({
    queryKey: queryKeys.pullsheetItems.unplaced(jobId),
    queryFn: () => getUnplacedItems(jobId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}
