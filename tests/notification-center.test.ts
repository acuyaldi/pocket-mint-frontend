import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const readNormalized = (path: string) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const root = fileURLToPath(new URL("../", import.meta.url));
const hookSource = readNormalized(root + "src/features/notifications/hooks/useNotifications.ts");
const actionsSource = readNormalized(root + "src/features/notifications/hooks/useNotificationActions.ts");
const menuSource = readNormalized(root + "components/layout/notification-menu.tsx");
const topbarSource = readNormalized(root + "components/layout/app-topbar.tsx");
const modalSource = readNormalized(root + "src/features/notifications/components/ConfirmReminderModal.tsx");
const pageSource = readNormalized(root + "app/(app)/notifications/page.tsx");

describe("notification center hooks", () => {
  it("lists notifications from the reminder-events endpoint", () => {
    expect(hookSource).toContain("api.get<{ status: string; data: Notification[] }>('/notifications')");
  });

  it("derives unread count from readAt being unset", () => {
    expect(hookSource).toContain("notifications.filter((n) => !n.readAt).length");
  });

  it("marks a single notification read via PATCH /notifications/:id/read", () => {
    expect(hookSource).toContain("api.patch<{ status: string; data: Notification }>(`/notifications/${id}/read`)");
  });

  it("marks all notifications read via PATCH /notifications/read-all", () => {
    expect(hookSource).toContain("api.patch<{ status: string; data: { count: number } }>('/notifications/read-all')");
  });

  it("invalidates the notifications query after read/read-all/confirm mutations", () => {
    const invalidations = hookSource.match(/queryClient\.invalidateQueries\(\{ queryKey: \['notifications'\] \}\)/g) ?? [];
    expect(invalidations.length).toBe(3);
  });

  it("refreshes via an explicit POST /notifications/refresh, not GET", () => {
    expect(hookSource).toContain("api\n        .post<{ status: string; data: Notification[] }>('/notifications/refresh')");
  });

  it("seeds the notifications cache directly with the refreshed list instead of refetching", () => {
    expect(hookSource).toContain("queryClient.setQueryData(['notifications'], data);");
  });

  it("dedupes concurrent refresh calls behind a shared in-flight promise", () => {
    expect(hookSource).toContain("let inFlightRefresh: Promise<Notification[]> | null = null;");
    expect(hookSource).toContain("if (inFlightRefresh) return inFlightRefresh;");
  });

  it("reuses the cache within the freshness window instead of hitting the network", () => {
    expect(hookSource).toContain("const FRESHNESS_WINDOW_MS = 2 * 60 * 1000;");
    expect(hookSource).toContain("if (Date.now() - lastRefreshAt < FRESHNESS_WINDOW_MS)");
  });

  it("only advances lastRefreshAt on a successful refresh, so a failed refresh can retry", () => {
    expect(hookSource).toContain("lastRefreshAt = Date.now();");
    expect(hookSource.indexOf("lastRefreshAt = Date.now();")).toBeGreaterThan(hookSource.indexOf(".post<"));
  });

  it("never uses polling primitives for refresh coordination", () => {
    expect(hookSource).not.toMatch(/setInterval|setTimeout/);
  });
});

describe("notification menu", () => {
  it("marks a notification as read only when it was unread, then navigates to the template", () => {
    expect(menuSource).toContain('href={isInstallment ? "/tagihan" : "/transactions/rutin"}');
    expect(menuSource).toContain("if (isUnread) onMarkRead(notification.id);");
  });

  it("only shows the mark-all-read action when there is unread mail", () => {
    expect(menuSource).toContain("unreadCount > 0 ?");
    expect(menuSource).toContain("markAllRead.mutate()");
  });

  it("distinguishes loading, empty, and populated states", () => {
    expect(menuSource).toContain('t("loading")');
    expect(menuSource).toContain('t("empty")');
  });

  it("triggers a targeted refresh once when the dropdown mounts (opens), not on a polling interval", () => {
    expect(menuSource).toContain("refresh.mutate();");
    expect(menuSource).not.toMatch(/setInterval|setTimeout/);
  });

  it("links to the View All notifications page", () => {
    expect(menuSource).toContain('href="/notifications"');
    expect(menuSource).toContain('t("viewAll")');
  });
});

