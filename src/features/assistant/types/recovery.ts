// Bounded recovery-state model for a refresh/direct-nav that lost in-memory
// workflow state, or an ambiguous mutation failure. Deliberately NOT a
// generic state machine — just the states reachable given the real backend
// contract (`GET .../recovery-state`, idempotent draft confirm/cancel,
// token-less clarification cancel).

import type { AssistantDraft, AssistantRecoveryClarification, AssistantRecoveryStateResponse } from "@/src/types/assistant";

/** The mutation kinds that can fail ambiguously and are tracked for reconciliation. */
export type AssistantPendingActionKind =
  | "sendMessage"
  | "selectClarification"
  | "confirmDraft"
  | "cancelDraft"
  | "cancelClarification";

/**
 * Retry after an ambiguous failure is only contractually safe for actions the
 * backend accepts by id alone and treats idempotently — draft confirm/cancel
 * (idempotency key / id-only) and clarification cancel (id-only, no token).
 * A plain message-send or a clarification `select` must never be
 * auto-retried: resending free text, or a stale option, could create a
 * duplicate clarification/draft chain.
 */
export function isAssistantActionRetrySafe(action: AssistantPendingActionKind): boolean {
  return action === "confirmDraft" || action === "cancelDraft" || action === "cancelClarification";
}

export type AssistantRecoveryState =
  | { kind: "ready" }
  | { kind: "transientClarificationLost" }
  | { kind: "clarificationRecovered"; clarification: AssistantRecoveryClarification }
  | { kind: "draftRecovered"; draft: AssistantDraft }
  | { kind: "actionOutcomeUnknown"; action: AssistantPendingActionKind }
  | { kind: "historyUnavailable" };

/**
 * Adapts the recovery-state draft preview (ids only — the endpoint is
 * read-only and never re-derives a display label or `renderedText`) into the
 * exact shape `DraftSummaryCard`/`DraftActionBar` already render, so no
 * parallel draft-review UI is built. `wallet`/`category` fall back to their
 * raw id since recovery-state doesn't carry a human label.
 * ponytail: id-as-label fallback; upgrade if the backend ever adds labels here.
 */
export function mapRecoveredDraftToAssistantDraft(
  pendingDraft: NonNullable<AssistantRecoveryStateResponse["pendingDraft"]>
): AssistantDraft {
  const { preview } = pendingDraft;
  return {
    draftId: pendingDraft.draftId,
    status: pendingDraft.status,
    expiresAt: preview.expiresAt,
    confirmationRequired: true,
    renderedText: "",
    preview: {
      type: preview.type,
      amount: preview.amount,
      wallet: preview.walletId,
      walletId: preview.walletId,
      category: preview.categoryId,
      date: preview.date,
      description: preview.description,
    },
  };
}

/** Maps `GET .../recovery-state` to the bounded UI state for a refresh with no in-memory workflow. */
export function resolveRecoveryState(response: AssistantRecoveryStateResponse): AssistantRecoveryState {
  if (response.activeClarification) {
    return { kind: "clarificationRecovered", clarification: response.activeClarification };
  }
  if (response.pendingDraft) {
    return { kind: "draftRecovered", draft: mapRecoveredDraftToAssistantDraft(response.pendingDraft) };
  }
  return { kind: "transientClarificationLost" };
}
