'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Notification } from '@/src/types/notification';
import { invalidateTransactionDependents } from '@/src/features/transactions/hooks/useTransactions';

const STALE_TIME = 60 * 1000;

// Matches the Notification Center page size (no audit evidence to change it).
export const NOTIFICATIONS_PAGE_SIZE = 10;

export type NotificationFilter = 'all' | 'unread';

export interface NotificationsPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface NotificationsPage {
  items: Notification[];
  pagination: NotificationsPagination;
}

const EMPTY_PAGE: NotificationsPage = {
  items: [],
  pagination: { page: 1, limit: NOTIFICATIONS_PAGE_SIZE, total: 0, totalPages: 1, hasMore: false },
};

export interface UseNotificationsParams {
  page?: number;
  limit?: number;
  filter?: NotificationFilter;
}

// Materialization is at most once every FRESHNESS_WINDOW_MS per browser
// session (module-scope, reset on reload). Concurrent callers (bell dropdown
// + /notifications page mounted together) share one in-flight request via
// inFlightRefresh; a call inside the freshness window is a no-op instead of
// hitting the network. A failed refresh does not update lastRefreshAt, so it
// may be retried immediately.
const FRESHNESS_WINDOW_MS = 2 * 60 * 1000;
let lastRefreshAt = 0;
let inFlightRefresh: Promise<void> | null = null;

/**
 * Server-driven page of notifications. `page`/`limit`/`filter` are part of the
 * query key so each combination caches independently and a filter change
 * fetches its own page 1 rather than reusing a stale slice.
 */
export const useNotifications = (params: UseNotificationsParams = {}) => {
  const { page = 1, limit = NOTIFICATIONS_PAGE_SIZE, filter = 'all' } = params;

  return useQuery<NotificationsPage, Error>({
    queryKey: ['notifications', 'list', page, limit, filter],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: NotificationsPage }>('/notifications', {
        params: { page, limit, filter },
      });
      return response.data?.data ?? EMPTY_PAGE;
    },
    staleTime: STALE_TIME,
  });
};

/**
 * Accurate unread count regardless of what page/filter the bell or the
 * Notification Center happen to be showing — reads the server's total for
 * the unread filter (limit: 1, only pagination metadata is used).
 */
export const useUnreadNotificationCount = (): number => {
  const { data } = useQuery<NotificationsPage, Error>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const response = await api.get<{ status: string; data: NotificationsPage }>('/notifications', {
        params: { page: 1, limit: 1, filter: 'unread' },
      });
      return response.data?.data ?? EMPTY_PAGE;
    },
    staleTime: STALE_TIME,
  });
  return data?.pagination.total ?? 0;
};

/**
 * On-demand materialization: asks the backend to evaluate reminder events
 * for the authenticated user only, then invalidates every notifications
 * query so active pages/filters refetch. No polling — callers trigger this
 * at specific moments (dropdown open, View All page load).
 */
export const useRefreshNotifications = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: () => {
      if (inFlightRefresh) return inFlightRefresh;

      if (Date.now() - lastRefreshAt < FRESHNESS_WINDOW_MS) {
        return Promise.resolve();
      }

      inFlightRefresh = api
        .post('/notifications/refresh')
        .then(() => {
          lastRefreshAt = Date.now();
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        })
        .finally(() => {
          inFlightRefresh = null;
        });
      return inFlightRefresh;
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
