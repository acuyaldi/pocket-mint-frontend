"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { SavingGoal } from "@/src/types/savingGoal";

const STALE_TIME = 5 * 60 * 1000;

export const useSavingGoals = () => {
  return useQuery<SavingGoal[], Error>({
    queryKey: ["savingGoals"],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: SavingGoal[] }>("/saving-goals");
      const arr = response.data?.data ?? [];
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE_TIME,
  });
};

export interface CreateSavingGoalDto {
  name: string;
  targetAmount: number;
  /** Optional; backend defaults to zero when omitted. */
  currentAmount?: number;
  targetDate?: string;
  notes?: string;
}

export interface UpdateSavingGoalDto {
  name?: string;
  targetAmount?: number;
  targetDate?: string | null;
  notes?: string | null;
}

export const useCreateSavingGoal = () => {
  const queryClient = useQueryClient();

  return useMutation<SavingGoal, Error, CreateSavingGoalDto>({
    mutationFn: (dto) => api.post<{ status: string; data: SavingGoal }>("/saving-goals", dto).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingGoals"] });
    },
  });
};

export const useUpdateSavingGoal = () => {
  const queryClient = useQueryClient();

  return useMutation<SavingGoal, Error, { id: string } & UpdateSavingGoalDto>({
    mutationFn: ({ id, ...updates }) =>
      api.patch<{ status: string; data: SavingGoal }>(`/saving-goals/${id}`, updates).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingGoals"] });
    },
  });
};

export const useUpdateSavingGoalProgress = () => {
  const queryClient = useQueryClient();

  return useMutation<SavingGoal, Error, { id: string; currentAmount: number }>({
    mutationFn: ({ id, currentAmount }) =>
      api.patch<{ status: string; data: SavingGoal }>(`/saving-goals/${id}/progress`, { currentAmount }).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingGoals"] });
    },
  });
};

export const useArchiveSavingGoal = () => {
  const queryClient = useQueryClient();

  return useMutation<SavingGoal, Error, string>({
    mutationFn: (id) => api.post<{ status: string; data: SavingGoal }>(`/saving-goals/${id}/archive`).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savingGoals"] });
    },
  });
};
