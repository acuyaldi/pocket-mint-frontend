"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FormField, FormErrorMessage } from "@/components/ui/form-field";
import type { SavingGoal } from "@/src/types/savingGoal";

const formatRupiahVisual = (value: string): string => {
  const rawNumber = value.replace(/\D/g, "");
  return rawNumber ? new Intl.NumberFormat("id-ID").format(Number(rawNumber)) : "";
};

const parseRupiahToNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

interface UpdateProgressModalProps {
  goal: SavingGoal | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (currentAmount: number) => Promise<void>;
}

export function UpdateProgressModal({ goal, isSaving, onClose, onSubmit }: UpdateProgressModalProps) {
  const t = useTranslations("savingGoalModals.progress");
  const tCommon = useTranslations("common");

  const [currentAmount, setCurrentAmount] = useState(() =>
    goal ? formatRupiahVisual(String(goal.currentAmount)) : "",
  );
  const [error, setError] = useState("");

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await onSubmit(parseRupiahToNumber(currentAmount));
    } catch (err) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? t("errors.genericSaveFailed"));
    }
  };

  return (
    <AppModal
      open={goal !== null}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={isSaving}
      size="sm"
      title={t("title")}
      description={goal ? goal.name : ""}
      footer={
        <>
          <ModalCancelButton isPending={isSaving} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton form="update-progress-form" isPending={isSaving} pendingLabel={tCommon("actions.saving")}>
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="update-progress-form" onSubmit={handleSubmit} className="space-y-4">
        <FormField label={t("currentAmount")} htmlFor="update-progress-amount" description={t("helper")}>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
              Rp
            </span>
            <input
              id="update-progress-amount"
              value={currentAmount}
              onChange={(event) => setCurrentAmount(formatRupiahVisual(event.target.value))}
              className="h-14 w-full rounded-lg border border-border/70 bg-card pl-12 pr-4 text-right text-2xl font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
              inputMode="numeric"
              placeholder="0"
              required
              type="text"
              autoFocus
            />
          </div>
        </FormField>

        <FormErrorMessage message={error} />
      </form>
    </AppModal>
  );
}
