"use client";
import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelAssistantClarification,
  getAssistantSession,
  selectAssistantClarification,
  sendAssistantMessage,
} from "@/src/features/assistant/api/assistantApi";
import { invalidateAssistantSessionDependents } from "@/src/features/assistant/hooks/useAssistantSession";
import { assistantKeys } from "@/src/features/assistant/constants/queryKeys";
import { createIdempotencyKey } from "@/src/features/assistant/utils/idempotency";
import { classifyAssistantMutationError } from "@/src/features/assistant/utils/errors";
import type { SendAssistantMessageInput } from "@/src/features/assistant/types";
import type { AssistantMessage } from "@/src/types/assistant";

/** Selects the message list out of the shared session query — no separate fetch. */
export const useAssistantMessages = (conversationId: string | null) => {
  return useQuery({
    queryKey: assistantKeys.session(conversationId ?? ""),
    queryFn: () => getAssistantSession(conversationId as string),
    enabled: !!conversationId,
    select: (session): AssistantMessage[] => session.messages.items,
  });
};

/**
 * `idempotencyKey` (Phase 27) is one key per hook instance — the composer only
 * ever has one message in flight at a time (`submit()` no-ops while
 * `isPending`), unlike `useConfirmAssistantDraft`'s per-draftId map. It is
 * reused across retries of the same not-yet-terminal submission (an ambiguous
 * failure — no HTTP response reached the client, so the previous attempt may
 * have gone through) and dropped on success or a definite failure, so a
 * genuinely new submission always gets its own fresh key.
 */
export const useSendAssistantMessage = () => {
  const queryClient = useQueryClient();
  const idempotencyKeyRef = useRef<string | null>(null);

  const getIdempotencyKey = (): string => {
    if (!idempotencyKeyRef.current) idempotencyKeyRef.current = createIdempotencyKey();
    return idempotencyKeyRef.current;
  };

  /** Call once the current submission reaches a terminal outcome (success, or a definite — non-ambiguous — failure), or when it's explicitly abandoned (e.g. starting a new conversation). */
  const clearIdempotencyKey = () => {
    idempotencyKeyRef.current = null;
  };

  const mutation = useMutation({
    mutationFn: (input: SendAssistantMessageInput) => sendAssistantMessage(input, getIdempotencyKey()),
    onSuccess: (result) => {
      clearIdempotencyKey();
      invalidateAssistantSessionDependents(queryClient, result.conversationId);
    },
    onError: (error) => {
      // Ambiguous (no HTTP response reached the client) keeps the same key so a
      // manual retry replays or safely reclaims the same logical submission.
      if (classifyAssistantMutationError(error) === "definite") clearIdempotencyKey();
    },
  });

  return { ...mutation, clearIdempotencyKey };
};

export const useSelectAssistantClarification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      clarificationId,
      optionToken,
      fields,
    }: {
      conversationId: string;
      clarificationId: string;
      optionToken?: string;
      fields?: Record<string, string>;
    }) => selectAssistantClarification(
      conversationId,
      clarificationId,
      optionToken ? { optionToken } : { fields: fields ?? {} }
    ),
    onSuccess: (_result, variables) => invalidateAssistantSessionDependents(queryClient, variables.conversationId),
  });
};

export const useCancelAssistantClarification = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ conversationId, clarificationId }: { conversationId: string; clarificationId: string }) =>
      cancelAssistantClarification(conversationId, clarificationId),
    onSuccess: (_result, variables) => invalidateAssistantSessionDependents(queryClient, variables.conversationId),
  });
};
