"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FormField, FormErrorMessage } from "@/components/ui/form-field";
import type { SavingGoal } from "@/src/types/savingGoal";
import type { CreateSavingGoalDto } from "@/src/features/savingGoals/hooks/useSavingGoals";

const formatRupiahVisual = (value: string): string => {
  const rawNumber = value.replace(/\D/g, "");
  return rawNumber ? new Intl.NumberFormat("id-ID").format(Number(rawNumber)) : "";
};

const parseRupiahToNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

export type SavingGoalFormValues = CreateSavingGoalDto;

interface SavingGoalModalProps {
  mode: "create" | "edit";
  isOpen: boolean;
  isSaving: boolean;
  /** Prefill values in edit mode; ignored in create mode. */
  goal?: SavingGoal | null;
  onClose: () => void;
  onSubmit: (data: SavingGoalFormValues) => Promise<void>;
}

export function SavingGoalModal({ mode, isOpen, isSaving, goal, onClose, onSubmit }: SavingGoalModalProps) {
  const t = useTranslations(`savingGoalModals.${mode}`);
  const tCommon = useTranslations("common");

  // Lazy initializers read `goal` only at mount. The parent remounts this
  // component (via a `key` tied to the open goal/state) every time it opens,
  // so this always starts from the right prefill without an effect + setState.
  const [name, setName] = useState(() => goal?.name ?? "");
  const [targetAmount, setTargetAmount] = useState(() =>
    goal?.targetAmount !== undefined ? formatRupiahVisual(String(goal.targetAmount)) : "",
  );
  const [currentAmount, setCurrentAmount] = useState(() =>
    goal?.currentAmount !== undefined ? formatRupiahVisual(String(goal.currentAmount)) : "",
  );
  const [targetDate, setTargetDate] = useState(() => goal?.targetDate?.slice(0, 10) ?? "");
  const [notes, setNotes] = useState(() => goal?.notes ?? "");
  const [error, setError] = useState("");

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const parsedTargetAmount = parseRupiahToNumber(targetAmount);
    if (!name.trim() || parsedTargetAmount <= 0) return;

    try {
      await onSubmit({
        name: name.trim(),
        targetAmount: parsedTargetAmount,
        currentAmount: mode === "create" ? parseRupiahToNumber(currentAmount) : undefined,
        targetDate: targetDate || undefined,
        notes: notes.trim() || undefined,
      });
    } catch (err) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? t("errors.genericSaveFailed"));
      return;
    }
  };

  return (
    <AppModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={isSaving}
      size="lg"
      title={t("title")}
      description={t("description")}
      footer={
        <>
          <ModalCancelButton isPending={isSaving} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton form="saving-goal-form" isPending={isSaving} pendingLabel={tCommon("actions.saving")}>
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="saving-goal-form" onSubmit={handleSubmit} className="space-y-6">
        <FormField label={t("name")} htmlFor="saving-goal-name">
          <Input
            type="text"
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="h-12 border-border/70 bg-card px-3 text-sm"
          />
        </FormField>

        <FormField label={t("targetAmount")} htmlFor="saving-goal-target-amount">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
              Rp
            </span>
            <input
              id="saving-goal-target-amount"
              value={targetAmount}
              onChange={(event) => setTargetAmount(formatRupiahVisual(event.target.value))}
              className="h-14 w-full rounded-lg border border-border/70 bg-card pl-12 pr-4 text-right text-2xl font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
              inputMode="numeric"
              placeholder="0"
              required
              type="text"
            />
          </div>
        </FormField>

        {mode === "create" ? (
          <FormField label={t("currentAmount")} htmlFor="saving-goal-current-amount">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                Rp
              </span>
              <input
                id="saving-goal-current-amount"
                value={currentAmount}
                onChange={(event) => setCurrentAmount(formatRupiahVisual(event.target.value))}
                className="h-12 w-full rounded-lg border border-border/70 bg-card pl-11 pr-4 text-right text-base font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                inputMode="numeric"
                placeholder="0"
                type="text"
              />
            </div>
          </FormField>
        ) : null}

        <FormField label={t("targetDate")} htmlFor="saving-goal-target-date">
          <input
            id="saving-goal-target-date"
            type="date"
            value={targetDate}
            onChange={(event) => setTargetDate(event.target.value)}
            className="h-12 w-full rounded-lg border border-border/70 bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
        </FormField>

        <FormField label={t("notes")} htmlFor="saving-goal-notes">
          <Input
            type="text"
            placeholder={t("notesPlaceholder")}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            className="h-12 border-border/70 bg-card px-3 text-sm"
          />
        </FormField>

        <FormErrorMessage message={error} />
      </form>
    </AppModal>
  );
}
