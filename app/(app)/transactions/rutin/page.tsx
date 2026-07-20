"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowLeft, ArrowUpRight, Pencil, Plus, Trash2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { INTL_LOCALE } from "@/i18n/config";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toaster";
import { useWallets } from "@/src/features/wallets/hooks/useWallets";
import { useCategories } from "@/src/features/categories/hooks/useCategories";
import {
  useCreateRecurringTransaction,
  useDeleteRecurringTransaction,
  useRecurringTransactions,
  useUpdateRecurringTransaction,
} from "@/src/features/recurring/hooks/useRecurringTransactions";
import type { RecurringTransaction } from "@/src/types/recurringTransaction";
import { RecurringTransactionModal, type RecurringTransactionFormValues } from "./components/RecurringTransactionModal";
import DeleteRecurringModal from "./components/DeleteRecurringModal";

function reminderValueKey(reminderOffsetDays: number): "reminderOnDueDate" | "reminder1Day" | "reminder3Days" | "reminder7Days" {
  if (reminderOffsetDays === 0) return "reminderOnDueDate";
  if (reminderOffsetDays === 1) return "reminder1Day";
  if (reminderOffsetDays === 3) return "reminder3Days";
  return "reminder7Days";
}

function formatDueDate(value: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

export default function RecurringTransactionsPage() {
  const t = useTranslations("recurringTransactions");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];

  const { data, isLoading, isError, isFetching, refetch } = useRecurringTransactions();
  const { data: walletsData } = useWallets();
  const { data: categoriesData } = useCategories();
  const createRecurring = useCreateRecurringTransaction();
  const updateRecurring = useUpdateRecurringTransaction();
  const deleteRecurring = useDeleteRecurringTransaction();

  const templates = useMemo(() => data ?? [], [data]);
  const wallets = useMemo(() => walletsData ?? [], [walletsData]);
  const categories = useMemo(() => categoriesData ?? [], [categoriesData]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<RecurringTransaction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RecurringTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = useCallback(
    async (dto: RecurringTransactionFormValues) => {
      setIsCreating(true);
      try {
        await createRecurring.mutateAsync(dto);
        setIsAddModalOpen(false);
      } finally {
        setIsCreating(false);
      }
    },
    [createRecurring],
  );

  const handleUpdate = useCallback(
    async (dto: RecurringTransactionFormValues) => {
      if (!editTarget) return;
      setIsUpdating(true);
      try {
        await updateRecurring.mutateAsync({ id: editTarget.id, ...dto });
        setEditTarget(null);
      } finally {
        setIsUpdating(false);
      }
    },
    [editTarget, updateRecurring],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRecurring.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast(message ?? t("toastDeleteFailed"), "error");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, deleteRecurring, t]);

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <Link
          href="/transactions"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          {t("backToTransactions")}
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {t("addTemplate")}
          </button>
        </div>
      </div>

      {isError ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card py-10 text-center">
          <p className="text-sm text-muted-foreground">{t("error")}</p>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-sm font-medium text-primary hover:underline disabled:opacity-50"
          >
            {t("retry")}
          </button>
        </div>
      ) : (
      <>
      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/60 bg-card p-6"
          >
            <div className="flex min-w-0 items-center gap-4">
              <div
                className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                  template.type === "INCOME" ? "bg-mint/10" : "bg-coral/10"
                }`}
              >
                {template.type === "INCOME" ? (
                  <ArrowUpRight className="size-5 text-mint" />
                ) : (
                  <ArrowDownLeft className="size-5 text-coral" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{template.name}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {template.wallet?.name ?? "—"} · {template.category?.name ?? t("noCategory")} ·{" "}
                  {template.isActive ? t("active") : t("paused")}
                </p>
                {template.isActive && template.nextDueDate ? (
                  <p className="mt-1 truncate text-xs font-medium text-amber">
                    {t("dueDate", { date: formatDueDate(template.nextDueDate, intlLocale) })}
                  </p>
                ) : null}
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {template.reminderEnabled && template.reminderOffsetDays !== null
                    ? t("reminderLine", { value: t(reminderValueKey(template.reminderOffsetDays)) })
                    : t("reminderNone")}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              {template.amountMode === "FIXED" && template.amount !== null ? (
                <p
                  className={`text-sm font-bold tabular-nums ${
                    template.type === "INCOME" ? "text-mint" : "text-coral"
                  }`}
                >
                  {template.type === "INCOME" ? "+" : "-"}
                  {formatCurrency(template.amount, intlLocale)}
                </p>
              ) : (
                <p className="text-sm font-semibold text-muted-foreground">{t("flexibleAmount")}</p>
              )}
              <button
                type="button"
                aria-label={t("edit")}
                onClick={() => setEditTarget(template)}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
              >
                <Pencil className="size-4" />
              </button>
              <button
                type="button"
                aria-label={t("delete")}
                onClick={() => setDeleteTarget(template)}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && !isLoading ? (
        <p className="rounded-xl border border-dashed border-border bg-card py-10 text-center text-sm text-muted-foreground">
          {t("empty")}
        </p>
      ) : null}
      {isLoading ? (
        <p className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
          {t("loading")}
        </p>
      ) : null}
      </>)}

      {/* Keyed on open state so each open starts from a clean/prefilled form (no stale fields from the previous open). */}
      <RecurringTransactionModal
        key={isAddModalOpen ? "create-open" : "create-closed"}
        mode="create"
        isOpen={isAddModalOpen}
        isSaving={isCreating}
        wallets={wallets}
        categories={categories}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreate}
      />
      <RecurringTransactionModal
        key={editTarget?.id ?? "edit-closed"}
        mode="edit"
        isOpen={editTarget !== null}
        isSaving={isUpdating}
        wallets={wallets}
        categories={categories}
        template={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
      />
      <DeleteRecurringModal
        template={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
