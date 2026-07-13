import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getJobs, updateJobDates } from "@/api/jobs";
import { queryKeys } from "@/api/queryKeys";
import { toast } from "sonner";

export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobsList.all,
    queryFn: getJobs,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateJobDates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      jobId,
      ...dates
    }: { jobId: number; prepDate?: string | null; leaveDate?: string | null }) =>
      updateJobDates(jobId, dates),
    onSuccess: () => {
      toast.success("Date updated");
      queryClient.invalidateQueries({ queryKey: queryKeys.jobsList.all });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error(`Failed to update date: ${message}`);
    },
  });
}
