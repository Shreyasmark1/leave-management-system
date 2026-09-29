import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import type { LeaveRequestRow, LeaveStatus } from "@/features/types";

export const leaveRequestsKeys = {
  all: ["leave-requests"] as const,
  lists: () => [...leaveRequestsKeys.all, "list"] as const,
  list: (status?: LeaveStatus, scope?: "mine", userId?: string) =>
    [...leaveRequestsKeys.lists(), userId ?? scope ?? "all", status ?? "all"] as const,
};

export function useLeaveRequests(status?: LeaveStatus, scope?: "mine", userId?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (scope && !userId) params.set("scope", scope);
  if (userId) params.set("userId", userId);
  const query = params.size > 0 ? `?${params.toString()}` : "";

  return useQuery({
    queryKey: leaveRequestsKeys.list(status, scope, userId),
    queryFn: async () => {
      const data = await apiGet<{ requests: LeaveRequestRow[] }>(
        `/api/leave-requests${query}`
      );
      return data.requests;
    },
  });
}

export interface CreateLeaveRequestInput {
  leaveTypeId: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateLeaveRequestInput) =>
      apiPost<{ request: LeaveRequestRow }>("/api/leave-requests", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}

export interface ReviewLeaveRequestInput {
  id: string;
  status: "approved" | "rejected";
  reviewNote?: string;
}

export function useReviewLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReviewLeaveRequestInput) =>
      apiPost<{ request: LeaveRequestRow }>("/api/leave-requests", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}

export function useCancelLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPost<{ request: LeaveRequestRow }>("/api/leave-requests", {
        id,
        status: "cancelled",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}

export function useDeleteLeaveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>("/api/leave-requests", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leaveRequestsKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}