describe("confirm reminder hook", () => {
  it("confirms via POST /notifications/:id/confirm, forwarding the amount only when provided", () => {
    expect(hookSource).toContain(
      "api\n        .post<{ status: string; data: ConfirmReminderResult }>(`/notifications/${id}/confirm`, amount !== undefined ? { amount } : {})"
    );
  });

  it("invalidates notifications, transactions, and wallets on success", () => {
    expect(hookSource).toContain("queryClient.invalidateQueries({ queryKey: ['notifications'] });");
    expect(hookSource).toContain("invalidateTransactionDependents(queryClient);");
  });
});

describe("notification menu — quick confirm", () => {
  it("shows a Confirm action for pending reminders and a Completed label once completed is derived true", () => {
    expect(menuSource).toContain("const isCompleted = notification.completed;");
    expect(menuSource).toContain('t("completed")');
    expect(menuSource).toContain('t("confirm")');
  });

  it("opens the flexible-amount modal instead of confirming immediately when amountMode is FLEXIBLE", () => {
    expect(actionsSource).toContain("if (notification.templateAmountMode === 'FLEXIBLE')");
    expect(actionsSource).toContain("setFlexibleTarget(notification);");
  });

  it("confirms a FIXED reminder directly and navigates to /transactions on success", () => {
    expect(actionsSource).toContain(
      "confirmReminder.mutate({ id: notification.id }, { onSuccess: () => router.push('/transactions') });"
    );
  });

  it("navigates to /transactions after a flexible confirm submits successfully", () => {
    expect(actionsSource).toContain("await confirmReminder.mutateAsync({ id: flexibleTarget.id, amount });");
    expect(actionsSource).toContain("router.push('/transactions');");
  });

  it("shares the same Quick Confirm state machine between the dropdown and the View All page", () => {
    expect(menuSource).toContain("useNotificationActions();");
    expect(pageSource).toContain("useNotificationActions();");
  });

  it("stops the confirm click from also triggering the row's navigation link", () => {
    expect(menuSource).toContain("event.preventDefault();\n            event.stopPropagation();\n            onConfirm(notification);");
  });
});

describe("notification menu — installment reminders (Phase 7)", () => {
  it("links installment rows to /tagihan instead of /transactions/rutin", () => {
    expect(menuSource).toContain('href={isInstallment ? "/tagihan" : "/transactions/rutin"}');
  });

  it("marks the notification read via the same row click used for template reminders", () => {
    expect(menuSource).toContain("if (isUnread) onMarkRead(notification.id);");
  });

  it("does not import or render PayBillModal", () => {
    expect(menuSource).not.toContain("PayBillModal");
  });

  it("does not call usePayBill or reference bills/wallets for the pay flow", () => {
    expect(menuSource).not.toContain("usePayBill");
    expect(menuSource).not.toContain("useBills");
    expect(menuSource).not.toContain("useWallets");
    expect(menuSource).not.toContain("setPayTarget");
  });

  it("renders no action (Pay, Confirm, or Mark Paid) for installment rows", () => {
    expect(menuSource).toContain("{isInstallment ? null : isCompleted ? (");
  });

  it("disables the confirm button while a confirmation is in flight (template reminders only)", () => {
    expect(menuSource).toContain("disabled={isConfirming}");
    expect(menuSource).toContain("confirmReminder.isPending && confirmReminder.variables?.id === notification.id");
  });
});

describe("confirm reminder modal", () => {
  it("only has an amount field and Cancel / Create Transaction actions", () => {
    expect(modalSource).toContain('t("amount")');
    expect(modalSource).toContain('tCommon("actions.cancel")');
    expect(modalSource).toContain('t("submit")');
  });

  it("reuses the Rupiah formatting helpers from the recurring transaction modal", () => {
    expect(modalSource).toContain("const formatRupiahVisual = (value: string): string =>");
    expect(modalSource).toContain("const parseRupiahToNumber = (value: string): number =>");
  });

  it("rejects submitting a zero or empty amount", () => {
    expect(modalSource).toContain("if (parsedAmount <= 0) return;");
    expect(modalSource).toContain("disabled={isSaving || parseRupiahToNumber(amount) <= 0}");
  });

  it("surfaces the backend error message when confirmation fails", () => {
    expect(modalSource).toContain("?.response?.data?.error?.message;");
    expect(modalSource).toContain('t("errors.genericFailed")');
  });
});

