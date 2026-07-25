"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useConfirmAssistantDraft, useCancelAssistantDraft } from "@/src/features/assistant/hooks/useAssistantDraft";
import {
  useSelectAssistantClarification,
  useCancelAssistantClarification,
  useSendAssistantMessage,
} from "@/src/features/assistant/hooks/useAssistantMessages";
import { useAssistantSession } from "@/src/features/assistant/hooks/useAssistantSession";
import { parseAssistantDraftParam, isAssistantDraft } from "@/src/features/assistant/utils/draftParam";
import { isClarificationRequest } from "@/src/features/assistant/utils/clarification";
import { readAssistantErrorMessage } from "@/src/features/assistant/utils/errors";
import type {
  AssistantClarificationSelectResult,
  AssistantDraft,
  AssistantTurnResult,
  ClarificationRequest,
} from "@/src/types/assistant";

/**
 * Transient (never persisted) workflow item currently blocking a new
 * instruction — a clarification awaiting selection or a draft awaiting
 * confirm/cancel. Reusing the exact Phase 23.2/23.3 response shapes; nothing
 * here is fabricated.
 */
export type AssistantActiveWorkflow =
  | { kind: "clarification"; clarification: ClarificationRequest }
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
 * Centralizes the Assistant interaction orchestration so the conversation UI
 * and the underlying submit → clarification → draft → confirm/cancel flow
 * stay one canonical path. Every mutation/query here is the exact Phase
 * 23.2/23.3 hook — this only adds conversation-level bookkeeping
 * (conversation id retention, active-workflow tracking, last-result echo)
 * on top.
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

  const session = useAssistantSession(conversationId);

  const sendMessage = useSendAssistantMessage();
  const selectClarification = useSelectAssistantClarification();
  const cancelClarification = useCancelAssistantClarification();
  const confirmDraft = useConfirmAssistantDraft();
  const cancelDraft = useCancelAssistantDraft();

  function persistConversationId(id: string) {
    if (id === conversationId) return;
    setConversationId(id);
    router.replace(`/assistant?${CONVERSATION_ID_PARAM}=${encodeURIComponent(id)}`);
  }

  function applyTurnResult(result: AssistantTurnResult) {
    persistConversationId(result.conversationId);
    if (result.status === "clarification_required") {
      if (result.data && isClarificationRequest(result.data.clarification)) {
        setActiveWorkflow({ kind: "clarification", clarification: result.data.clarification });
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
    setLastResult({ renderedText: result.renderedText });
    return;
  }

  function applySelectResult(result: AssistantClarificationSelectResult) {
    persistConversationId(result.conversationId);
    if (result.status === "clarification_required") {
      if (isClarificationRequest(result.data.clarification)) {
        setActiveWorkflow({ kind: "clarification", clarification: result.data.clarification });
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

  const submit = (
    tErrors: (key: string) => string,
    onGenericError: () => void
  ) => {
    const message = instructionText.trim();
    if (!message || sendMessage.isPending || activeWorkflow) return;
    setFormError(null);
    sendMessage.mutate(
      { message, conversationId: conversationId ?? undefined },
      {
        onSuccess: (result) => {
          setInstructionText("");
          if (applyTurnResult(result) === "generic-error") onGenericError();
        },
        onError: (error) => setFormError(readAssistantErrorMessage(error, tErrors)),
      }
    );
  };

  const selectOption = (token: string, tErrors: (key: string) => string, onError: (message: string) => void) => {
    if (activeWorkflow?.kind !== "clarification" || selectClarification.isPending || cancelClarification.isPending) return;
    setPendingOptionToken(token);
    selectClarification.mutate(
      { conversationId: conversationId as string, clarificationId: activeWorkflow.clarification.clarificationId, optionToken: token },
      {
        onSuccess: (result) => {
          if (applySelectResult(result) === "generic-error") onError(tErrors("generic"));
        },
        onError: (error) => onError(readAssistantErrorMessage(error, tErrors)),
        onSettled: () => setPendingOptionToken(null),
      }
    );
  };

  const cancelActiveClarification = (
    tErrors: (key: string) => string,
    onSuccess: () => void,
    onError: (message: string) => void
  ) => {
    if (activeWorkflow?.kind !== "clarification" || selectClarification.isPending || cancelClarification.isPending) return;
    cancelClarification.mutate(
      { conversationId: conversationId as string, clarificationId: activeWorkflow.clarification.clarificationId },
      {
        onSuccess: () => {
          setActiveWorkflow(null);
          onSuccess();
        },
        onError: (error) => onError(readAssistantErrorMessage(error, tErrors)),
      }
    );
  };

  const confirm = (tErrors: (key: string) => string, onSuccess: () => void, onError: (message: string) => void) => {
    if (activeWorkflow?.kind !== "draft") return;
    confirmDraft.mutate(activeWorkflow.draft.draftId, {
      onSuccess: (result) => {
        setActiveWorkflow(null);
        setLastResult({ renderedText: result.renderedText });
        onSuccess();
      },
      onError: (error) => onError(readAssistantErrorMessage(error, tErrors)),
    });
  };

  const cancelActiveDraft = (tErrors: (key: string) => string, onSuccess: () => void, onError: (message: string) => void) => {
    if (activeWorkflow?.kind !== "draft") return;
    cancelDraft.mutate(activeWorkflow.draft.draftId, {
      onSuccess: (result) => {
        setActiveWorkflow(null);
        setLastResult({ renderedText: result.renderedText });
        onSuccess();
      },
      onError: (error) => onError(readAssistantErrorMessage(error, tErrors)),
    });
  };

  /** Blocked while a clarification/draft is unresolved — the user must cancel it via the real endpoint first. */
  const canStartNewConversation = activeWorkflow === null;

  function startNewConversation() {
    if (!canStartNewConversation) return;
    setConversationId(null);
    setActiveWorkflow(null);
    setLastResult(null);
    setInstructionText("");
    setFormError(null);
    setPendingOptionToken(null);
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
    submit,
    selectOption,
    cancelActiveClarification,
    confirm,
    cancelActiveDraft,
    startNewConversation,
  };
}
