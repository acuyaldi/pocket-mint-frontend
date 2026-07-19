'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { RecurringTransaction } from '@/src/types/recurringTransaction';

const STALE_TIME = 5 * 60 * 1000;

export const useRecurringTransactions = () => {
  return useQuery<RecurringTransaction[], Error>({
    queryKey: ['recurringTransactions'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: RecurringTransaction[] }>('/recurring-transactions');
      const arr = response.data?.data ?? [];
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE_TIME,
  });
};

export interface CreateRecurringTransactionDto {
  name: string;
  walletId: string;
  categoryId?: string;
  type: 'INCOME' | 'EXPENSE';
  amountMode: RecurringTransaction['amountMode'];
  /** Required when amountMode is FIXED; omitted when FLEXIBLE. */
  amount?: number;
  description?: string;
  frequency: RecurringTransaction['frequency'];
  startDate: string;
  endDate?: string;
  reminderEnabled?: boolean;
  /** Required when reminderEnabled is true; must be null when false. */
  reminderOffsetDays?: number | null;
}

export const useCreateRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<RecurringTransaction, Error, CreateRecurringTransactionDto>({
    mutationFn: (dto) =>
      api.post<{ status: string; data: RecurringTransaction }>('/recurring-transactions', dto).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
    },
  });
};

export const useUpdateRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<RecurringTransaction, Error, { id: string } & Partial<CreateRecurringTransactionDto & { isActive: boolean }>>({
    mutationFn: ({ id, ...updates }) =>
      api.put<{ status: string; data: RecurringTransaction }>(`/recurring-transactions/${id}`, updates).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
    },
  });
};

export const useDeleteRecurringTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    mutationFn: (id) =>
      api.delete<{ status: string; data: { id: string } }>(`/recurring-transactions/${id}`).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recurringTransactions'] });
    },
  });
};
