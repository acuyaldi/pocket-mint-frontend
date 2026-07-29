// Request-side shapes local to the Assistant feature. Response DTOs live in
// `src/types/assistant.ts` alongside every other domain's shared types.

export interface SendAssistantMessageInput {
  message: string;
  conversationId?: string;
  /**
   * BCP-47 locale of the active UI (e.g. "id-ID" / "en-US"). The backend owns
   * response localization; the frontend only forwards the user's active locale.
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
