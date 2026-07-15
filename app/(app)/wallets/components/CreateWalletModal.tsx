"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import {
  Banknote,
  CreditCard,
  Landmark,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type {
  AssetSubType,
  DebtSubType,
  WalletCategory,
} from "@/src/types/wallet";

interface CreateWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (data: CreateWalletFormData) => void;
}

export interface CreateWalletFormData {
  name: string;
  category: WalletCategory;
  icon: string;
  balance?: number;
  subType?: AssetSubType | DebtSubType;
  creditLimit?: number;
  outstanding?: number;
  interestRate?: number;
  adminFee?: number;
}

type AccountType = "bank" | "wallet" | "credit" | "loan";

const PAYLATER_PRESETS: Record<string, { interestRate: number; adminFee: number }> = {
  SPaylater: { interestRate: 2.95, adminFee: 1 },
  Kredivo: { interestRate: 2.6, adminFee: 1 },
  Akulaku: { interestRate: 1.5, adminFee: 1 },
  GoPayLater: { interestRate: 2, adminFee: 0 },
  "BCA PayLater": { interestRate: 1.25, adminFee: 0 },
  "Mandiri Paylater": { interestRate: 1.5, adminFee: 0 },
};

const ACCOUNT_TYPES: Array<{
  value: AccountType;
  label: string;
  Icon: typeof Landmark;
  tone: string;
  activeTone: string;
}> = [
  {
    value: "bank",
    label: "Rekening",
    Icon: Landmark,
    tone: "border-t-mint text-mint",
    activeTone: "peer-checked:border-t-mint",
  },
  {
    value: "wallet",
    label: "E-Wallet",
    Icon: Wallet,
    tone: "border-t-primary text-primary",
    activeTone: "peer-checked:border-t-primary",
  },
  {
    value: "credit",
    label: "Kredit",
    Icon: CreditCard,
    tone: "border-t-coral text-coral",
    activeTone: "peer-checked:border-t-coral",
  },
  {
    value: "loan",
    label: "Pinjaman",
    Icon: Banknote,
    tone: "border-t-amber text-amber",
    activeTone: "peer-checked:border-t-amber",
  },
];

const INSTITUTIONS = [
  { value: "", label: "Pilih Bank / Penyedia" },
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
  return cleaned ? parseInt(cleaned, 10) : 0;
};

const formatRupiahVisual = (value: string): string => {
  const rawNumber = value.replace(/\D/g, "");
  if (!rawNumber) return "";
  return new Intl.NumberFormat("id-ID").format(Number(rawNumber));
};

function getAccountMeta(type: AccountType): {
  category: WalletCategory;
  subType: AssetSubType | DebtSubType;
  icon: string;
} {
  if (type === "bank") {
    return { category: "asset", subType: "bank_account", icon: "landmark" };
  }
  if (type === "wallet") {
    return { category: "asset", subType: "e_wallet", icon: "wallet" };
  }
  if (type === "credit") {
    return { category: "debt", subType: "credit_card", icon: "creditcard" };
  }
  return { category: "debt", subType: "paylater", icon: "coins" };
}

function FieldLabel({ children, danger = false }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <label
      className={`text-[12px] font-medium ${
        danger ? "font-bold text-coral" : "text-muted-foreground"
      }`}
    >
      {children}
    </label>
  );
}

