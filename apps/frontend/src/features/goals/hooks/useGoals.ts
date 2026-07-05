'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const STALE_TIME = 5 * 60 * 1000;

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGoalDto {
  name: string;
  targetAmount: number;
  savedAmount?: number;
  deadline?: string | null;
}

export const isGoalComplete = (g: Goal) => g.savedAmount >= g.targetAmount;

export const goalProgress = (g: Goal) =>
  g.targetAmount > 0 ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100)) : 0;

export const useGoals = () => {
  return useQuery<Goal[], Error>({
    queryKey: ['goals'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: Goal[] }>('/goals');
      const arr = response.data?.data ?? [];
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE_TIME,
  });
};

export const useCreateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation<Goal, Error, CreateGoalDto>({
    mutationFn: (dto) =>
      api.post<{ status: string; data: Goal }>('/goals', dto).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

export const useUpdateGoal = () => {
  const queryClient = useQueryClient();

  return useMutation<Goal, Error, { id: string } & Partial<CreateGoalDto>>({
    mutationFn: ({ id, ...updates }) =>
      api.put<{ status: string; data: Goal }>(`/goals/${id}`, updates).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};

export const useDeleteGoal = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    mutationFn: (id) =>
      api.delete<{ status: string; data: { id: string } }>(`/goals/${id}`).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
};
