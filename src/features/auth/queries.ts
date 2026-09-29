import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/lib/api-client";
import type { SessionUser } from "@/features/types";

export const authKeys = {
  me: ["auth", "me"] as const,
};

export function useMe() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const data = await apiGet<{ user: SessionUser }>("/api/auth/me");
      return data.user;
    },
    retry: false,
  });
}

export interface LoginInput {
  email: string;
  password: string;
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) =>
      apiPost<{ user: SessionUser }>("/api/auth/login", input),
    onSuccess: (data) => {
      queryClient.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>       apiPost<{ loggedOut: boolean }>("/api/auth/logout", {}),
    onSuccess: () => {
      queryClient.clear();
    },
  });
}

export const authQuery = {
  me: () =>
    queryOptions({
      queryKey: authKeys.me,
      queryFn: async () => {
        const data = await apiGet<{ user: SessionUser }>("/api/auth/me");
        return data.user;
      },
      retry: false,
    }),
};