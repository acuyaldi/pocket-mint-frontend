"use client";

import { useCallback, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CreditCard,
  Loader2,
  Plus,
  RefreshCw,
  Smartphone,
  Wallet as WalletIcon,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { usePaylaterRates } from "@/src/features/installments/hooks/useInstallments";
import { isDebtWallet, type Wallet } from "@/src/types/wallet";
import { AccountPicker } from "./AccountPicker";
import { formatRupiah } from "./constants";
import {
  getTransferWallets,
  isValidTransferPair,
  selectTransferEndpoint,
  swapTransferEndpoints,
} from "./transfer-account-picker";

type TxType = "EXPENSE" | "INCOME" | "TRANSFER";
type Tab = TxType;

const EXPENSE_CATS = [
  "Makanan",
  "Transportasi",
  "Belanja",
  "Hiburan",
  "Tagihan",
  "Kesehatan",
  "Pendidikan",
  "Perjalanan",
  "Perawatan",
  "Lainnya",
];
const INCOME_CATS = [
  "Gaji",
  "Freelance",
  "Bisnis",
  "Investasi",
  "Hadiah",
  "Lainnya",
];

const TENORS = [3, 6, 12];

const TYPE_OPTIONS = [
  {
    type: "EXPENSE" as Tab,
    label: "Pengeluaran",
    Icon: ArrowDownLeft,
    activeClass: "bg-coral text-white shadow-sm",
    iconClass: "text-coral",
  },
  {
    type: "INCOME" as Tab,
    label: "Pemasukan",
    Icon: ArrowUpRight,
    activeClass: "bg-mint text-primary shadow-sm",
    iconClass: "text-mint",
  },
  {
    type: "TRANSFER" as Tab,
    label: "Transfer",
    Icon: ArrowLeftRight,
    activeClass: "bg-primary text-primary-foreground shadow-sm",
    iconClass: "text-primary",
  },
];

const spendable = (wallet: Wallet) =>
  isDebtWallet(wallet.type)
    ? Math.max((wallet.creditLimit ?? 0) - Math.abs(wallet.balance), 0)
    : wallet.balance;

function todayStr() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInstallmentDefaults(
  wallet: Wallet | undefined,
  paylaterRates:
    | Array<{ match: string; rate: number; adminFee: number }>
    | undefined,
) {
  if (!wallet || !isDebtWallet(wallet.type)) {
    return { interestRate: "", adminFee: "" };
  }

  if (wallet.interestRate > 0 || (wallet.adminFee ?? 0) > 0) {
    return {
      interestRate: String(wallet.interestRate),
      adminFee:
        wallet.adminFeeType === "PERCENT" ? String(wallet.adminFee ?? 0) : "",
    };
  }

  const preset = paylaterRates?.find((item) =>
    wallet.name.toLowerCase().includes(item.match),
  );

  return {
    interestRate: preset ? String(preset.rate) : "",
    adminFee: preset ? String(preset.adminFee) : "",
  };
}

function getWalletKind(wallet: Wallet) {
  if (wallet.type === "BANK") return "Rekening";
  if (wallet.type === "E_WALLET") return "E-Wallet";
  if (wallet.type === "CASH") return "Kas";
  if (wallet.type === "CREDIT_CARD") return "Kredit";
  return "Pinjaman";
}

function getWalletIcon(wallet: Wallet) {
  if (wallet.type === "BANK") return Banknote;
  if (wallet.type === "E_WALLET") return Smartphone;
  if (isDebtWallet(wallet.type)) return CreditCard;
  return WalletIcon;
}

function formatWalletAmount(wallet: Wallet) {
  return `Rp ${formatRupiah(String(Math.abs(wallet.balance)))}`;
}

export interface AddTransactionData {
  description: string;
  amount: number;
  type: TxType;
  date: string;
  walletId?: string;
  toWalletId?: string;
  isInstallment?: boolean;
  installmentMonths?: number;
  interestRate?: number;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  isCreating: boolean;
  wallets: Wallet[];
  onClose: () => void;
  onSubmit: (data: AddTransactionData) => Promise<void>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </label>
  );
}

