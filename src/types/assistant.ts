// Mirrors pocket-mint-be `src/assistant/*.ts` and the Prisma Assistant enums
// (`prisma/schema.prisma`) exactly. Do not add fields the backend doesn't send.

export type AssistantConversationStatus = "ACTIVE" | "ARCHIVED" | "EXPIRED";

export type AssistantTurnStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "REJECTED"
  | "CLARIFICATION_REQUIRED";

export type AssistantRole = "USER" | "ASSISTANT" | "SYSTEM";

export type AssistantMessageSource =
  | "USER_PROVIDED"
  | "CANONICAL_FALLBACK"
  | "SAFE_REQUEST_SUMMARY"
  | "DETERMINISTIC_RENDERER"
  | "SAFE_ERROR"
  | "PROVIDER_CLARIFICATION";

export type AssistantToolExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCEEDED"
  | "FAILED"
  | "TIMED_OUT"
  | "DENIED";

export type AssistantFinancialDraftStatus =
  | "PENDING_CONFIRMATION"
  | "COMMITTED"
  | "CANCELLED"
  | "EXPIRED"
  | "FAILED";

export type AssistantClarificationStatus = "PENDING" | "CONSUMED" | "CANCELLED" | "STALE";

export type AssistantRiskLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH";

export type AssistantClarificationEntityType = "wallet" | "merchant" | "category";

export interface AssistantPage<T> {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface AssistantMessage {
  id: string;
  turnId: string;
  role: AssistantRole;
  source: AssistantMessageSource;
  content: string;
  createdAt: string;
}

export interface AssistantConversationSummary {
  id: string;
  status: AssistantConversationStatus;
  locale: string;
  createdAt: string;
  updatedAt: string;
  lastActivityAt: string;
  lastMessage?: string;
}

export interface AssistantToolExecution {
  id: string;
  toolId: string;
  capability: string;
  riskLevel: AssistantRiskLevel;
  policyDecision: string;
  status: AssistantToolExecutionStatus;
  correlationId: string;
  startedAt: string;
  completedAt: string | null;
  durationMs: number | null;
  safeErrorCode: string | null;
}

export interface AssistantTurn {
  id: string;
  correlationId: string;
  status: AssistantTurnStatus;
  intent: string;
  safeErrorCode: string | null;
  startedAt: string;
  finishedAt: string | null;
  toolExecutions: AssistantToolExecution[];
}

/** `GET /assistant/conversations/:conversationId` — the full session view. */
export interface AssistantSession {
  conversation: {
    id: string;
    status: AssistantConversationStatus;
    locale: string;
    createdAt: string;
    updatedAt: string;
    lastActivityAt: string;
  };
  messages: AssistantPage<AssistantMessage>;
  turns: AssistantTurn[];
}

/** Common result shape returned by `/execute`, `/messages`, and clarification select/cancel. */
export interface AssistantSuccessResult {
  status: "success";
  renderedText: string;
  data: unknown;
  correlationId: string;
  conversationId: string;
  turnId: string;
}

export interface AssistantClarificationRequiredResult {
  status: "clarification_required";
  message: string;
  data?: unknown;
  correlationId: string;
  conversationId: string;
  turnId: string;
}

/** Non-2xx `rejected` / `error` responses — thrown as `AssistantError`, never returned. */
export interface AssistantErrorResult {
  status: "rejected" | "error";
  code: string;
  message: string;
  correlationId: string;
  conversationId: string;
  turnId: string;
}

export type AssistantTurnResult = AssistantSuccessResult | AssistantClarificationRequiredResult;

export interface AssistantDraftPreview {
  type: "INCOME" | "EXPENSE";
  amount: string | number;
  wallet?: string;
  walletId?: string;
  category: string;
  merchant?: string;
  date: string;
  description?: string;
}

export interface AssistantDraft {
  draftId: string;
  status: AssistantFinancialDraftStatus;
  expiresAt: string;
  preview: AssistantDraftPreview;
  confirmationRequired: true;
  renderedText: string;
}

export interface AssistantDraftConfirmed {
  draftId: string;
  status: "COMMITTED";
  transactionId: string;
  conversationId: string;
  turnId?: string;
  renderedText: string;
}

export interface AssistantDraftCancelled {
  draftId: string;
  status: "CANCELLED" | "EXPIRED";
  conversationId: string;
  turnId?: string;
  renderedText: string;
}

export interface ClarificationOption {
  label: string;
  discriminator?: string;
}

export interface ClarificationRequest {
  clarificationId: string;
  entityType: AssistantClarificationEntityType;
  prompt: string;
  options: ClarificationOption[];
  expiresAt: string;
}

/** `POST .../clarifications/:id/select` response — either another clarification, or a resolved draft. */
export type AssistantClarificationSelectResult =
  | {
      status: "clarification_required";
      data: {
        kind: "ambiguous";
        entityType: AssistantClarificationEntityType;
        clarification: ClarificationRequest;
      };
    }
  | {
      status: "success";
      data: {
        draftId: string;
        status: AssistantFinancialDraftStatus;
        preview: AssistantDraftPreview;
      };
    };

export interface AssistantClarificationCancelled {
  clarificationId: string;
  status: "CANCELLED";
}

/** `POST .../clarifications/:id/cancel` response — status-wrapped like the select endpoint. */
export interface AssistantClarificationCancelResult {
  status: "success";
  data: AssistantClarificationCancelled;
}

/** Thrown for non-2xx Assistant responses — mirrors the backend's `{ error: {...} }` envelope. */
export interface AssistantError {
  code: string;
  message: string;
  statusCode: number;
  correlationId?: string;
  conversationId?: string;
  turnId?: string;
}
