import type { AssistantDraft } from "@/src/types/assistant";
import type { DraftConfirmOverrides } from "@/src/features/assistant/api/assistantApi";

/**
 * Seeds the transient edit-mode override state from a draft's own preview —
 * so entering edit mode shows the draft's current amount/wallet/category/date
 * already selected, instead of blank controls the user has to fill in from
 * scratch. `categoryId`/`date` come from the raw `categoryId`/`transactionDate`
 * preview fields (Phase 34), never from the display-only `category`/`date`
 * strings.
 */
export function buildDraftEditOverrides(draft: AssistantDraft): DraftConfirmOverrides {
  const { preview } = draft;
  return {
    amount: preview.amount ? Number(preview.amount) : undefined,
    walletId: preview.walletId,
    categoryId: preview.categoryId,
    description: preview.description,
    date: preview.transactionDate,
  };
}
