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
import { isClarificationRequest } from "@/src/features/assistant/utils/clarification";
import { readAssistantErrorMessage } from "@/src/features/assistant/utils/errors";
import type { AssistantDraft, ClarificationRequest } from "@/src/types/assistant";

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
const commandFormSource = readFileSync(root + "src/features/assistant/components/AssistantCommandForm.tsx", "utf8");
const clarificationCardSource = readFileSync(root + "src/features/assistant/components/ClarificationCard.tsx", "utf8");
const clarificationOptionsSource = readFileSync(
  root + "src/features/assistant/components/ClarificationOptions.tsx",
  "utf8"
);
const resultStateSource = readFileSync(root + "src/features/assistant/components/AssistantResultState.tsx", "utf8");

const VALID_CLARIFICATION: ClarificationRequest = {
  clarificationId: "clar-1",
  entityType: "wallet",
  prompt: "Which wallet did you mean?",
  options: [
    { token: "tok-1", label: "BCA", discriminator: "BANK" },
    { token: "tok-2", label: "Cash" },
  ],
  expiresAt: "2026-07-25T15:30:00.000Z",
};

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

  it("does not implement chat timeline, streaming, markdown, or attachment UI", () => {
    for (const forbidden of ["ReactMarkdown", "EventSource", "WebSocket", "<textarea"]) {
      expect(pageSource).not.toContain(forbidden);
      expect(commandFormSource).not.toContain(forbidden);
    }
  });

  it("still supports reading a draft out of the URL — no GET endpoint exists to fetch one instead", () => {
    expect(pageSource).toContain("parseAssistantDraftParam(searchParams)");
    expect(pageSource).not.toMatch(/api\.get.*\/assistant\/drafts/);
  });

  it("wires Confirm/Cancel to the existing draft mutation hooks only", () => {
    expect(pageSource).toContain("useConfirmAssistantDraft");
    expect(pageSource).toContain("useCancelAssistantDraft");
    expect(pageSource).toContain("confirmDraft.mutate(effectivePhase.draft.draftId");
    expect(pageSource).toContain("cancelDraft.mutate(effectivePhase.draft.draftId");
  });

  it("shows loading via the mutation pending state, not a duplicate submit path", () => {
    expect(pageSource).toContain("confirmDraft.isPending");
    expect(pageSource).toContain("cancelDraft.isPending");
    expect(pageSource).toContain("sendMessage.isPending");
  });

  it("i18n catalogs define matching draft-review keys in both locales", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.assistant.pageTitle).toBeTruthy();
      expect(messages.assistant.draftReview.confirm).toBeTruthy();
      expect(messages.assistant.draftReview.cancel).toBeTruthy();
      const statusLabels = messages.assistant.draftReview.status as Record<string, string>;
      for (const status of ["PENDING_CONFIRMATION", "COMMITTED", "CANCELLED", "EXPIRED", "FAILED"]) {
        expect(statusLabels[status]).toBeTruthy();
      }
    }
  });
});

