'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Notification } from '@/src/types/notification';
import { invalidateTransactionDependents } from '@/src/features/transactions/hooks/useTransactions';

const STALE_TIME = 60 * 1000;

// Materialization is at most once every FRESHNESS_WINDOW_MS per browser
// session (module-scope, reset on reload). Concurrent callers (bell dropdown
// + /notifications page mounted together) share one in-flight request via
// inFlightRefresh; a call inside the freshness window resolves immediately
// from the existing cache instead of hitting the network. A failed refresh
// does not update lastRefreshAt, so it may be retried immediately.
const FRESHNESS_WINDOW_MS = 2 * 60 * 1000;
let lastRefreshAt = 0;
let inFlightRefresh: Promise<Notification[]> | null = null;

export const useNotifications = () => {
  return useQuery<Notification[], Error>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: Notification[] }>('/notifications');
      const arr = response.data?.data ?? [];
      return Array.isArray(arr) ? arr : [];
    },
    staleTime: STALE_TIME,
  });
};

export const useUnreadNotificationCount = (): number => {
  const { data: notifications = [] } = useNotifications();
  return notifications.filter((n) => !n.readAt).length;
};

/**
 * On-demand materialization: asks the backend to evaluate reminder events
 * for the authenticated user only, then seeds the ['notifications'] cache
 * with the fresh list. No polling — callers trigger this at specific
 * moments (dropdown open, View All page load).
 */
export const useRefreshNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation<Notification[], Error, void>({
    mutationFn: () => {
      if (inFlightRefresh) return inFlightRefresh;

      if (Date.now() - lastRefreshAt < FRESHNESS_WINDOW_MS) {
        return Promise.resolve(queryClient.getQueryData<Notification[]>(['notifications']) ?? []);
      }

      inFlightRefresh = api
        .post<{ status: string; data: Notification[] }>('/notifications/refresh')
        .then((res) => {
          lastRefreshAt = Date.now();
          return res.data.data;
        })
        .finally(() => {
          inFlightRefresh = null;
        });
      return inFlightRefresh;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['notifications'], data);
    },
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();

  return useMutation<Notification, Error, string>({
    mutationFn: (id) =>
      api.patch<{ status: string; data: Notification }>(`/notifications/${id}/read`).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<{ count: number }, Error, void>({
    mutationFn: () =>
      api.patch<{ status: string; data: { count: number } }>('/notifications/read-all').then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};

export interface ConfirmReminderResult {
  notification: Notification;
  transaction: { id: string; amount: number };
}

export const useConfirmReminder = () => {
  const queryClient = useQueryClient();

  return useMutation<ConfirmReminderResult, Error, { id: string; amount?: number }>({
    mutationFn: ({ id, amount }) =>
      api
        .post<{ status: string; data: ConfirmReminderResult }>(`/notifications/${id}/confirm`, amount !== undefined ? { amount } : {})
        .then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      invalidateTransactionDependents(queryClient);
    },
  });
};
