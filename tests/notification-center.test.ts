import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const hookSource = readFileSync(root + "src/features/notifications/hooks/useNotifications.ts", "utf8");
const menuSource = readFileSync(root + "components/layout/notification-menu.tsx", "utf8");
const topbarSource = readFileSync(root + "components/layout/app-topbar.tsx", "utf8");

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

  it("invalidates the notifications query after both mutations", () => {
    const invalidations = hookSource.match(/queryClient\.invalidateQueries\(\{ queryKey: \['notifications'\] \}\)/g) ?? [];
    expect(invalidations.length).toBe(2);
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
});
