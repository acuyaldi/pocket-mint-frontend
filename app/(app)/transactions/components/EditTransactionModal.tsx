"use client";

import { useState, useCallback, useEffect, FormEvent } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FormField, FormErrorMessage } from "@/components/ui/form-field";
import { Transaction } from "@/src/types/transaction";
import { formatRupiah } from "./constants";

interface EditTransactionModalProps {
  tx: Transaction | null;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (data: {
    id: string;
    description: string;
    amount: number;
    type: "EXPENSE" | "INCOME";
    date?: string;
  }) => Promise<void>;
}

export function EditTransactionModal({ tx, isSaving, onClose, onSubmit }: EditTransactionModalProps) {
  const t = useTranslations("transactionModals.edit");
  const tCommon = useTranslations("common");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  // Re-hydrate every editable field whenever a (different) transaction is
  // opened, clearing stale error/pending UI from a previous edit. This is a
  // genuine synchronization with an external prop change, not a derived
  // value, so it belongs in an effect rather than during render.
  useEffect(() => {
    if (!tx) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing form fields from the `tx` prop is the intended use of this effect, not incidental render-time state.
    setDescription(tx.description ?? "");
    setAmount(formatRupiah(String(tx.amount)));
    setType(tx.type === "INCOME" ? "INCOME" : "EXPENSE");
    setDate(tx.date ? tx.date.slice(0, 10) : "");
    setError("");
  }, [tx]);

  const handleClose = useCallback(() => {
    if (!isSaving) onClose();
  }, [isSaving, onClose]);

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    setAmount(formatRupiah(raw));
  }, []);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    if (!tx) return;
    const rawAmount = amount.replace(/\./g, "");
    const parsedAmount = Number(rawAmount);
    if (!description.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;
    setError("");
    try {
      await onSubmit({
        id: tx.id,
        description: description.trim(),
        amount: parsedAmount,
        type,
        date: date ? new Date(date).toISOString() : undefined,
      });
    } catch (err) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? t("genericSaveFailed"));
    }
  }, [tx, amount, description, type, date, onSubmit, t]);

  return (
    <AppModal
      open={!!tx}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={isSaving}
      size="sm"
      title={t("title")}
      description={t("subtitle")}
      footer={
        <>
          <ModalCancelButton isPending={isSaving} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton form="edit-transaction-form" isPending={isSaving} pendingLabel={t("saving")}>
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="edit-transaction-form" onSubmit={handleSubmit} className="space-y-5">
        <FormField label={t("description")} htmlFor="edit-tx-description">
          <Input
            type="text"
            placeholder={t("descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="h-12 border-border/70 bg-card px-3 text-sm"
          />
        </FormField>

        <FormField label={t("amount")} htmlFor="edit-tx-amount">
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 select-none text-sm text-muted-foreground">
              Rp
            </span>
            <Input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={amount}
              onChange={handleAmountChange}
              required
              className="h-12 border-border/70 bg-card pl-10 pr-4 text-sm"
            />
          </div>
        </FormField>

        <FormField label={t("type")}>
          <div className="flex gap-2">
            {(["EXPENSE", "INCOME"] as const).map((typeOption) => {
              const active = type === typeOption;
              const label = typeOption === "EXPENSE" ? t("typeExpense") : t("typeIncome");
              const Icon = typeOption === "EXPENSE" ? TrendingDown : TrendingUp;
              return (
                <button
                  key={typeOption}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setType(typeOption)}
                  className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-all ${
                    active
                      ? typeOption === "EXPENSE"
                        ? "border-coral/40 bg-coral/10 text-coral"
                        : "border-mint/40 bg-mint/10 text-primary"
                      : "border-border/70 bg-card text-muted-foreground hover:bg-surface-low"
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              );
            })}
          </div>
        </FormField>

        <FormField label={t("date")} htmlFor="edit-tx-date">
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-12 border-border/70 bg-card px-3 text-sm"
          />
        </FormField>

        <FormErrorMessage message={error} />
      </form>
    </AppModal>
  );
}