export default function CreateWalletModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateWalletModalProps) {
  const [accountType, setAccountType] = useState<AccountType>("bank");
  const [walletName, setWalletName] = useState("");
  const [initialBalance, setInitialBalance] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [institution, setInstitution] = useState("");

  const meta = useMemo(() => getAccountMeta(accountType), [accountType]);
  const isDebt = meta.category === "debt";

  const resetForm = useCallback(() => {
    setAccountType("bank");
    setWalletName("");
    setInitialBalance("");
    setCreditLimit("");
    setInstitution("");
  }, []);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    const fallbackName = institution && institution !== "Lainnya" ? institution : "";
    const resolvedName = walletName.trim() || fallbackName;
    const preset = PAYLATER_PRESETS[resolvedName];

    const formData: CreateWalletFormData = {
      name: resolvedName,
      category: meta.category,
      subType: meta.subType,
      icon: meta.icon,
      ...(isDebt
        ? {
            outstanding: parseRupiahToNumber(initialBalance),
            creditLimit: parseRupiahToNumber(creditLimit),
            ...(preset ? preset : {}),
          }
        : {
            balance: parseRupiahToNumber(initialBalance),
          }),
    };

    onSuccess(formData);
    handleClose();
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col gap-0 overflow-hidden rounded-xl border border-border/70 bg-card p-0 text-foreground shadow-2xl sm:max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-start justify-between border-b border-border/70 p-6">
            <div>
              <DialogTitle className="text-xl font-semibold text-primary">
                Tambah Akun
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                Daftarkan rekening, e-wallet, atau kartu kredit baru
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
              <h3 className="mb-4 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Pilih Kategori Akun
              </h3>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
                          setCreditLimit("");
                        }}
                        className="peer sr-only"
                      />
                      <span
                        className={`flex h-full min-h-[92px] flex-col items-center justify-center gap-2 rounded-lg border border-border bg-card p-3 text-center transition-all border-t-4 ${item.tone} ${item.activeTone} peer-checked:border-primary peer-checked:bg-accent hover:bg-surface-low`}
                      >
                        <Icon className="size-6" />
                        <span className="text-[12px] font-semibold leading-tight text-foreground">
                          {item.label}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Rincian Akun
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <FieldLabel>Nama Akun</FieldLabel>
                  <input
                    value={walletName}
                    onChange={(event) => setWalletName(event.target.value)}
                    required={!institution || institution === "Lainnya"}
                    className="h-12 w-full rounded-lg border border-border bg-surface-low px-4 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-primary/30"
                    placeholder="Contoh: BCA Debit, GoPay Personal"
                    type="text"
                  />
                </div>

                <div className="space-y-1.5">
                  <FieldLabel>{isDebt ? "Outstanding Awal" : "Saldo Awal"}</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                      Rp
                    </span>
                    <input
                      value={initialBalance}
                      onChange={(event) =>
                        setInitialBalance(formatRupiahVisual(event.target.value))
                      }
                      className="h-16 w-full rounded-lg border border-border bg-card pl-12 pr-4 text-right text-[32px] font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      inputMode="numeric"
                      placeholder="0"
                      type="text"
                    />
                  </div>
                </div>

                {isDebt ? (
                  <div className="space-y-1.5 transition-all duration-300">
                    <FieldLabel danger>
                      {accountType === "credit" ? "Limit Kredit" : "Limit Pinjaman"}
                    </FieldLabel>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                        Rp
                      </span>
                      <input
                        value={creditLimit}
                        onChange={(event) =>
                          setCreditLimit(formatRupiahVisual(event.target.value))
                        }
                        className="h-16 w-full rounded-lg border border-coral bg-coral/10 pl-12 pr-4 text-right text-[32px] font-semibold tabular-nums text-foreground outline-none transition-all focus:border-coral focus:ring-2 focus:ring-coral/20"
                        inputMode="numeric"
                        placeholder="0"
                        type="text"
                      />
                    </div>
                  </div>
                ) : null}

                <div className="space-y-1.5">
                  <FieldLabel>Institusi (Opsional)</FieldLabel>
                  <select
                    value={institution}
                    onChange={(event) => setInstitution(event.target.value)}
                    className="h-12 w-full rounded-lg border border-border bg-surface-low px-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-1 focus:ring-primary/30"
                  >
                    {INSTITUTIONS.map((item) => (
                      <option key={item.value || "empty"} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-muted-foreground">
                    Jika nama akun dikosongkan, institusi terpilih akan dipakai sebagai nama akun.
                  </p>
                </div>
              </div>
            </section>
          </div>

          <footer className="flex justify-end gap-3 border-t border-border/70 bg-card p-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-10 px-6 text-[12px] font-semibold uppercase tracking-[0.08em]"
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="h-10 bg-primary px-8 text-[12px] font-bold uppercase tracking-[0.08em] text-primary-foreground hover:bg-primary/90"
            >
              Simpan Akun
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
