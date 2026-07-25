"use client";
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

  return useMutation({
    mutationFn: (draftId: string) => confirmAssistantDraft(draftId, createIdempotencyKey()),
    onSuccess: (result) => invalidateAssistantSessionDependents(queryClient, result.conversationId),
  });
};

export const useCancelAssistantDraft = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (draftId: string) => cancelAssistantDraft(draftId),
    onSuccess: (result) => invalidateAssistantSessionDependents(queryClient, result.conversationId),
  });
};
