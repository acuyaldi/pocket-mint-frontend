"use client";

import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";

import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toaster";
import { INTL_LOCALE } from "@/i18n/config";
import { useConfirmAssistantDraft, useCancelAssistantDraft } from "@/src/features/assistant/hooks/useAssistantDraft";
import {
  useSelectAssistantClarification,
  useCancelAssistantClarification,
  useSendAssistantMessage,
} from "@/src/features/assistant/hooks/useAssistantMessages";
import { parseAssistantDraftParam, isAssistantDraft } from "@/src/features/assistant/utils/draftParam";
import { isClarificationRequest } from "@/src/features/assistant/utils/clarification";
import { readAssistantErrorMessage } from "@/src/features/assistant/utils/errors";
import { AssistantCommandForm } from "@/src/features/assistant/components/AssistantCommandForm";
import { ClarificationCard } from "@/src/features/assistant/components/ClarificationCard";
import { AssistantResultState } from "@/src/features/assistant/components/AssistantResultState";
import { DraftSummaryCard } from "@/src/features/assistant/components/DraftSummaryCard";
import { DraftActionBar } from "@/src/features/assistant/components/DraftActionBar";
import type {
  AssistantClarificationSelectResult,
  AssistantDraft,
  AssistantFinancialDraftStatus,
  AssistantTurnResult,
  ClarificationRequest,
} from "@/src/types/assistant";

/**
 * Bounded, in-memory draft handoff: an execution/clarification response's
 * structured draft is held in this component's own React state, never
 * round-tripped through the URL. This avoids putting financial payloads in
 * browser history and keeps a refresh safely reset to idle. The `?draft=`
 * param remains supported read-only (see `parseAssistantDraftParam`) since
 * no `GET /assistant/drafts/:draftId` endpoint exists for the confirm/cancel
 * flow to reload a draft any other way, but this phase's interaction flow
 * never writes to it.
 */
type AssistantFlowPhase =
  | { kind: "idle" }
  | { kind: "clarification"; conversationId: string; clarification: ClarificationRequest }
  | { kind: "draft"; draft: AssistantDraft }
  | { kind: "completed"; renderedText: string };

