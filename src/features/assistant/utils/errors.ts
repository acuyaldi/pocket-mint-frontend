import { AuthenticationRequiredError, AuthSessionError } from "@/lib/api-errors";

export type AssistantErrorAmbiguity = "ambiguous" | "definite";

/**
 * Classifies a caught Assistant mutation error:
 * - `"ambiguous"` — no HTTP response ever reached the client (network error,
 *   timeout, `AggregateError`), OR the server explicitly said the original
 *   submission (same Idempotency-Key) is still running
 *   (`409 ASSISTANT_REQUEST_IN_PROGRESS`) — in both cases the mutation's real
 *   outcome is unknown/pending, so the key must be kept: clearing it here
 *   would hand the next retry a fresh key and let it start a genuine second
 *   turn/draft while the first is still in flight, defeating Phase 27's
 *   whole point.
 * - `"definite"` — a real HTTP response came back with a terminal outcome
 *   (including a 401, which is handled separately by `lib/api.ts`'s own
 *   interceptor) — the backend explicitly finished handling the request.
 */
export function classifyAssistantMutationError(error: unknown): AssistantErrorAmbiguity {
  if (error instanceof AuthenticationRequiredError || error instanceof AuthSessionError) return "definite";
  if (readBackendError(error)?.code === "ASSISTANT_REQUEST_IN_PROGRESS") return "ambiguous";
  const response = (error as { response?: unknown } | null | undefined)?.response;
  return response === undefined ? "ambiguous" : "definite";
}

/** Maps known real `AssistantError` codes (`pocket-mint-be/src/assistant/errors.ts`) to an `assistant.errors.*` message key. */
const ASSISTANT_ERROR_MESSAGE_KEYS: Record<string, string> = {
  ASSISTANT_INVALID_REQUEST: "invalidInput",
  ASSISTANT_INVALID_INPUT: "invalidInput",
  // 503s from the provider must read as a calm "try again later", never the raw
  // backend string "Assistant provider is unavailable".
  ASSISTANT_PROVIDER_UNAVAILABLE: "providerUnavailable",
  ASSISTANT_PROVIDER_CONFIGURATION_ERROR: "providerUnavailable",
  ASSISTANT_CLARIFICATION_EXPIRED: "clarificationExpired",
  ASSISTANT_CLARIFICATION_STALE: "clarificationExpired",
  ASSISTANT_CLARIFICATION_ALREADY_CONSUMED: "clarificationConsumed",
  ASSISTANT_CLARIFICATION_CANCELLED: "clarificationConsumed",
  ASSISTANT_CLARIFICATION_INVALID_OPTION: "invalidOption",
  ASSISTANT_DRAFT_CONFLICT: "draftConflict",
  ASSISTANT_IDEMPOTENCY_CONFLICT: "idempotencyConflict",
};

/** Extracts the backend's safe `{error:{code,message,detail}}` envelope from an Axios/API-boundary error. */
function readBackendError(error: unknown): { code?: string; message?: string; detail?: string } | undefined {
  return (error as { response?: { data?: { error?: { code?: string; message?: string; detail?: string } } } })?.response?.data?.error;
}

/**
 * Phase 38 — the four terminal conditions recovery distinguishes. `notActionable`
 * carries why, so the UI can explain it instead of showing a generic error.
 */
export type AssistantNotActionableReason = "archived" | "consumed" | "stale" | "committed" | "unknown";
export type AssistantTerminalCondition =
  | { kind: "expired" }
  | { kind: "failed" }
  | { kind: "cancelled" }
  | { kind: "notActionable"; reason: AssistantNotActionableReason };

const TERMINAL_BY_CODE: Record<string, AssistantTerminalCondition> = {
  ASSISTANT_CLARIFICATION_EXPIRED: { kind: "expired" },
  ASSISTANT_CLARIFICATION_CANCELLED: { kind: "cancelled" },
  ASSISTANT_CLARIFICATION_ALREADY_CONSUMED: { kind: "notActionable", reason: "consumed" },
  ASSISTANT_CLARIFICATION_STALE: { kind: "notActionable", reason: "stale" },
  ASSISTANT_CLARIFICATION_CONTEXT_INVALID: { kind: "notActionable", reason: "stale" },
  ASSISTANT_CLARIFICATION_CONTINUATION_INVALID: { kind: "notActionable", reason: "stale" },
  ASSISTANT_CONVERSATION_NOT_CONTINUABLE: { kind: "notActionable", reason: "archived" },
};

const TERMINAL_BY_DRAFT_STATUS: Record<string, AssistantTerminalCondition> = {
  EXPIRED: { kind: "expired" },
  FAILED: { kind: "failed" },
  CANCELLED: { kind: "cancelled" },
  COMMITTED: { kind: "notActionable", reason: "committed" },
};

/** Terminal condition for a draft status marker (409 `detail`, or recovery-state's `latestTerminalDraft.status`). */
export function terminalConditionForDraftStatus(status: string | undefined): AssistantTerminalCondition {
  return (status && TERMINAL_BY_DRAFT_STATUS[status]) || { kind: "notActionable", reason: "unknown" };
}

/**
 * Maps a definite backend error to a terminal condition using only the
 * structured `code` and, for `ASSISTANT_DRAFT_CONFLICT`, the `detail` status
 * marker (Phase 37.3) — never the free-text `message`. Returns null for any
 * error that is not a terminal state (the caller keeps its normal handling).
 */
export function readAssistantTerminalCondition(error: unknown): AssistantTerminalCondition | null {
  const backendError = readBackendError(error);
  if (!backendError?.code) return null;
  if (backendError.code === "ASSISTANT_DRAFT_CONFLICT") {
    return terminalConditionForDraftStatus(backendError.detail);
  }
  return TERMINAL_BY_CODE[backendError.code] ?? null;
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
