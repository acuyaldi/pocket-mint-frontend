"use client";

import { FormEvent, useCallback, useState } from "react";
import {
  Banknote,
  Coins,
  CreditCard,
  HandCoins,
  Landmark,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WalletType } from "@/src/types/wallet";

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: CreateWalletFormData) => void;
}

export interface CreateWalletFormData {
  name: string;
  type: WalletType;
  icon: string;
  balance?: number;
  principal?: number;
  creditLimit?: number;
  cutoffDay?: number;
  paymentDueDay?: number;
  interestRate?: number;
  adminFee?: number;
}

const PAYLATER_PRESETS: Record<string, { interestRate: number; adminFee: number }> = {
  SPaylater: { interestRate: 2.95, adminFee: 1 },
  Kredivo: { interestRate: 2.6, adminFee: 1 },
  Akulaku: { interestRate: 1.5, adminFee: 1 },
  GoPayLater: { interestRate: 2, adminFee: 0 },
  "BCA PayLater": { interestRate: 1.25, adminFee: 0 },
  "Mandiri Paylater": { interestRate: 1.5, adminFee: 0 },
};

const ACCOUNT_TYPES: Array<{
  value: WalletType;
  label: string;
  Icon: typeof Landmark;
  tone: string;
  icon: string;
}> = [
  { value: "CASH", label: "Tunai", Icon: Banknote, tone: "text-mint", icon: "banknote" },
  { value: "BANK", label: "Bank", Icon: Landmark, tone: "text-mint", icon: "landmark" },
  { value: "E_WALLET", label: "E-Wallet", Icon: Smartphone, tone: "text-primary", icon: "smartphone" },
  { value: "CREDIT_CARD", label: "Kartu Kredit", Icon: CreditCard, tone: "text-coral", icon: "creditcard" },
  { value: "PAYLATER", label: "Paylater", Icon: Coins, tone: "text-coral", icon: "coins" },
  { value: "LOAN", label: "Pinjaman", Icon: HandCoins, tone: "text-amber", icon: "handcoins" },
];

const INSTITUTIONS = [
  { value: "none", label: "Tanpa institusi" },
  { value: "Bank Central Asia (BCA)", label: "Bank Central Asia (BCA)" },
  { value: "Bank Mandiri", label: "Bank Mandiri" },
  { value: "Bank Negara Indonesia (BNI)", label: "Bank Negara Indonesia (BNI)" },
  { value: "GoPay", label: "GoPay" },
  { value: "OVO", label: "OVO" },
  { value: "SPaylater", label: "SPaylater" },
  { value: "Kredivo", label: "Kredivo" },
  { value: "Akulaku", label: "Akulaku" },
  { value: "Lainnya", label: "Lainnya" },
];

const parseRupiahToNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

const formatRupiahVisual = (value: string): string => {
  const rawNumber = value.replace(/\D/g, "");
  return rawNumber ? new Intl.NumberFormat("id-ID").format(Number(rawNumber)) : "";
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-muted-foreground">{children}</label>;
}

function MoneyInput({
  value,
  onChange,
  required = false,
}: {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
        Rp
      </span>
      <input
        value={value}
        onChange={(event) => onChange(formatRupiahVisual(event.target.value))}
        className="h-16 w-full rounded-lg border border-border bg-card pl-12 pr-4 text-right text-3xl font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        inputMode="numeric"
        placeholder="0"
        required={required}
        type="text"
      />
    </div>
  );
}

