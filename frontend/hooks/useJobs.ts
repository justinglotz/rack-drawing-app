import { useQuery } from "@tanstack/react-query";
import { getJobs } from "@/api/jobs";
import { queryKeys } from "@/api/queryKeys";

export function useJobs() {
  return useQuery({
    queryKey: queryKeys.jobsList.all,
    queryFn: getJobs,
    staleTime: 1000 * 30,
    refetchOnWindowFocus: false,
  });
}