function WalletSelectionList({
  wallets,
  selected,
  emptyLabel,
  isDisabled,
  disabledTitle = "Saldo tidak cukup",
  onSelect,
}: {
  wallets: Wallet[];
  selected: string;
  emptyLabel: string;
  isDisabled?: (wallet: Wallet) => boolean;
  disabledTitle?: string;
  onSelect: (id: string) => void;
}) {
  if (wallets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-low p-4 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {wallets.map((wallet) => {
        const active = selected === wallet.id;
        const disabled = isDisabled?.(wallet) ?? false;
        const Icon = getWalletIcon(wallet);
        const isDebt = isDebtWallet(wallet.type);

        return (
          <button
            key={wallet.id}
            type="button"
            disabled={disabled}
            title={disabled ? disabledTitle : undefined}
            onClick={() => onSelect(active ? "" : wallet.id)}
            className={`group flex min-h-[76px] items-center gap-3 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
              active
                ? "border-mint bg-mint/10 shadow-sm"
                : "border-border/70 bg-card hover:border-primary/30 hover:bg-surface-low"
            }`}
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                isDebt ? "bg-coral/10 text-coral" : "bg-surface-high text-primary"
              }`}
            >
              <Icon className="size-5 transition-transform group-hover:scale-105" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {wallet.name}
              </span>
              <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{getWalletKind(wallet)}</span>
                <span className="tabular-nums">{formatWalletAmount(wallet)}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function AddTransactionModal({
  isOpen,
  isCreating,
  wallets,
  onClose,
  onSubmit,
}: AddTransactionModalProps) {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<Tab>("EXPENSE");
  const [walletId, setWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayStr);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentMonths, setInstallmentMonths] = useState(3);
  const [interestRateOverride, setInterestRateOverride] = useState<
    string | null
  >(null);
  const [adminFeeOverride, setAdminFeeOverride] = useState<string | null>(null);
  const [error, setError] = useState("");

  const router = useRouter();
  const { data: paylaterRates } = usePaylaterRates();

  const hasNoWallets = wallets.length === 0;
  const selectedWallet = wallets.find((wallet) => wallet.id === walletId);
  const installmentDefaults = getInstallmentDefaults(
    selectedWallet,
    paylaterRates,
  );
  const interestRate = interestRateOverride ?? installmentDefaults.interestRate;
  const adminFee = adminFeeOverride ?? installmentDefaults.adminFee;
  const parsedAmount = Number(amount.replace(/\./g, "")) || 0;
  const activeType = TYPE_OPTIONS.find((option) => option.type === type)!;
  const ActiveIcon = activeType.Icon;

  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(formatRupiah(event.target.value.replace(/\D/g, "")));
    },
    [],
  );

  const handleTypeChange = useCallback((nextType: Tab) => {
    setType(nextType);
    setWalletId("");
    setToWalletId("");
    setCategory("");
    setIsInstallment(false);
    setInstallmentMonths(3);
    setInterestRateOverride(null);
    setAdminFeeOverride(null);
    setError("");
  }, []);

  const handleSourceSelect = useCallback(
    (nextId: string) => {
      const next = selectTransferEndpoint(walletId, toWalletId, nextId);
      setWalletId(next.selectedId);
      setToWalletId(next.oppositeId);
      setError("");
    },
    [walletId, toWalletId],
  );

  const handleDestinationSelect = useCallback(
    (nextId: string) => {
      const next = selectTransferEndpoint(toWalletId, walletId, nextId);
      setToWalletId(next.selectedId);
      setWalletId(next.oppositeId);
      setError("");
    },
    [toWalletId, walletId],
  );

  const handleSwapWallets = useCallback(() => {
    const next = swapTransferEndpoints(walletId, toWalletId);
    setWalletId(next.selectedId);
    setToWalletId(next.oppositeId);
    setError("");
  }, [walletId, toWalletId]);

  const handleClose = useCallback(() => {
    if (!isCreating) onClose();
  }, [isCreating, onClose]);

  const handleAddWallet = useCallback(() => {
    onClose();
    router.push("/wallets");
  }, [onClose, router]);

  const cats =
    type === "INCOME" ? INCOME_CATS : type === "EXPENSE" ? EXPENSE_CATS : [];

  const sourceWallets = useMemo(() => {
    if (type === "INCOME") {
      return wallets.filter((wallet) => !isDebtWallet(wallet.type));
    }
    if (type === "TRANSFER") {
      return getTransferWallets(wallets);
    }
    return wallets;
  }, [type, wallets]);

  const transferWallets = useMemo(() => getTransferWallets(wallets), [wallets]);

  const rateNum = Number(interestRate.replace(",", ".")) || 0;
  const adminFeeNum = Number(adminFee.replace(",", ".")) || 0;
  const totalInterest = Math.round(
    parsedAmount * (rateNum / 100) * installmentMonths,
  );
  const monthlyEst = Math.round(
    (parsedAmount + totalInterest) / installmentMonths,
  );
  const adminRp = Math.round(parsedAmount * (adminFeeNum / 100));
  const matchedPreset =
    isInstallment && selectedWallet
      ? paylaterRates?.find((preset) =>
          selectedWallet.name.toLowerCase().includes(preset.match),
        )
      : undefined;

  const lacksFunds = (wallet: Wallet) =>
    type !== "INCOME" &&
    parsedAmount > 0 &&
    spendable(wallet) <
      (isInstallment && isDebtWallet(wallet.type)
        ? parsedAmount + totalInterest
        : parsedAmount);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (parsedAmount <= 0) return;

    const srcWallet = wallets.find((wallet) => wallet.id === walletId);
    const isTransfer = type === "TRANSFER";
    const asInstallment =
      isInstallment && !!srcWallet && isDebtWallet(srcWallet.type);

    if (isTransfer && !isValidTransferPair(walletId, toWalletId)) {
      setError("Pilih dompet sumber dan tujuan yang berbeda.");
      return;
    }

    if (isTransfer && srcWallet && isDebtWallet(srcWallet.type)) {
      setError("Transfer tidak bisa dilakukan dari kartu kredit atau paylater.");
      return;
    }

    if (type === "INCOME" && srcWallet && isDebtWallet(srcWallet.type)) {
      setError("Pemasukan tidak bisa dicatat ke kartu kredit atau paylater.");
      return;
    }

    if (srcWallet && type !== "INCOME") {
      const requiredAmount = asInstallment
        ? parsedAmount + totalInterest
        : parsedAmount;

      if (spendable(srcWallet) < requiredAmount) {
        setError(`Saldo ${srcWallet.name} tidak cukup.`);
        return;
      }
    }

    try {
      await onSubmit({
        description: description.trim(),
        amount: parsedAmount,
        type,
        date: new Date(date).toISOString(),
        walletId: walletId || undefined,
        toWalletId: isTransfer ? toWalletId || undefined : undefined,
        isInstallment: asInstallment || undefined,
        installmentMonths: asInstallment ? installmentMonths : undefined,
        interestRate: asInstallment ? rateNum : undefined,
      });
    } catch (err) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? "Transaksi gagal disimpan. Coba lagi.");
      return;
    }

    setAmount("");
    setType("EXPENSE");
    setWalletId("");
    setToWalletId("");
    setCategory("");
    setDescription("");
    setDate(todayStr());
    setIsInstallment(false);
    setInstallmentMonths(3);
    setInterestRateOverride(null);
    setAdminFeeOverride(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="add-transaction-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm md:p-10"
          onClick={handleClose}
        >
          <motion.div
            key="add-transaction-card"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(event) => event.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl"
          >
            <header className="flex items-center justify-between border-b border-border/50 bg-surface-low px-6 py-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Tambah Transaksi
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Catat arus uang tanpa keluar dari halaman.
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup modal"
                onClick={handleClose}
                className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </header>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="flex-1 space-y-6 overflow-y-auto p-6">
                <nav
                  aria-label="Jenis transaksi"
                  className="grid grid-cols-3 rounded-lg bg-surface-high p-1"
                >
                  {TYPE_OPTIONS.map(({ type: optionType, label, Icon, activeClass }) => {
                    const active = type === optionType;
                    return (
                      <button
                        key={optionType}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleTypeChange(optionType)}
                        className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-bold uppercase tracking-[0.08em] transition-all ${
                          active
                            ? activeClass
                            : "text-muted-foreground hover:bg-card hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                        {label}
                      </button>
                    );
                  })}
                </nav>

                <section className="space-y-2">
                  <FieldLabel>Jumlah</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={amount}
                      onChange={handleAmountChange}
                      required
                      className={`w-full rounded-xl border border-border/70 bg-card py-4 pl-16 pr-4 text-[32px] font-semibold tabular-nums tracking-[-0.02em] outline-none transition-all placeholder:text-border focus:border-primary focus:ring-2 focus:ring-primary/15 md:text-[40px] ${activeType.iconClass}`}
                    />
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <FieldLabel>Tanggal</FieldLabel>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        required
                        className="h-12 w-full rounded-lg border border-border/70 bg-card pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                  </div>

                  {cats.length > 0 && (
                    <div className="space-y-2">
                      <FieldLabel>Kategori</FieldLabel>
                      <select
                        value={category}
                        onChange={(event) => setCategory(event.target.value)}
                        className="h-12 w-full rounded-lg border border-border/70 bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                      >
                        <option value="">Pilih kategori</option>
                        {cats.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </section>

                {hasNoWallets ? (
                  <section className="rounded-xl border border-dashed border-border bg-surface-low p-6 text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <WalletIcon className="size-6" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      Belum ada dompet
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      Buat dompet dulu supaya transaksi bisa dicatat ke sumber
                      dana yang benar.
                    </p>
                    <Button
                      type="button"
                      onClick={handleAddWallet}
                      className="mt-4 h-10 gap-2 px-4"
                    >
                      <Plus className="size-4" />
                      Tambah dompet
                    </Button>
                  </section>
                ) : type === "TRANSFER" ? (
                  <section className="space-y-2">
                    <AccountPicker
                      id="transfer-source"
                      label="Dompet sumber"
                      wallets={transferWallets}
                      selectedId={walletId}
                      emptyLabel="Pilih dompet sumber"
                      disabledReason="Saldo tidak cukup"
                      isDisabled={lacksFunds}
                      onSelect={handleSourceSelect}
                    />
                    <div className="flex justify-center">
                      <button
                        type="button"
                        aria-label="Tukar dompet sumber dan tujuan"
                        onClick={handleSwapWallets}
                        className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-sm transition-colors hover:bg-surface-low hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/15"
                      >
                        <ArrowLeftRight className="size-4" />
                      </button>
                    </div>
                    <AccountPicker
                      id="transfer-destination"
                      label="Dompet tujuan"
                      wallets={transferWallets}
                      selectedId={toWalletId}
                      emptyLabel="Pilih dompet tujuan"
                      onSelect={handleDestinationSelect}
                    />
                  </section>
                ) : (
                  <section className="space-y-2">
                    <FieldLabel>Pilih dompet</FieldLabel>
                    <WalletSelectionList
                      wallets={sourceWallets}
                      selected={walletId}
                      emptyLabel="Tidak ada dompet yang tersedia."
                      isDisabled={lacksFunds}
                      onSelect={(id) => {
                        setWalletId(id);
                        setInterestRateOverride(null);
                        setAdminFeeOverride(null);
                      }}
                    />
                  </section>
                )}

                <section className="space-y-2">
                  <FieldLabel>Deskripsi</FieldLabel>
                  <Input
                    type="text"
                    placeholder="Contoh: Belanja mingguan"
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="h-12 border-border/70 bg-card px-3 text-sm"
                  />
                </section>

                {type === "EXPENSE" &&
                  selectedWallet &&
                  isDebtWallet(selectedWallet.type) && (
                    <section className="rounded-xl border border-border/60 bg-surface-low p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <RefreshCw className="size-5" />
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">
                              Jadikan cicilan?
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              Aktif untuk transaksi dari kartu kredit atau
                              paylater.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isInstallment}
                          onClick={() => {
                            setIsInstallment((value) => !value);
                            setInterestRateOverride(null);
                            setAdminFeeOverride(null);
                          }}
                          className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                            isInstallment ? "bg-primary" : "bg-border"
                          }`}
                        >
                          <span
                            className={`inline-block size-5 rounded-full bg-card shadow-sm transition-transform ${
                              isInstallment
                                ? "translate-x-6"
                                : "translate-x-1"
                            }`}
                          />
                        </button>
                      </div>

                      {isInstallment && (
                        <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
                          <div className="space-y-2">
                            <FieldLabel>Tenor</FieldLabel>
                            <div className="grid grid-cols-3 gap-2">
                              {TENORS.map((months) => {
                                const active = installmentMonths === months;
                                return (
                                  <button
                                    key={months}
                                    type="button"
                                    onClick={() => setInstallmentMonths(months)}
                                    className={`h-10 rounded-lg border text-sm font-semibold transition-colors ${
                                      active
                                        ? "border-mint bg-mint/10 text-primary"
                                        : "border-border bg-card text-muted-foreground hover:bg-surface-high"
                                    }`}
                                  >
                                    {months} bulan
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <div className="space-y-2">
                              <FieldLabel>Bunga % / bulan</FieldLabel>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                value={interestRate}
                                onChange={(event) =>
                                  setInterestRateOverride(
                                    event.target.value.replace(/[^\d.,]/g, ""),
                                  )
                                }
                                className="h-11 border-border/70 bg-card"
                              />
                            </div>
                            <div className="space-y-2">
                              <FieldLabel>Admin fee %</FieldLabel>
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                value={adminFee}
                                onChange={(event) =>
                                  setAdminFeeOverride(
                                    event.target.value.replace(/[^\d.,]/g, ""),
                                  )
                                }
                                className="h-11 border-border/70 bg-card"
                              />
                            </div>
                          </div>

                          {matchedPreset && (
                            <p className="text-xs text-muted-foreground">
                              Bunga dan admin fee diisi dari preset{" "}
                              {selectedWallet.name}; nilainya tetap bisa
                              diedit.
                            </p>
                          )}

                          {parsedAmount > 0 && (
                            <p className="rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground">
                              Estimasi:{" "}
                              <strong className="tabular-nums text-primary">
                                Rp {formatRupiah(String(monthlyEst))}/bulan
                              </strong>{" "}
                              × {installmentMonths} bulan
                              {adminRp > 0 && (
                                <>
                                  {" "}
                                  + Rp {formatRupiah(String(adminRp))} admin
                                  sekali bayar
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </section>
                  )}

                {error && (
                  <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
                    {error}
                  </p>
                )}
              </div>

              <footer className="flex flex-col-reverse gap-3 border-t border-border/50 bg-surface-low px-6 py-4 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isCreating}
                  className="h-11 flex-1 bg-card"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isCreating || hasNoWallets}
                  className="h-11 flex-1 gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Menyimpan
                    </>
                  ) : (
                    <>
                      <ActiveIcon className="size-4" />
                      Simpan transaksi
                    </>
                  )}
                </Button>
              </footer>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
