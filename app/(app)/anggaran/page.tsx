"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Archive, Gauge, Pencil, Plus, RotateCcw } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { INTL_LOCALE } from "@/i18n/config";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toaster";
import { useCategories } from "@/src/features/categories/hooks/useCategories";
import {
  useArchiveBudget,
  useBudgets,
  useCreateBudget,
  useRestoreBudget,
  useUpdateBudget,
  type BudgetListStatus,
  type CreateBudgetDto,
  type UpdateBudgetAmountDto,
} from "@/src/features/budgets/hooks/useBudgets";
import type { BudgetDto } from "@/src/types/budget";
import { BudgetStatusPill } from "./components/BudgetStatusPill";
import { BudgetProgressBar } from "./components/BudgetProgressBar";
import { CreateBudgetModal } from "./components/CreateBudgetModal";
import { EditBudgetModal } from "./components/EditBudgetModal";
import { ArchiveBudgetModal } from "./components/ArchiveBudgetModal";
import { RestoreBudgetModal } from "./components/RestoreBudgetModal";

function BudgetCard({
  budget,
  intlLocale,
  onEdit,
  onArchive,
  onRestore,
}: {
  budget: BudgetDto;
  intlLocale: string;
  onEdit: (budget: BudgetDto) => void;
  onArchive: (budget: BudgetDto) => void;
  onRestore: (budget: BudgetDto) => void;
}) {
  const t = useTranslations("budgets");

  return (
    <article className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Gauge className="size-5 text-primary" />
          </div>
          <Link href={`/anggaran/${budget.id}`} className="min-w-0 hover:underline">
            <p className="truncate text-sm font-semibold text-foreground">{budget.category.name}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {t("limit")}: {formatCurrency(budget.amount, intlLocale)}
            </p>
          </Link>
        </div>
        <BudgetStatusPill status={budget.status} />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-xs text-muted-foreground">{t("spent")}</span>
          <strong className="text-lg tabular-nums text-foreground">{formatCurrency(budget.spent, intlLocale)}</strong>
        </div>
        <BudgetProgressBar percentUsed={budget.percentUsed} status={budget.status} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("limit")}: {formatCurrency(budget.amount, intlLocale)}</span>
          <span>{budget.percentUsed !== null ? `${budget.percentUsed.toFixed(0)}%` : "—"}</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {budget.remaining > 0
            ? `${t("remaining")}: ${formatCurrency(budget.remaining, intlLocale)}`
            : budget.remaining === 0
              ? t("fullyUsed")
              : `${t("exceededBy")}: ${formatCurrency(Math.abs(budget.remaining), intlLocale)}`}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
        <button
          type="button"
          onClick={() => onEdit(budget)}
          aria-label={t("editAria", { name: budget.category.name })}
          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-high"
        >
          <Pencil className="size-3.5" /> {t("edit")}
        </button>
        {budget.isArchived ? (
          <button
            type="button"
            onClick={() => onRestore(budget)}
            aria-label={t("restoreAria", { name: budget.category.name })}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-mint transition-colors hover:bg-mint/10"
          >
            <RotateCcw className="size-3.5" /> {t("restore")}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onArchive(budget)}
            aria-label={t("archiveAria", { name: budget.category.name })}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral"
          >
            <Archive className="size-3.5" /> {t("archive")}
          </button>
        )}
      </div>
    </article>
  );
}

