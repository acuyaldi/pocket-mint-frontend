"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toaster";
import { INTL_LOCALE } from "@/i18n/config";
import type { DraftConfirmOverrides } from "@/src/features/assistant/api/assistantApi";
import { useAssistantConversationFlow } from "@/src/features/assistant/hooks/useAssistantConversationFlow";
import { readAssistantErrorMessage } from "@/src/features/assistant/utils/errors";
import { AssistantConversation, type AssistantConversationLabels } from "@/src/features/assistant/components/AssistantConversation";
import { AssistantConversationHistory } from "@/src/features/assistant/components/AssistantConversationHistory";
import type { AssistantFinancialDraftStatus } from "@/src/types/assistant";

/**
 * Bounded conversation experience over the canonical Phase 23.2/23.3 flow.
 * `useAssistantConversationFlow` owns conversation id retention and the
 * clarification/draft/completed transitions; this component only wires
 * translations, focus management, and the query-string conversation id.
 *
 * Refresh behavior: persisted messages reload via `conversationId` (kept in
 * the URL as an opaque query param — no draft payload or clarification
 * token ever accompanies it). A transient clarification/draft in progress
 * cannot be reconstructed from history after a refresh; if the last turn on
 * reload is stuck at `CLARIFICATION_REQUIRED` with nothing to render, a
 * localized recovery message is shown and the user can safely continue with
 * a new instruction in the same conversation.
 */
