import { useQuery } from "@tanstack/react-query";

import { getPatientList } from "@/lib/api";

export function usePatients() {
  return useQuery({
    queryKey: ["patients", 60],
    queryFn: () => getPatientList(60),
  });
}
