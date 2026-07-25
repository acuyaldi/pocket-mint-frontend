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
import { parseAssistantDraftParam } from "@/src/features/assistant/utils/draftParam";
import type { AssistantDraft } from "@/src/types/assistant";

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
const draftSummaryCardSource = readFileSync(root + "src/features/assistant/components/DraftSummaryCard.tsx", "utf8");
const draftActionBarSource = readFileSync(root + "src/features/assistant/components/DraftActionBar.tsx", "utf8");

const VALID_DRAFT: AssistantDraft = {
  draftId: "draft-1",
  status: "PENDING_CONFIRMATION",
  expiresAt: "2026-07-25T15:30:00.000Z",
  confirmationRequired: true,
  renderedText: "Rp50.000 expense at Indomaret from BCA.",
  preview: {
    type: "EXPENSE",
    amount: 50000,
    wallet: "BCA",
    walletId: "wallet-1",
    category: "Makanan",
    merchant: "Indomaret",
    date: "2026-07-25",
  },
};

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

describe("assistant draft review route (Phase 23.2)", () => {
  it("reuses the shared PageHeader", () => {
    expect(pageSource).toContain('import { PageHeader } from "@/components/layout/page-header";');
    expect(pageSource).toContain('t("pageTitle")');
  });

  it("does not implement chat, streaming, markdown, or clarification UI", () => {
    for (const forbidden of [
      "useAssistantSession(",
      "useSendAssistantMessage(",
      "useSelectAssistantClarification(",
      "ReactMarkdown",
      "EventSource",
      "WebSocket",
    ]) {
      expect(pageSource).not.toContain(forbidden);
    }
  });

  it("never fetches a draft — reads it out of the URL instead, since no GET endpoint exists", () => {
    expect(pageSource).toContain("parseAssistantDraftParam(searchParams)");
    expect(pageSource).not.toMatch(/api\.get.*\/assistant\/drafts/);
  });

  it("wires Confirm/Cancel to the existing draft mutation hooks only", () => {
    expect(pageSource).toContain("useConfirmAssistantDraft");
    expect(pageSource).toContain("useCancelAssistantDraft");
    expect(pageSource).toContain("confirmDraft.mutate(draft.draftId");
    expect(pageSource).toContain("cancelDraft.mutate(draft.draftId");
  });

  it("reuses the repository's dashed-border empty-state pattern instead of inventing a new one", () => {
    expect(pageSource).toContain("border-dashed border-border");
    expect(pageSource).toContain('tDraft("empty.title")');
  });

  it("shows loading via the mutation pending state, not a duplicate submit path", () => {
    expect(pageSource).toContain("confirmDraft.isPending");
    expect(pageSource).toContain("cancelDraft.isPending");
  });

  it("i18n catalogs define matching draft-review keys in both locales", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.assistant.pageTitle).toBeTruthy();
      expect(messages.assistant.draftReview.confirm).toBeTruthy();
      expect(messages.assistant.draftReview.cancel).toBeTruthy();
      expect(messages.assistant.draftReview.empty.title).toBeTruthy();
      const statusLabels = messages.assistant.draftReview.status as Record<string, string>;
      for (const status of ["PENDING_CONFIRMATION", "COMMITTED", "CANCELLED", "EXPIRED", "FAILED"]) {
        expect(statusLabels[status]).toBeTruthy();
      }
    }
  });
});

describe("assistant draft param parsing", () => {
  it("returns null when the draft param is absent", () => {
    expect(parseAssistantDraftParam(new URLSearchParams())).toBeNull();
  });

  it("returns null for malformed JSON instead of throwing", () => {
    expect(parseAssistantDraftParam(new URLSearchParams({ draft: "{not-json" }))).toBeNull();
  });

  it("returns null when required fields are missing", () => {
    const incomplete = JSON.stringify({ draftId: "draft-1" });
    expect(parseAssistantDraftParam(new URLSearchParams({ draft: incomplete }))).toBeNull();
  });

  it("returns the parsed draft for a valid payload", () => {
    const params = new URLSearchParams({ draft: JSON.stringify(VALID_DRAFT) });
    expect(parseAssistantDraftParam(params)).toEqual(VALID_DRAFT);
  });
});

describe("assistant draft review components", () => {
  it("DraftSummaryCard only renders fields AssistantDraft actually carries", () => {
    expect(draftSummaryCardSource).toContain("preview.wallet");
    expect(draftSummaryCardSource).toContain("preview.category");
    expect(draftSummaryCardSource).toContain("preview.merchant");
    expect(draftSummaryCardSource).toContain("preview.date");
    expect(draftSummaryCardSource).toContain("preview.description");
    // Not a backend field on AssistantDraft — must never be fabricated.
    expect(draftSummaryCardSource).not.toContain("confidence");
  });

  it("DraftSummaryCard reuses the shared currency formatter", () => {
    expect(draftSummaryCardSource).toContain('import { formatCurrency } from "@/lib/utils";');
  });

  it("DraftActionBar exposes Confirm and Cancel with independent loading states", () => {
    expect(draftActionBarSource).toContain("isConfirming");
    expect(draftActionBarSource).toContain("isCancelling");
    expect(draftActionBarSource).toContain("onConfirm");
    expect(draftActionBarSource).toContain("onCancel");
  });
});

describe("assistant auth protection", () => {
  it("relies on the existing deny-by-default middleware — no per-route auth check", () => {
    expect(pageSource).not.toContain("requireUser");
    expect(pageSource).not.toContain("getUser(");
    expect(libApiSource).toContain("Authorization");
  });
});
