"use client";
import { useQueryClient } from "@tanstack/react-query";
import { getAssistantRecoveryState, getAssistantSession } from "@/src/features/assistant/api/assistantApi";
import { assistantKeys } from "@/src/features/assistant/constants/queryKeys";
import type { AssistantPendingActionKind } from "@/src/features/assistant/types/recovery";

export interface AssistantReconciliationSnapshot {
  conversationId: string;
  /** `turns.length` from `session.data` immediately before the ambiguous attempt. */
  turnCount: number;
  action: AssistantPendingActionKind;
  draftId?: string;
  clarificationId?: string;
}

export interface AssistantReconciliationOutcome {
  /** True once the real outcome could be confirmed one way or the other — never re-sends anything either way. */
  resolved: boolean;
}

/**
 * Runs once, only on explicit trigger (an ambiguous mutation failure, or the
 * user pressing "Check conversation") — never polls, never auto-retries.
 * Refetches the conversation session + recovery-state and compares against a
 * pre-attempt snapshot to see whether the ambiguous action actually
 * completed on the backend.
 */
export function useAssistantReconciliation() {
  const queryClient = useQueryClient();

  const reconcile = async (snapshot: AssistantReconciliationSnapshot): Promise<AssistantReconciliationOutcome> => {
    const [session, recovery] = await Promise.all([
      queryClient.fetchQuery({
        queryKey: assistantKeys.session(snapshot.conversationId),
        queryFn: () => getAssistantSession(snapshot.conversationId),
      }),
      getAssistantRecoveryState(snapshot.conversationId).catch(() => null),
    ]);

    let resolved = session.turns.length > snapshot.turnCount;

    if (!resolved && recovery) {
      if (snapshot.action === "confirmDraft" || snapshot.action === "cancelDraft") {
        resolved = recovery.pendingDraft?.draftId !== snapshot.draftId;
      } else if (snapshot.action === "cancelClarification") {
        resolved =
          recovery.activeClarification?.clarificationId !== snapshot.clarificationId ||
          recovery.latestTerminalClarification?.clarificationId === snapshot.clarificationId;
      }
      // "sendMessage" / "selectClarification": only a new turn counts as resolved.
    }

    queryClient.setQueryData(assistantKeys.session(snapshot.conversationId), session);
    queryClient.invalidateQueries({ queryKey: assistantKeys.recoveryState(snapshot.conversationId) });

    return { resolved };
  };

  return { reconcile };
}
