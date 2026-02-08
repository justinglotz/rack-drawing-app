import { useMutation, useQueryClient } from "@tanstack/react-query";
import { importFlexUrl } from "@/api/flex";
import { queryKeys } from "@/api/queryKeys";
import { toast } from "sonner";

export function useImportFlexUrl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => importFlexUrl(url),
    onSuccess: (data) => {
      toast.success(`Imported ${data.data.name} successfully!`);
      // Invalidate queries to refetch fresh data
      queryClient.invalidateQueries({ queryKey: queryKeys.flexJobs.all });
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });
}
