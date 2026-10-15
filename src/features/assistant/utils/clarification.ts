import type { ClarificationOption, ClarificationRequest, GuidedClarification } from "@/src/types/assistant";

const ENTITY_TYPES = new Set(["wallet", "merchant", "category"]);

function isClarificationOption(value: unknown): value is ClarificationOption {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.token === "string" &&
    typeof v.label === "string" &&
    (v.discriminator === undefined || typeof v.discriminator === "string")
  );
}

/** Validates an unknown value as a real `ClarificationRequest` — a turn/select response is never trusted blindly before it drives UI or a subsequent mutation. */
export function isClarificationRequest(value: unknown): value is ClarificationRequest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.clarificationId === "string" &&
    typeof v.entityType === "string" &&
    ENTITY_TYPES.has(v.entityType) &&
    typeof v.prompt === "string" &&
    typeof v.expiresAt === "string" &&
    Array.isArray(v.options) &&
    v.options.every(isClarificationOption)
  );
}

function isGuidedField(value: unknown) {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.field === "date") {
    return v.required === true && typeof v.input === "object" && v.input !== null && (v.input as { type?: unknown }).type === "date";
  }
  if (v.field === "category") {
    return v.required === true && typeof v.input === "object" && v.input !== null && (v.input as { type?: unknown }).type === "text";
  }
  return false;
}

export function isGuidedClarification(value: unknown): value is GuidedClarification {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    v.kind === "guided" &&
    typeof v.clarificationId === "string" &&
    typeof v.expiresAt === "string" &&
    Array.isArray(v.fields) &&
    v.fields.every(isGuidedField)
  );
}
