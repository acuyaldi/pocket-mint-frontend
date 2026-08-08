"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { type DraftConfirmOverrides } from "@/src/features/assistant/api/assistantApi";
import { useConfirmAssistantDraft, useCancelAssistantDraft } from "@/src/features/assistant/hooks/useAssistantDraft";
import {
  useSelectAssistantClarification,
  useCancelAssistantClarification,
  useSendAssistantMessage,
} from "@/src/features/assistant/hooks/useAssistantMessages";
import { useAssistantSession, useAssistantRecoveryState } from "@/src/features/assistant/hooks/useAssistantSession";
import { useAssistantReconciliation } from "@/src/features/assistant/hooks/useAssistantReconciliation";
import { parseAssistantDraftParam, isAssistantDraft } from "@/src/features/assistant/utils/draftParam";
import { isClarificationRequest, isGuidedClarification } from "@/src/features/assistant/utils/clarification";
import { readAssistantErrorMessage, classifyAssistantMutationError } from "@/src/features/assistant/utils/errors";
import {
  resolveRecoveryState,
  isAssistantActionRetrySafe,
  type AssistantPendingActionKind,
  type AssistantRecoveryState,
} from "@/src/features/assistant/types/recovery";
import type {
  AssistantClarificationSelectResult,
  AssistantDraft,
  AssistantTurnResult,
  ClarificationRequest,
  GuidedClarification,
} from "@/src/types/assistant";

/**
 * Transient (never persisted) workflow item currently blocking a new
 * instruction — a clarification awaiting selection or a draft awaiting
 * confirm/cancel. Reusing the exact Phase 23.2/23.3 response shapes; nothing
 * here is fabricated.
 */
export type AssistantActiveWorkflow =
  | { kind: "clarification"; clarification: ClarificationRequest }
  | { kind: "guidedClarification"; clarification: GuidedClarification; prompt: string }
  | { kind: "draft"; draft: AssistantDraft }
  | null;

/**
 * Ephemeral echo of the most recent real backend response (success text, or
 * a draft confirm/cancel `renderedText`) shown immediately after an action.
 * The same content lands in persisted conversation history once the
 * `useAssistantSession` query refetches (every mutation here invalidates
 * it) — this is just a same-turn UI echo, not a second source of truth.
 * ponytail: no de-dupe against the refetched history by turnId, so the
 * echo and the persisted message can both be visible for one refetch
 * cycle. Upgrade path: key the echo by turnId and drop it once that turnId
 * appears in `session.messages`, if the brief duplication proves confusing.
 */
export type AssistantLastResult = { renderedText: string } | null;

const CONVERSATION_ID_PARAM = "conversationId";

/**
 * Client-side guard mirroring the backend's `MAX_ASSISTANT_MESSAGE_LENGTH`
 * (`pocket-mint-be/src/assistant/persistence.ts`). An over-length instruction is
 * a genuine field-validation error — it surfaces inline on the input, never as a
 * snackbar, and never leaves the browser. Not a business-rule change: the backend
 * would reject it identically.
 */
const MAX_ASSISTANT_INSTRUCTION_LENGTH = 10_000;

/**
 * Centralizes the Assistant interaction orchestration so the conversation UI
 * and the underlying submit → clarification → draft → confirm/cancel flow
 * stay one canonical path. Every mutation/query here is the exact Phase
 * 23.2/23.3 hook — this only adds conversation-level bookkeeping
 * (conversation id retention, active-workflow tracking, last-result echo,
 * and Phase 23.5 resilience/recovery state) on top.
 */
