import { useQuery } from "@tanstack/react-query";
import { getGenericEquipment } from "@/api/genericEquipment";
import { queryKeys } from "@/api/queryKeys";

export function useGenericEquipment() {
  return useQuery({
    queryKey: queryKeys.genericEquipment.all,
    queryFn: getGenericEquipment,
    staleTime: 1000 * 60 * 60, // 1 hour — generic items rarely change
    refetchOnWindowFocus: false,
  });
}
