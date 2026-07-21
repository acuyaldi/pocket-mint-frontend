"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/layout/page-header";
import { NotificationRow } from "@/components/layout/notification-menu";
import {
  NOTIFICATIONS_PAGE_SIZE,
  useNotifications,
  useRefreshNotifications,
  useUnreadNotificationCount,
} from "@/src/features/notifications/hooks/useNotifications";
import { useNotificationActions } from "@/src/features/notifications/hooks/useNotificationActions";
import { ConfirmReminderModal } from "@/src/features/notifications/components/ConfirmReminderModal";
import { cn } from "@/lib/utils";

type Filter = "all" | "unread";

export default function NotificationsPage() {
  const t = useTranslations("notificationCenter");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useNotifications({ page, limit: NOTIFICATIONS_PAGE_SIZE, filter });
  const items = data?.items ?? [];
  const pagination = data?.pagination;
  const totalPages = pagination?.totalPages ?? 1;

  const unreadCount = useUnreadNotificationCount();
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

  useEffect(() => {
    refresh.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The server total can shrink under the current page (marking read while on
  // the Unread filter, mark-all-read, etc.) — clamp back to the last valid
  // page. This must re-trigger a fetch (not just re-derive a render value),
  // so it stays an Effect rather than a derived value.
  useEffect(() => {
    if (pagination && page > pagination.totalPages) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPage(pagination.totalPages);
    }
  }, [pagination, page]);

  const handleFilterChange = (next: Filter) => {
    setFilter(next);
    setPage(1);
  };

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("page.back")}
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <PageHeader title={t("page.title")} description={t("page.description")} />
          {unreadCount > 0 ? (
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="shrink-0 text-sm font-medium text-primary hover:underline disabled:opacity-50"
            >
              {t("markAllRead")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "unread"] as const).map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => handleFilterChange(option)}
            aria-current={filter === option ? "true" : undefined}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              filter === option
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {t(`page.filters.${option}`)}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-card p-2">
        {isLoading ? (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">{t("loading")}</p>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">{t("page.error")}</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="text-sm font-medium text-primary hover:underline"
            >
              {t("page.retry")}
            </button>
          </div>
        ) : items.length === 0 ? (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            {filter === "unread" ? t("page.emptyUnread") : t("empty")}
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-0.5">
              {items.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onMarkRead={(id) => markRead.mutate(id)}
                  onConfirm={handleConfirm}
                  isConfirming={confirmReminder.isPending && confirmReminder.variables?.id === notification.id}
                />
              ))}
            </div>
            {totalPages > 1 ? (
              <div className="flex items-center justify-between gap-4 border-t border-border px-3 pt-3">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  {t("page.previous")}
                </button>
                <span className="text-xs text-muted-foreground">
                  {t("page.pageIndicator", { page, totalPages })}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={!pagination?.hasMore}
                  className="text-sm font-medium text-primary hover:underline disabled:opacity-40 disabled:no-underline"
                >
                  {t("page.next")}
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>

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
