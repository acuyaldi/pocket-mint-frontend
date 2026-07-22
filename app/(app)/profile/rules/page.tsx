"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toaster";
import { useCategories } from "@/src/features/categories/hooks/useCategories";
import {
  useCreateRule,
  useDeleteRule,
  useReorderRules,
  useRules,
  useUpdateRule,
  type CreateRuleDto,
  type UpdateRuleDto,
} from "@/src/features/rules/hooks/useRules";
import type { RuleDto } from "@/src/types/rule";
import { CreateRuleModal } from "./components/CreateRuleModal";
import { EditRuleModal } from "./components/EditRuleModal";
import { DeleteRuleModal } from "./components/DeleteRuleModal";
import { RuleRow } from "./components/RuleRow";
import { describeRuleCondition } from "./lib/describe-condition";

export default function RulesPage() {
  const t = useTranslations("rules");
  const tSummary = useTranslations("ruleConditionSummary");

  const { data: rules = [], isLoading, isError } = useRules();
  const { data: categories = [] } = useCategories();
  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const createRule = useCreateRule();
  const updateRule = useUpdateRule();
  const deleteRule = useDeleteRule();
  const reorderRules = useReorderRules();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<RuleDto | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RuleDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCreate = useCallback(
    async (dto: CreateRuleDto) => {
      setIsCreating(true);
      try {
        await createRule.mutateAsync(dto);
        setIsCreateOpen(false);
        toast(t("toastCreated"));
      } finally {
        setIsCreating(false);
      }
    },
    [createRule, t],
  );

  const handleUpdate = useCallback(
    async (dto: UpdateRuleDto) => {
      if (!editTarget) return;
      setIsUpdating(true);
      try {
        await updateRule.mutateAsync({ id: editTarget.id, ...dto });
        setEditTarget(null);
        toast(t("toastUpdated"));
      } finally {
        setIsUpdating(false);
      }
    },
    [editTarget, updateRule, t],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRule.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
      toast(t("toastDeleted"));
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast(message ?? t("toastDeleteFailed"), "error");
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, deleteRule, t]);

  const handleToggleEnabled = useCallback(
    async (rule: RuleDto, enabled: boolean) => {
      try {
        await updateRule.mutateAsync({ id: rule.id, enabled });
      } catch {
        toast(t("toastToggleFailed"), "error");
      }
    },
    [updateRule, t],
  );

  const move = useCallback(
    (rule: RuleDto, direction: -1 | 1) => {
      const index = rules.findIndex((r) => r.id === rule.id);
      const targetIndex = index + direction;
      if (index < 0 || targetIndex < 0 || targetIndex >= rules.length) return;

      const reordered = [...rules];
      [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
      reorderRules.mutate(reordered.map((r) => r.id));
    },
    [rules, reorderRules],
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <PageHeader title={t("pageTitle")} description={t("pageDescription")} />
        <button
          type="button"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
        >
          <Plus className="size-4" />
          {t("addRule")}
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
      ) : rules.length === 0 ? (
        <div className="space-y-4 rounded-xl border border-dashed border-border bg-card py-12 text-center">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
          <p className="text-xs text-muted-foreground">{t("emptyDescription")}</p>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="mx-auto inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            {t("addRule")}
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {rules.map((rule, index) => (
            <RuleRow
              key={rule.id}
              rule={rule}
              categoryName={categoryNameById.get(rule.categoryId) ?? "—"}
              isFirst={index === 0}
              isLast={index === rules.length - 1}
              labels={{
                edit: t("edit"),
                delete: t("delete"),
                editAria: t("editAria", { name: rule.name }),
                deleteAria: t("deleteAria", { name: rule.name }),
                enableAria: t("enableAria", { name: rule.name }),
                moveUpAria: t("moveUpAria", { name: rule.name }),
                moveDownAria: t("moveDownAria", { name: rule.name }),
                disabledBadge: t("disabledBadge"),
                conditionSummary: describeRuleCondition(rule, tSummary),
              }}
              onEdit={setEditTarget}
              onDelete={setDeleteTarget}
              onToggleEnabled={handleToggleEnabled}
              onMoveUp={(r) => move(r, -1)}
              onMoveDown={(r) => move(r, 1)}
            />
          ))}
        </ul>
      )}

      <CreateRuleModal
        key={isCreateOpen ? "create-open" : "create-closed"}
        isOpen={isCreateOpen}
        isSaving={isCreating}
        categories={categories}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />
      <EditRuleModal
        key={editTarget?.id ?? "edit-closed"}
        isOpen={editTarget !== null}
        isSaving={isUpdating}
        rule={editTarget}
        categories={categories}
        onClose={() => setEditTarget(null)}
        onSubmit={handleUpdate}
      />
      <DeleteRuleModal
        rule={deleteTarget}
        isDeleting={isDeleting}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
