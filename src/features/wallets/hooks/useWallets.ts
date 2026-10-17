'use client';
import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Wallet, WalletAlias, WalletType } from '@/src/types/wallet';

const STALE_TIME = 5 * 60 * 1000;

/**
 * Query key prefixes that read wallet-derived data. Invalidate all of these
 * after any successful wallet mutation (create/update/delete) so dependent
 * views (dashboard net worth, wallet list, transaction history) never
 * require a manual reload. Narrower than `invalidateTransactionDependents`
 * (no `bills` — wallet metadata mutations don't affect installment bills).
 */
export const invalidateWalletDependents = (queryClient: QueryClient) => {
  for (const queryKey of [['wallets'], ['dashboard'], ['transactions']]) {
    queryClient.invalidateQueries({ queryKey });
  }
};

export const useWallets = () => {
  return useQuery<Wallet[], Error>({
    queryKey: ['wallets'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: Wallet[] }>('/wallets');
      const arr = response.data?.data ?? [];
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE_TIME,
  });
};

export interface CreateWalletDto {
  name: string;
  type: WalletType;
  balance?: number;
  principal?: number;
  creditLimit?: number;
  cutoffDay?: number | null;
  paymentDueDay?: number | null;
  interestRate?: number;
  adminFee?: number;
  adminFeeType?: 'FLAT' | 'PERCENT';
  color?: string;
  icon?: string;
}

export const useCreateWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<Wallet, Error, CreateWalletDto>({
    mutationFn: (dto) =>
      api.post<{ status: string; data: Wallet }>('/wallets', dto).then((res) => res.data.data),
    onSuccess: () => invalidateWalletDependents(queryClient),
  });
};

export const useUpdateWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<Wallet, Error, { id: string; isArchived?: boolean } & Partial<CreateWalletDto>>({
    mutationFn: ({ id, ...updates }) =>
      api.put<{ status: string; data: Wallet }>(`/wallets/${id}`, updates).then((res) => res.data.data),
    onSuccess: () => invalidateWalletDependents(queryClient),
  });
};

export const useDeleteWallet = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string }, Error, string>({
    // force=true: user already confirmed in the delete modal; backend otherwise
    // rejects wallets that have transaction history (409)
    mutationFn: (walletId) =>
      api.delete<{ status: string; data: { id: string } }>(`/wallets/${walletId}?force=true`).then((res) => res.data.data),
    onSuccess: () => invalidateWalletDependents(queryClient),
  });
};

/**
 * Explicit wallet aliases (Phase 37) — a per-user exact-match nickname
 * namespace, separate from `CreateWalletDto`: delete and recreate is the
 * intended editing flow, there is no update endpoint.
 */
export const useCreateWalletAlias = () => {
  const queryClient = useQueryClient();

  return useMutation<WalletAlias, Error, { walletId: string; aliasDisplay: string }>({
    mutationFn: ({ walletId, aliasDisplay }) =>
      api
        .post<{ status: string; data: WalletAlias }>(`/wallets/${walletId}/aliases`, { aliasDisplay })
        .then((res) => res.data.data),
    onSuccess: () => invalidateWalletDependents(queryClient),
  });
};

export const useDeleteWalletAlias = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { walletId: string; aliasId: string }>({
    mutationFn: ({ walletId, aliasId }) =>
      api.delete(`/wallets/${walletId}/aliases/${aliasId}`).then(() => undefined),
    onSuccess: () => invalidateWalletDependents(queryClient),
  });
};