export function useAssistantConversationFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlConversationId = useMemo(() => {
    const raw = searchParams.get(CONVERSATION_ID_PARAM);
    const trimmed = raw?.trim();
    return trimmed ? trimmed : null;
  }, [searchParams]);
  const urlDraft = useMemo(() => parseAssistantDraftParam(searchParams), [searchParams]);

  const [conversationId, setConversationId] = useState<string | null>(urlConversationId);
  // Legacy read-only `?draft=` entry point (Phase 23.2) — no conversationId
  // travels with it, so it surfaces as a draft workflow item over an empty
  // conversation rather than being merged into history. Never expanded;
  // seeded once from the initial URL, same as `conversationId` above.
  const [activeWorkflow, setActiveWorkflow] = useState<AssistantActiveWorkflow>(
    urlDraft ? { kind: "draft", draft: urlDraft } : null
  );
  const [lastResult, setLastResult] = useState<AssistantLastResult>(null);
  const [instructionText, setInstructionText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingOptionToken, setPendingOptionToken] = useState<string | null>(null);

  // True only while this hook instance still reflects a conversation loaded
  // from the URL at mount (a refresh/direct-nav) — a conversation created
  // fresh during this session already has its workflow state in memory, so
  // there's nothing to "recover". Reset on `startNewConversation`.
  const [cameFromUrl, setCameFromUrl] = useState(!!urlConversationId);

  // §4 reconciliation bookkeeping — set only when a mutation fails
  // ambiguously (no HTTP response reached the client).
  const [outcomeUnknownAction, setOutcomeUnknownAction] = useState<AssistantPendingActionKind | null>(null);
  const [outcomeSnapshot, setOutcomeSnapshot] = useState<{
    conversationId: string;
    turnCount: number;
    action: AssistantPendingActionKind;
    draftId?: string;
    clarificationId?: string;
  } | null>(null);
  const [isCheckingOutcome, setIsCheckingOutcome] = useState(false);

  const session = useAssistantSession(conversationId);

  const sendMessage = useSendAssistantMessage();
  const selectClarification = useSelectAssistantClarification();
  const cancelClarification = useCancelAssistantClarification();
  const confirmDraft = useConfirmAssistantDraft();
  const cancelDraft = useCancelAssistantDraft();
  const { reconcile } = useAssistantReconciliation();

  const latestTurnStatus = session.data?.turns.at(-1)?.status;
  const turnCount = session.data?.turns.length ?? 0;

  // Only fetch recovery-state when there's an actual signal something might
  // be unresolved: no in-memory workflow, a real conversation loaded from
  // the URL (not freshly created this session), and it has history.
  const recoveryTriggerEnabled = activeWorkflow === null && !!conversationId && cameFromUrl && turnCount > 0;
  const recoveryStateQuery = useAssistantRecoveryState(conversationId, recoveryTriggerEnabled);

  const derivedRecovery: AssistantRecoveryState = useMemo(() => {
    if (activeWorkflow !== null) return { kind: "ready" };
    if (session.isError) return { kind: "historyUnavailable" };
    if (!recoveryTriggerEnabled) return { kind: "ready" };
    if (recoveryStateQuery.isPending) return { kind: "recoveryLoading" };
    if (recoveryStateQuery.isError) {
      return latestTurnStatus === "CLARIFICATION_REQUIRED" ? { kind: "transientClarificationLost" } : { kind: "ready" };
    }
    if (recoveryStateQuery.data) return resolveRecoveryState(recoveryStateQuery.data);
    return { kind: "ready" };
  }, [
    activeWorkflow,
    session.isError,
    recoveryTriggerEnabled,
    recoveryStateQuery.isPending,
    recoveryStateQuery.isError,
    recoveryStateQuery.data,
    latestTurnStatus,
  ]);

  const recoveryState: AssistantRecoveryState = outcomeUnknownAction
    ? { kind: "actionOutcomeUnknown", action: outcomeUnknownAction }
    : derivedRecovery;

  function persistConversationId(id: string) {
    if (id === conversationId) return;
    setConversationId(id);
    router.replace(`/assistant?${CONVERSATION_ID_PARAM}=${encodeURIComponent(id)}`);
  }

  function applyTurnResult(result: AssistantTurnResult) {
    persistConversationId(result.conversationId);
    if (result.status === "clarification_required") {
      if (result.data?.kind === "entity_selection") {
        if (isClarificationRequest(result.data.clarification)) {
          setActiveWorkflow({ kind: "clarification", clarification: result.data.clarification });
          return;
        }
        setActiveWorkflow(null);
        return "generic-error" as const;
      }
      if (result.data?.kind === "guided_fields") {
        if (isGuidedClarification(result.data.clarification)) {
          setActiveWorkflow({ kind: "guidedClarification", clarification: result.data.clarification, prompt: result.message });
          return;
        }
        setActiveWorkflow(null);
        return "generic-error" as const;
      }
      // Provider clarification: one bounded free-form question answered by typing a follow-up.
      setActiveWorkflow(null);
      setLastResult(null);
      return;
    }
    setLastResult(null);
    if (isAssistantDraft(result.data)) {
      setActiveWorkflow({ kind: "draft", draft: result.data });
      return;
    }
    setActiveWorkflow(null);
    // Echo the deterministic rendered text only when the backend actually sent
    // one. A non-tool result without it (e.g. an HTTP-200 `unsupported` reply that
    // carries `message` but no `renderedText`) still lands in the persisted
    // timeline — there is nothing to echo, and an empty result card must never appear.
    if (result.renderedText) setLastResult({ renderedText: result.renderedText });
    return;
  }

  function applySelectResult(result: AssistantClarificationSelectResult) {
    persistConversationId(result.conversationId);
    if (result.status === "clarification_required") {
      if (result.data.kind === "entity_selection" && isClarificationRequest(result.data.clarification)) {
        setActiveWorkflow({ kind: "clarification", clarification: result.data.clarification });
        return;
      }
      if (result.data.kind === "guided_fields" && isGuidedClarification(result.data.clarification)) {
        setActiveWorkflow({ kind: "guidedClarification", clarification: result.data.clarification, prompt: result.message });
        return;
      }
      setActiveWorkflow(null);
      return "generic-error" as const;
    }
    setLastResult(null);
    if (isAssistantDraft(result.data)) {
      setActiveWorkflow({ kind: "draft", draft: result.data });
      return;
    }
    setActiveWorkflow(null);
    return "generic-error" as const;
  }

  /**
   * Shared ambiguous/definite branch for every mutation below. Ambiguous
   * failures never surface as a plain error — they move into
   * `actionOutcomeUnknown` so the user gets reconcile/retry instead of a
   * false "failed" message.
   */
  function handleMutationError(
    error: unknown,
    action: AssistantPendingActionKind,
    extra: { draftId?: string; clarificationId?: string },
    tErrors: (key: string) => string,
    onError: (message: string) => void
  ) {
    if (classifyAssistantMutationError(error) === "ambiguous" && conversationId) {
      setOutcomeSnapshot({ conversationId, turnCount, action, ...extra });
      setOutcomeUnknownAction(action);
      return;
    }
    onError(readAssistantErrorMessage(error, tErrors));
  }

  /**
   * Sends the composed instruction. Error ownership is split by kind:
   * - Field validation (too-long) → inline `formError` on the input; the
   *   request never leaves the browser.
   * - Ambiguous failure (no HTTP response) → the `actionOutcomeUnknown`
   *   recovery UI, exactly as before — never a snackbar, because the mutation
   *   might have succeeded.
   * - Definite request/provider/server failure → `onRequestError` (the top
   *   snackbar). It is never rendered inline and never marks the input invalid.
   * The typed instruction is cleared only on success, so a failure leaves it in
   * place for an immediate retry.
   */
  const submit = (
    tErrors: (key: string) => string,
    onRequestError: (message: string) => void,
    onGenericError: () => void,
    requestLocale: string
  ) => {
    const message = instructionText.trim();
    if (!message || sendMessage.isPending || activeWorkflow) return;
    if (message.length > MAX_ASSISTANT_INSTRUCTION_LENGTH) {
      setFormError(tErrors("tooLong"));
      return;
    }
    setFormError(null);
    setOutcomeUnknownAction(null);
    sendMessage.mutate(
      { message, conversationId: conversationId ?? undefined, locale: requestLocale },
      {
        onSuccess: (result) => {
          setInstructionText("");
          if (applyTurnResult(result) === "generic-error") onGenericError();
        },
        onError: (error) => {
          if (classifyAssistantMutationError(error) === "ambiguous" && conversationId) {
            setOutcomeSnapshot({ conversationId, turnCount, action: "sendMessage" });
            setOutcomeUnknownAction("sendMessage");
            return;
          }
          onRequestError(readAssistantErrorMessage(error, tErrors));
        },
      }
    );
  };

  const selectOption = (token: string, tErrors: (key: string) => string, onError: (message: string) => void) => {
    if (activeWorkflow?.kind !== "clarification" || selectClarification.isPending || cancelClarification.isPending) return;
    setPendingOptionToken(token);
    setOutcomeUnknownAction(null);
    selectClarification.mutate(
      { conversationId: conversationId as string, clarificationId: activeWorkflow.clarification.clarificationId, optionToken: token },
      {
        onSuccess: (result) => {
          if (applySelectResult(result) === "generic-error") onError(tErrors("generic"));
        },
        onError: (error) =>
          handleMutationError(
            error,
            "selectClarification",
            { clarificationId: activeWorkflow.clarification.clarificationId },
            tErrors,
            onError
          ),
        onSettled: () => setPendingOptionToken(null),
      }
    );
  };

  const submitGuidedFields = (fields: Record<string, string>, tErrors: (key: string) => string, onError: (message: string) => void) => {
    if (activeWorkflow?.kind !== "guidedClarification" || selectClarification.isPending || cancelClarification.isPending) return;
    setOutcomeUnknownAction(null);
    selectClarification.mutate(
      { conversationId: conversationId as string, clarificationId: activeWorkflow.clarification.clarificationId, fields },
      {
        onSuccess: (result) => {
          if (applySelectResult(result) === "generic-error") onError(tErrors("generic"));
        },
        onError: (error) =>
          handleMutationError(
            error,
            "selectClarification",
            { clarificationId: activeWorkflow.clarification.clarificationId },
            tErrors,
            onError
          ),
      }
    );
  };

  const cancelActiveClarification = (
    tErrors: (key: string) => string,
    onSuccess: () => void,
    onError: (message: string) => void
  ) => {
    const clarification =
      activeWorkflow?.kind === "clarification"
        ? activeWorkflow.clarification
        : activeWorkflow?.kind === "guidedClarification"
          ? activeWorkflow.clarification
        : recoveryState.kind === "clarificationRecovered"
          ? recoveryState.clarification
          : null;
    if (!clarification || selectClarification.isPending || cancelClarification.isPending) return;
    setOutcomeUnknownAction(null);
    cancelClarification.mutate(
      { conversationId: conversationId as string, clarificationId: clarification.clarificationId },
      {
        onSuccess: () => {
          setActiveWorkflow(null);
          onSuccess();
        },
        onError: (error) =>
          handleMutationError(error, "cancelClarification", { clarificationId: clarification.clarificationId }, tErrors, onError),
      }
    );
  };

  const confirm = (overrides: DraftConfirmOverrides | undefined, tErrors: (key: string) => string, onSuccess: () => void, onError: (message: string) => void) => {
    const draft =
      activeWorkflow?.kind === "draft" ? activeWorkflow.draft : recoveryState.kind === "draftRecovered" ? recoveryState.draft : null;
    if (!draft) return;
    setOutcomeUnknownAction(null);
    confirmDraft.mutate({ draftId: draft.draftId, overrides }, {
      onSuccess: () => {
        // Transaction committed — reset to empty state. No chat bubble, no lastResult echo.
        setActiveWorkflow(null);
        setLastResult(null);
        setConversationId(null);
        setInstructionText("");
        setFormError(null);
        setPendingOptionToken(null);
        setOutcomeUnknownAction(null);
        setOutcomeSnapshot(null);
        setCameFromUrl(false);
        router.replace("/assistant");
        onSuccess();
      },
      onError: (error) => handleMutationError(error, "confirmDraft", { draftId: draft.draftId }, tErrors, onError),
    });
  };

  const cancelActiveDraft = (tErrors: (key: string) => string, onSuccess: () => void, onError: (message: string) => void) => {
    const draft =
      activeWorkflow?.kind === "draft" ? activeWorkflow.draft : recoveryState.kind === "draftRecovered" ? recoveryState.draft : null;
    if (!draft) return;
    setOutcomeUnknownAction(null);
    cancelDraft.mutate(draft.draftId, {
      onSuccess: () => {
        confirmDraft.clearIdempotencyKey(draft.draftId);
        setActiveWorkflow(null);
        setLastResult(null);
        startNewConversation();
        onSuccess();
      },
      onError: (error) => handleMutationError(error, "cancelDraft", { draftId: draft.draftId }, tErrors, onError),
    });
  };

  /** Reconciles the last ambiguous failure — refetches session + recovery-state, never re-sends anything. */
  const checkOutcome = async () => {
    if (!outcomeSnapshot) return;
    setIsCheckingOutcome(true);
    try {
      const outcome = await reconcile(outcomeSnapshot);
      if (outcome.resolved) {
        setOutcomeUnknownAction(null);
        setOutcomeSnapshot(null);
        setActiveWorkflow(null);
      }
    } finally {
      setIsCheckingOutcome(false);
    }
  };

  /** Only offered when `isAssistantActionRetrySafe(outcomeUnknownAction)` is true (draft confirm/cancel, clarification cancel). */
  const retryOutcomeAction = (tErrors: (key: string) => string, onSuccess: () => void, onError: (message: string) => void) => {
    if (!outcomeUnknownAction || !isAssistantActionRetrySafe(outcomeUnknownAction)) return;
    if (outcomeUnknownAction === "confirmDraft") confirm(undefined, tErrors, onSuccess, onError);
    else if (outcomeUnknownAction === "cancelDraft") cancelActiveDraft(tErrors, onSuccess, onError);
    else if (outcomeUnknownAction === "cancelClarification") cancelActiveClarification(tErrors, onSuccess, onError);
  };

  /** Blocked while a clarification/draft is unresolved — the user must cancel it via the real endpoint first (including a rediscovered/ambiguous one). */
  const canStartNewConversation =
    activeWorkflow === null &&
    recoveryState.kind !== "recoveryLoading" &&
    recoveryState.kind !== "clarificationRecovered" &&
    recoveryState.kind !== "draftRecovered" &&
    recoveryState.kind !== "actionOutcomeUnknown";

  /**
   * Switches to an already-persisted conversation (history navigation).
   * Mirrors `startNewConversation`'s local-state reset but keeps the target
   * id and marks it as URL-equivalent, so the existing recovery check
   * (`recoveryTriggerEnabled`) runs exactly as it would for a refresh/direct
   * nav. Gated by the same `canStartNewConversation` rule — returns `false`
   * without changing anything when a clarification/draft is unresolved, so
   * the caller can block or confirm before discarding local state. Never
   * touches backend state.
   */
  function switchConversation(id: string, options: { force?: boolean } = {}) {
    if (id === conversationId) return true;
    if (!canStartNewConversation && !options.force) return false;
    setConversationId(id);
    setActiveWorkflow(null);
    setLastResult(null);
    setInstructionText("");
    setFormError(null);
    setPendingOptionToken(null);
    setOutcomeUnknownAction(null);
    setOutcomeSnapshot(null);
    setCameFromUrl(true);
    sendMessage.reset();
    selectClarification.reset();
    cancelClarification.reset();
    confirmDraft.reset();
    cancelDraft.reset();
    router.replace(`/assistant?${CONVERSATION_ID_PARAM}=${encodeURIComponent(id)}`);
    return true;
  }

  function startNewConversation() {
    if (!canStartNewConversation) return;
    setConversationId(null);
    setActiveWorkflow(null);
    setLastResult(null);
    setInstructionText("");
    setFormError(null);
    setPendingOptionToken(null);
    setOutcomeUnknownAction(null);
    setOutcomeSnapshot(null);
    setCameFromUrl(false);
    sendMessage.reset();
    selectClarification.reset();
    cancelClarification.reset();
    confirmDraft.reset();
    cancelDraft.reset();
    router.replace("/assistant");
  }

  return {
    conversationId,
    session,
    activeWorkflow,
    lastResult,
    instructionText,
    setInstructionText,
    formError,
    pendingOptionToken,
    isSendingMessage: sendMessage.isPending,
    isSelectingClarification: selectClarification.isPending,
    isCancellingClarification: cancelClarification.isPending,
    isConfirmingDraft: confirmDraft.isPending,
    isCancellingDraft: cancelDraft.isPending,
    canStartNewConversation,
    recoveryState,
    isCheckingOutcome,
    checkOutcome,
    retryOutcomeAction,
    submit,
    selectOption,
    submitGuidedFields,
    cancelActiveClarification,
    confirm,
    cancelActiveDraft,
    startNewConversation,
    switchConversation,
  };
}
