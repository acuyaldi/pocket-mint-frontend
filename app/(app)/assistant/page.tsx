"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toaster";
import { INTL_LOCALE } from "@/i18n/config";
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
    newConversation: tConversation("newConversation"),
    resetBlocked: tConversation("resetBlocked"),
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
    clarification: { cancel: tCommon("actions.cancel"), cancelling: tClarification("cancelling") },
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
    },
    draftActions: {
      confirm: tDraft("confirm"),
      confirming: tDraft("confirming"),
      cancel: tCommon("actions.cancel"),
      cancelling: tDraft("cancelling"),
    },
    recoveryBanner: {
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
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4">
        <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
        <AssistantConversationHistory
          conversationId={flow.conversationId}
          canStartNewConversation={flow.canStartNewConversation}
          onSwitchConversation={flow.switchConversation}
          onStartNewConversation={flow.startNewConversation}
          intlLocale={intlLocale}
        />
      </div>

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
        onSubmit={() => flow.submit(tErrors, () => flow.startNewConversation())}
        isSendingMessage={flow.isSendingMessage}
        formError={flow.formError}
        pendingOptionToken={flow.pendingOptionToken}
        isSelectingClarification={flow.isSelectingClarification}
        isCancellingClarification={flow.isCancellingClarification}
        onSelectOption={(token) =>
          flow.selectOption(token, tErrors, (message) => toast(message, "error"))
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
            tErrors,
            () => toast(tDraft("confirmSuccess"), "success"),
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
        canStartNewConversation={flow.canStartNewConversation}
        onStartNewConversation={flow.startNewConversation}
        intlLocale={intlLocale}
        labels={labels}
        workflowHeadingRef={workflowHeadingRef}
      />
    </div>
  );
}
