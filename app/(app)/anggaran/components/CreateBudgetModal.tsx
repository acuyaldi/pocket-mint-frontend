"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FormField, FormErrorMessage } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/src/features/categories/hooks/useCategories";
import type { CreateBudgetDto } from "@/src/features/budgets/hooks/useBudgets";
import { mapBudgetErrorMessage } from "../lib/error-messages";

const formatRupiahVisual = (value: string): string => {
  const rawNumber = value.replace(/\D/g, "");
  return rawNumber ? new Intl.NumberFormat("id-ID").format(Number(rawNumber)) : "";
};

const parseRupiahToNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

interface CreateBudgetModalProps {
  isOpen: boolean;
  isSaving: boolean;
  /** Expense categories with no Budget row (active or archived) yet. */
  eligibleCategories: Category[];
  onClose: () => void;
  onSubmit: (data: CreateBudgetDto) => Promise<void>;
}

export function CreateBudgetModal({ isOpen, isSaving, eligibleCategories, onClose, onSubmit }: CreateBudgetModalProps) {
  const t = useTranslations("budgetModals.create");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("budgets.errors");

  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [error, setError] = useState("");

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const parsedAmount = parseRupiahToNumber(amount);
    if (!categoryId || parsedAmount <= 0) return;

    try {
      await onSubmit({ categoryId, amount: parsedAmount });
    } catch (err) {
      setError(mapBudgetErrorMessage(err, tErrors));
    }
  };

  return (
    <AppModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={isSaving}
      size="md"
      title={t("title")}
      description={t("description")}
      footer={
        <>
          <ModalCancelButton isPending={isSaving} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton
            form="create-budget-form"
            isPending={isSaving}
            pendingLabel={tCommon("actions.saving")}
            disabled={eligibleCategories.length === 0}
          >
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="create-budget-form" onSubmit={handleSubmit} className="space-y-6">
        {eligibleCategories.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-surface-low px-4 py-6 text-center text-sm text-muted-foreground">
            {t("noEligibleCategories")}
          </p>
        ) : (
          <FormField label={t("category")} htmlFor="create-budget-category" required>
            <Select
              value={categoryId ?? undefined}
              onValueChange={(value) => setCategoryId(value ?? null)}
              items={Object.fromEntries(eligibleCategories.map((c) => [c.id, c.name]))}
            >
              <SelectTrigger id="create-budget-category">
                <SelectValue placeholder={t("categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {eligibleCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}

        <FormField label={t("amount")} htmlFor="create-budget-amount" required>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
              Rp
            </span>
            <input
              id="create-budget-amount"
              value={amount}
              onChange={(event) => setAmount(formatRupiahVisual(event.target.value))}
              className="h-14 w-full rounded-lg border border-border/70 bg-card pl-12 pr-4 text-right text-2xl font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
              inputMode="numeric"
              placeholder="0"
              required
              type="text"
              disabled={eligibleCategories.length === 0}
            />
          </div>
        </FormField>

        <FormErrorMessage message={error} />
      </form>
    </AppModal>
  );
}
