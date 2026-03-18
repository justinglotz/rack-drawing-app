import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getRackDrawings, updateRackName } from "@/api/rackDrawings";
import { queryKeys } from "@/api/queryKeys";
import { toast } from "sonner";

export function useRackDrawings(jobId: number) {
  return useQuery({
    queryKey: queryKeys.rackDrawings.byJob(jobId),
    queryFn: () => getRackDrawings(jobId),
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateRackName(jobId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rackId, name }: { rackId: number; name: string }) =>
      updateRackName(jobId, rackId, name),
    onSuccess: () => {
      toast.success("Rack name updated successfully");
      queryClient.invalidateQueries({
        queryKey: queryKeys.rackDrawings.byJob(jobId),
      });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to update rack name: ${message}`);
    },
  });
}