describe("assistant clarification flow (Phase 23.3)", () => {
  it("page wires the instruction form to the real message endpoint", () => {
    expect(pageSource).toContain("useSendAssistantMessage");
    expect(pageSource).toContain("sendMessage.mutate(");
    expect(pageSource).toContain("AssistantCommandForm");
  });

  it("rejects blank or whitespace-only instructions before submitting", () => {
    expect(commandFormSource).toContain("value.trim().length > 0");
    expect(pageSource).toContain("instructionText.trim()");
  });

  it("preserves the entered instruction after a recoverable submit failure", () => {
    expect(pageSource).toContain("setFormError(readAssistantErrorMessage(error, tErrors))");
    // Only a successful submission clears the instruction text.
    expect(pageSource).toMatch(/onSuccess:\s*\(result\)\s*=>\s*\{\s*setInstructionText\(""\);/);
  });

  it("an immediate draft response enters draft review directly", () => {
    expect(pageSource).toContain("isAssistantDraft(result.data)");
    expect(pageSource).toContain('setPhase({ kind: "draft", draft: result.data })');
  });

  it("a clarification_required response renders only backend-provided options", () => {
    expect(pageSource).toContain("isClarificationRequest(result.data.clarification)");
    expect(pageSource).toContain("ClarificationCard");
    expect(clarificationOptionsSource).toContain("options.map((option)");
    expect(clarificationOptionsSource).not.toContain(".sort(");
  });

  it("only forwards the exact backend-issued option token, never a client value", () => {
    expect(clarificationOptionsSource).toContain("onSelect(option.token)");
    expect(pageSource).toContain("optionToken: token");
  });

  it("clarification token/id are forwarded unchanged, never decoded or altered", () => {
    expect(pageSource).toContain("clarificationId: effectivePhase.clarification.clarificationId");
    expect(pageSource).not.toMatch(/atob\(|JSON\.parse\(token/);
  });

  it("blocks duplicate option submission while a selection is pending", () => {
    expect(pageSource).toContain("selectClarification.isPending || cancelClarification.isPending) return;");
  });

  it("handles chained clarification by replacing the current clarification, not assuming a draft", () => {
    expect(pageSource).toContain("function applySelectResult");
    expect(pageSource).toMatch(/applySelectResult[\s\S]*?status === "clarification_required"/);
  });

  it("a resolved clarification reuses the Phase 23.2 draft review components", () => {
    expect(pageSource).toContain('import { DraftSummaryCard } from "@/src/features/assistant/components/DraftSummaryCard";');
    expect(pageSource).toContain('import { DraftActionBar } from "@/src/features/assistant/components/DraftActionBar";');
  });

  it("clears transient draft/clarification state after a successful confirm or cancel", () => {
    expect(pageSource).toContain("function resetFlow()");
    expect(pageSource).toContain('setPhase({ kind: "idle" })');
    expect(pageSource).toContain("sendMessage.reset()");
    expect(pageSource).toContain("selectClarification.reset()");
    expect(pageSource).toContain("cancelClarification.reset()");
    expect(pageSource).toContain("confirmDraft.reset()");
    expect(pageSource).toContain("cancelDraft.reset()");
    expect(pageSource).toContain("resetFlow();");
  });

  it("never calls a transaction-creation endpoint directly — the backend is the sole authority", () => {
    for (const forbidden of ["/transactions", "createTransaction", "/wallets"]) {
      expect(pageSource).not.toContain(forbidden);
    }
  });

  it("the draft handoff stays in bounded component state, not a new URL write or global store", () => {
    expect(pageSource).not.toMatch(/router\.(push|replace)\(`?\/assistant\?draft=/);
    expect(pageSource).not.toContain("sessionStorage");
    expect(pageSource).not.toContain("localStorage");
  });

  it("no chat timeline, avatars, or typing-indicator UI is introduced", () => {
    for (const forbidden of ["ChatBubble", "TypingIndicator", "MessageAvatar", "ConversationTimeline"]) {
      expect(pageSource).not.toContain(forbidden);
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

  it("AssistantCommandForm reuses the shared form primitives, not a hand-rolled input", () => {
    expect(commandFormSource).toContain('import { FormField } from "@/components/ui/form-field";');
    expect(commandFormSource).toContain('import { Input } from "@/components/ui/input";');
    expect(commandFormSource).toContain('import { Button } from "@/components/ui/button";');
  });

  it("ClarificationOptions never fabricates options — only renders the backend-provided list", () => {
    expect(clarificationOptionsSource).toContain("options: ClarificationOption[]");
    expect(clarificationOptionsSource).not.toContain("generateOption");
  });

  it("ClarificationCard reuses ClarificationOptions instead of a second selection UI", () => {
    expect(clarificationCardSource).toContain(
      'import { ClarificationOptions } from "./ClarificationOptions";'
    );
  });

  it("AssistantResultState renders only the server-provided renderedText, nothing fabricated", () => {
    expect(resultStateSource).toContain("renderedText: string");
    for (const forbidden of ["transactionId:", "balance:", "confidence:"]) {
      expect(resultStateSource).not.toContain(forbidden);
    }
  });
});

describe("assistant clarification and error utilities", () => {
  it("isClarificationRequest accepts a real backend clarification payload", () => {
    expect(isClarificationRequest(VALID_CLARIFICATION)).toBe(true);
  });

  it("isClarificationRequest rejects an option missing its token — never trust an untokened option", () => {
    const malformed = {
      ...VALID_CLARIFICATION,
      options: [{ label: "BCA" }],
    };
    expect(isClarificationRequest(malformed)).toBe(false);
  });

  it("isClarificationRequest rejects an unknown entityType or missing fields", () => {
    expect(isClarificationRequest({ ...VALID_CLARIFICATION, entityType: "unknown" })).toBe(false);
    expect(isClarificationRequest({ clarificationId: "x" })).toBe(false);
    expect(isClarificationRequest(null)).toBe(false);
  });

  it("readAssistantErrorMessage maps known backend codes to a localized message", () => {
    const t = (key: string) => `translated:${key}`;
    const error = { response: { data: { error: { code: "ASSISTANT_CLARIFICATION_EXPIRED", message: "raw" } } } };
    expect(readAssistantErrorMessage(error, t)).toBe("translated:clarificationExpired");
  });

  it("readAssistantErrorMessage falls back to the backend's own safe message for unmapped codes", () => {
    const t = (key: string) => `translated:${key}`;
    const error = { response: { data: { error: { code: "ASSISTANT_TOOL_DISABLED", message: "Tool is disabled" } } } };
    expect(readAssistantErrorMessage(error, t)).toBe("Tool is disabled");
  });

  it("readAssistantErrorMessage falls back to a generic localized message for network/unknown failures", () => {
    const t = (key: string) => `translated:${key}`;
    expect(readAssistantErrorMessage({}, t)).toBe("translated:generic");
  });
});

describe("assistant clarification i18n", () => {
  it("English and Indonesian catalogs define matching command/clarification/completion/error keys", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.assistant.command.label).toBeTruthy();
      expect(messages.assistant.command.placeholder).toBeTruthy();
      expect(messages.assistant.command.submit).toBeTruthy();
      expect(messages.assistant.command.submitting).toBeTruthy();
      expect(messages.assistant.clarification.cancelling).toBeTruthy();
      expect(messages.assistant.completion.newInstruction).toBeTruthy();
      const errors = messages.assistant.errors as Record<string, string>;
      for (const key of [
        "invalidInput",
        "clarificationExpired",
        "clarificationConsumed",
        "invalidOption",
        "draftConflict",
        "idempotencyConflict",
        "generic",
      ]) {
        expect(errors[key]).toBeTruthy();
      }
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
