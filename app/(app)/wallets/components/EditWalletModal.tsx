"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toaster";
import { useUpdateWallet } from "@/src/features/wallets/hooks/useWallets";
import { isCreditWallet, type Wallet } from "@/src/types/wallet";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </label>
  );
}

export default function EditWalletModal({
  wallet,
  onClose,
}: {
  wallet: Wallet | null;
  onClose: () => void;
}) {
  if (!wallet) return <Dialog open={false} onOpenChange={() => undefined} />;
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
    <Dialog open onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-full max-w-md flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-card p-0 text-foreground shadow-xl"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border/50 bg-surface-low px-6 py-4">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">
                {t("title")}
              </DialogTitle>
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
              <FieldLabel>{t("accountName")}</FieldLabel>
              <Input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="h-12 border-border/70 bg-card px-3 text-sm"
              />
            </section>

            {isCredit ? (
              <>
                <section className="space-y-2">
                  <FieldLabel>{t("creditLimit")}</FieldLabel>
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
                </section>
                {hasBillingCycle ? (
                <section className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <FieldLabel>{t("cutoffDate")}</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={cutoffDay}
                      onChange={(event) => setCutoffDay(event.target.value)}
                      placeholder={t("optional")}
                      className="h-12 border-border/70 bg-card px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <FieldLabel>{t("dueDate")}</FieldLabel>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDueDay}
                      onChange={(event) => setPaymentDueDay(event.target.value)}
                      placeholder={t("optional")}
                      className="h-12 border-border/70 bg-card px-3 text-sm"
                    />
                  </div>
                </section>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t("paylaterDueNote")}
                  </p>
                )}
              </>
            ) : null}

            {error ? (
              <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
                {error}
              </p>
            ) : null}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-border/50 bg-surface-low px-6 py-4 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={updateWallet.isPending}
              className="h-11 flex-1 bg-card"
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={updateWallet.isPending}
              className="h-11 flex-1 gap-2"
            >
              {updateWallet.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {tCommon("actions.saving")}
                </>
              ) : (
                <>
                  <Pencil className="size-4" />
                  {t("submit")}
                </>
              )}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
