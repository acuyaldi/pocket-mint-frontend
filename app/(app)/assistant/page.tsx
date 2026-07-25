"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Inbox } from "lucide-react";

import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toaster";
import { INTL_LOCALE } from "@/i18n/config";
import { useConfirmAssistantDraft, useCancelAssistantDraft } from "@/src/features/assistant/hooks/useAssistantDraft";
import { parseAssistantDraftParam } from "@/src/features/assistant/utils/draftParam";
import { DraftSummaryCard } from "@/src/features/assistant/components/DraftSummaryCard";
import { DraftActionBar } from "@/src/features/assistant/components/DraftActionBar";
import type { AssistantFinancialDraftStatus } from "@/src/types/assistant";

/** Extracts the backend's safe error message from an Axios/API-boundary error, falling back to a generic one. */
function readErrorMessage(error: unknown, fallback: string): string {
  const backendMessage = (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
    ?.message;
  if (backendMessage) return backendMessage;
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

/**
 * Phase 23.2 — Pending Financial Draft review.
 *
 * There is no `GET /assistant/drafts/:draftId` endpoint on the backend, so
 * this page never fetches a draft itself; it reads one out of the `draft`
 * URL param (see `parseAssistantDraftParam`) and only calls the two
 * draft-mutation endpoints that do exist. Review only — no editing, no chat.
 */
export default function AssistantPage() {
  const t = useTranslations("assistant");
  const tDraft = useTranslations("assistant.draftReview");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];
  const router = useRouter();
  const searchParams = useSearchParams();

  const draft = useMemo(() => parseAssistantDraftParam(searchParams), [searchParams]);

  const confirmDraft = useConfirmAssistantDraft();
  const cancelDraft = useCancelAssistantDraft();

  const statusValues: Record<AssistantFinancialDraftStatus, string> = {
    PENDING_CONFIRMATION: tDraft("status.PENDING_CONFIRMATION"),
    COMMITTED: tDraft("status.COMMITTED"),
    CANCELLED: tDraft("status.CANCELLED"),
    EXPIRED: tDraft("status.EXPIRED"),
    FAILED: tDraft("status.FAILED"),
  };

  const handleConfirm = () => {
    if (!draft) return;
    confirmDraft.mutate(draft.draftId, {
      onSuccess: () => {
        toast(tDraft("confirmSuccess"), "success");
        router.replace("/assistant");
      },
      onError: (error) => toast(readErrorMessage(error, tDraft("genericError")), "error"),
    });
  };

  const handleCancel = () => {
    if (!draft) return;
    cancelDraft.mutate(draft.draftId, {
      onSuccess: () => {
        toast(tDraft("cancelSuccess"), "success");
        router.replace("/assistant");
      },
      onError: (error) => toast(readErrorMessage(error, tDraft("genericError")), "error"),
    });
  };

  return (
    <div className="space-y-8">
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />

      {draft ? (
        <div className="max-w-xl space-y-6">
          <DraftSummaryCard
            draft={draft}
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
            onCancel={handleCancel}
            isConfirming={confirmDraft.isPending}
            isCancelling={cancelDraft.isPending}
            disabled={draft.status !== "PENDING_CONFIRMATION"}
            labels={{
              confirm: tDraft("confirm"),
              confirming: tDraft("confirming"),
              cancel: tCommon("actions.cancel"),
              cancelling: tDraft("cancelling"),
            }}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <Inbox className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
          <p className="mt-3 text-sm font-medium text-foreground">{tDraft("empty.title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{tDraft("empty.body")}</p>
        </div>
      )}
    </div>
  );
}
