"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelAssistantClarification,
  getAssistantSession,
  selectAssistantClarification,
  sendAssistantMessage,
} from "@/src/features/assistant/api/assistantApi";
import { invalidateAssistantSessionDependents } from "@/src/features/assistant/hooks/useAssistantSession";
import { assistantKeys } from "@/src/features/assistant/constants/queryKeys";
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

export const useSendAssistantMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SendAssistantMessageInput) => sendAssistantMessage(input),
    onSuccess: (result) => invalidateAssistantSessionDependents(queryClient, result.conversationId),
  });
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
