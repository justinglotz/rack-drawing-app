import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUnplacedItems, movePlacedItem } from "@/api/flex";
import { queryKeys } from "@/api/queryKeys";
import { Side } from "@/types/rackDrawingTypes";

export function useUnplacedItems(jobId: number) {
  return useQuery({
    queryKey: queryKeys.pullsheetItems.unplaced(jobId),
    queryFn: () => getUnplacedItems(jobId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function useMovePlacedItem(jobId: number, rackDrawingId: number) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ itemId, startPosition, side }: { itemId: number; startPosition: number; side: Side }) =>
      movePlacedItem(jobId, itemId, rackDrawingId, startPosition, side),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rackDrawings.byJob(jobId) });
    },
  });
}
