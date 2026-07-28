// Request-side shapes local to the Assistant feature. Response DTOs live in
// `src/types/assistant.ts` alongside every other domain's shared types.

export interface SendAssistantMessageInput {
  message: string;
  conversationId?: string;
  /**
   * BCP-47 locale of the active UI (e.g. "id-ID" / "en-US"). Sent so the
   * backend replies in the user's language instead of defaulting to English;
   * omitted, the backend falls back to its own default ("id-ID").
   */
  locale?: string;
}

export interface ExecuteAssistantIntentInput {
  intent: string;
  arguments: unknown;
  message?: string;
  conversationId?: string;
  locale?: string;
}

export interface ListAssistantConversationsParams {
  page?: number;
  limit?: number;
}
