import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import type { LeaveTypeRow, AdminStats } from "@/features/types";
import { leaveTypesKeys } from "@/features/leave-types/queries";

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const data = await apiGet<{ stats: AdminStats }>("/api/admin/stats");
      return data.stats;
    },
  });
}

export interface CreateLeaveTypeInput {
  name: string;
  code: string;
  annualQuotaDays: number;
  isPaid?: boolean;
  description?: string | null;
}

export function useCreateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLeaveTypeInput) =>
      apiPost<{ leaveType: LeaveTypeRow }>("/api/leave-types", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveTypesKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export interface UpdateLeaveTypeInput {
  id: string;
  name?: string;
  code?: string;
  annualQuotaDays?: number;
  isPaid?: boolean;
  description?: string | null;
}

export function useUpdateLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateLeaveTypeInput) =>
      apiPost<{ leaveType: LeaveTypeRow }>("/api/leave-types", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveTypesKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}

export function useDeleteLeaveType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>("/api/leave-types", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveTypesKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}