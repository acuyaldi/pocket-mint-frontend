"use client";
import { QueryClient, useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  archiveAssistantSession,
  getAssistantRecoveryState,
  getAssistantSession,
  listAssistantConversations,
} from "@/src/features/assistant/api/assistantApi";
import { assistantKeys } from "@/src/features/assistant/constants/queryKeys";
import type { ListAssistantConversationsParams } from "@/src/features/assistant/types";
import type {
  AssistantConversationSummary,
  AssistantPage,
  AssistantRecoveryStateResponse,
  AssistantSession,
} from "@/src/types/assistant";

const STALE_TIME = 5 * 60 * 1000;

export const invalidateAssistantSessionDependents = (queryClient: QueryClient, conversationId?: string) => {
  queryClient.invalidateQueries({ queryKey: ["assistant", "conversations"] });
  if (conversationId) {
    queryClient.invalidateQueries({ queryKey: assistantKeys.session(conversationId) });
    queryClient.invalidateQueries({ queryKey: assistantKeys.recoveryState(conversationId) });
  }
};

export const useAssistantConversations = (params: ListAssistantConversationsParams = {}) => {
  const { page, limit } = params;
  return useQuery<AssistantPage<AssistantConversationSummary>, Error>({
    queryKey: assistantKeys.conversations(page, limit),
    queryFn: () => listAssistantConversations(params),
    staleTime: STALE_TIME,
  });
};

/**
 * Bounded, "Load more"-paginated conversation history for the history
 * navigation UI. Backend order (`lastActivityAt desc, id desc`) is preserved
 * as-is — pages are appended in fetch order only, never client-sorted.
 */
export const useAssistantConversationHistory = (limit = 20) => {
  return useInfiniteQuery<AssistantPage<AssistantConversationSummary>, Error>({
    queryKey: assistantKeys.conversations(undefined, limit),
    queryFn: ({ pageParam }) => listAssistantConversations({ page: pageParam as number, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    staleTime: STALE_TIME,
  });
};

export const useAssistantSession = (conversationId: string | null) => {
  return useQuery<AssistantSession, Error>({
    queryKey: assistantKeys.session(conversationId ?? ""),
    queryFn: () => getAssistantSession(conversationId as string),
    enabled: !!conversationId,
    staleTime: STALE_TIME,
  });
};

/**
 * Recovery-state lookup — deliberately NOT auto-fetched alongside the
 * session. Only enabled when a caller has an actual signal something might
 * be unresolved (see `useAssistantConversationFlow`'s recovery trigger).
 */
export const useAssistantRecoveryState = (conversationId: string | null, enabled: boolean) => {
  return useQuery<AssistantRecoveryStateResponse, Error>({
    queryKey: assistantKeys.recoveryState(conversationId ?? ""),
    queryFn: () => getAssistantRecoveryState(conversationId as string),
    enabled: !!conversationId && enabled,
    staleTime: 0,
  });
};

export const useArchiveAssistantSession = () => {
  const queryClient = useQueryClient();

  return useMutation<Awaited<ReturnType<typeof archiveAssistantSession>>, Error, string>({
    mutationFn: (conversationId) => archiveAssistantSession(conversationId),
    onSuccess: (_data, conversationId) => invalidateAssistantSessionDependents(queryClient, conversationId),
  });
};
