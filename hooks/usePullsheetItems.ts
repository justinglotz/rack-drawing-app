import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getUnplacedItems, movePlacedItem, placePullsheetItem, placeGenericEquipment } from "@/api/flex";
import { queryKeys } from "@/api/queryKeys";
import { Side, RackDrawingWithItems } from "@/types/rackDrawingTypes";
import { PullsheetItem } from "@/types/jobTypes";
import { GenericEquipment } from "@/types/genericEquipmentTypes";
import { toast } from "sonner";

export function useUnplacedItems(jobId: number) {
  return useQuery({
    queryKey: queryKeys.pullsheetItems.unplaced(jobId),
    queryFn: () => getUnplacedItems(jobId),
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });
}

export function usePlacePullsheetItem(jobId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ itemId, rackDrawingId, startPosition, side }: { itemId: number; rackDrawingId: number; startPosition: number; side: Side }) =>
      placePullsheetItem(jobId, itemId, rackDrawingId, startPosition, side),
    onMutate: async ({ itemId, rackDrawingId, startPosition, side }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pullsheetItems.unplaced(jobId) });
      await queryClient.cancelQueries({ queryKey: queryKeys.rackDrawings.byJob(jobId) });

      const previousUnplaced = queryClient.getQueryData(queryKeys.pullsheetItems.unplaced(jobId));
      const previousRacks = queryClient.getQueryData(queryKeys.rackDrawings.byJob(jobId));

      const unplacedItems = queryClient.getQueryData<PullsheetItem[]>(queryKeys.pullsheetItems.unplaced(jobId));
      const item = unplacedItems?.find((i) => i.id === itemId);

      // Remove placed item and its direct children from unplaced list
      queryClient.setQueryData<PullsheetItem[]>(
        queryKeys.pullsheetItems.unplaced(jobId),
        (old) => old?.filter((i) => i.id !== itemId && i.parentId !== itemId) ?? []
      );

      if (item) {
        queryClient.setQueryData<RackDrawingWithItems[]>(
          queryKeys.rackDrawings.byJob(jobId),
          (old) => {
            if (!Array.isArray(old)) return old;
            return old.map((rack) =>
              rack.id === rackDrawingId
                ? {
                    ...rack,
                    placedItems: [
                      ...rack.placedItems,
                      {
                        id: item.id,
                        name: item.name,
                        displayNameOverride: item.displayNameOverride ?? null,
                        rackUnits: item.rackUnits,
                        side,
                        startPosition,
                        category: null,
                      },
                    ],
                  }
                : rack
            );
          }
        );
      }

      return { previousUnplaced, previousRacks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousUnplaced) {
        queryClient.setQueryData(queryKeys.pullsheetItems.unplaced(jobId), context.previousUnplaced);
      }
      if (context?.previousRacks) {
        queryClient.setQueryData(queryKeys.rackDrawings.byJob(jobId), context.previousRacks);
      }
      toast.error("Failed to place item. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pullsheetItems.unplaced(jobId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.rackDrawings.byJob(jobId) });
    },
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

export function usePlaceGenericEquipment(jobId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ genericEquipmentId, rackDrawingId, startPosition, side }: { genericEquipmentId: number; rackDrawingId: number; startPosition: number; side: Side }) =>
      placeGenericEquipment(jobId, genericEquipmentId, rackDrawingId, startPosition, side),
    onMutate: async ({ genericEquipmentId, rackDrawingId, startPosition, side }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.rackDrawings.byJob(jobId) });

      const previousRacks = queryClient.getQueryData(queryKeys.rackDrawings.byJob(jobId));

      const genericItems = queryClient.getQueryData<GenericEquipment[]>(queryKeys.genericEquipment.all);
      const item = genericItems?.find((i) => i.id === genericEquipmentId);

      if (item) {
        queryClient.setQueryData<RackDrawingWithItems[]>(
          queryKeys.rackDrawings.byJob(jobId),
          (old) => {
            if (!Array.isArray(old)) return old;
            return old.map((rack) =>
              rack.id === rackDrawingId
                ? {
                    ...rack,
                    placedItems: [
                      ...rack.placedItems,
                      {
                        id: -Date.now(),
                        name: item.name,
                        displayNameOverride: item.displayName ?? null,
                        rackUnits: item.rackUnits,
                        side,
                        startPosition,
                        category: "generic",
                      },
                    ],
                  }
                : rack
            );
          }
        );
      }

      return { previousRacks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousRacks) {
        queryClient.setQueryData(queryKeys.rackDrawings.byJob(jobId), context.previousRacks);
      }
      toast.error("Failed to place item. Please try again.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.rackDrawings.byJob(jobId) });
    },
  });
}
