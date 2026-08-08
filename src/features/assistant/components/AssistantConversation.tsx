"use client";

import type { Dispatch, RefObject, SetStateAction } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AssistantMessageList } from "./AssistantMessageList";
import { AssistantMessage as AssistantMessageComponent, type AssistantMessageLabels } from "./AssistantMessage";
import { AssistantConversationEmptyState } from "./AssistantConversationEmptyState";
import { AssistantPendingResponse } from "./AssistantPendingResponse";
import { AssistantCommandForm, type AssistantCommandFormLabels } from "./AssistantCommandForm";
import { ClarificationCard, type ClarificationCardLabels } from "./ClarificationCard";
import { GuidedClarificationCard, type GuidedClarificationCardLabels } from "./GuidedClarificationCard";
import { DraftSummaryCard, type DraftSummaryCardLabels } from "./DraftSummaryCard";
import { DraftActionBar, type DraftActionBarLabels } from "./DraftActionBar";
import { AssistantResultState } from "./AssistantResultState";
import { AssistantRecoveryBanner, type AssistantRecoveryBannerLabels } from "./AssistantRecoveryBanner";
import { AssistantOutcomeUnknown, type AssistantOutcomeUnknownLabels } from "./AssistantOutcomeUnknown";
import type { AssistantMessage as AssistantMessageDto } from "@/src/types/assistant";
import type { AssistantActiveWorkflow, AssistantLastResult } from "@/src/features/assistant/hooks/useAssistantConversationFlow";
import { isAssistantActionRetrySafe, type AssistantRecoveryState } from "@/src/features/assistant/types/recovery";
import type { DraftConfirmOverrides } from "@/src/features/assistant/api/assistantApi";

export interface AssistantConversationLabels {
  regionLabel: string;
  listLabel: string;
  historyLoading: string;
  historyRetry: string;
  message: AssistantMessageLabels;
  emptyTitle: string;
  emptyDescription: string;
  examplesLabel: string;
  examples: string[];
  pendingResponse: string;
  continueLabel: string;
  composer: AssistantCommandFormLabels;
  composerDisabledClarification: string;
  composerDisabledDraft: string;
  composerDisabledOutcomeUnknown: string;
  clarification: ClarificationCardLabels;
  guidedClarification: GuidedClarificationCardLabels;
  draft: DraftSummaryCardLabels;
  draftActions: DraftActionBarLabels;
  draftEdit: DraftSummaryCardEditLabels;
  reviewHeading: string;
  recoveryBanner: AssistantRecoveryBannerLabels;
  outcomeUnknown: AssistantOutcomeUnknownLabels;
}

export interface DraftSummaryCardEditLabels {
  edit: string;
  saveChanges: string;
  saving: string;
  cancelEdit: string;
  confirmTransaction: string;
  confirming: string;
  cancel: string;
  cancelling: string;
}

interface AssistantConversationProps {
  conversationId: string | null;
  messages: AssistantMessageDto[];
  isLoadingHistory: boolean;
  historyErrorMessage: string | null;
  onRetryHistory: () => void;
  recoveryState: AssistantRecoveryState;
  activeWorkflow: AssistantActiveWorkflow;
  lastResult: AssistantLastResult;
  instructionText: string;
  onInstructionChange: (value: string) => void;
  onSubmit: () => void;
  isSendingMessage: boolean;
  formError: string | null;
  pendingOptionToken: string | null;
  isSelectingClarification: boolean;
  isCancellingClarification: boolean;
  onSelectOption: (token: string) => void;
  onSubmitGuidedFields: (fields: Record<string, string>) => void;
  onCancelClarification: () => void;
  isConfirmingDraft: boolean;
  isCancellingDraft: boolean;
  onConfirmDraft: () => void;
  onCancelDraft: () => void;
  isCheckingOutcome: boolean;
  onCheckOutcome: () => void;
  onRetryOutcome: () => void;
  onStartNewConversation: () => void;
  intlLocale: string;
  labels: AssistantConversationLabels;
  workflowHeadingRef?: RefObject<HTMLElement | null>;
  /** Draft edit-mode controls — transient React state, never persisted. */
  isEditingDraft: boolean;
  draftOverrides: DraftConfirmOverrides;
  onStartEditDraft: () => void;
  onCancelEditDraft: () => void;
  onSaveEditDraft: () => void;
  onDraftOverrideChange: Dispatch<SetStateAction<DraftConfirmOverrides>>;
}

/**
 * The bounded Assistant conversation region: persisted history, then
 * whatever transient item is currently in play (pending response,
 * clarification, draft review, or the last-result echo), then the
 * composer. This composes the exact Phase 23.2/23.3 components — it does
 * not reimplement clarification or draft-confirmation UI.
 */