export default function AssistantPage() {
  const t = useTranslations("assistant");
  const tConversation = useTranslations("assistant.conversation");
  const tCommand = useTranslations("assistant.command");
  const tClarification = useTranslations("assistant.clarification");
  const tCompletion = useTranslations("assistant.completion");
  const tErrors = useTranslations("assistant.errors");
  const tDraft = useTranslations("assistant.draftReview");
  const tRecovery = useTranslations("assistant.recovery");
  const tOutcome = useTranslations("assistant.outcomeUnknown");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];

  const flow = useAssistantConversationFlow();

  // Draft edit state — transient, held in React state. Never persisted.
  // Lost on refresh (by design — the recovery flow always starts in view mode).
  const [isEditingDraft, setIsEditingDraft] = useState(false);
  const [draftOverrides, setDraftOverrides] = useState<DraftConfirmOverrides>({});

  const handleStartEditDraft = useCallback(() => {
    const draft = flow.activeWorkflow?.kind === "draft" ? flow.activeWorkflow.draft : null;
    if (!draft) return;
    setDraftOverrides({
      amount: draft.preview.amount ? Number(draft.preview.amount) : undefined,
      walletId: draft.preview.walletId,
      categoryId: undefined, // We don't have categoryId in preview, only category name
      description: draft.preview.description,
      date: undefined, // Date from preview is rendered, not ISO
    });
    setIsEditingDraft(true);
  }, [flow.activeWorkflow]);

  const handleCancelEditDraft = useCallback(() => {
    setIsEditingDraft(false);
    setDraftOverrides({});
  }, []);

  const handleSaveEditDraft = useCallback(() => {
    // "Simpan Perubahan" — frontend only, returns to view mode with edits applied
    setIsEditingDraft(false);
  }, []);

  const workflowHeadingRef = useRef<HTMLElement>(null);
  const focusKey = flow.activeWorkflow?.kind ?? flow.recoveryState.kind ?? (flow.lastResult ? "result" : "idle");
  useEffect(() => {
    workflowHeadingRef.current?.focus();
  }, [focusKey]);

  const messages = flow.session.data?.messages.items ?? [];

  const statusValues: Record<AssistantFinancialDraftStatus, string> = {
    PENDING_CONFIRMATION: tDraft("status.PENDING_CONFIRMATION"),
    COMMITTED: tDraft("status.COMMITTED"),
    CANCELLED: tDraft("status.CANCELLED"),
    EXPIRED: tDraft("status.EXPIRED"),
    FAILED: tDraft("status.FAILED"),
  };

  const labels: AssistantConversationLabels = {
    regionLabel: tConversation("regionLabel"),
    listLabel: tConversation("listLabel"),
    historyLoading: tConversation("historyLoading"),
    historyRetry: tConversation("retry"),
    message: {
      USER: tConversation("authorUser"),
      ASSISTANT: tConversation("authorAssistant"),
      SYSTEM: tConversation("authorSystem"),
    },
    emptyTitle: tConversation("emptyTitle"),
    emptyDescription: tConversation("emptyDescription"),
    examplesLabel: tConversation("examplesLabel"),
    examples: [tConversation("example1"), tConversation("example2")],
    pendingResponse: tConversation("pendingResponse"),
    continueLabel: tCompletion("newInstruction"),
    composer: {
      label: tCommand("label"),
      placeholder: tCommand("placeholder"),
      helper: tCommand("helper"),
      submit: tCommand("submit"),
      submitting: tCommand("submitting"),
    },
    composerDisabledClarification: tConversation("composerDisabledClarification"),
    composerDisabledDraft: tConversation("composerDisabledDraft"),
    composerDisabledOutcomeUnknown: tRecovery("composerDisabled"),
    clarification: {
      cancel: tCommon("actions.cancel"),
      cancelling: tClarification("cancelling"),
      titleByEntity: {
        wallet: tClarification("title.wallet"),
        merchant: tClarification("title.merchant"),
        category: tClarification("title.category"),
      },
      descriptionByEntity: {
        wallet: tClarification("description.wallet"),
        merchant: tClarification("description.merchant"),
        category: tClarification("description.category"),
      },
    },
    guidedClarification: {
      field: {
        category: tClarification("guided.field.category"),
        date: tClarification("guided.field.date"),
      },
      submit: tClarification("guided.submit"),
      cancel: tCommon("actions.cancel"),
    },
    draft: {
      income: tDraft("income"),
      expense: tDraft("expense"),
      wallet: tDraft("wallet"),
      category: tDraft("category"),
      merchant: tDraft("merchant"),
      date: tDraft("date"),
      notes: tDraft("notes"),
      expiresAt: tDraft("expiresAt"),
      statusValues,
      edit: tDraft("edit"),
      saveChanges: tDraft("saveChanges"),
      cancelEdit: tDraft("cancelEdit"),
    },
    draftActions: {
      confirm: tDraft("confirm"),
      confirming: tDraft("confirming"),
      cancel: tCommon("actions.cancel"),
      cancelling: tDraft("cancelling"),
    },
    draftEdit: {
      edit: tDraft("edit"),
      saveChanges: tDraft("saveChanges"),
      saving: tDraft("saving"),
      cancelEdit: tDraft("cancelEdit"),
      confirmTransaction: tDraft("confirmTransaction"),
      confirming: tDraft("confirming"),
      cancel: tCommon("actions.cancel"),
      cancelling: tDraft("cancelling"),
    },
    reviewHeading: tDraft("reviewHeading"),
    recoveryBanner: {
      recoveryLoading: tRecovery("loading"),
      transientLostTitle: tConversation("transientUnavailable"),
      clarificationRecoveredTitle: tRecovery("clarificationRecoveredTitle"),
      cancel: tCommon("actions.cancel"),
      cancelling: tClarification("cancelling"),
    },
    outcomeUnknown: {
      heading: tOutcome("heading"),
      description: tOutcome("description"),
      check: tOutcome("check"),
      checking: tOutcome("checking"),
      retry: tOutcome("retry"),
      retrying: tOutcome("retrying"),
    },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Compact header: title/description on the left, conversation actions
          grouped on the right. The action group wraps below the title on narrow
          screens rather than overflowing. */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <Button
            type="button"
            variant="default"
            size="touch"
            onClick={flow.startNewConversation}
            disabled={!flow.canStartNewConversation}
            title={flow.canStartNewConversation ? undefined : tConversation("resetBlocked")}
          >
            <Plus data-icon="inline-start" aria-hidden="true" />
            {tConversation("newConversation")}
          </Button>
          <AssistantConversationHistory
            conversationId={flow.conversationId}
            canStartNewConversation={flow.canStartNewConversation}
            onSwitchConversation={flow.switchConversation}
            onStartNewConversation={flow.startNewConversation}
            intlLocale={intlLocale}
          />
        </div>
      </header>

      <AssistantConversation
        conversationId={flow.conversationId}
        messages={messages}
        isLoadingHistory={flow.session.isLoading}
        historyErrorMessage={flow.session.isError ? readAssistantErrorMessage(flow.session.error, tErrors) : null}
        onRetryHistory={() => flow.session.refetch()}
        recoveryState={flow.recoveryState}
        activeWorkflow={flow.activeWorkflow}
        lastResult={flow.lastResult}
        instructionText={flow.instructionText}
        onInstructionChange={flow.setInstructionText}
        onSubmit={() => flow.submit(tErrors, (message) => toast(message, "error"), () => toast(tErrors("generic"), "error"), intlLocale)}
        isSendingMessage={flow.isSendingMessage}
        formError={flow.formError}
        pendingOptionToken={flow.pendingOptionToken}
        isSelectingClarification={flow.isSelectingClarification}
        isCancellingClarification={flow.isCancellingClarification}
        onSelectOption={(token) =>
          flow.selectOption(token, tErrors, (message) => toast(message, "error"))
        }
        onSubmitGuidedFields={(fields) =>
          flow.submitGuidedFields(fields, tErrors, (message) => toast(message, "error"))
        }
        onCancelClarification={() =>
          flow.cancelActiveClarification(
            tErrors,
            () => toast(tClarification("cancelSuccess"), "success"),
            (message) => toast(message, "error")
          )
        }
        isConfirmingDraft={flow.isConfirmingDraft}
        isCancellingDraft={flow.isCancellingDraft}
        onConfirmDraft={() =>
          flow.confirm(
            Object.keys(draftOverrides).length > 0 ? draftOverrides : undefined,
            tErrors,
            () => {
              setDraftOverrides({});
              setIsEditingDraft(false);
              toast(tDraft("confirmSuccess"), "success");
            },
            (message) => toast(message, "error")
          )
        }
        onCancelDraft={() =>
          flow.cancelActiveDraft(
            tErrors,
            () => toast(tDraft("cancelSuccess"), "success"),
            (message) => toast(message, "error")
          )
        }
        isCheckingOutcome={flow.isCheckingOutcome}
        onCheckOutcome={() => flow.checkOutcome()}
        onRetryOutcome={() =>
          flow.retryOutcomeAction(
            tErrors,
            () => toast(tOutcome("retrySuccess"), "success"),
            (message) => toast(message, "error")
          )
        }
        onStartNewConversation={flow.startNewConversation}
        intlLocale={intlLocale}
        labels={labels}
        workflowHeadingRef={workflowHeadingRef}
        isEditingDraft={isEditingDraft}
        draftOverrides={draftOverrides}
        onStartEditDraft={handleStartEditDraft}
        onCancelEditDraft={handleCancelEditDraft}
        onSaveEditDraft={handleSaveEditDraft}
        onDraftOverrideChange={setDraftOverrides}
      />
    </div>
  );
}
