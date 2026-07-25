import type { AssistantDraft, AssistantDraftPreview } from "@/src/types/assistant";

const DRAFT_STATUSES = new Set(["PENDING_CONFIRMATION", "COMMITTED", "CANCELLED", "EXPIRED", "FAILED"]);
const DRAFT_TYPES = new Set(["INCOME", "EXPENSE"]);

function isDraftPreview(value: unknown): value is AssistantDraftPreview {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.type === "string" &&
    DRAFT_TYPES.has(v.type) &&
    (typeof v.amount === "string" || typeof v.amount === "number") &&
    typeof v.category === "string" &&
    typeof v.date === "string" &&
    (v.wallet === undefined || typeof v.wallet === "string") &&
    (v.walletId === undefined || typeof v.walletId === "string") &&
    (v.merchant === undefined || typeof v.merchant === "string") &&
    (v.description === undefined || typeof v.description === "string")
  );
}

/** Validates an unknown value as a real `AssistantDraft` — URL-supplied data is never trusted blindly. */
export function isAssistantDraft(value: unknown): value is AssistantDraft {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.draftId === "string" &&
    typeof v.status === "string" &&
    DRAFT_STATUSES.has(v.status) &&
    typeof v.expiresAt === "string" &&
    v.confirmationRequired === true &&
    typeof v.renderedText === "string" &&
    isDraftPreview(v.preview)
  );
}

/**
 * Reads the pending draft the review page displays out of the `draft` URL
 * param. There is no `GET /assistant/drafts/:draftId` endpoint — a draft only
 * ever exists as the transient response of `/execute`, `/messages`, or a
 * clarification `select` call — so it must arrive via navigation instead of
 * a fetch. Returns null on anything absent or malformed rather than throwing.
 */
export function parseAssistantDraftParam(searchParams: URLSearchParams): AssistantDraft | null {
  const raw = searchParams.get("draft");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return isAssistantDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