export function AssistantConversation({
  conversationId,
  messages,
  isLoadingHistory,
  historyErrorMessage,
  onRetryHistory,
  recoveryState,
  activeWorkflow,
  lastResult,
  instructionText,
  onInstructionChange,
  onSubmit,
  isSendingMessage,
  formError,
  pendingOptionToken,
  isSelectingClarification,
  isCancellingClarification,
  onSelectOption,
  onSubmitGuidedFields,
  onCancelClarification,
  isConfirmingDraft,
  isCancellingDraft,
  onConfirmDraft,
  onCancelDraft,
  isCheckingOutcome,
  onCheckOutcome,
  onRetryOutcome,
  onStartNewConversation,
  intlLocale,
  labels,
  workflowHeadingRef,
  isEditingDraft,
  draftOverrides,
  onStartEditDraft,
  onCancelEditDraft,
  onSaveEditDraft,
  onDraftOverrideChange,
}: AssistantConversationProps) {
  const hasHistory = messages.length > 0;
  const showEmptyState = !conversationId && !hasHistory && !activeWorkflow && !isSendingMessage;

  const composerDisabledReason = activeWorkflow
    ? activeWorkflow.kind === "clarification" || activeWorkflow.kind === "guidedClarification"
      ? labels.composerDisabledClarification
      : labels.composerDisabledDraft
    : recoveryState.kind === "clarificationRecovered"
      ? labels.composerDisabledClarification
      : recoveryState.kind === "draftRecovered"
        ? labels.composerDisabledDraft
        : recoveryState.kind === "recoveryLoading" || recoveryState.kind === "actionOutcomeUnknown"
          ? labels.composerDisabledOutcomeUnknown
          : null;

  return (
    <section aria-label={labels.regionLabel} className="flex min-h-[calc(100dvh-14rem)] flex-col">
      {/* Persisted history is not itself an aria-live region — refetching it
          (e.g. after invalidation) must not re-announce every message. */}
      <div className="flex flex-1 flex-col gap-5 overflow-y-auto pb-5">
        <div className={showEmptyState ? "flex flex-1 items-center justify-center py-8" : "space-y-5"}>
          {conversationId ? (
            <AssistantMessageList
              messages={messages}
              isLoading={isLoadingHistory}
              errorMessage={historyErrorMessage}
              loadingLabel={labels.historyLoading}
              errorRetryLabel={labels.historyRetry}
              onRetry={onRetryHistory}
              messageLabels={labels.message}
              listLabel={labels.listLabel}
            />
          ) : null}

          {showEmptyState ? (
            <AssistantConversationEmptyState
              title={labels.emptyTitle}
              description={labels.emptyDescription}
              examplesLabel={labels.examplesLabel}
              examples={labels.examples}
            />
          ) : null}

          {isSendingMessage && instructionText ? (
            <ul aria-label={labels.listLabel} className="flex flex-col gap-4">
              <AssistantMessageComponent message={{ role: "USER", content: instructionText }} labels={labels.message} />
            </ul>
          ) : null}
        </div>

        {/* Narrow live region: only the transient workflow item currently in
            play is announced once when it appears — not the whole history. */}
        <div aria-live="polite" className="space-y-6">
          {recoveryState.kind === "recoveryLoading" ? (
            <AssistantRecoveryBanner kind="recoveryLoading" labels={labels.recoveryBanner} />
          ) : null}

          {recoveryState.kind === "transientClarificationLost" ? (
            <AssistantRecoveryBanner kind="transientClarificationLost" labels={labels.recoveryBanner} />
          ) : null}

          {recoveryState.kind === "clarificationRecovered" ? (
            <AssistantRecoveryBanner
              kind="clarificationRecovered"
              clarification={recoveryState.clarification}
              isCancelling={isCancellingClarification}
              onCancel={onCancelClarification}
              labels={labels.recoveryBanner}
              headingRef={workflowHeadingRef}
            />
          ) : null}

          {recoveryState.kind === "draftRecovered" ? (
            <div ref={workflowHeadingRef as RefObject<HTMLDivElement>} tabIndex={-1} className="max-w-xl space-y-6 outline-none">
              <DraftSummaryCard
                draft={recoveryState.draft}
                intlLocale={intlLocale}
                labels={labels.draft}
                isEditing={false}
                overrides={{}}
                onOverrideChange={() => {}}
                onStartEdit={() => {}}
                onSaveEdit={() => {}}
                onCancelEdit={() => {}}
              />
              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancelDraft}
                  disabled={isCancellingDraft || recoveryState.draft.status !== "PENDING_CONFIRMATION"}
                  className="h-11 flex-1 gap-2 bg-card"
                >
                  {isCancellingDraft ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {isCancellingDraft ? labels.draftEdit.cancelling : labels.draftEdit.cancel}
                </Button>
                <Button
                  type="button"
                  onClick={onConfirmDraft}
                  disabled={isConfirmingDraft || recoveryState.draft.status !== "PENDING_CONFIRMATION"}
                  className="h-11 flex-1 gap-2"
                >
                  {isConfirmingDraft ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
                  {isConfirmingDraft ? labels.draftEdit.confirming : labels.draftEdit.confirmTransaction}
                </Button>
              </div>
            </div>
          ) : null}

          {recoveryState.kind === "actionOutcomeUnknown" ? (
            <AssistantOutcomeUnknown
              onCheck={onCheckOutcome}
              onRetry={isAssistantActionRetrySafe(recoveryState.action) ? onRetryOutcome : undefined}
              isChecking={isCheckingOutcome}
              isRetrying={isConfirmingDraft || isCancellingDraft || isCancellingClarification}
              labels={labels.outcomeUnknown}
              headingRef={workflowHeadingRef}
            />
          ) : null}

          {isSendingMessage ? <AssistantPendingResponse label={labels.pendingResponse} /> : null}

          {activeWorkflow?.kind === "clarification" ? (
            <ClarificationCard
              clarification={activeWorkflow.clarification}
              pendingToken={pendingOptionToken}
              isSelecting={isSelectingClarification}
              isCancelling={isCancellingClarification}
              onSelect={onSelectOption}
              onCancel={onCancelClarification}
              labels={labels.clarification}
              headingRef={workflowHeadingRef}
            />
          ) : null}

          {activeWorkflow?.kind === "guidedClarification" ? (
            <GuidedClarificationCard
              clarification={activeWorkflow.clarification}
              prompt={activeWorkflow.prompt}
              labels={labels.guidedClarification}
              isSubmitting={isSelectingClarification}
              isCancelling={isCancellingClarification}
              onSubmit={onSubmitGuidedFields}
              onCancel={onCancelClarification}
              headingRef={workflowHeadingRef}
            />
          ) : null}

          {activeWorkflow?.kind === "draft" ? (
            <>
              {/* Separator between chat timeline and Transaction Review workspace */}
              <div className="border-t border-border pt-4">
                <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-muted-foreground">
                  {labels.reviewHeading}
                </h2>
                <div ref={workflowHeadingRef as RefObject<HTMLDivElement>} tabIndex={-1} className="max-w-xl space-y-6 outline-none">
                  <DraftSummaryCard
                    draft={activeWorkflow.draft}
                    intlLocale={intlLocale}
                    labels={labels.draft}
                    isEditing={isEditingDraft}
                    overrides={draftOverrides}
                    onOverrideChange={onDraftOverrideChange}
                    onStartEdit={onStartEditDraft}
                    onSaveEdit={onSaveEditDraft}
                    onCancelEdit={onCancelEditDraft}
                  />
                  {/* View-mode only: [Simpan Transaksi] button */}
                  {!isEditingDraft ? (
                    <div className="flex flex-col-reverse gap-3 sm:flex-row">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={onCancelDraft}
                        disabled={isConfirmingDraft || activeWorkflow.draft.status !== "PENDING_CONFIRMATION"}
                        className="h-11 flex-1 gap-2 bg-card"
                      >
                        {isCancellingDraft ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : null}
                        {isCancellingDraft ? labels.draftEdit.cancelling : labels.draftEdit.cancel}
                      </Button>
                      <Button
                        type="button"
                        onClick={onConfirmDraft}
                        disabled={isConfirmingDraft || activeWorkflow.draft.status !== "PENDING_CONFIRMATION"}
                        className="h-11 flex-1 gap-2"
                      >
                        {isConfirmingDraft ? (
                          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                        ) : null}
                        {isConfirmingDraft ? labels.draftEdit.confirming : labels.draftEdit.confirmTransaction}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </div>
            </>
          ) : null}

          {lastResult && !activeWorkflow ? (
            <AssistantResultState
              renderedText={lastResult.renderedText}
              actionLabel={labels.continueLabel}
              onAction={onStartNewConversation}
              headingRef={workflowHeadingRef}
            />
          ) : null}
        </div>
      </div>

      <div className="w-full border-t border-border pt-4">
        <AssistantCommandForm
          value={instructionText}
          onChange={onInstructionChange}
          onSubmit={onSubmit}
          isSubmitting={isSendingMessage}
          error={formError}
          disabledReason={composerDisabledReason}
          labels={labels.composer}
        />
      </div>
    </section>
  );
}
