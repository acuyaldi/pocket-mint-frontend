'use client';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Transaction } from '@/src/types/transaction';

// Stale time: 5 minutes (in milliseconds)
const STALE_TIME = 5 * 60 * 1000;

/**
 * Query key prefixes that read transaction-derived data. Invalidate all of
 * these after any successful transaction mutation (create/update/delete/
 * confirm) so dependent views (dashboard net worth, wallet balances,
 * installment bills) never require a manual reload.
 */
export const invalidateTransactionDependents = (queryClient: QueryClient) => {
  for (const queryKey of [['transactions'], ['wallets'], ['dashboard'], ['bills']]) {
    queryClient.invalidateQueries({ queryKey });
  }
};

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
 * Fetch the user's full transaction history (no current-month auto-filter).
 * Backed by `GET /transactions/all` — use this for any multi-month view
 * (Analytics filters/charts). Current-month-only views should keep using
 * `useTransactions()`.
 */
export const useAllTransactions = () => {
  return useQuery<Transaction[], Error>({
    queryKey: ['transactions', 'all'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: Transaction[] }>('/transactions/all');
      const arr = response.data?.data ?? [];
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE_TIME,
  });
};

export interface MonthlySummary {
  income: number;
  expenses: number;
  netSavings: number;
  month: string; // YYYY-MM
}

/**
 * Monthly P&L from the backend, scoped to the current calendar month.
 * Month key comes from new Date(), so the query naturally rolls over.
 */
export const useMonthlySummary = () => {
  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  return useQuery<MonthlySummary, Error>({
    // 'transactions' prefix: invalidated automatically by tx mutations
    queryKey: ['transactions', 'summary', month],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: MonthlySummary }>(
        '/transactions/summary',
        { params: { month } }
      );
      return response.data.data;
    },
    staleTime: STALE_TIME,
  });
};

/**
 * Update an existing transaction by ID.
 * Invalidates the transactions query on success so the list auto-refreshes.
 */
export const useUpdateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Transaction, // response type
    Error,       // error type
    { id: string } & Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt' | 'userId'>>
  >({
    mutationFn: ({ id, ...updates }) =>
      api.put<{ status: string; data: Transaction }>(`/transactions/${id}`, updates).then((res) => res.data.data),
    onSuccess: () => invalidateTransactionDependents(queryClient),
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<
    Transaction,
    Error,
    CreateTransactionDto
  >({
    mutationFn: (newTx) => api.post<{ status: string; data: Transaction }>('/transactions', newTx).then((res) => res.data.data),
    onSuccess: () => invalidateTransactionDependents(queryClient),
  });
};

export interface CreateTransactionDto {
  type: Transaction['type'];
  amount: number;
  description?: string;
  date?: string;
  walletId?: string;
  toWalletId?: string;
  categoryId?: string;
  billingMode?: 'FULL' | 'INSTALLMENT';
  firstDueDate?: string;
  isInstallment?: boolean;
  installmentMonths?: number;
  interestRate?: number;
}

/**
 * Download the Analytics page's currently selected period as a CSV, filtered
 * on the backend (`GET /transactions/export`) — never fetched all-time and
 * filtered client-side. `anchor` must be the same Asia/Jakarta `YYYY-MM`
 * reporting-month key the Analytics page is displaying (see
 * `getJakartaMonthKey` in `app/(app)/analytics/period.ts`), not a raw
 * `Date` — a UTC instant can land on a different calendar month near a
 * Jakarta month boundary.
 */
export const exportTransactionsCsv = async (period: 'month' | 'quarter' | 'six-months', anchor: string) => {
  const response = await api.get<Blob>('/transactions/export', {
    params: { period, anchor },
    responseType: 'blob',
  });
  const url = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = `transactions-${period}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

export const useDeleteTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation<
    { id: string },
    Error,
    string // transaction ID
  >({
    mutationFn: (id) =>
      api.delete<{ status: string; data: { id: string } }>(`/transactions/${id}`).then((res) => res.data.data),
    onSuccess: () => invalidateTransactionDependents(queryClient),
  });
};
