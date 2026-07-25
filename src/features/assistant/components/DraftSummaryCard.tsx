import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { DraftMetadata, type DraftMetadataItem } from "./DraftMetadata";
import type { AssistantDraft, AssistantFinancialDraftStatus } from "@/src/types/assistant";

export interface DraftSummaryCardLabels {
  income: string;
  expense: string;
  wallet: string;
  category: string;
  merchant: string;
  date: string;
  notes: string;
  expiresAt: string;
  statusValues: Record<AssistantFinancialDraftStatus, string>;
}

interface DraftSummaryCardProps {
  draft: AssistantDraft;
  labels: DraftSummaryCardLabels;
  intlLocale?: string;
}

const STATUS_TONE: Record<AssistantFinancialDraftStatus, string> = {
  PENDING_CONFIRMATION: "bg-amber/10 text-amber",
  COMMITTED: "bg-mint/10 text-mint",
  CANCELLED: "bg-surface-high text-muted-foreground",
  EXPIRED: "bg-coral/10 text-destructive",
  FAILED: "bg-coral/10 text-destructive",
};

function formatDraftDate(value: string, intlLocale: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

/** Read-only review card for a Pending Financial Draft. Renders only fields `AssistantDraft` actually carries — editing belongs to a later phase. */
export function DraftSummaryCard({ draft, labels, intlLocale = "id-ID" }: DraftSummaryCardProps) {
  const { preview } = draft;
  const isIncome = preview.type === "INCOME";
  const amount = Number(preview.amount);

  const metadataItems: DraftMetadataItem[] = [
    preview.wallet ? { label: labels.wallet, value: preview.wallet } : null,
    { label: labels.category, value: preview.category },
    preview.merchant ? { label: labels.merchant, value: preview.merchant } : null,
    { label: labels.date, value: formatDraftDate(preview.date, intlLocale) },
    preview.description ? { label: labels.notes, value: preview.description } : null,
  ].filter((item): item is DraftMetadataItem => item !== null);

  return (
    <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {isIncome ? (
            <ArrowUpRight className="size-5 text-mint" aria-hidden="true" />
          ) : (
            <ArrowDownLeft className="size-5 text-foreground" aria-hidden="true" />
          )}
          <span className="text-sm font-medium text-muted-foreground">{isIncome ? labels.income : labels.expense}</span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_TONE[draft.status]}`}>
          {labels.statusValues[draft.status]}
        </span>
      </div>

      <p className={`mt-4 text-3xl font-semibold tabular-nums ${isIncome ? "text-mint" : "text-foreground"}`}>
        {isIncome ? "+" : "-"}
        {formatCurrency(amount, intlLocale)}
      </p>

      {draft.renderedText ? <p className="mt-3 text-sm text-muted-foreground">{draft.renderedText}</p> : null}

      <div className="mt-6 border-t border-border/50 pt-5">
        <DraftMetadata items={metadataItems} />
      </div>

      <p className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" aria-hidden="true" />
        {labels.expiresAt}: {formatDraftDate(draft.expiresAt, intlLocale)}
      </p>
    </article>
  );
}