export default function BudgetsPage() {
  const t = useTranslations("budgets");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];
  const currentMonthLabel = new Intl.DateTimeFormat(intlLocale, {
    timeZone: "Asia/Jakarta",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const [statusFilter, setStatusFilter] = useState<BudgetListStatus>("active");
  const { data: activeBudgets = [] } = useBudgets("active");
  const { data: archivedBudgets = [] } = useBudgets("archived");
  const { data: categories = [] } = useCategories();

  const { data: visibleBudgets = [], isLoading, isError } = useBudgets(statusFilter);

  const eligibleCategories = useMemo(() => {
    const takenIds = new Set([...activeBudgets, ...archivedBudgets].map((b) => b.category.id));
    return categories.filter((c) => c.type === "EXPENSE" && !takenIds.has(c.id));
  }, [categories, activeBudgets, archivedBudgets]);

  const createBudget = useCreateBudget();
  const updateBudget = useUpdateBudget();
  const archiveBudget = useArchiveBudget();
  const restoreBudget = useRestoreBudget();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<BudgetDto | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<BudgetDto | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<BudgetDto | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const handleCreate = useCallback(
    async (dto: CreateBudgetDto) => {
      setIsCreating(true);
      try {
        await createBudget.mutateAsync(dto);
        setIsCreateOpen(false);
        toast(t("toastCreated"));
      } finally {
        setIsCreating(false);
      }
    },
    [createBudget, t],
  );

  const handleUpdate = useCallback(
    async (dto: UpdateBudgetAmountDto) => {
      if (!editTarget) return;
      setIsUpdating(true);
      try {
        await updateBudget.mutateAsync({ id: editTarget.id, ...dto });
        setEditTarget(null);
        toast(t("toastUpdated"));
      } finally {
        setIsUpdating(false);
      }
    },
    [editTarget, updateBudget, t],
  );

  const handleArchiveConfirm = useCallback(async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      await archiveBudget.mutateAsync(archiveTarget.id);
      setArchiveTarget(null);
      toast(t("toastArchived"));
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast(message ?? t("toastArchiveFailed"), "error");
    } finally {
      setIsArchiving(false);
    }
  }, [archiveTarget, archiveBudget, t, setArchiveTarget]);

  const handleRestoreConfirm = useCallback(async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    try {
      await restoreBudget.mutateAsync(restoreTarget.id);
      setRestoreTarget(null);
      toast(t("toastRestored"));
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast(message ?? t("toastRestoreFailed"), "error");
    } finally {
      setIsRestoring(false);
    }
  }, [restoreTarget, restoreBudget, t, setRestoreTarget]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title={t("pageTitle")} description={t("pageDescription", { month: currentMonthLabel })} />
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          {t("addBudget")}
        </button>
      </div>

      <div role="tablist" aria-label={t("filterAria")} className="inline-flex rounded-lg border border-border/70 bg-card p-1">
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === "active"}
          onClick={() => setStatusFilter("active")}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            statusFilter === "active" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("filterActive")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={statusFilter === "archived"}
          onClick={() => setStatusFilter("archived")}
          className={`rounded-md px-4 py-2 text-sm font-semibold transition-colors ${
            statusFilter === "archived" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("filterArchived")}
        </button>
      </div>

      {isLoading ? (
        <p className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
          {t("loading")}
        </p>
      ) : isError ? (
        <p className="rounded-xl border border-coral/30 bg-coral/10 py-10 text-center text-sm text-coral">
          {t("loadError")}
        </p>
      ) : visibleBudgets.length === 0 ? (
        statusFilter === "active" ? (
          <div className="space-y-4 rounded-xl border border-dashed border-border bg-card py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
            <p className="text-xs text-muted-foreground">{t("emptyDescription")}</p>
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mx-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" />
              {t("addBudget")}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
            <p className="text-sm text-muted-foreground">{t("emptyArchived")}</p>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {visibleBudgets.map((budget) => (
            <BudgetCard
              key={budget.id}
              budget={budget}
              intlLocale={intlLocale}
              onEdit={setEditTarget}
              onArchive={setArchiveTarget}
              onRestore={setRestoreTarget}
            />
          ))}
        </div>
      )}

      <CreateBudgetModal
        key={isCreateOpen ? "create-open" : "create-closed"}
        isOpen={isCreateOpen}
        isSaving={isCreating}
        eligibleCategories={eligibleCategories}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <EditBudgetModal
        key={editTarget?.id ?? "edit-closed"}
        isOpen={editTarget !== null}
        isSaving={isUpdating}
        budget={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
      />
      <ArchiveBudgetModal
        budget={archiveTarget}
        isArchiving={isArchiving}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
      />
      <RestoreBudgetModal
        budget={restoreTarget}
        isRestoring={isRestoring}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestoreConfirm}
      />
    </div>
  );
}
