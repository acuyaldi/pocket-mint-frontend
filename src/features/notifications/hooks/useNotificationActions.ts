'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useConfirmReminder,
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
} from '@/src/features/notifications/hooks/useNotifications';
import type { Notification } from '@/src/types/notification';

/** Shared Quick Confirm + mark-read state machine used by the dropdown and the View All page. */
export function useNotificationActions() {
  const router = useRouter();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const confirmReminder = useConfirmReminder();
  const [flexibleTarget, setFlexibleTarget] = useState<Notification | null>(null);

  const handleConfirm = (notification: Notification) => {
    if (notification.templateAmountMode === 'FLEXIBLE') {
      setFlexibleTarget(notification);
      return;
    }
    confirmReminder.mutate({ id: notification.id }, { onSuccess: () => router.push('/transactions') });
  };

  const handleFlexibleSubmit = async (amount: number) => {
    if (!flexibleTarget) return;
    await confirmReminder.mutateAsync({ id: flexibleTarget.id, amount });
    setFlexibleTarget(null);
    router.push('/transactions');
  };

  return {
    markRead,
    markAllRead,
    confirmReminder,
    flexibleTarget,
    setFlexibleTarget,
    handleConfirm,
    handleFlexibleSubmit,
  };
}
