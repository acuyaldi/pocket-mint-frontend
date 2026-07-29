import api from "@/lib/api";
import type {
  AssistantClarificationCancelResult,
  AssistantClarificationSelectResult,
  AssistantConversationSummary,
  AssistantConversationStatus,
  AssistantDraftCancelled,
  AssistantDraftConfirmed,
  AssistantPage,
  AssistantRecoveryStateResponse,
  AssistantSession,
  AssistantTurnResult,
} from "@/src/types/assistant";
import type {
  ExecuteAssistantIntentInput,
  ListAssistantConversationsParams,
  SendAssistantMessageInput,
} from "@/src/features/assistant/types";

/**
 * Assistant API wrappers. Every endpoint here matches an existing route in
 * `pocket-mint-be/src/routes/assistantRoutes.ts` — there is deliberately no
 * "create session" or "fetch draft" call: a conversation is created
 * implicitly by the first message/execute call, and there is no `GET
 * /assistant/drafts/:draftId` endpoint on the backend today.
 */

export function sendAssistantMessage(input: SendAssistantMessageInput): Promise<AssistantTurnResult> {
  const body = input.conversationId
    ? { message: input.message, conversationId: input.conversationId, locale: input.locale }
    : { message: input.message, locale: input.locale };
  return api.post<{ success: boolean; data: AssistantTurnResult }>("/assistant/messages", body).then((res) => res.data.data);
}

export function executeAssistantIntent(input: ExecuteAssistantIntentInput): Promise<AssistantTurnResult> {
  return api.post<{ success: boolean; data: AssistantTurnResult }>("/assistant/execute", input).then((res) => res.data.data);
}

export function listAssistantConversations(
  params: ListAssistantConversationsParams = {}
): Promise<AssistantPage<AssistantConversationSummary>> {
  return api
    .get<{ success: boolean; data: AssistantPage<AssistantConversationSummary> }>("/assistant/conversations", { params })
    .then((res) => res.data.data);
}

export function getAssistantSession(
  conversationId: string,
  params: { page?: number; limit?: number } = {}
): Promise<AssistantSession> {
  return api
    .get<{ success: boolean; data: AssistantSession }>(`/assistant/conversations/${conversationId}`, { params })
    .then((res) => res.data.data);
}

/**
 * Read-only recovery lookup — rediscovers an unresolved clarification/draft
 * after a refresh/direct-nav, or reconciles an ambiguous mutation failure.
 * Same auth/ownership/404 behavior as `getAssistantSession`.
 */
export function getAssistantRecoveryState(conversationId: string): Promise<AssistantRecoveryStateResponse> {
  return api
    .get<{ success: boolean; data: AssistantRecoveryStateResponse }>(
      `/assistant/conversations/${conversationId}/recovery-state`
    )
    .then((res) => res.data.data);
}

export function archiveAssistantSession(
  conversationId: string
): Promise<{ id: string; status: AssistantConversationStatus; archivedAt: string | null }> {
  return api
    .post<{ success: boolean; data: { id: string; status: AssistantConversationStatus; archivedAt: string | null } }>(
      `/assistant/conversations/${conversationId}/archive`
    )
    .then((res) => res.data.data);
}

export function confirmAssistantDraft(draftId: string, idempotencyKey: string): Promise<AssistantDraftConfirmed> {
  return api
    .post<{ success: boolean; data: AssistantDraftConfirmed }>(
      `/assistant/drafts/${draftId}/confirm`,
      undefined,
      { headers: { "Idempotency-Key": idempotencyKey } }
    )
    .then((res) => res.data.data);
}

export function cancelAssistantDraft(draftId: string): Promise<AssistantDraftCancelled> {
  return api
    .post<{ success: boolean; data: AssistantDraftCancelled }>(`/assistant/drafts/${draftId}/cancel`)
    .then((res) => res.data.data);
}

export function selectAssistantClarification(
  conversationId: string,
  clarificationId: string,
  optionToken: string
): Promise<AssistantClarificationSelectResult> {
  return api
    .post<{ success: boolean; data: AssistantClarificationSelectResult }>(
      `/assistant/conversations/${conversationId}/clarifications/${clarificationId}/select`,
      { optionToken }
    )
    .then((res) => res.data.data);
}

export function cancelAssistantClarification(
  conversationId: string,
  clarificationId: string
): Promise<AssistantClarificationCancelResult> {
  return api
    .post<{ success: boolean; data: AssistantClarificationCancelResult }>(
      `/assistant/conversations/${conversationId}/clarifications/${clarificationId}/cancel`
    )
    .then((res) => res.data.data);
}
