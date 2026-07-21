"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FormField, FormErrorMessage } from "@/components/ui/form-field";
import { formatCurrency } from "@/lib/utils";
import { INTL_LOCALE } from "@/i18n/config";
import {
  getJakartaDateKey,
  usePayBill,
  type BillDto,
} from "@/src/features/bills/hooks/useBills";
import { ASSET_WALLET_TYPES, type Wallet } from "@/src/types/wallet";

export function PayBillModal({
  bill,
  wallets,
  onClose,
}: {
  bill: BillDto;
  wallets: Wallet[];
  onClose: () => void;
}) {
  const t = useTranslations("tagihan.payModal");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];
  const payBill = usePayBill();
  const [sourceWalletId, setSourceWalletId] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => getJakartaDateKey());
  const [error, setError] = useState("");
  const sourceWallets = wallets.filter((wallet) =>
    ASSET_WALLET_TYPES.includes(wallet.type),
  );

  const handleClose = () => {
    if (!payBill.isPending) onClose();
  };

  async function handlePay() {
    if (!sourceWalletId) return;
    setError("");
    try {
      await payBill.mutateAsync({
        billId: bill.id,
        sourceWalletId,
        amount: bill.amountPerTerm,
        date: paymentDate,
      });
      onClose();
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? t("genericError"));
    }
  }

  return (
    <AppModal
      open
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={payBill.isPending}
      size="lg"
      title={t("title")}
      description={bill.description || bill.walletName}
      footer={
        <>
          <ModalCancelButton isPending={payBill.isPending} onClick={handleClose}>
            {t("cancel")}
          </ModalCancelButton>
          <ModalSubmitButton
            type="button"
            isPending={payBill.isPending}
            pendingLabel={t("confirm")}
            disabled={!sourceWalletId}
            onClick={handlePay}
          >
            {t("confirm")}
          </ModalSubmitButton>
        </>
      }
    >
      <div className="rounded-lg bg-surface-low p-4">
        <p className="text-xs text-muted-foreground">{t("paymentAmount")}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
          {formatCurrency(bill.amountPerTerm, intlLocale)}
        </p>
      </div>

      <FormField label={t("paymentSource")}>
        <div className="grid gap-3 sm:grid-cols-2">
          {sourceWallets.map((wallet) => {
            const selected = sourceWalletId === wallet.id;
            const disabled = wallet.balance < bill.amountPerTerm;
            return (
              <button
                key={wallet.id}
                type="button"
                disabled={disabled}
                onClick={() => setSourceWalletId(wallet.id)}
                className={`rounded-lg border p-3 text-left disabled:cursor-not-allowed disabled:opacity-55 ${selected ? "border-mint bg-mint/10" : "border-border bg-card"}`}
              >
                <span className="flex items-center justify-between gap-2 text-sm font-semibold">
                  {wallet.name}
                  {selected ? <CheckCircle2 className="size-4 text-mint" /> : null}
                </span>
                <span className="mt-1 block text-sm tabular-nums text-muted-foreground">
                  {formatCurrency(wallet.balance, intlLocale)}
                </span>
                {disabled ? (
                  <span className="mt-1 block text-xs text-coral">{t("insufficientBalance")}</span>
                ) : null}
              </button>
            );
          })}
        </div>
        {sourceWallets.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            {t("noSourceWallets")}
          </p>
        ) : null}
      </FormField>

      <FormField label={t("paymentDate")} htmlFor="pay-bill-date">
        <Input
          type="date"
          value={paymentDate}
          onChange={(event) => setPaymentDate(event.target.value)}
          className="h-11 border-border bg-card px-3 text-sm"
        />
      </FormField>

      <FormErrorMessage message={error} />
    </AppModal>
  );
}
