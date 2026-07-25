/** Maps known real `AssistantError` codes (`pocket-mint-be/src/assistant/errors.ts`) to an `assistant.errors.*` message key. */
const ASSISTANT_ERROR_MESSAGE_KEYS: Record<string, string> = {
  ASSISTANT_INVALID_REQUEST: "invalidInput",
  ASSISTANT_INVALID_INPUT: "invalidInput",
  ASSISTANT_CLARIFICATION_EXPIRED: "clarificationExpired",
  ASSISTANT_CLARIFICATION_STALE: "clarificationExpired",
  ASSISTANT_CLARIFICATION_ALREADY_CONSUMED: "clarificationConsumed",
  ASSISTANT_CLARIFICATION_CANCELLED: "clarificationConsumed",
  ASSISTANT_CLARIFICATION_INVALID_OPTION: "invalidOption",
  ASSISTANT_DRAFT_CONFLICT: "draftConflict",
  ASSISTANT_IDEMPOTENCY_CONFLICT: "idempotencyConflict",
};

/** Extracts the backend's safe `{error:{code,message}}` envelope from an Axios/API-boundary error. */
function readBackendError(error: unknown): { code?: string; message?: string } | undefined {
  return (error as { response?: { data?: { error?: { code?: string; message?: string } } } })?.response?.data?.error;
}

/**
 * Maps an Assistant mutation error to a safe, localized message. Known codes get a
 * translated message; anything else falls back to the backend's own already-sanitized
 * message, then to a generic localized fallback — never a raw stack trace or token value.
 */
export function readAssistantErrorMessage(error: unknown, t: (key: string) => string): string {
  const backendError = readBackendError(error);
  const key = backendError?.code ? ASSISTANT_ERROR_MESSAGE_KEYS[backendError.code] : undefined;
  if (key) return t(key);
  if (backendError?.message) return backendError.message;
  if (error instanceof Error && error.message) return error.message;
  return t("generic");
}
