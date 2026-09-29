import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "@/lib/api-client";
import type { UserRow } from "@/features/types";

export const usersKeys = {
  all: ["users"] as const,
  detail: (id: string) => [...usersKeys.all, "detail", id] as const,
};

export function useUsers() {
  return useQuery({
    queryKey: usersKeys.all,
    queryFn: async () => {
      const data = await apiGet<{ users: UserRow[] }>("/api/users");
      return data.users;
    },
  });
}

export function useUser(id: string) {
  return useQuery({
    queryKey: usersKeys.detail(id),
    queryFn: async () => {
      const data = await apiGet<{ user: UserRow }>(`/api/users?id=${id}`);
      return data.user;
    },
    enabled: Boolean(id),
  });
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: "employee" | "admin";
  department?: string | null;
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateUserInput) =>
      apiPost<{ user: UserRow }>("/api/users", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}

export interface UpdateUserInput {
  id: string;
  name?: string;
  email?: string;
  password?: string;
  role?: "employee" | "admin";
  department?: string | null;
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateUserInput) =>
      apiPost<{ user: UserRow }>("/api/users", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiDelete<{ id: string }>("/api/users", { id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersKeys.all });
      queryClient.invalidateQueries({ queryKey: ["admin-stats"] });
    },
  });
}