"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
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

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </label>
  );
}

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
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-full max-w-xl flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-card p-0 text-foreground shadow-xl"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border/50 bg-surface-low px-6 py-4">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">{t("title")}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {t("description")}
              </DialogDescription>
            </div>
            <button
              type="button"
              aria-label={t("closeAria")}
              onClick={handleClose}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <section className="space-y-2">
              <FieldLabel>{t("name")}</FieldLabel>
              <Input
                type="text"
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="h-12 border-border/70 bg-card px-3 text-sm"
              />
            </section>

            <section className="space-y-2">
              <FieldLabel>{t("targetAmount")}</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                  Rp
                </span>
                <input
                  value={targetAmount}
                  onChange={(event) => setTargetAmount(formatRupiahVisual(event.target.value))}
                  className="h-14 w-full rounded-lg border border-border/70 bg-card pl-12 pr-4 text-right text-2xl font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                  inputMode="numeric"
                  placeholder="0"
                  required
                  type="text"
                />
              </div>
            </section>

            {mode === "create" ? (
              <section className="space-y-2">
                <FieldLabel>{t("currentAmount")}</FieldLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-muted-foreground">
                    Rp
                  </span>
                  <input
                    value={currentAmount}
                    onChange={(event) => setCurrentAmount(formatRupiahVisual(event.target.value))}
                    className="h-12 w-full rounded-lg border border-border/70 bg-card pl-11 pr-4 text-right text-base font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                    inputMode="numeric"
                    placeholder="0"
                    type="text"
                  />
                </div>
              </section>
            ) : null}

            <section className="space-y-2">
              <FieldLabel>{t("targetDate")}</FieldLabel>
              <input
                type="date"
                value={targetDate}
                onChange={(event) => setTargetDate(event.target.value)}
                className="h-12 w-full rounded-lg border border-border/70 bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
              />
            </section>

            <section className="space-y-2">
              <FieldLabel>{t("notes")}</FieldLabel>
              <Input
                type="text"
                placeholder={t("notesPlaceholder")}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                className="h-12 border-border/70 bg-card px-3 text-sm"
              />
            </section>

            {error ? (
              <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>
            ) : null}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-border/50 bg-surface-low px-6 py-4 sm:flex-row">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving} className="h-11 flex-1 bg-card">
              {tCommon("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving} className="h-11 flex-1">
              {isSaving ? tCommon("actions.saving") : t("submit")}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
