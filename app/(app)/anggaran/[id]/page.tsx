"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Archive, ArrowLeft, Pencil, ReceiptText, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { INTL_LOCALE } from "@/i18n/config";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toaster";
import { useTransactions } from "@/src/features/transactions/hooks/useTransactions";
import {
  useArchiveBudget,
  useBudget,
  useRestoreBudget,
  useUpdateBudget,
  type UpdateBudgetAmountDto,
} from "@/src/features/budgets/hooks/useBudgets";
import { BudgetStatusPill } from "../components/BudgetStatusPill";
import { BudgetProgressBar } from "../components/BudgetProgressBar";
import { EditBudgetModal } from "../components/EditBudgetModal";
import { ArchiveBudgetModal } from "../components/ArchiveBudgetModal";
import { RestoreBudgetModal } from "../components/RestoreBudgetModal";

export default function BudgetDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useTranslations("budgets");
  const tDetail = useTranslations("budgetDetail");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];

  const { data: budget, isLoading, isError } = useBudget(params.id);
  // Current-month-only, same as the Budget's own period (Journey/contract: the
  // contributing list is the existing Transaction List filtered client-side to
  // this Budget's category — never a second/duplicated data source).
  const { data: transactions = [] } = useTransactions();

  const contributingTransactions = useMemo(() => {
    if (!budget) return [];
    return transactions
      .filter((tx) => tx.type === "EXPENSE" && tx.categoryId === budget.category.id)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [transactions, budget]);

  const updateBudget = useUpdateBudget();
  const archiveBudget = useArchiveBudget();
  const restoreBudget = useRestoreBudget();

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoreOpen, setIsRestoreOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleUpdate = useCallback(
    async (dto: UpdateBudgetAmountDto) => {
      if (!budget) return;
      setIsUpdating(true);
      try {
        await updateBudget.mutateAsync({ id: budget.id, ...dto });
        setIsEditOpen(false);
        toast(t("toastUpdated"));
      } finally {
        setIsUpdating(false);
      }
    },
    [budget, updateBudget, t],
  );

  const handleArchiveConfirm = useCallback(async () => {
    if (!budget) return;
    setIsArchiving(true);
    try {
      await archiveBudget.mutateAsync(budget.id);
      setIsArchiveOpen(false);
      toast(t("toastArchived"));
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast(message ?? t("toastArchiveFailed"), "error");
    } finally {
      setIsArchiving(false);
    }
  }, [budget, archiveBudget, t]);

  const handleRestoreConfirm = useCallback(async () => {
    if (!budget) return;
    setIsRestoring(true);
    try {
      await restoreBudget.mutateAsync(budget.id);
      setIsRestoreOpen(false);
      toast(t("toastRestored"));
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast(message ?? t("toastRestoreFailed"), "error");
    } finally {
      setIsRestoring(false);
    }
  }, [budget, restoreBudget, t]);

  if (isLoading) {
    return (
      <p className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
        {t("loading")}
      </p>
    );
  }

  if (isError || !budget) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl border border-coral/30 bg-coral/10 py-10 text-center text-sm text-coral">
          {tDetail("loadError")}
        </p>
        <Link href="/anggaran" className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" /> {tDetail("backToList")}
        </Link>
      </div>
    );
  }

  const periodLabel = new Intl.DateTimeFormat(intlLocale, {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const periodRange = `${periodLabel.format(new Date(budget.periodStart))} – ${periodLabel.format(new Date(new Date(budget.periodEnd).getTime() - 1))}`;

  return (
    <div className="space-y-8">
      <button
        type="button"
        onClick={() => router.push("/anggaran")}
        className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> {tDetail("backToList")}
      </button>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title={budget.category.name} description={periodRange} />
        <BudgetStatusPill status={budget.status} />
      </div>

      {budget.isArchived ? (
        <p className="rounded-lg border border-border/70 bg-surface-low px-4 py-3 text-sm text-muted-foreground">
          {tDetail("archivedNotice")}
        </p>
      ) : null}

      <section className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">{t("limit")}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{formatCurrency(budget.amount, intlLocale)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t("spent")}</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-foreground">{formatCurrency(budget.spent, intlLocale)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{budget.remaining < 0 ? t("exceededBy") : t("remaining")}</p>
            <p className={`mt-1 text-lg font-semibold tabular-nums ${budget.remaining < 0 ? "text-coral" : "text-foreground"}`}>
              {formatCurrency(Math.abs(budget.remaining), intlLocale)}
            </p>
          </div>
        </div>

        <BudgetProgressBar percentUsed={budget.percentUsed} status={budget.status} />
        <p className="text-xs text-muted-foreground">
          {budget.percentUsed !== null ? tDetail("percentUsed", { percent: budget.percentUsed.toFixed(1) }) : "—"}
        </p>

        <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
          <button
            type="button"
            onClick={() => setIsEditOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-high"
          >
            <Pencil className="size-3.5" /> {t("edit")}
          </button>
          {budget.isArchived ? (
            <button
              type="button"
              onClick={() => setIsRestoreOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-mint transition-colors hover:bg-mint/10"
            >
              <RotateCcw className="size-3.5" /> {t("restore")}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIsArchiveOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral"
            >
              <Archive className="size-3.5" /> {t("archive")}
            </button>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{tDetail("contributingTitle")}</h2>
        {contributingTransactions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card py-10 text-center">
            <ReceiptText className="mx-auto size-6 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">{tDetail("contributingEmpty")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60 rounded-xl border border-border/60 bg-card">
            {contributingTransactions.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{tx.description || budget.category.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Intl.DateTimeFormat(intlLocale, { timeZone: "Asia/Jakarta", day: "numeric", month: "short" }).format(new Date(tx.date))}
                  </p>
                </div>
                <strong className="shrink-0 tabular-nums text-foreground">{formatCurrency(tx.amount, intlLocale)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <EditBudgetModal
        key={isEditOpen ? "edit-open" : "edit-closed"}
        isOpen={isEditOpen}
        isSaving={isUpdating}
        budget={budget}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleUpdate}
      />
      <ArchiveBudgetModal
        budget={isArchiveOpen ? budget : null}
        isArchiving={isArchiving}
        onClose={() => setIsArchiveOpen(false)}
        onConfirm={handleArchiveConfirm}
      />
      <RestoreBudgetModal
        budget={isRestoreOpen ? budget : null}
        isRestoring={isRestoring}
        onClose={() => setIsRestoreOpen(false)}
        onConfirm={handleRestoreConfirm}
      />
    </div>
  );
}
