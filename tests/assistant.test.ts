import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * Source-text contract tests, matching this repo's convention (see
 * `tests/budgets.test.ts` header) — no jsdom/testing-library is installed,
 * so these assert exact substrings in the real source rather than rendering
 * components or calling hooks.
 */

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const apiSource = readFileSync(root + "src/features/assistant/api/assistantApi.ts", "utf8");
const sessionHookSource = readFileSync(root + "src/features/assistant/hooks/useAssistantSession.ts", "utf8");
const messagesHookSource = readFileSync(root + "src/features/assistant/hooks/useAssistantMessages.ts", "utf8");
const draftHookSource = readFileSync(root + "src/features/assistant/hooks/useAssistantDraft.ts", "utf8");
const typesSource = readFileSync(root + "src/types/assistant.ts", "utf8");
const pageSource = readFileSync(root + "app/(app)/assistant/page.tsx", "utf8");
const sidebarSource = readFileSync(root + "components/layout/app-sidebar.tsx", "utf8");
const bottomNavSource = readFileSync(root + "components/layout/bottom-nav.tsx", "utf8");
const libApiSource = readFileSync(root + "lib/api.ts", "utf8");

describe("assistant navigation", () => {
  it("adds a first-class nav entry on both desktop and mobile, matching each other", () => {
    for (const source of [sidebarSource, bottomNavSource]) {
      expect(source).toContain('href: "/assistant"');
      expect(source).toContain('label: t("assistant")');
    }
    expect(enMessages.nav.assistant).toBeTruthy();
    expect(idMessages.nav.assistant).toBeTruthy();
  });
});

describe("assistant API contract", () => {
  it("reuses the shared lib/api.ts client — no second HTTP client", () => {
    expect(apiSource).toContain('import api from "@/lib/api";');
    expect(apiSource).not.toContain("axios.create");
  });

  it("hits only real backend routes under /assistant", () => {
    expect(apiSource).toContain('"/assistant/messages"');
    expect(apiSource).toContain('"/assistant/execute"');
    expect(apiSource).toContain('"/assistant/conversations"');
    expect(apiSource).toContain("`/assistant/conversations/${conversationId}`");
    expect(apiSource).toContain("`/assistant/conversations/${conversationId}/archive`");
    expect(apiSource).toContain("`/assistant/drafts/${draftId}/confirm`");
    expect(apiSource).toContain("`/assistant/drafts/${draftId}/cancel`");
    expect(apiSource).toContain(
      "`/assistant/conversations/${conversationId}/clarifications/${clarificationId}/select`"
    );
    expect(apiSource).toContain(
      "`/assistant/conversations/${conversationId}/clarifications/${clarificationId}/cancel`"
    );
  });

  it("never invents a create-session or fetch-draft endpoint — neither exists on the backend", () => {
    expect(apiSource).not.toContain("/assistant/sessions");
    expect(apiSource).not.toMatch(/api\.get.*\/assistant\/drafts/);
  });

  it("sends the Idempotency-Key header required by draft confirmation", () => {
    expect(apiSource).toContain('"Idempotency-Key": idempotencyKey');
  });
});

describe("assistant React Query hooks", () => {
  it("session hooks use the assistantKeys factory and reuse the shared api client", () => {
    expect(sessionHookSource).toContain("assistantKeys.conversations(page, limit)");
    expect(sessionHookSource).toContain("assistantKeys.session(conversationId ?? \"\")");
    expect(sessionHookSource).toContain('enabled: !!conversationId');
  });

  it("messages hook selects out of the shared session query instead of a second fetch", () => {
    expect(messagesHookSource).toContain("assistantKeys.session(conversationId ?? \"\")");
    expect(messagesHookSource).toContain("select: (session): AssistantMessage[] => session.messages.items");
  });

  it("draft hook only exposes confirm/cancel mutations — no fetch-draft query", () => {
    expect(draftHookSource).toContain("useConfirmAssistantDraft");
    expect(draftHookSource).toContain("useCancelAssistantDraft");
    expect(draftHookSource).not.toMatch(/\buseQuery\b/);
    expect(draftHookSource).toContain("createIdempotencyKey()");
  });

  it("no hook manages its own useState-based cache — TanStack Query only, no Redux/Zustand", () => {
    for (const source of [sessionHookSource, messagesHookSource, draftHookSource]) {
      expect(source).not.toContain("zustand");
      expect(source).not.toContain("redux");
      expect(source).not.toContain("createStore");
    }
  });
});

describe("assistant domain types", () => {
  it("uses the exact backend enums, never re-derived", () => {
    expect(typesSource).toContain('"ACTIVE" | "ARCHIVED" | "EXPIRED"');
    expect(typesSource).toContain('"USER" | "ASSISTANT" | "SYSTEM"');
    expect(typesSource).toContain("AssistantFinancialDraftStatus =");
    for (const status of ["PENDING_CONFIRMATION", "COMMITTED", "CANCELLED", "EXPIRED", "FAILED"]) {
      expect(typesSource).toContain(`"${status}"`);
    }
  });
});

describe("assistant placeholder route", () => {
  it("renders only a placeholder, reusing the shared PageHeader", () => {
    expect(pageSource).toContain('import { PageHeader } from "@/components/layout/page-header";');
    expect(pageSource).toContain('t("underDevelopment")');
  });

  it("does not implement chat, streaming, or markdown rendering", () => {
    for (const forbidden of ["useAssistantSession(", "useSendAssistantMessage(", "ReactMarkdown", "EventSource", "WebSocket"]) {
      expect(pageSource).not.toContain(forbidden);
    }
  });

  it("i18n catalogs define matching assistant keys in both locales", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.assistant.pageTitle).toBeTruthy();
      expect(messages.assistant.pageDescription).toBeTruthy();
      expect(messages.assistant.underDevelopment).toBeTruthy();
    }
  });
});

describe("assistant auth protection", () => {
  it("relies on the existing deny-by-default middleware — no per-route auth check", () => {
    expect(pageSource).not.toContain("requireUser");
    expect(pageSource).not.toContain("getUser(");
    expect(libApiSource).toContain("Authorization");
  });
});
