import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api-client";
import type { LeaveBalanceRow } from "@/features/types";

export const balancesKeys = {
  all: ["balances"] as const,
  list: (year: number, userId?: string) =>
    [...balancesKeys.all, year, userId ?? "me"] as const,
};

export function useLeaveBalances(year = new Date().getFullYear(), userId?: string) {
  return useQuery({
    queryKey: balancesKeys.list(year, userId),
    queryFn: async () => {
      const params = new URLSearchParams({ year: String(year) });
      if (userId) params.set("userId", userId);

      const data = await apiGet<{ year: number; balances: LeaveBalanceRow[] }>(
        `/api/balances?${params.toString()}`
      );
      return data.balances;
    },
  });
}