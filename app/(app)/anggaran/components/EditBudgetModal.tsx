"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FormField, FormErrorMessage } from "@/components/ui/form-field";
import type { BudgetDto } from "@/src/types/budget";
import type { UpdateBudgetAmountDto } from "@/src/features/budgets/hooks/useBudgets";
import { mapBudgetErrorMessage } from "../lib/error-messages";

const formatRupiahVisual = (value: string): string => {
  const rawNumber = value.replace(/\D/g, "");
  return rawNumber ? new Intl.NumberFormat("id-ID").format(Number(rawNumber)) : "";
};

const parseRupiahToNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

interface EditBudgetModalProps {
  isOpen: boolean;
  isSaving: boolean;
  budget: BudgetDto | null;
  onClose: () => void;
  onSubmit: (data: UpdateBudgetAmountDto) => Promise<void>;
}

export function EditBudgetModal({ isOpen, isSaving, budget, onClose, onSubmit }: EditBudgetModalProps) {
  const t = useTranslations("budgetModals.edit");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("budgets.errors");

  // Remounted per open via a page-level `key`, so this always starts prefilled correctly.
  const [amount, setAmount] = useState(() => (budget ? formatRupiahVisual(String(budget.amount)) : ""));
  const [error, setError] = useState("");

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const parsedAmount = parseRupiahToNumber(amount);
    if (parsedAmount <= 0) return;

    try {
      await onSubmit({ amount: parsedAmount });
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
          <ModalSubmitButton form="edit-budget-form" isPending={isSaving} pendingLabel={tCommon("actions.saving")}>
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="edit-budget-form" onSubmit={handleSubmit} className="space-y-6">
        <FormField label={t("category")} htmlFor="edit-budget-category" description={t("categoryLocked")}>
          <input
            id="edit-budget-category"
            value={budget?.category.name ?? ""}
            readOnly
            disabled
            className="h-12 w-full rounded-lg border border-border/70 bg-surface-low px-4 text-sm text-muted-foreground"
          />
        </FormField>

        <FormField label={t("amount")} htmlFor="edit-budget-amount" required>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
              Rp
            </span>
            <input
              id="edit-budget-amount"
              value={amount}
              onChange={(event) => setAmount(formatRupiahVisual(event.target.value))}
              className="h-14 w-full rounded-lg border border-border/70 bg-card pl-12 pr-4 text-right text-2xl font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
              inputMode="numeric"
              placeholder="0"
              required
              type="text"
            />
          </div>
        </FormField>

        <FormErrorMessage message={error} />
      </form>
    </AppModal>
  );
}
