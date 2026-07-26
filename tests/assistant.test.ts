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
import { readAssistantErrorMessage, classifyAssistantMutationError } from "@/src/features/assistant/utils/errors";
import { isAssistantActionRetrySafe, resolveRecoveryState } from "@/src/features/assistant/types/recovery";
import { AuthenticationRequiredError } from "@/lib/api-errors";
import type { AssistantDraft, AssistantRecoveryStateResponse, ClarificationRequest } from "@/src/types/assistant";

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
const flowHookSource = readFileSync(
  root + "src/features/assistant/hooks/useAssistantConversationFlow.ts",
  "utf8"
);
const conversationSource = readFileSync(
  root + "src/features/assistant/components/AssistantConversation.tsx",
  "utf8"
);
const messageSource = readFileSync(root + "src/features/assistant/components/AssistantMessage.tsx", "utf8");
const messageListSource = readFileSync(
  root + "src/features/assistant/components/AssistantMessageList.tsx",
  "utf8"
);
const errorsSource = readFileSync(root + "src/features/assistant/utils/errors.ts", "utf8");
const recoveryTypesSource = readFileSync(root + "src/features/assistant/types/recovery.ts", "utf8");
const reconciliationSource = readFileSync(
  root + "src/features/assistant/hooks/useAssistantReconciliation.ts",
  "utf8"
);
const recoveryBannerSource = readFileSync(
  root + "src/features/assistant/components/AssistantRecoveryBanner.tsx",
  "utf8"
);
const outcomeUnknownSource = readFileSync(
  root + "src/features/assistant/components/AssistantOutcomeUnknown.tsx",
  "utf8"
);
const historySource = readFileSync(
  root + "src/features/assistant/components/AssistantConversationHistory.tsx",
  "utf8"
);
const historyListSource = readFileSync(
  root + "src/features/assistant/components/AssistantConversationHistoryList.tsx",
  "utf8"
);
const historyTriggerSource = readFileSync(
  root + "src/features/assistant/components/AssistantConversationHistoryTrigger.tsx",
  "utf8"
);

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
    expect(flowHookSource).toContain("parseAssistantDraftParam(searchParams)");
    expect(apiSource).not.toMatch(/api\.get.*\/assistant\/drafts/);
  });

  it("wires Confirm/Cancel to the existing draft mutation hooks only", () => {
    expect(flowHookSource).toContain("useConfirmAssistantDraft");
    expect(flowHookSource).toContain("useCancelAssistantDraft");
    expect(flowHookSource).toContain("confirmDraft.mutate(draft.draftId");
    expect(flowHookSource).toContain("cancelDraft.mutate(draft.draftId");
  });

  it("shows loading via the mutation pending state, not a duplicate submit path", () => {
    expect(flowHookSource).toContain("isConfirmingDraft: confirmDraft.isPending");
    expect(flowHookSource).toContain("isCancellingDraft: cancelDraft.isPending");
    expect(flowHookSource).toContain("isSendingMessage: sendMessage.isPending");
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

describe("assistant clarification flow (Phase 23.3, orchestration now in useAssistantConversationFlow)", () => {
  it("wires the instruction composer to the real message endpoint", () => {
    expect(flowHookSource).toContain("useSendAssistantMessage");
    expect(flowHookSource).toContain("sendMessage.mutate(");
    expect(conversationSource).toContain("AssistantCommandForm");
  });

  it("rejects blank or whitespace-only instructions before submitting", () => {
    expect(commandFormSource).toContain("value.trim().length > 0");
    expect(flowHookSource).toContain("instructionText.trim()");
  });

  it("preserves the entered instruction after a recoverable submit failure", () => {
    expect(flowHookSource).toContain("setFormError(readAssistantErrorMessage(error, tErrors))");
    // Only a successful submission clears the instruction text.
    expect(flowHookSource).toMatch(/onSuccess:\s*\(result\)\s*=>\s*\{\s*setInstructionText\(""\);/);
  });

  it("an immediate draft response enters draft review directly", () => {
    expect(flowHookSource).toContain("isAssistantDraft(result.data)");
    expect(flowHookSource).toContain('setActiveWorkflow({ kind: "draft", draft: result.data })');
  });

  it("a clarification_required response renders only backend-provided options", () => {
    expect(flowHookSource).toContain("isClarificationRequest(result.data.clarification)");
    expect(conversationSource).toContain("ClarificationCard");
    expect(clarificationOptionsSource).toContain("options.map((option)");
    expect(clarificationOptionsSource).not.toContain(".sort(");
  });

  it("only forwards the exact backend-issued option token, never a client value", () => {
    expect(clarificationOptionsSource).toContain("onSelect(option.token)");
    expect(flowHookSource).toContain("optionToken: token");
  });

  it("clarification token/id are forwarded unchanged, never decoded or altered", () => {
    expect(flowHookSource).toContain("clarificationId: activeWorkflow.clarification.clarificationId");
    expect(flowHookSource).not.toMatch(/atob\(|JSON\.parse\(token/);
  });

  it("blocks duplicate option submission while a selection is pending", () => {
    expect(flowHookSource).toContain("selectClarification.isPending || cancelClarification.isPending) return;");
  });

  it("handles chained clarification by replacing the current clarification, not assuming a draft", () => {
    expect(flowHookSource).toContain("function applySelectResult");
    expect(flowHookSource).toMatch(/applySelectResult[\s\S]*?status === "clarification_required"/);
  });

  it("a resolved clarification reuses the Phase 23.2 draft review components", () => {
    expect(conversationSource).toContain('from "./DraftSummaryCard"');
    expect(conversationSource).toContain('from "./DraftActionBar"');
  });

  it("clears transient workflow state after a successful clarification cancel or draft confirm/cancel", () => {
    expect(flowHookSource).toContain("setActiveWorkflow(null);");
    expect(flowHookSource).toContain("function startNewConversation()");
    expect(flowHookSource).toContain("sendMessage.reset()");
    expect(flowHookSource).toContain("selectClarification.reset()");
    expect(flowHookSource).toContain("cancelClarification.reset()");
    expect(flowHookSource).toContain("confirmDraft.reset()");
    expect(flowHookSource).toContain("cancelDraft.reset()");
  });

  it("never calls a transaction-creation endpoint directly — the backend is the sole authority", () => {
    for (const forbidden of ["/transactions", "createTransaction", "/wallets"]) {
      expect(flowHookSource).not.toContain(forbidden);
      expect(pageSource).not.toContain(forbidden);
    }
  });

  it("the draft handoff stays in bounded component/hook state, not a global store or the URL", () => {
    expect(flowHookSource).not.toMatch(/router\.(push|replace)\(`?\/assistant\?draft=/);
    expect(flowHookSource).not.toContain("sessionStorage");
    expect(flowHookSource).not.toContain("localStorage");
    expect(pageSource).not.toContain("sessionStorage");
    expect(pageSource).not.toContain("localStorage");
  });

  it("no chat timeline, avatars, or typing-indicator UI is introduced", () => {
    for (const forbidden of ["ChatBubble", "TypingIndicator", "MessageAvatar", "ConversationTimeline"]) {
      expect(pageSource).not.toContain(forbidden);
      expect(conversationSource).not.toContain(forbidden);
    }
  });
});

describe("assistant conversation experience (Phase 23.4)", () => {
  it("reuses useAssistantSession for history retrieval instead of a new fetch path", () => {
    expect(flowHookSource).toContain('from "@/src/features/assistant/hooks/useAssistantSession"');
    expect(flowHookSource).toContain("useAssistantSession(conversationId)");
  });

  it("retains the conversation id as an opaque query param, never a draft payload or clarification token", () => {
    expect(flowHookSource).toContain('const CONVERSATION_ID_PARAM = "conversationId"');
    expect(flowHookSource).toContain("router.replace(`/assistant?${CONVERSATION_ID_PARAM}=${encodeURIComponent(id)}`)");
    expect(flowHookSource).not.toContain("draftId=");
    expect(flowHookSource).not.toContain("clarificationId=");
    expect(flowHookSource).not.toContain("optionToken=");
  });

  it("session retrieval is only enabled once a conversation id exists — no fetch with a malformed/absent id", () => {
    expect(sessionHookSource).toContain("enabled: !!conversationId");
  });

  it("blocks starting a new conversation while a clarification/draft is unresolved", () => {
    expect(flowHookSource).toContain('recoveryState.kind !== "clarificationRecovered"');
    expect(flowHookSource).toContain('recoveryState.kind !== "draftRecovered"');
    expect(flowHookSource).toContain('recoveryState.kind !== "actionOutcomeUnknown"');
    expect(flowHookSource).toContain("if (!canStartNewConversation) return;");
  });

  it("only one unresolved workflow blocks the composer at a time — no parallel instruction submission", () => {
    expect(flowHookSource).toContain("|| activeWorkflow) return;");
    expect(conversationSource).toContain("composerDisabledReason");
    expect(commandFormSource).toContain("disabledReason");
  });

  it("persisted messages render in backend order — no client-side sort/reverse", () => {
    expect(messageListSource).toContain("messages.map((message)");
    expect(messageListSource).not.toContain(".sort(");
    expect(messageListSource).not.toContain(".reverse(");
  });

  it("distinguishes persisted history from a pending local submission — no fabricated message id/role/status", () => {
    expect(conversationSource).toContain("AssistantMessageList");
    expect(conversationSource).toContain("AssistantPendingResponse");
    expect(conversationSource).toContain("isSendingMessage");
  });

  it("renders plain text only — no markdown/HTML rendering of Assistant content", () => {
    for (const forbidden of ["dangerouslySetInnerHTML", "ReactMarkdown", "<textarea"]) {
      expect(messageSource).not.toContain(forbidden);
      expect(conversationSource).not.toContain(forbidden);
    }
  });

  it("documents the exact refresh limitation: a stuck clarification-required turn can't be reconstructed after reload, and is resolved via recovery-state instead", () => {
    expect(flowHookSource).toContain('latestTurnStatus === "CLARIFICATION_REQUIRED"');
    expect(pageSource).toContain("recoveryState={flow.recoveryState}");
    expect(conversationSource).toContain("recoveryState");
  });

  it("never reconstructs a draft or clarification by parsing rendered message text", () => {
    for (const source of [flowHookSource, conversationSource, messageSource]) {
      expect(source).not.toMatch(/parse.*renderedText|content\.match\(/i);
    }
  });

  it("no draft/token/message payload is written to durable browser storage", () => {
    for (const source of [flowHookSource, conversationSource, pageSource]) {
      expect(source).not.toContain("localStorage");
      expect(source).not.toContain("sessionStorage");
      expect(source).not.toContain("indexedDB");
    }
  });

  it("no streaming/WebSocket/SSE/voice/attachment integration exists", () => {
    for (const source of [flowHookSource, conversationSource, pageSource]) {
      for (const forbidden of ["EventSource", "WebSocket", "MediaRecorder", "<audio", "<video", "FileReader"]) {
        expect(source).not.toContain(forbidden);
      }
    }
  });

  it("no second Assistant API client or duplicate mutation implementation was added", () => {
    expect(flowHookSource).not.toContain("axios.create");
    expect(flowHookSource).not.toContain("fetch(");
    // Every mutation call site reuses the exact Phase 23.2/23.3 hook names.
    for (const hookName of [
      "useSendAssistantMessage",
      "useSelectAssistantClarification",
      "useCancelAssistantClarification",
      "useConfirmAssistantDraft",
      "useCancelAssistantDraft",
    ]) {
      expect(flowHookSource).toContain(hookName);
    }
  });

  it("English and Indonesian catalogs define matching conversation keys", () => {
    for (const messages of [idMessages, enMessages]) {
      const conversation = messages.assistant.conversation as Record<string, unknown>;
      for (const key of [
        "regionLabel",
        "listLabel",
        "historyLoading",
        "retry",
        "authorUser",
        "authorAssistant",
        "authorSystem",
        "emptyTitle",
        "emptyDescription",
        "examplesLabel",
        "example1",
        "example2",
        "pendingResponse",
        "transientUnavailable",
        "newConversation",
        "resetBlocked",
        "composerDisabledClarification",
        "composerDisabledDraft",
      ]) {
        expect(conversation[key]).toBeTruthy();
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

describe("assistant resilience/recovery — draft confirm idempotency key reuse", () => {
  it("keys the idempotency key by draftId and reuses it instead of minting one per call", () => {
    expect(draftHookSource).toContain("idempotencyKeysRef.current.get(draftId)");
    expect(draftHookSource).toContain("idempotencyKeysRef.current.set(draftId, key)");
    // Only ONE call site creates a fresh key — inside the reuse-or-create helper — never
    // inline in mutationFn (which would mint a new key on every retry).
    expect(draftHookSource.match(/createIdempotencyKey\(\)/g)?.length).toBe(1);
  });

  it("clears the key once a draftId is resolved (confirmed, or cancelled via the flow hook) so it can't grow unbounded", () => {
    expect(draftHookSource).toContain("clearIdempotencyKey");
    expect(draftHookSource).toContain("idempotencyKeysRef.current.delete(draftId)");
    expect(flowHookSource).toContain("confirmDraft.clearIdempotencyKey(draft.draftId)");
  });

  it("stores the key in-memory only (a ref/Map) — never localStorage/sessionStorage", () => {
    expect(draftHookSource).toContain("useRef(new Map<string, string>())");
    expect(draftHookSource).not.toMatch(/\blocalStorage\.(setItem|getItem)/);
    expect(draftHookSource).not.toMatch(/\bsessionStorage\.(setItem|getItem)/);
  });
});

describe("assistant resilience/recovery — ambiguous vs definite error classification", () => {
  it("classifies a no-response Axios-shaped error as ambiguous", () => {
    expect(classifyAssistantMutationError({ message: "Network Error" })).toBe("ambiguous");
    expect(classifyAssistantMutationError({ response: undefined })).toBe("ambiguous");
  });

  it("classifies a real HTTP error response as definite", () => {
    expect(classifyAssistantMutationError({ response: { status: 409, data: {} } })).toBe("definite");
    expect(classifyAssistantMutationError({ response: { status: 500, data: {} } })).toBe("definite");
  });

  it("classifies a 401 / AuthenticationRequiredError as definite, not ambiguous — auth has its own handling", () => {
    expect(classifyAssistantMutationError(new AuthenticationRequiredError())).toBe("definite");
    expect(classifyAssistantMutationError({ response: { status: 401, data: {} } })).toBe("definite");
  });
});

describe("assistant resilience/recovery — recovery-state API wrapper and query gating", () => {
  it("hits the exact recovery-state endpoint with GET", () => {
    expect(apiSource).toContain("`/assistant/conversations/${conversationId}/recovery-state`");
    expect(apiSource).toContain("export function getAssistantRecoveryState");
  });

  it("the query hook is gated behind an explicit enabled condition, not auto-fetched alongside session", () => {
    expect(sessionHookSource).toContain("useAssistantRecoveryState");
    expect(sessionHookSource).toContain("enabled: !!conversationId && enabled");
  });

  it("the flow hook only enables the recovery-state fetch when there's no in-memory workflow, a URL-loaded conversation, and history", () => {
    expect(flowHookSource).toContain("activeWorkflow === null && !!conversationId && cameFromUrl && turnCount > 0");
  });
});

describe("assistant resilience/recovery — bounded recovery-state model", () => {
  const draftPreview = {
    operation: "record_transaction",
    type: "EXPENSE" as const,
    amount: "50000",
    walletId: "wallet-1",
    categoryId: "cat-1",
    date: "2026-07-25",
    expiresAt: "2026-07-25T15:30:00.000Z",
  };

  it("resolves to clarificationRecovered when an active clarification is found — never usable to select (no token in the type)", () => {
    const response: AssistantRecoveryStateResponse = {
      activeClarification: {
        clarificationId: "clar-1",
        entityType: "wallet",
        prompt: "Which wallet?",
        options: [{ label: "BCA" }],
        expiresAt: "2026-07-25T15:30:00.000Z",
      },
    };
    const state = resolveRecoveryState(response);
    expect(state.kind).toBe("clarificationRecovered");
    if (state.kind === "clarificationRecovered") {
      expect((state.clarification.options[0] as { token?: string }).token).toBeUndefined();
    }
    // The recovery-state type never carries a token; the recovery banner component
    // never wires an onSelect/select call — only cancel.
    expect(recoveryBannerSource).not.toContain("onSelect");
    expect(recoveryBannerSource).not.toContain("selectAssistantClarification");
  });

  it("resolves to draftRecovered when a pending draft is found, mapped into the existing AssistantDraft shape", () => {
    const response: AssistantRecoveryStateResponse = {
      pendingDraft: { draftId: "draft-1", status: "PENDING_CONFIRMATION", preview: draftPreview },
    };
    const state = resolveRecoveryState(response);
    expect(state.kind).toBe("draftRecovered");
    if (state.kind === "draftRecovered") {
      expect(state.draft.draftId).toBe("draft-1");
      expect(state.draft.confirmationRequired).toBe(true);
    }
  });

  it("resolves to transientClarificationLost when neither is found", () => {
    expect(resolveRecoveryState({}).kind).toBe("transientClarificationLost");
  });

  it("only draft confirm/cancel and clarification cancel are retry-safe — never a plain message send or a select", () => {
    expect(isAssistantActionRetrySafe("confirmDraft")).toBe(true);
    expect(isAssistantActionRetrySafe("cancelDraft")).toBe(true);
    expect(isAssistantActionRetrySafe("cancelClarification")).toBe(true);
    expect(isAssistantActionRetrySafe("sendMessage")).toBe(false);
    expect(isAssistantActionRetrySafe("selectClarification")).toBe(false);
  });

  it("draftRecovered reuses the existing DraftSummaryCard/DraftActionBar — no parallel draft-review UI", () => {
    expect(conversationSource).toContain('recoveryState.kind === "draftRecovered"');
    expect(conversationSource.match(/DraftSummaryCard/g)?.length).toBeGreaterThanOrEqual(2);
  });
});

describe("assistant resilience/recovery — reconciliation never re-sends anything", () => {
  it("compares a pre-attempt snapshot against a fresh session/recovery-state fetch, not a blind retry", () => {
    expect(reconciliationSource).toContain("snapshot.turnCount");
    expect(reconciliationSource).toContain("getAssistantSession");
    expect(reconciliationSource).toContain("getAssistantRecoveryState");
  });

  it("never calls a send/select/confirm/cancel mutation from the reconciliation hook", () => {
    for (const forbidden of ["sendAssistantMessage", "confirmAssistantDraft", "cancelAssistantDraft", "selectAssistantClarification"]) {
      expect(reconciliationSource).not.toContain(forbidden);
    }
  });

  it("checkOutcome is only invoked explicitly (user action / ambiguous failure) — not on an interval", () => {
    for (const forbidden of ["setInterval", "setTimeout"]) {
      expect(flowHookSource).not.toContain(forbidden);
      expect(reconciliationSource).not.toContain(forbidden);
    }
  });
});

describe("assistant resilience/recovery — startNewConversation blocking", () => {
  it("stays blocked while clarificationRecovered/draftRecovered/actionOutcomeUnknown are showing", () => {
    expect(flowHookSource).toContain('recoveryState.kind !== "clarificationRecovered"');
    expect(flowHookSource).toContain('recoveryState.kind !== "draftRecovered"');
    expect(flowHookSource).toContain('recoveryState.kind !== "actionOutcomeUnknown"');
  });

  it("does NOT block on transientClarificationLost — nothing left to protect", () => {
    expect(flowHookSource).not.toContain('recoveryState.kind !== "transientClarificationLost"');
  });
});

describe("assistant resilience/recovery — outcome-unknown UI", () => {
  it("uses role=status, not role=alert — an ambiguous outcome is not definitively an error", () => {
    expect(outcomeUnknownSource).toMatch(/<div role="status"/);
    expect(outcomeUnknownSource).not.toMatch(/<\w+[^>]*role="alert"/);
  });

  it("only renders a retry action when the caller supplies one — never fabricates a retry for unsafe actions", () => {
    expect(outcomeUnknownSource).toContain("onRetry?: () => void");
    expect(outcomeUnknownSource).toContain("{onRetry ?");
  });
});

describe("assistant resilience/recovery — no durable storage of recovery state", () => {
  it("recovery/reconciliation source never touches localStorage/sessionStorage/indexedDB", () => {
    for (const source of [recoveryTypesSource, reconciliationSource, recoveryBannerSource, outcomeUnknownSource]) {
      expect(source).not.toContain("localStorage");
      expect(source).not.toContain("sessionStorage");
      expect(source).not.toContain("indexedDB");
    }
  });
});

describe("assistant resilience/recovery i18n", () => {
  it("English and Indonesian catalogs define matching recovery/outcome-unknown keys", () => {
    for (const messages of [idMessages, enMessages]) {
      const recovery = messages.assistant.recovery as Record<string, string>;
      expect(recovery.clarificationRecoveredTitle).toBeTruthy();
      expect(recovery.composerDisabled).toBeTruthy();
      const outcome = messages.assistant.outcomeUnknown as Record<string, string>;
      for (const key of ["heading", "description", "check", "checking", "retry", "retrying"]) {
        expect(outcome[key]).toBeTruthy();
      }
    }
  });

  it("plain user language only — no backend terminology leaks into the new strings", () => {
    for (const messages of [idMessages, enMessages]) {
      const blob = JSON.stringify(messages.assistant.recovery) + JSON.stringify(messages.assistant.outcomeUnknown);
      for (const forbidden of ["idempotency", "token", "advisory lock", "P2002", "500", "404"]) {
        expect(blob.toLowerCase()).not.toContain(forbidden.toLowerCase());
      }
    }
  });
});

describe("assistant resilience — no new dependency", () => {
  it("package.json's dependency/devDependency sets are unchanged by this feature (no new HTTP client, state library, or nav-blocking package)", () => {
    for (const source of [recoveryTypesSource, reconciliationSource, recoveryBannerSource, outcomeUnknownSource, errorsSource]) {
      expect(source).not.toContain("axios.create");
      expect(source).not.toContain("zustand");
      expect(source).not.toContain("redux");
    }
  });
});

describe("assistant conversation history (Phase 23.6)", () => {
  it("reuses the existing list endpoint/hook — no new fetch path or second API client", () => {
    expect(sessionHookSource).toContain("useInfiniteQuery");
    expect(sessionHookSource).toContain("listAssistantConversations");
    expect(sessionHookSource).toContain("assistantKeys.conversations(undefined, limit)");
    expect(historySource).not.toContain("axios.create");
    expect(historySource).not.toMatch(/\bfetch\(["'`]/);
  });

  it("preserves backend order — pages are appended, never client-sorted", () => {
    expect(historySource).toContain("query.data?.pages.flatMap((page) => page.items)");
    expect(sessionHookSource).not.toContain(".sort(");
    expect(historyListSource).toContain("items.map((item)");
    expect(historyListSource).not.toContain(".sort(");
    expect(historyListSource).not.toContain(".reverse(");
  });

  it("pagination follows backend hasMore — no infinite-scroll or virtualization dependency", () => {
    expect(sessionHookSource).toContain("getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined)");
    expect(historySource).not.toContain("react-window");
    expect(historySource).not.toContain("react-virtual");
    expect(historyListSource).not.toContain("IntersectionObserver");
  });

  it("switching is gated by the same canStartNewConversation rule as starting a new conversation, and is forceable only from an explicit confirmation", () => {
    expect(flowHookSource).toContain("function switchConversation(id: string, options: { force?: boolean } = {})");
    expect(flowHookSource).toContain("if (!canStartNewConversation && !options.force) return false;");
    expect(historySource).toContain("onSwitchConversation(blockedTargetId, { force: true })");
  });

  it("switching never fabricates backend cancellation — only local transient state is cleared", () => {
    expect(flowHookSource).toMatch(/function switchConversation[\s\S]*?setActiveWorkflow\(null\)/);
    expect(historySource).not.toMatch(/cancelAssistantDraft|cancelAssistantClarification/);
  });

  it("switching keeps the conversation id as the only URL state — no extra params, no draft/token payload", () => {
    expect(flowHookSource).toMatch(
      /switchConversation[\s\S]*?router\.replace\(`\/assistant\?\$\{CONVERSATION_ID_PARAM\}=\$\{encodeURIComponent\(id\)\}`\)/
    );
  });

  it("no delete, archive, rename, search, or pin functionality exists in the history feature", () => {
    for (const source of [historySource, historyListSource, historyTriggerSource]) {
      for (const forbidden of [/\barchive/i, /\bdelete/i, /\brename/i, /\bsearch/i, /\bpin\b/i, /\bDELETE\b/, /\bPATCH\b/]) {
        expect(source).not.toMatch(forbidden);
      }
    }
  });

  it("no durable storage, polling, or streaming is introduced by the history feature", () => {
    for (const source of [historySource, historyListSource, historyTriggerSource, sessionHookSource]) {
      for (const forbidden of [
        "localStorage",
        "sessionStorage",
        "indexedDB",
        "setInterval",
        "EventSource",
        "WebSocket",
      ]) {
        expect(source).not.toContain(forbidden);
      }
    }
  });

  it("the trigger and list are presentational — no data fetching inside the leaf components", () => {
    expect(historyTriggerSource).not.toContain("useQuery");
    expect(historyListSource).not.toContain("useQuery");
    expect(historyListSource).not.toContain("useInfiniteQuery");
  });

  it("the trigger has a stable accessible name and the selected item is programmatically identifiable", () => {
    expect(historyTriggerSource).toContain("aria-label={label}");
    expect(historyListSource).toContain('aria-current={isSelected ? "true" : undefined}');
  });

  it("the conversation label is a deterministic preview or date fallback — never AI-generated or parsed", () => {
    expect(historyListSource).toContain("resolveConversationLabel");
    expect(historyListSource).toContain("summary.lastMessage?.trim()");
    expect(historyListSource).not.toMatch(/generateTitle|summarize/i);
  });

  it("English and Indonesian catalogs define matching history keys", () => {
    for (const messages of [idMessages, enMessages]) {
      const history = messages.assistant.history as Record<string, unknown>;
      for (const key of [
        "title",
        "openLabel",
        "listLabel",
        "newConversation",
        "activeConversationLabel",
        "conversationFromDate",
        "loading",
        "loadingMore",
        "empty",
        "error",
        "retry",
        "loadMore",
        "switchBlockedTitle",
        "switchBlockedDescription",
        "switchConfirm",
        "switchCancel",
      ]) {
        expect(history[key]).toBeTruthy();
      }
    }
  });
});
