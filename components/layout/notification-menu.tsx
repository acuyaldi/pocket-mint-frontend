"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications, useRefreshNotifications, useUnreadNotificationCount } from "@/src/features/notifications/hooks/useNotifications";
import { useNotificationActions } from "@/src/features/notifications/hooks/useNotificationActions";
import { ConfirmReminderModal } from "@/src/features/notifications/components/ConfirmReminderModal";
import type { Notification } from "@/src/types/notification";
import { cn } from "@/lib/utils";

export function formatOccurrenceDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

export function NotificationRow({
  notification,
  onMarkRead,
  onConfirm,
  isConfirming,
}: {
  notification: Notification;
  onMarkRead: (id: string) => void;
  onConfirm: (notification: Notification) => void;
  isConfirming: boolean;
}) {
  const t = useTranslations("notificationCenter");
  const locale = useLocale();
  const isUnread = !notification.readAt;
  const isCompleted = notification.completed;
  const isInstallment = !!notification.installmentId;
  const name = isInstallment
    ? notification.installmentDescription ?? notification.installmentWalletName ?? ""
    : notification.templateName ?? "";

  return (
    <div className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-muted/70 focus-visible:bg-muted/70">
      <Link
        href={isInstallment ? "/tagihan" : "/transactions/rutin"}
        onClick={() => {
          if (isUnread) onMarkRead(notification.id);
        }}
        className="flex flex-1 items-start gap-3"
      >
        <span
          aria-hidden
          className={cn("mt-1.5 size-2 shrink-0 rounded-full", isUnread ? "bg-mint" : "bg-transparent")}
        />
        <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
        <span className="flex flex-col gap-0.5">
          <span className={cn("text-foreground", isUnread && "font-semibold")}>
            {t("reminderMessage", { name })}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatOccurrenceDate(notification.occurrenceDate, locale)}
          </span>
        </span>
      </Link>
      {isInstallment ? null : isCompleted ? (
        <span className="mt-1 shrink-0 text-xs font-semibold text-muted-foreground">{t("completed")}</span>
      ) : (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isConfirming}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onConfirm(notification);
          }}
          className="mt-0.5 shrink-0 gap-1 bg-card"
        >
          {isConfirming ? <Loader2 className="size-3.5 animate-spin" /> : null}
          {t("confirm")}
        </Button>
      )}
    </div>
  );
}

export function NotificationMenuItems() {
  const t = useTranslations("notificationCenter");
  const { data, isLoading, isError, refetch } = useNotifications();
  const notifications = data?.items ?? [];
  const refresh = useRefreshNotifications();
  const {
    markRead,
    markAllRead,
    confirmReminder,
    flexibleTarget,
    setFlexibleTarget,
    handleConfirm,
    handleFlexibleSubmit,
  } = useNotificationActions();
  const unreadCount = useUnreadNotificationCount();

  // Dropdown content only mounts while open (base-ui Menu), so this fires
  // once per open — an explicit, targeted refresh, not polling.
  useEffect(() => {
    refresh.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex max-h-[70vh] w-80 flex-col">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-sm font-semibold text-foreground">{t("title")}</span>
        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
            className="text-xs font-medium text-primary hover:underline disabled:opacity-50"
          >
            {t("markAllRead")}
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-0.5 overflow-y-auto">
        {isLoading ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t("loading")}</p>
        ) : isError ? (
          <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
            <p className="text-sm text-muted-foreground">{t("page.error")}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("page.retry")}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={(id) => markRead.mutate(id)}
              onConfirm={handleConfirm}
              isConfirming={confirmReminder.isPending && confirmReminder.variables?.id === notification.id}
            />
          ))
        )}
      </div>
      <Link
        href="/notifications"
        className="mt-1 rounded-lg px-3 py-2 text-center text-xs font-medium text-primary outline-none hover:bg-muted/70 hover:underline focus-visible:bg-muted/70"
      >
        {t("viewAll")}
      </Link>
      {flexibleTarget ? (
        <ConfirmReminderModal
          notification={flexibleTarget}
          isSaving={confirmReminder.isPending}
          onClose={() => setFlexibleTarget(null)}
          onSubmit={handleFlexibleSubmit}
        />
      ) : null}
    </div>
  );
}
