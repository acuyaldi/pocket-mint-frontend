'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Transaction } from '@/types/transaction';

// Stale time: 5 minutes (in milliseconds)
const STALE_TIME = 5 * 60 * 1000;

/**
 * Fetch all transactions.
 * The backend returns an array of Transaction objects.
 */
export const useTransactions = () => {
  return useQuery<Transaction[], Error>({
    queryKey: ['transactions'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: Transaction[] }>('/transactions');
      // Backend wraps in {status, data}
      const arr = response.data?.data ?? [];
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE_TIME,
  });
};

/**
 * Create a new transaction.
 * After a successful mutation we invalidate the `transactions` query
 * so the list refreshes automatically.
 */
export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Transaction, // response type
    Error,       // error type
    Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> // payload (omit server‑generated fields)
  >(
    (newTx) => api.post<Transaction>('/transactions', newTx).then((res) => res.data),
    {
      onSuccess: () => {
        // Refetch the transaction list after creating a new one
        queryClient.invalidateQueries({ queryKey: ['transactions'] });
      },
    }
  );
};