export default function AssistantPage() {
  const t = useTranslations("assistant");
  const tCommand = useTranslations("assistant.command");
  const tClarification = useTranslations("assistant.clarification");
  const tCompletion = useTranslations("assistant.completion");
  const tErrors = useTranslations("assistant.errors");
  const tDraft = useTranslations("assistant.draftReview");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlDraft = useMemo(() => parseAssistantDraftParam(searchParams), [searchParams]);

  const [phase, setPhase] = useState<AssistantFlowPhase>({ kind: "idle" });
  const [instructionText, setInstructionText] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [pendingOptionToken, setPendingOptionToken] = useState<string | null>(null);

  const sendMessage = useSendAssistantMessage();
  const selectClarification = useSelectAssistantClarification();
  const cancelClarification = useCancelAssistantClarification();
  const confirmDraft = useConfirmAssistantDraft();
  const cancelDraft = useCancelAssistantDraft();

  const effectivePhase: AssistantFlowPhase = phase.kind === "idle" && urlDraft ? { kind: "draft", draft: urlDraft } : phase;

  const headingRef = useRef<HTMLElement>(null);
  useEffect(() => {
    headingRef.current?.focus();
  }, [effectivePhase.kind]);

  function resetFlow() {
    setPhase({ kind: "idle" });
    setInstructionText("");
    setFormError(null);
    sendMessage.reset();
    selectClarification.reset();
    cancelClarification.reset();
    confirmDraft.reset();
    cancelDraft.reset();
    router.replace("/assistant");
  }

  function applyTurnResult(result: AssistantTurnResult) {
    if (result.status === "clarification_required") {
      if (result.data && isClarificationRequest(result.data.clarification)) {
        setPhase({ kind: "clarification", conversationId: result.conversationId, clarification: result.data.clarification });
        return;
      }
      toast(tErrors("generic"), "error");
      return;
    }
    if (isAssistantDraft(result.data)) {
      setPhase({ kind: "draft", draft: result.data });
      return;
    }
    setPhase({ kind: "completed", renderedText: result.renderedText });
  }

  function applySelectResult(result: AssistantClarificationSelectResult) {
    if (result.status === "clarification_required") {
      if (isClarificationRequest(result.data.clarification)) {
        setPhase({ kind: "clarification", conversationId: result.conversationId, clarification: result.data.clarification });
        return;
      }
      toast(tErrors("generic"), "error");
      resetFlow();
      return;
    }
    if (isAssistantDraft(result.data)) {
      setPhase({ kind: "draft", draft: result.data });
      return;
    }
    toast(tErrors("generic"), "error");
    resetFlow();
  }

  const handleSubmit = () => {
    const message = instructionText.trim();
    if (!message || sendMessage.isPending) return;
    setFormError(null);
    sendMessage.mutate(
      { message },
      {
        onSuccess: (result) => {
          setInstructionText("");
          applyTurnResult(result);
        },
        onError: (error) => setFormError(readAssistantErrorMessage(error, tErrors)),
      }
    );
  };

  const handleSelectOption = (token: string) => {
    if (effectivePhase.kind !== "clarification" || selectClarification.isPending || cancelClarification.isPending) return;
    setPendingOptionToken(token);
    selectClarification.mutate(
      {
        conversationId: effectivePhase.conversationId,
        clarificationId: effectivePhase.clarification.clarificationId,
        optionToken: token,
      },
      {
        onSuccess: applySelectResult,
        onError: (error) => toast(readAssistantErrorMessage(error, tErrors), "error"),
        onSettled: () => setPendingOptionToken(null),
      }
    );
  };

  const handleCancelClarification = () => {
    if (effectivePhase.kind !== "clarification" || selectClarification.isPending || cancelClarification.isPending) return;
    cancelClarification.mutate(
      { conversationId: effectivePhase.conversationId, clarificationId: effectivePhase.clarification.clarificationId },
      {
        onSuccess: () => {
          toast(tClarification("cancelSuccess"), "success");
          resetFlow();
        },
        onError: (error) => toast(readAssistantErrorMessage(error, tErrors), "error"),
      }
    );
  };

  const statusValues: Record<AssistantFinancialDraftStatus, string> = {
    PENDING_CONFIRMATION: tDraft("status.PENDING_CONFIRMATION"),
    COMMITTED: tDraft("status.COMMITTED"),
    CANCELLED: tDraft("status.CANCELLED"),
    EXPIRED: tDraft("status.EXPIRED"),
    FAILED: tDraft("status.FAILED"),
  };

  const handleConfirm = () => {
    if (effectivePhase.kind !== "draft") return;
    confirmDraft.mutate(effectivePhase.draft.draftId, {
      onSuccess: (result) => {
        toast(tDraft("confirmSuccess"), "success");
        setPhase({ kind: "completed", renderedText: result.renderedText });
      },
      onError: (error) => toast(readAssistantErrorMessage(error, tErrors), "error"),
    });
  };

  const handleCancelDraft = () => {
    if (effectivePhase.kind !== "draft") return;
    cancelDraft.mutate(effectivePhase.draft.draftId, {
      onSuccess: () => {
        toast(tDraft("cancelSuccess"), "success");
        resetFlow();
      },
      onError: (error) => toast(readAssistantErrorMessage(error, tErrors), "error"),
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />

      <div aria-live="polite">
        {effectivePhase.kind === "idle" ? (
          <AssistantCommandForm
            value={instructionText}
            onChange={setInstructionText}
            onSubmit={handleSubmit}
            isSubmitting={sendMessage.isPending}
            error={formError}
            labels={{
              label: tCommand("label"),
              placeholder: tCommand("placeholder"),
              helper: tCommand("helper"),
              submit: tCommand("submit"),
              submitting: tCommand("submitting"),
            }}
          />
        ) : null}

        {effectivePhase.kind === "clarification" ? (
          <ClarificationCard
            clarification={effectivePhase.clarification}
            pendingToken={pendingOptionToken}
            isSelecting={selectClarification.isPending}
            isCancelling={cancelClarification.isPending}
            onSelect={handleSelectOption}
            onCancel={handleCancelClarification}
            labels={{ cancel: tCommon("actions.cancel"), cancelling: tClarification("cancelling") }}
            headingRef={headingRef}
          />
        ) : null}

        {effectivePhase.kind === "draft" ? (
          <div ref={headingRef as RefObject<HTMLDivElement>} tabIndex={-1} className="max-w-xl space-y-6 outline-none">
            <DraftSummaryCard
              draft={effectivePhase.draft}
              intlLocale={intlLocale}
              labels={{
                income: tDraft("income"),
                expense: tDraft("expense"),
                wallet: tDraft("wallet"),
                category: tDraft("category"),
                merchant: tDraft("merchant"),
                date: tDraft("date"),
                notes: tDraft("notes"),
                expiresAt: tDraft("expiresAt"),
                statusValues,
              }}
            />

            <DraftActionBar
              onConfirm={handleConfirm}
              onCancel={handleCancelDraft}
              isConfirming={confirmDraft.isPending}
              isCancelling={cancelDraft.isPending}
              disabled={effectivePhase.draft.status !== "PENDING_CONFIRMATION"}
              labels={{
                confirm: tDraft("confirm"),
                confirming: tDraft("confirming"),
                cancel: tCommon("actions.cancel"),
                cancelling: tDraft("cancelling"),
              }}
            />
          </div>
        ) : null}

        {effectivePhase.kind === "completed" ? (
          <AssistantResultState
            renderedText={effectivePhase.renderedText}
            actionLabel={tCompletion("newInstruction")}
            onAction={resetFlow}
            headingRef={headingRef}
          />
        ) : null}
      </div>
    </div>
  );
}
