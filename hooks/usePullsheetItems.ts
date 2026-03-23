import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUnplacedItems, movePlacedItem } from "@/api/flex";
import { queryKeys } from "@/api/queryKeys";
import { Side, RackDrawingWithItems } from "@/types/rackDrawingTypes";
import { toast } from "sonner";

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
    onMutate: async ({ itemId, startPosition, side }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rackDrawings.byJob(jobId) });

      const previousData = queryClient.getQueryData(queryKeys.rackDrawings.byJob(jobId));

      queryClient.setQueryData<RackDrawingWithItems[]>(
        queryKeys.rackDrawings.byJob(jobId),
        (oldData) => {
          if (!Array.isArray(oldData)) return oldData;

          const racks = oldData as RackDrawingWithItems[];
          return racks.map((rack) => ({
            ...rack,
            placedItems: rack.placedItems.map((item: typeof rack.placedItems[number]) =>
              item.id === itemId
                ? { ...item, startPosition, side }
                : item
            ),
          }));
        }
      );

      return { previousData };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          queryKeys.rackDrawings.byJob(jobId),
          context.previousData
        );
      }
      toast.error("Failed to move item. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rackDrawings.byJob(jobId) });
    },
  });
}
