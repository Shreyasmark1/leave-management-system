import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { LeaveTypeRow } from "@/features/types";

export const leaveTypesKeys = {
  all: ["leave-types"] as const,
};

export function useLeaveTypes() {
  return useQuery({
    queryKey: leaveTypesKeys.all,
    queryFn: async () => {
      const data = await apiGet<{ leaveTypes: LeaveTypeRow[] }>("/api/leave-types");
      return data.leaveTypes;
    },
  });
}