"use client";

import { ArrowDownLeft, ArrowUpRight, Clock } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useWallets } from "@/src/features/wallets/hooks/useWallets";
import { useCategories } from "@/src/features/categories/hooks/useCategories";
import { DraftMetadata, type DraftMetadataItem } from "./DraftMetadata";
import type { AssistantDraft, AssistantFinancialDraftStatus } from "@/src/types/assistant";
import type { DraftConfirmOverrides } from "@/src/features/assistant/api/assistantApi";

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
  edit: string;
  saveChanges: string;
  cancelEdit: string;
}

interface DraftSummaryCardProps {
  draft: AssistantDraft;
  labels: DraftSummaryCardLabels;
  intlLocale?: string;
  /** Whether the card is in edit mode. */
  isEditing: boolean;
  /** Current override values (transient React state). */
  overrides: DraftConfirmOverrides;
  onOverrideChange: (patch: DraftConfirmOverrides | ((prev: DraftConfirmOverrides) => DraftConfirmOverrides)) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}

const STATUS_TONE: Record<AssistantFinancialDraftStatus, string> = {
  PENDING_CONFIRMATION: "bg-amber/10 text-amber-strong",
  COMMITTED: "bg-mint/10 text-mint-strong",
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

function todayStr(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Transaction Review card — view mode (read-only) and edit mode (inline editing). */
export function DraftSummaryCard({
  draft,
  labels,
  intlLocale = "id-ID",
  isEditing,
  overrides,
  onOverrideChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: DraftSummaryCardProps) {
  const { preview } = draft;
  const isIncome = preview.type === "INCOME";
  const amount = Number(preview.amount);

  // For edit mode: load wallets and categories
  const { data: wallets = [] } = useWallets();
  const { data: categories = [] } = useCategories();

  const effectiveAmount = overrides.amount ?? amount;
  const effectiveWalletId = overrides.walletId ?? preview.walletId ?? "";
  const selectedWallet = wallets.find((w) => w.id === effectiveWalletId);
  const effectiveWalletLabel = selectedWallet?.name ?? preview.wallet ?? "";
  const effectiveDate = overrides.date ?? preview.date;
  const effectiveDescription = overrides.description !== undefined ? overrides.description : (preview.description ?? "");

  // Category: from user override, or from preview (display-only — backend will re-infer on confirm)
  const selectedCategory = categories.find((c) => c.id === overrides.categoryId);

  const metadataItems: DraftMetadataItem[] = [
    { label: labels.wallet, value: effectiveWalletLabel },
    { label: labels.category, value: selectedCategory?.name ?? preview.category },
    preview.merchant ? { label: labels.merchant, value: preview.merchant } : null,
    { label: labels.date, value: formatDraftDate(effectiveDate, intlLocale) },
    effectiveDescription ? { label: labels.notes, value: effectiveDescription } : null,
  ].filter((item): item is DraftMetadataItem => item !== null);

  return (
    <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      {/* Header row: type icon + type label + status badge */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          {isIncome ? (
            <ArrowUpRight className="size-5 text-mint" aria-hidden="true" />
          ) : (
            <ArrowDownLeft className="size-5 text-foreground" aria-hidden="true" />
          )}
          <span className="text-sm font-medium text-muted-foreground">
            {isIncome ? labels.income : labels.expense}
          </span>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${STATUS_TONE[draft.status]}`}>
          {labels.statusValues[draft.status]}
        </span>
      </div>

      {/* Amount */}
      {isEditing ? (
        <div className="mt-4">
          <Input
            type="number"
            inputMode="decimal"
            value={effectiveAmount}
            onChange={(e) =>
              onOverrideChange({ ...overrides, amount: Number(e.target.value) || undefined } as DraftConfirmOverrides)
            }
            className="h-12 text-3xl font-semibold tabular-nums"
            aria-label={isIncome ? labels.income : labels.expense}
          />
        </div>
      ) : (
        <p className={`mt-4 text-3xl font-semibold tabular-nums ${isIncome ? "text-mint-strong" : "text-foreground"}`}>
          {isIncome ? "+" : "-"}
          {formatCurrency(effectiveAmount, intlLocale)}
        </p>
      )}

      {/* Metadata fields */}
      <div className="mt-6 border-t border-border/50 pt-5">
        {isEditing ? (
          <div className="space-y-4">
            {/* Wallet dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{labels.wallet}</label>
              <Select
                value={effectiveWalletId}
                onValueChange={(id) =>
                  onOverrideChange({ ...overrides, walletId: id } as DraftConfirmOverrides)
                }
              >

                <SelectTrigger className="h-10 w-full" aria-label={labels.wallet}>
                  <SelectValue placeholder={labels.wallet} />
                </SelectTrigger>
                <SelectContent>
                  {wallets.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Category dropdown */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{labels.category}</label>
              <Select
                value={overrides.categoryId ?? ""}
                onValueChange={(id) =>
                  onOverrideChange({ ...overrides, categoryId: id } as DraftConfirmOverrides)
                }
              >
                <SelectTrigger className="h-10 w-full" aria-label={labels.category}>
                  <SelectValue placeholder={selectedCategory?.name ?? preview.category} />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((c) => c.type === preview.type)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date radio group: Hari ini / Kemarin / Pilih tanggal */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{labels.date}</label>
              <div className="flex flex-wrap gap-3">
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="draftDate"
                    value="today"
                    checked={effectiveDate.slice(0, 10) === todayStr()}
                    onChange={() =>
                      onOverrideChange({ ...overrides, date: todayStr() } as DraftConfirmOverrides)
                    }
                    className="size-4"
                  />
                  Hari ini
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="draftDate"
                    value="yesterday"
                    checked={effectiveDate.slice(0, 10) === yesterdayStr()}
                    onChange={() =>
                      onOverrideChange({ ...overrides, date: yesterdayStr() } as DraftConfirmOverrides)
                    }
                    className="size-4"
                  />
                  Kemarin
                </label>
                <label className="flex items-center gap-1.5 text-sm">
                  <input
                    type="radio"
                    name="draftDate"
                    value="custom"
                    checked={
                      effectiveDate.slice(0, 10) !== todayStr() &&
                      effectiveDate.slice(0, 10) !== yesterdayStr()
                    }
                    onChange={() => {}} // handled by the date input below
                    className="size-4"
                  />
                  <input
                    type="date"
                    value={effectiveDate.slice(0, 10)}
                    onChange={(e) =>
                      onOverrideChange({ ...overrides, date: e.target.value } as DraftConfirmOverrides)
                    }
                    className="rounded border border-border px-2 py-1 text-sm"
                    aria-label={labels.date}
                  />
                </label>
              </div>
            </div>

            {/* Description input */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{labels.notes}</label>
              <Input
                value={effectiveDescription}
                onChange={(e) =>
                  onOverrideChange({ ...overrides, description: e.target.value } as DraftConfirmOverrides)
                }
                placeholder={labels.notes}
                className="h-10"
              />
            </div>
          </div>
        ) : (
          <DraftMetadata items={metadataItems} />
        )}
      </div>

      {/* Expiry */}
      <p className="mt-5 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Clock className="size-3.5" aria-hidden="true" />
        {labels.expiresAt}: {formatDraftDate(draft.expiresAt, intlLocale)}
      </p>

      {/* Action buttons — placed inside the card */}
      <div className="mt-5 flex flex-col-reverse gap-3 border-t border-border/50 pt-5 sm:flex-row">
        {isEditing ? (
          <>
            <Button type="button" variant="outline" onClick={onCancelEdit} className="h-11 flex-1 gap-2 bg-card">
              {labels.cancelEdit}
            </Button>
            <Button type="button" onClick={onSaveEdit} className="h-11 flex-1 gap-2">
              {labels.saveChanges}
            </Button>
          </>
        ) : (
          <Button type="button" variant="outline" onClick={onStartEdit} className="h-11 flex-1 gap-2 bg-card">
            {labels.edit}
          </Button>
        )}
      </div>
    </article>
  );
}
