"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Notification } from "@/src/types/notification";

const formatRupiahVisual = (value: string): string => {
  const rawNumber = value.replace(/\D/g, "");
  return rawNumber ? new Intl.NumberFormat("id-ID").format(Number(rawNumber)) : "";
};

const parseRupiahToNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

interface ConfirmReminderModalProps {
  notification: Notification;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (amount: number) => Promise<void>;
}

export function ConfirmReminderModal({ notification, isSaving, onClose, onSubmit }: ConfirmReminderModalProps) {
  const t = useTranslations("notificationCenter.confirmModal");
  const tCommon = useTranslations("common");
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
    if (parsedAmount <= 0) return;

    try {
      await onSubmit(parsedAmount);
    } catch (err) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? t("errors.genericFailed"));
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex w-full max-w-sm flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-card p-0 text-foreground shadow-xl"
      >
        <form onSubmit={handleSubmit}>
          <header className="border-b border-border/50 bg-surface-low px-6 py-4">
            <DialogTitle className="text-xl font-semibold text-foreground">{t("title")}</DialogTitle>
            <DialogDescription className="mt-1 text-sm text-muted-foreground">
              {t("description", { name: notification.templateName ?? "" })}
            </DialogDescription>
          </header>

          <div className="space-y-2 p-6">
            <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t("amount")}
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                Rp
              </span>
              <input
                value={amount}
                onChange={(event) => setAmount(formatRupiahVisual(event.target.value))}
                className="h-14 w-full rounded-lg border border-border/70 bg-card pl-12 pr-4 text-right text-2xl font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                inputMode="numeric"
                placeholder="0"
                autoFocus
                required
                type="text"
              />
            </div>
            {error ? (
              <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>
            ) : null}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-border/50 bg-surface-low px-6 py-4 sm:flex-row">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving} className="h-11 flex-1 bg-card">
              {tCommon("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving || parseRupiahToNumber(amount) <= 0} className="h-11 flex-1 gap-2">
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              {t("submit")}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