export default function CreateWalletModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWalletModalProps) {
  const [accountType, setAccountType] = useState<WalletType>("CASH");
  const [walletName, setWalletName] = useState("");
  const [amount, setAmount] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [cutoffDay, setCutoffDay] = useState("");
  const [paymentDueDay, setPaymentDueDay] = useState("");
  const [institution, setInstitution] = useState("none");

  const selectedType = ACCOUNT_TYPES.find((item) => item.value === accountType)!;
  const isAsset = ["CASH", "BANK", "E_WALLET"].includes(accountType);
  const isCredit = ["CREDIT_CARD", "PAYLATER"].includes(accountType);
  const isLoan = accountType === "LOAN";

  const resetForm = useCallback(() => {
    setAccountType("CASH");
    setWalletName("");
    setAmount("");
    setCreditLimit("");
    setCutoffDay("");
    setPaymentDueDay("");
    setInstitution("none");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const fallbackName = !["none", "Lainnya"].includes(institution) ? institution : "";
    const resolvedName = walletName.trim() || fallbackName;
    if (!resolvedName) return;

    const limit = parseRupiahToNumber(creditLimit);
    const principal = parseRupiahToNumber(amount);
    if ((isCredit && limit <= 0) || (isLoan && principal <= 0)) return;

    const preset = accountType === "PAYLATER" ? PAYLATER_PRESETS[resolvedName] : undefined;
    onSuccess({
      name: resolvedName,
      type: accountType,
      icon: selectedType.icon,
      ...(isAsset && { balance: principal }),
      ...(isCredit && {
        creditLimit: limit,
        ...(cutoffDay && { cutoffDay: Number(cutoffDay) }),
        ...(paymentDueDay && { paymentDueDay: Number(paymentDueDay) }),
        ...(preset ?? {}),
      }),
      ...(isLoan && { principal }),
    });
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-xl border border-border/70 bg-card p-0 text-foreground shadow-2xl sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-start justify-between border-b border-border/70 p-6">
            <div>
              <DialogTitle className="text-xl font-semibold text-primary">Tambah Akun</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Tambahkan kas, bank, e-wallet, kredit, atau pinjaman.
              </DialogDescription>
            </div>
            <button
              type="button"
              aria-label="Tutup modal tambah akun"
              onClick={handleClose}
              className="rounded-lg p-1 text-muted-foreground transition-colors hover:text-coral"
            >
              <X className="size-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-8 overflow-y-auto p-6">
            <section>
              <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Pilih Jenis Akun
              </h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {ACCOUNT_TYPES.map((item) => {
                  const Icon = item.Icon;
                  return (
                    <label key={item.value} className="group relative cursor-pointer">
                      <input
                        type="radio"
                        name="account_type"
                        value={item.value}
                        checked={accountType === item.value}
                        onChange={() => {
                          setAccountType(item.value);
                          setAmount("");
                          setCreditLimit("");
                          setCutoffDay("");
                          setPaymentDueDay("");
                        }}
                        className="peer sr-only"
                      />
                      <span className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-border border-t-4 bg-card p-3 text-center transition-all peer-checked:border-primary peer-checked:bg-accent hover:bg-surface-low ${item.tone}`}>
                        <Icon className="size-6" />
                        <span className="text-xs font-semibold leading-tight text-foreground">{item.label}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Rincian Akun
              </h3>

              <div className="space-y-1.5">
                <FieldLabel>Nama Akun</FieldLabel>
                <input
                  value={walletName}
                  onChange={(event) => setWalletName(event.target.value)}
                  required={["none", "Lainnya"].includes(institution)}
                  className="h-12 w-full rounded-lg border border-border bg-surface-low px-4 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
                  placeholder="Contoh: Uang Tunai, BCA, SPaylater"
                  type="text"
                />
              </div>

              {isAsset ? (
                <div className="space-y-1.5">
                  <FieldLabel>Saldo Awal</FieldLabel>
                  <MoneyInput value={amount} onChange={setAmount} />
                </div>
              ) : null}

              {isLoan ? (
                <div className="space-y-1.5">
                  <FieldLabel>Nominal Pinjaman</FieldLabel>
                  <MoneyInput value={amount} onChange={setAmount} required />
                  <p className="text-xs text-muted-foreground">Saldo pinjaman akan tercatat sebagai kewajiban.</p>
                </div>
              ) : null}

              {isCredit ? (
                <>
                  <div className="space-y-1.5">
                    <FieldLabel>Limit Kredit</FieldLabel>
                    <MoneyInput value={creditLimit} onChange={setCreditLimit} required />
                    <p className="text-xs text-muted-foreground">Tagihan awal selalu Rp0 dan bertambah saat dipakai.</p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <FieldLabel>Tanggal Cutoff (Opsional)</FieldLabel>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={cutoffDay}
                        onChange={(event) => setCutoffDay(event.target.value)}
                        className="h-12 w-full rounded-lg border border-border bg-surface-low px-4 text-sm outline-none focus:border-primary"
                        placeholder="1–31"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>Tanggal Jatuh Tempo (Opsional)</FieldLabel>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={paymentDueDay}
                        onChange={(event) => setPaymentDueDay(event.target.value)}
                        className="h-12 w-full rounded-lg border border-border bg-surface-low px-4 text-sm outline-none focus:border-primary"
                        placeholder="1–31"
                      />
                    </div>
                  </div>
                </>
              ) : null}

              <div className="space-y-1.5">
                <FieldLabel>Institusi (Opsional)</FieldLabel>
                <select
                  value={institution}
                  onChange={(event) => setInstitution(event.target.value)}
                  className="h-12 w-full rounded-lg border border-border bg-surface-low px-4 text-sm outline-none focus:border-primary"
                >
                  {INSTITUTIONS.map((item) => (
                    <option key={item.value} value={item.value}>{item.label}</option>
                  ))}
                </select>
              </div>
            </section>
          </div>

          <footer className="flex justify-end gap-3 border-t border-border/70 bg-card p-6">
            <Button type="button" variant="outline" onClick={handleClose}>Batal</Button>
            <Button type="submit" className="bg-primary text-primary-foreground">Simpan Akun</Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
