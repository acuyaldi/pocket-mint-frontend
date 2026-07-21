"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { Input } from "@/components/ui/input";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FormField, FormErrorMessage } from "@/components/ui/form-field";
import { toast } from "@/components/ui/toaster";
import { useUpdateWallet } from "@/src/features/wallets/hooks/useWallets";
import { isCreditWallet, type Wallet } from "@/src/types/wallet";

export default function EditWalletModal({
  wallet,
  onClose,
}: {
  wallet: Wallet | null;
  onClose: () => void;
}) {
  if (!wallet) return null;
  return <EditWalletForm key={wallet.id} wallet={wallet} onClose={onClose} />;
}

function EditWalletForm({ wallet, onClose }: { wallet: Wallet; onClose: () => void }) {
  const t = useTranslations("walletModals.edit");
  const tCommon = useTranslations("common");
  const updateWallet = useUpdateWallet();
  const isCredit = isCreditWallet(wallet.type);
  // Hanya kartu kredit yang punya siklus cutoff/jatuh tempo; paylater otomatis 30 hari per transaksi
  const hasBillingCycle = wallet.type === "CREDIT_CARD";
  const [name, setName] = useState(wallet.name);
  const [creditLimit, setCreditLimit] = useState(String(wallet.creditLimit ?? 0));
  const [cutoffDay, setCutoffDay] = useState(wallet.cutoffDay ? String(wallet.cutoffDay) : "");
  const [paymentDueDay, setPaymentDueDay] = useState(
    wallet.paymentDueDay ? String(wallet.paymentDueDay) : "",
  );
  const [error, setError] = useState("");

  const handleClose = () => {
    if (!updateWallet.isPending) onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await updateWallet.mutateAsync({
        id: wallet.id,
        name: name.trim(),
        ...(isCredit && {
          creditLimit: Number(creditLimit),
          cutoffDay: hasBillingCycle && cutoffDay ? Number(cutoffDay) : null,
          paymentDueDay:
            hasBillingCycle && paymentDueDay ? Number(paymentDueDay) : null,
        }),
      });
      toast(t("toastSaved", { name: name.trim() }));
      onClose();
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? t("genericError"));
    }
  };

  return (
    <AppModal
      open
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={updateWallet.isPending}
      size="md"
      title={t("title")}
      description={t("description")}
      footer={
        <>
          <ModalCancelButton isPending={updateWallet.isPending} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton
            form="edit-wallet-form"
            isPending={updateWallet.isPending}
            pendingLabel={tCommon("actions.saving")}
          >
            <Pencil className="size-4" />
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="edit-wallet-form" onSubmit={handleSubmit} className="space-y-6">
        <FormField label={t("accountName")} htmlFor="edit-wallet-name">
          <Input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="h-12 border-border/70 bg-card px-3 text-sm"
          />
        </FormField>

        {isCredit ? (
          <>
            <FormField label={t("creditLimit")} htmlFor="edit-wallet-credit-limit">
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={creditLimit}
                  onChange={(event) => setCreditLimit(event.target.value.replace(/\D/g, ""))}
                  className="h-12 border-border/70 bg-card pl-11 text-sm tabular-nums"
                  required
                />
              </div>
            </FormField>
            {hasBillingCycle ? (
              <div className="grid grid-cols-2 gap-3">
                <FormField label={t("cutoffDate")} htmlFor="edit-wallet-cutoff-day">
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={cutoffDay}
                    onChange={(event) => setCutoffDay(event.target.value)}
                    placeholder={t("optional")}
                    className="h-12 border-border/70 bg-card px-3 text-sm"
                  />
                </FormField>
                <FormField label={t("dueDate")} htmlFor="edit-wallet-due-day">
                  <Input
                    type="number"
                    min="1"
                    max="31"
                    value={paymentDueDay}
                    onChange={(event) => setPaymentDueDay(event.target.value)}
                    placeholder={t("optional")}
                    className="h-12 border-border/70 bg-card px-3 text-sm"
                  />
                </FormField>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">{t("paylaterDueNote")}</p>
            )}
          </>
        ) : null}

        <FormErrorMessage message={error} />
      </form>
    </AppModal>
  );
}
