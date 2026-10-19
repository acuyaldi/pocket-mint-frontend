// Bounded recovery-state model for a refresh/direct-nav that lost in-memory
// workflow state, or an ambiguous mutation failure. Deliberately NOT a
// generic state machine — just the states reachable given the real backend
// contract (`GET .../recovery-state`, idempotent draft confirm/cancel,
// token-less clarification cancel).

import type {
  AssistantDraft,
  AssistantRecoveryActiveTurn,
  AssistantRecoveryClarification,
  AssistantRecoveryStateResponse,
  AssistantRecoveryTerminalClarification,
} from "@/src/types/assistant";
import type { AssistantTerminalCondition } from "@/src/features/assistant/utils/errors";

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
  | { kind: "recoveryLoading" }
  | { kind: "transientClarificationLost" }
  | { kind: "clarificationRecovered"; clarification: AssistantRecoveryClarification }
  | { kind: "draftRecovered"; draft: AssistantDraft }
  | { kind: "actionOutcomeUnknown"; action: AssistantPendingActionKind }
  | { kind: "historyUnavailable" }
  | { kind: "turnRunning"; turn: AssistantRecoveryActiveTurn }
  /** Phase 38 — nothing left to act on; never offers Confirm. */
  | { kind: "terminal"; condition: AssistantTerminalCondition };

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
      ...(preview.type === "TRANSFER"
        ? { toWallet: preview.toWalletId, toWalletId: preview.toWalletId }
        : { categoryId: preview.categoryId, category: preview.categoryId }),
      date: preview.date,
      transactionDate: preview.transactionDate,
      description: preview.description,
    },
  };
}

/** `STALE` + `terminalCode: 'expired'` is the clarification's expired state (assistant-stuck-states.md); CONSUMED is a normal outcome. */
function terminalClarificationCondition(terminal: AssistantRecoveryTerminalClarification): AssistantTerminalCondition | null {
  if (terminal.status === "CANCELLED") return { kind: "cancelled" };
  if (terminal.status === "STALE") return terminal.terminalCode === "expired" ? { kind: "expired" } : { kind: "notActionable", reason: "stale" };
  return null;
}

export interface RecoveryContext {
  /** `session.conversation.status` — anything but ACTIVE cannot take a new message. */
  conversationStatus?: string;
  /** Intent of the latest persisted turn (a closed backend constant, e.g. `clarification.cancel`). */
  latestTurnIntent?: string;
}

/** Maps `GET .../recovery-state` to the bounded UI state for a refresh with no in-memory workflow. */
export function resolveRecoveryState(response: AssistantRecoveryStateResponse, context: RecoveryContext = {}): AssistantRecoveryState {
  if (response.activeClarification) {
    return { kind: "clarificationRecovered", clarification: response.activeClarification };
  }
  if (response.pendingDraft) {
    return { kind: "draftRecovered", draft: mapRecoveredDraftToAssistantDraft(response.pendingDraft) };
  }
  if (response.activeTurn) {
    return { kind: "turnRunning", turn: response.activeTurn };
  }
  if (context.conversationStatus && context.conversationStatus !== "ACTIVE") {
    return { kind: "terminal", condition: { kind: "notActionable", reason: "archived" } };
  }
  // `latestTerminalClarification` carries no turn link, so it only describes
  // what just happened when the conversation's last turn was itself a
  // clarification action (select/cancel/guided submit) — otherwise the
  // conversation has moved on and it is history, not a recovery state.
  const terminal = response.latestTerminalClarification;
  if (terminal && context.latestTurnIntent?.startsWith("clarification.")) {
    const condition = terminalClarificationCondition(terminal);
    if (condition) return { kind: "terminal", condition };
  }
  return { kind: "transientClarificationLost" };
}
