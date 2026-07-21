"use client";
import { QueryClient, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { BudgetDto } from "@/src/types/budget";

const STALE_TIME = 5 * 60 * 1000;

export type BudgetListStatus = "active" | "archived";

/**
 * A Budget mutation only ever changes Budget data itself. The Dashboard does
 * not consume budgets yet (deferred to a future phase) — do not invalidate it
 * here; add it back only once the Dashboard actually reads budget data.
 */
export const invalidateBudgetDependents = (queryClient: QueryClient) => {
  queryClient.invalidateQueries({ queryKey: ["budgets"] });
};

export const useBudgets = (status: BudgetListStatus = "active") => {
  return useQuery<BudgetDto[], Error>({
    queryKey: ["budgets", status],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: BudgetDto[] }>("/budgets", {
        params: { status },
      });
      const arr = response.data?.data ?? [];
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE_TIME,
  });
};

export const useBudget = (id: string | null) => {
  return useQuery<BudgetDto, Error>({
    queryKey: ["budgets", "detail", id],
    queryFn: async () => {
      const response = await api.get<{ success: boolean; data: BudgetDto }>(`/budgets/${id}`);
      return response.data.data;
    },
    enabled: !!id,
    staleTime: STALE_TIME,
  });
};

export interface CreateBudgetDto {
  categoryId: string;
  amount: number;
}

export interface UpdateBudgetAmountDto {
  amount: number;
}

export const useCreateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation<BudgetDto, Error, CreateBudgetDto>({
    mutationFn: (dto) => api.post<{ success: boolean; data: BudgetDto }>("/budgets", dto).then((res) => res.data.data),
    onSuccess: () => invalidateBudgetDependents(queryClient),
  });
};

export const useUpdateBudget = () => {
  const queryClient = useQueryClient();

  return useMutation<BudgetDto, Error, { id: string } & UpdateBudgetAmountDto>({
    mutationFn: ({ id, amount }) =>
      api.patch<{ success: boolean; data: BudgetDto }>(`/budgets/${id}`, { amount }).then((res) => res.data.data),
    onSuccess: () => invalidateBudgetDependents(queryClient),
  });
};

export const useArchiveBudget = () => {
  const queryClient = useQueryClient();

  return useMutation<BudgetDto, Error, string>({
    mutationFn: (id) => api.post<{ success: boolean; data: BudgetDto }>(`/budgets/${id}/archive`).then((res) => res.data.data),
    onSuccess: () => invalidateBudgetDependents(queryClient),
  });
};

export const useRestoreBudget = () => {
  const queryClient = useQueryClient();

  return useMutation<BudgetDto, Error, string>({
    mutationFn: (id) => api.post<{ success: boolean; data: BudgetDto }>(`/budgets/${id}/restore`).then((res) => res.data.data),
    onSuccess: () => invalidateBudgetDependents(queryClient),
  });
};
