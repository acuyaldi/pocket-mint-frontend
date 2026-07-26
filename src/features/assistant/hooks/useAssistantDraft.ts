"use client";
import { useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelAssistantDraft, confirmAssistantDraft } from "@/src/features/assistant/api/assistantApi";
import { invalidateAssistantSessionDependents } from "@/src/features/assistant/hooks/useAssistantSession";
import { createIdempotencyKey } from "@/src/features/assistant/utils/idempotency";

/**
 * There is no `GET /assistant/drafts/:draftId` endpoint on the backend — a
 * draft is only ever visible via the response of `/execute`, `/messages`, or
 * a clarification select. This hook only exposes the confirm/cancel
 * mutations that do exist.
 */
export const useConfirmAssistantDraft = () => {
  const queryClient = useQueryClient();
  // In-memory only — never persisted to localStorage/sessionStorage. Keyed
  // by draftId so a manual retry of the SAME draft (e.g. after an ambiguous
  // network failure) replays safely via the backend's idempotency table,
  // while a genuinely different draft always gets its own fresh key. Cleared
  // once a draftId reaches a terminal state so this can't grow unbounded
  // across a long session.
  const idempotencyKeysRef = useRef(new Map<string, string>());

  const getIdempotencyKey = (draftId: string): string => {
    let key = idempotencyKeysRef.current.get(draftId);
    if (!key) {
      key = createIdempotencyKey();
      idempotencyKeysRef.current.set(draftId, key);
    }
    return key;
  };

  /** Call once a draftId is confirmed/cancelled/otherwise resolved, so its key isn't kept forever. */
  const clearIdempotencyKey = (draftId: string) => {
    idempotencyKeysRef.current.delete(draftId);
  };

  const mutation = useMutation({
    mutationFn: (draftId: string) => confirmAssistantDraft(draftId, getIdempotencyKey(draftId)),
    onSuccess: (result, draftId) => {
      clearIdempotencyKey(draftId);
      invalidateAssistantSessionDependents(queryClient, result.conversationId);
    },
  });

  return { ...mutation, clearIdempotencyKey };
};

export const useCancelAssistantDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftId: string) => cancelAssistantDraft(draftId),
    onSuccess: (result) => invalidateAssistantSessionDependents(queryClient, result.conversationId),
  });
};