describe("topbar notification bell", () => {
  it("wires the bell trigger to the notification dropdown and an unread badge", () => {
    expect(topbarSource).toContain("<NotificationMenuItems />");
    expect(topbarSource).toContain("unreadCount > 0 ?");
    expect(topbarSource).toContain('{unreadCount > 9 ? "9+" : unreadCount}');
  });
});

describe("notifications View All page", () => {
  it("reuses the shared NotificationRow instead of duplicating row markup", () => {
    expect(pageSource).toContain('import { NotificationRow } from "@/components/layout/notification-menu";');
  });

  it("refreshes on load and lists all notifications, not just unread ones", () => {
    expect(pageSource).toContain("refresh.mutate();");
    expect(pageSource).toContain("pageItems.map((notification) => (");
  });

  it("distinguishes loading, error, and empty states", () => {
    expect(pageSource).toContain('t("loading")');
    expect(pageSource).toContain('t("empty")');
    expect(pageSource).toContain("isError");
    expect(pageSource).toContain('t("page.error")');
  });

  it("offers mark-all-read only when there is unread mail", () => {
    expect(pageSource).toContain("unreadCount > 0 ?");
    expect(pageSource).toContain("markAllRead.mutate()");
  });

  it("filters between All and Unread, resetting to page 1 on change", () => {
    expect(pageSource).toContain('filter === "unread" ? notifications.filter((n) => !n.readAt) : notifications');
    expect(pageSource).toContain("setFilter(next);\n    setPage(1);");
  });

  it("shows a separate empty state for the Unread filter", () => {
    expect(pageSource).toContain('filter === "unread" ? t("page.emptyUnread") : t("empty")');
  });

  it("paginates client-side over the full notification array with a fixed page size", () => {
    expect(pageSource).toContain("const PAGE_SIZE = 10;");
    expect(pageSource).toContain("filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)");
    expect(pageSource).toContain("Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))");
  });

  it("clamps the current page down when filtered results shrink", () => {
    expect(pageSource).toContain("setPage((current) => Math.min(current, totalPages));");
  });

  it("links back to the dashboard", () => {
    expect(pageSource).toContain('href="/dashboard"');
    expect(pageSource).toContain('t("page.back")');
  });
});

describe("notification center translations", () => {
  it("expose the same keys in id and en", () => {
    expect(Object.keys(idMessages.notificationCenter).sort()).toEqual(
      Object.keys(enMessages.notificationCenter).sort(),
    );
  });

  it("expose the critical notification center keys", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.notificationCenter.title).toBeTruthy();
      expect(messages.notificationCenter.markAllRead).toBeTruthy();
      expect(messages.notificationCenter.empty).toBeTruthy();
      expect(messages.notificationCenter.viewAll).toBeTruthy();
      expect(messages.notificationCenter.page.title).toBeTruthy();
      expect(messages.notificationCenter.page.description).toBeTruthy();
      expect(messages.notificationCenter.page.back).toBeTruthy();
      expect(messages.notificationCenter.page.filters.all).toBeTruthy();
      expect(messages.notificationCenter.page.filters.unread).toBeTruthy();
      expect(messages.notificationCenter.page.emptyUnread).toBeTruthy();
      expect(messages.notificationCenter.page.error).toBeTruthy();
      expect(messages.notificationCenter.page.retry).toBeTruthy();
      expect(messages.notificationCenter.page.previous).toBeTruthy();
      expect(messages.notificationCenter.page.next).toBeTruthy();
      expect(messages.notificationCenter.page.pageIndicator).toBeTruthy();
      expect(messages.nav.unreadAria).toBeTruthy();
    }
  });

  it("expose the quick-confirm keys in both locales", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.notificationCenter.confirm).toBeTruthy();
      expect(messages.notificationCenter.completed).toBeTruthy();
      expect(messages.notificationCenter.confirmModal.title).toBeTruthy();
      expect(messages.notificationCenter.confirmModal.amount).toBeTruthy();
      expect(messages.notificationCenter.confirmModal.submit).toBeTruthy();
      expect(messages.notificationCenter.confirmModal.errors.genericFailed).toBeTruthy();
    }
    expect(Object.keys(idMessages.notificationCenter.confirmModal).sort()).toEqual(
      Object.keys(enMessages.notificationCenter.confirmModal).sort(),
    );
  });
});
