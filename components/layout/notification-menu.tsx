"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CalendarClock } from "lucide-react";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/src/features/notifications/hooks/useNotifications";
import type { Notification } from "@/src/types/notification";
import { cn } from "@/lib/utils";

function formatOccurrenceDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" }).format(new Date(value));
}

function NotificationRow({ notification, onMarkRead }: { notification: Notification; onMarkRead: (id: string) => void }) {
  const t = useTranslations("notificationCenter");
  const locale = useLocale();
  const isUnread = !notification.readAt;

  return (
    <Link
      href="/transactions/rutin"
      onClick={() => {
        if (isUnread) onMarkRead(notification.id);
      }}
      className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors hover:bg-muted/70 focus-visible:bg-muted/70"
    >
      <span
        aria-hidden
        className={cn("mt-1.5 size-2 shrink-0 rounded-full", isUnread ? "bg-mint" : "bg-transparent")}
      />
      <CalendarClock className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <span className="flex flex-col gap-0.5">
        <span className={cn("text-foreground", isUnread && "font-semibold")}>
          {t("reminderMessage", { name: notification.templateName })}
        </span>
        <span className="text-xs text-muted-foreground">
          {formatOccurrenceDate(notification.occurrenceDate, locale)}
        </span>
      </span>
    </Link>
  );
}

export function NotificationMenuItems() {
  const t = useTranslations("notificationCenter");
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notifications.filter((n) => !n.readAt).length;

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
        ) : notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          notifications.map((notification) => (
            <NotificationRow
              key={notification.id}
              notification={notification}
              onMarkRead={(id) => markRead.mutate(id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
