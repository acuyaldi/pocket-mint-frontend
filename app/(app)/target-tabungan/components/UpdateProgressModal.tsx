"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SavingGoal } from "@/src/types/savingGoal";

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
    <Dialog open={goal !== null} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex w-full max-w-md flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-card p-0 text-foreground shadow-xl"
      >
        <form onSubmit={handleSubmit}>
          <header className="flex items-center justify-between border-b border-border/50 bg-surface-low px-6 py-4">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">{t("title")}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {goal ? goal.name : ""}
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

          <div className="space-y-4 p-6">
            <section className="space-y-2">
              <FieldLabel>{t("currentAmount")}</FieldLabel>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                  Rp
                </span>
                <input
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
            </section>

            <p className="rounded-lg border border-dashed border-border bg-surface-high px-3 py-2 text-xs text-muted-foreground">
              {t("helper")}
            </p>

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
