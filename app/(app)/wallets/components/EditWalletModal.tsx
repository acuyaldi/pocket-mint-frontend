"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUpdateWallet } from "@/src/features/wallets/hooks/useWallets";
import { isCreditWallet, type Wallet } from "@/src/types/wallet";

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
  const updateWallet = useUpdateWallet();
  const isCredit = isCreditWallet(wallet.type);
  const [name, setName] = useState(wallet.name);
  const [creditLimit, setCreditLimit] = useState(String(wallet.creditLimit ?? 0));
  const [cutoffDay, setCutoffDay] = useState(wallet.cutoffDay ? String(wallet.cutoffDay) : "");
  const [paymentDueDay, setPaymentDueDay] = useState(
    wallet.paymentDueDay ? String(wallet.paymentDueDay) : "",
  );
  const [error, setError] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    try {
      await updateWallet.mutateAsync({
        id: wallet.id,
        name: name.trim(),
        ...(isCredit && {
          creditLimit: Number(creditLimit),
          cutoffDay: cutoffDay ? Number(cutoffDay) : null,
          paymentDueDay: paymentDueDay ? Number(paymentDueDay) : null,
        }),
      });
      onClose();
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? "Perubahan belum dapat disimpan. Coba lagi.");
    }
  };

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md overflow-hidden p-0">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-border bg-card px-6 py-5">
            <DialogTitle className="text-base font-semibold">Edit Akun</DialogTitle>
            <DialogDescription className="mt-1 text-sm">
              Saldo dan tagihan hanya berubah melalui transaksi.
            </DialogDescription>
          </div>

          <div className="space-y-4 p-6">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Nama Akun</label>
              <Input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="h-11"
              />
            </div>

            {isCredit ? (
              <>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Limit Kredit</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">Rp</span>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={creditLimit}
                      onChange={(event) => setCreditLimit(event.target.value.replace(/\D/g, ""))}
                      className="h-11 pl-10"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Tanggal Cutoff</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={cutoffDay}
                      onChange={(event) => setCutoffDay(event.target.value)}
                      placeholder="Opsional"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Tanggal Jatuh Tempo</label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDueDay}
                      onChange={(event) => setPaymentDueDay(event.target.value)}
                      placeholder="Opsional"
                    />
                  </div>
                </div>
              </>
            ) : null}

            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>

          <div className="flex justify-end gap-3 border-t border-border bg-card px-6 py-5">
            <Button type="button" variant="ghost" onClick={onClose} disabled={updateWallet.isPending}>
              Batal
            </Button>
            <Button type="submit" disabled={updateWallet.isPending}>
              {updateWallet.isPending ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
