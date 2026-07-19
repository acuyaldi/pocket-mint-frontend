import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const readNormalized = (path: string) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const root = fileURLToPath(new URL("../", import.meta.url));
const hookSource = readNormalized(root + "src/features/notifications/hooks/useNotifications.ts");
const menuSource = readNormalized(root + "components/layout/notification-menu.tsx");
const topbarSource = readNormalized(root + "components/layout/app-topbar.tsx");
const modalSource = readNormalized(root + "src/features/notifications/components/ConfirmReminderModal.tsx");

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
});

describe("notification menu", () => {
  it("marks a notification as read only when it was unread, then navigates to the template", () => {
    expect(menuSource).toContain('href="/transactions/rutin"');
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
});

describe("confirm reminder hook", () => {
  it("confirms via POST /notifications/:id/confirm, forwarding the amount only when provided", () => {
    expect(hookSource).toContain(
      "api\n        .post<{ status: string; data: ConfirmReminderResult }>(`/notifications/${id}/confirm`, amount !== undefined ? { amount } : {})"
    );
  });

  it("invalidates notifications, transactions, and wallets on success", () => {
    expect(hookSource).toContain("queryClient.invalidateQueries({ queryKey: ['notifications'] });");
    expect(hookSource).toContain("queryClient.invalidateQueries({ queryKey: ['transactions'] });");
    expect(hookSource).toContain("queryClient.invalidateQueries({ queryKey: ['wallets'] });");
  });
});

describe("notification menu — quick confirm", () => {
  it("shows a Confirm action for pending reminders and a Completed label once completedAt is set", () => {
    expect(menuSource).toContain("const isCompleted = !!notification.completedAt;");
    expect(menuSource).toContain('t("completed")');
    expect(menuSource).toContain('t("confirm")');
  });

  it("opens the flexible-amount modal instead of confirming immediately when amountMode is FLEXIBLE", () => {
    expect(menuSource).toContain('if (notification.templateAmountMode === "FLEXIBLE")');
    expect(menuSource).toContain("setFlexibleTarget(notification);");
  });

  it("confirms a FIXED reminder directly and navigates to /transactions on success", () => {
    expect(menuSource).toContain('confirmReminder.mutate(\n      { id: notification.id },\n      { onSuccess: () => router.push("/transactions") }\n    );');
  });

  it("navigates to /transactions after a flexible confirm submits successfully", () => {
    expect(menuSource).toContain("await confirmReminder.mutateAsync({ id: flexibleTarget.id, amount });");
    expect(menuSource).toContain('router.push("/transactions");');
  });

  it("stops the confirm click from also triggering the row's navigation link", () => {
    expect(menuSource).toContain("event.preventDefault();\n            event.stopPropagation();\n            onConfirm(notification);");
  });

  it("disables the confirm button while a confirmation is in flight", () => {
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
