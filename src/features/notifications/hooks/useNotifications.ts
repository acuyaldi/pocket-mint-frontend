'use client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Notification } from '@/src/types/notification';

const STALE_TIME = 60 * 1000;

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
