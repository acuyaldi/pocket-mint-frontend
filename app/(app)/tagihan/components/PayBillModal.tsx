"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, X } from "lucide-react";

import { formatCurrency } from "@/lib/utils";
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
  const payBill = usePayBill();
  const [sourceWalletId, setSourceWalletId] = useState("");
  const [paymentDate, setPaymentDate] = useState(() => getJakartaDateKey());
  const [error, setError] = useState("");
  const sourceWallets = wallets.filter((wallet) =>
    ASSET_WALLET_TYPES.includes(wallet.type),
  );

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
      setError(message ?? "Pembayaran belum dapat diproses. Coba lagi.");
    }
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="pay-bill-title"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card shadow-2xl"
      >
        <header className="flex items-start justify-between border-b border-border bg-surface-low p-6">
          <div>
            <h2 id="pay-bill-title" className="text-xl font-semibold text-primary">Bayar Cicilan</h2>
            <p className="mt-1 text-sm text-muted-foreground">{bill.description || bill.walletName}</p>
          </div>
          <button type="button" aria-label="Tutup pembayaran" onClick={onClose} disabled={payBill.isPending}>
            <X className="size-5" />
          </button>
        </header>

        <div className="space-y-6 p-6">
          <div className="rounded-lg bg-surface-low p-4">
            <p className="text-xs text-muted-foreground">Jumlah pembayaran</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">{formatCurrency(bill.amountPerTerm)}</p>
          </div>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sumber pembayaran</h3>
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
                    <span className="mt-1 block text-sm tabular-nums text-muted-foreground">{formatCurrency(wallet.balance)}</span>
                    {disabled ? <span className="mt-1 block text-xs text-coral">Saldo tidak mencukupi</span> : null}
                  </button>
                );
              })}
            </div>
            {sourceWallets.length === 0 ? (
              <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
                Tambahkan Kas, Bank, atau E-Wallet untuk membayar cicilan.
              </p>
            ) : null}
          </section>

          <label className="block space-y-2 text-xs font-medium text-muted-foreground">
            <span>Tanggal pembayaran</span>
            <input
              type="date"
              value={paymentDate}
              onChange={(event) => setPaymentDate(event.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground"
            />
          </label>

          {error ? <p className="rounded-lg bg-coral/10 p-3 text-sm text-coral">{error}</p> : null}
        </div>

        <footer className="flex gap-3 border-t border-border bg-surface-low p-6">
          <button type="button" onClick={onClose} disabled={payBill.isPending} className="h-11 flex-1 rounded-lg border border-border bg-card text-sm font-semibold">Batal</button>
          <button type="button" onClick={handlePay} disabled={!sourceWalletId || payBill.isPending} className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-primary-foreground disabled:opacity-50">
            {payBill.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
            Konfirmasi
          </button>
        </footer>
      </section>
    </div>
  );
}
