"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Archive, Pencil, PiggyBank, Plus, TrendingUp } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { INTL_LOCALE } from "@/i18n/config";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toaster";
import {
  useArchiveSavingGoal,
  useCreateSavingGoal,
  useSavingGoals,
  useUpdateSavingGoal,
  useUpdateSavingGoalProgress,
} from "@/src/features/savingGoals/hooks/useSavingGoals";
import type { SavingGoal } from "@/src/types/savingGoal";
import { SavingGoalModal, type SavingGoalFormValues } from "./components/SavingGoalModal";
import { UpdateProgressModal } from "./components/UpdateProgressModal";
import ArchiveSavingGoalModal from "./components/ArchiveSavingGoalModal";

function formatTargetDate(value: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00Z`));
}

function SavingGoalCard({
  goal,
  intlLocale,
  onEdit,
  onUpdateProgress,
  onArchive,
}: {
  goal: SavingGoal;
  intlLocale: string;
  onEdit: (goal: SavingGoal) => void;
  onUpdateProgress: (goal: SavingGoal) => void;
  onArchive: (goal: SavingGoal) => void;
}) {
  const t = useTranslations("savingGoals");
  const isArchived = goal.status === "ARCHIVED";
  const isCompleted = goal.status === "COMPLETED";

  return (
    <article className="space-y-4 rounded-xl border border-border/60 bg-card p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint/10">
            <PiggyBank className="size-5 text-mint" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{goal.name}</p>
            {goal.targetDate ? (
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {t("targetDate")}: {formatTargetDate(goal.targetDate, intlLocale)}
              </p>
            ) : (
              <p className="mt-1 truncate text-xs text-muted-foreground">{t("noTargetDate")}</p>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
            isCompleted
              ? "bg-mint/10 text-mint"
              : isArchived
                ? "bg-surface-high text-muted-foreground"
                : "bg-primary/10 text-primary"
          }`}
        >
          {isCompleted ? t("statusCompleted") : isArchived ? t("statusArchived") : t("statusActive")}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-xs text-muted-foreground">{t("collected")}</span>
          <strong className="text-lg tabular-nums text-foreground">{formatCurrency(goal.currentAmount, intlLocale)}</strong>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-surface-high">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${goal.progressPercentage}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t("target")}: {formatCurrency(goal.targetAmount, intlLocale)}</span>
          <span>{goal.progressPercentage.toFixed(0)}%</span>
        </div>
        <div className="text-xs text-muted-foreground">
          {t("remaining")}: {formatCurrency(goal.remainingAmount, intlLocale)}
        </div>
      </div>

      {!isArchived ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-4">
          <button
            type="button"
            onClick={() => onUpdateProgress(goal)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-high"
          >
            <TrendingUp className="size-3.5" /> {t("updateProgress")}
          </button>
          <button
            type="button"
            onClick={() => onEdit(goal)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-high"
          >
            <Pencil className="size-3.5" /> {t("edit")}
          </button>
          <button
            type="button"
            onClick={() => onArchive(goal)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border/70 px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-coral/10 hover:text-coral"
          >
            <Archive className="size-3.5" /> {t("archive")}
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function SavingGoalsPage() {
  const t = useTranslations("savingGoals");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];

  const { data, isLoading, isError } = useSavingGoals();
  const createGoal = useCreateSavingGoal();
  const updateGoal = useUpdateSavingGoal();
  const updateProgress = useUpdateSavingGoalProgress();
  const archiveGoal = useArchiveSavingGoal();

  const goals = useMemo(() => data ?? [], [data]);
  const activeGoals = useMemo(() => goals.filter((g) => g.status === "ACTIVE"), [goals]);
  const completedGoals = useMemo(() => goals.filter((g) => g.status === "COMPLETED"), [goals]);
  const archivedGoals = useMemo(() => goals.filter((g) => g.status === "ARCHIVED"), [goals]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<SavingGoal | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [progressTarget, setProgressTarget] = useState<SavingGoal | null>(null);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<SavingGoal | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  const handleCreate = useCallback(
    async (dto: SavingGoalFormValues) => {
      setIsCreating(true);
      try {
        await createGoal.mutateAsync(dto);
        setIsAddModalOpen(false);
      } finally {
        setIsCreating(false);
      }
    },
    [createGoal],
  );

  const handleUpdate = useCallback(
    async (dto: SavingGoalFormValues) => {
      if (!editTarget) return;
      setIsUpdating(true);
      try {
        await updateGoal.mutateAsync({ id: editTarget.id, ...dto });
        setEditTarget(null);
      } finally {
        setIsUpdating(false);
      }
    },
    [editTarget, updateGoal],
  );

  const handleUpdateProgress = useCallback(
    async (currentAmount: number) => {
      if (!progressTarget) return;
      setIsUpdatingProgress(true);
      try {
        await updateProgress.mutateAsync({ id: progressTarget.id, currentAmount });
        setProgressTarget(null);
      } finally {
        setIsUpdatingProgress(false);
      }
    },
    [progressTarget, updateProgress],
  );

  const handleArchiveConfirm = useCallback(async () => {
    if (!archiveTarget) return;
    setIsArchiving(true);
    try {
      await archiveGoal.mutateAsync(archiveTarget.id);
      setArchiveTarget(null);
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast(message ?? t("toastArchiveFailed"), "error");
    } finally {
      setIsArchiving(false);
    }
  }, [archiveTarget, archiveGoal, t]);

  const sections = [
    { key: "active", title: t("sectionActive"), items: activeGoals },
    { key: "completed", title: t("sectionCompleted"), items: completedGoals },
    { key: "archived", title: t("sectionArchived"), items: archivedGoals },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          {t("addGoal")}
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
      ) : goals.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <p className="text-xs text-muted-foreground">{t("emptyDescription")}</p>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="mx-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {t("addGoal")}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {sections
            .filter((section) => section.items.length > 0)
            .map((section) => (
              <section key={section.key} className="space-y-4">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  {section.title}
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {section.items.map((goal) => (
                    <SavingGoalCard
                      key={goal.id}
                      goal={goal}
                      intlLocale={intlLocale}
                      onEdit={setEditTarget}
                      onUpdateProgress={setProgressTarget}
                      onArchive={setArchiveTarget}
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}

      {/* Keyed on open state so each open starts from a clean/prefilled form (no stale fields from the previous open). */}
      <SavingGoalModal
        key={isAddModalOpen ? "create-open" : "create-closed"}
        mode="create"
        isOpen={isAddModalOpen}
        isSaving={isCreating}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleCreate}
      />
      <SavingGoalModal
        key={editTarget?.id ?? "edit-closed"}
        mode="edit"
        isOpen={editTarget !== null}
        isSaving={isUpdating}
        goal={editTarget}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
      />
      <UpdateProgressModal
        key={progressTarget?.id ?? "progress-closed"}
        goal={progressTarget}
        isSaving={isUpdatingProgress}
        onClose={() => setProgressTarget(null)}
        onSubmit={handleUpdateProgress}
      />
      <ArchiveSavingGoalModal
        goal={archiveTarget}
        isArchiving={isArchiving}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
}
