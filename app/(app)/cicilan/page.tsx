"use client";

import { useMemo, useState } from "react";
import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertTriangle,
  Banknote,
  CalendarClock,
  CheckCircle2,
  Landmark,
  Loader2,
  LoaderCircle,
  ShieldCheck,
  Wallet as WalletIcon,
  X,
} from "lucide-react";
import {
  useInstallments,
  usePayInstallment,
  type Installment,
} from "@/src/features/installments/hooks/useInstallments";
import { useWallets } from "@/src/features/wallets/hooks/useWallets";
import { formatCurrency } from "@/lib/utils";
import type { Wallet } from "@/src/types/wallet";

function getDueDate(installment: Installment) {
  const dueDate = new Date(installment.startDate);
  dueDate.setMonth(dueDate.getMonth() + installment.currentTerm);
  return dueDate;
}

function getRemaining(installment: Installment) {
  return Math.max(
    0,
    installment.grandTotal - installment.monthlyAmount * installment.currentTerm,
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function todayStr() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getInstallmentState(installment: Installment) {
  const dueDate = getDueDate(installment);
  const daysUntilDue = Math.ceil(
    (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysUntilDue < 0) {
    return {
      label: "Terlambat",
      button: "Bayar Sekarang",
      border: "border-t-coral",
      badge: "bg-coral/10 text-coral",
      date: "text-coral",
      icon: "text-coral",
    };
  }

  if (daysUntilDue <= 7) {
    return {
      label: "Minggu Ini",
      button: "Bayar Tagihan",
      border: "border-t-amber",
      badge: "bg-amber/10 text-amber",
      date: "text-coral",
      icon: "text-amber",
    };
  }

  return {
    label: "Normal",
    button: "Bayar Tagihan",
    border: "border-t-mint",
    badge: "bg-mint/10 text-mint",
    date: "text-foreground",
    icon: "text-mint",
  };
}

function StatCard({
  label,
  value,
  helper,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: React.ReactNode;
}) {
  return (
    <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-muted-foreground">{label}</p>
        <span className="flex size-9 items-center justify-center rounded-lg bg-surface-high text-primary">
          {icon}
        </span>
      </div>
      <h3 className="text-[32px] font-bold leading-10 tabular-nums text-foreground">
        {value}
      </h3>
      <p className="mt-4 text-xs text-muted-foreground">{helper}</p>
    </article>
  );
}

function InstallmentCard({
  installment,
  onPay,
}: {
  installment: Installment;
  onPay: (installment: Installment) => void;
}) {
  const state = getInstallmentState(installment);
  const dueDate = getDueDate(installment);
  const progress =
    installment.installmentMonths > 0
      ? Math.min(
          100,
          Math.round(
            (installment.currentTerm / installment.installmentMonths) * 100,
          ),
        )
      : 0;

  return (
    <article
      className={`flex flex-col rounded-xl border border-border/70 bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md border-t-4 ${state.border}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-xl font-semibold text-primary">
            {installment.description || installment.walletName}
          </h4>
          <p className="mt-1 text-xs text-muted-foreground">
            {installment.walletType === "CREDIT_CARD" ? "Kredit" : "Paylater"} ·{" "}
            {installment.walletName}
          </p>
        </div>
        <span
          className={`rounded px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${state.badge}`}
        >
          {state.label}
        </span>
      </div>

      <div className="flex-1 space-y-4">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-xs font-medium text-muted-foreground">
            Cicilan Bulanan
          </span>
          <span className="text-lg font-semibold tabular-nums text-primary">
            {formatCurrency(installment.monthlyAmount)}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-xs font-medium text-muted-foreground">
            Sisa Pinjaman
          </span>
          <span className="text-sm font-medium tabular-nums text-foreground">
            {formatCurrency(getRemaining(installment))}
          </span>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-xs font-medium text-muted-foreground">
            Jatuh Tempo
          </span>
          <span className={`text-sm font-medium ${state.date}`}>
            {formatDate(dueDate)}
          </span>
        </div>
      </div>

      <div className="mt-6 border-t border-border/70 pt-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Progres repayment</span>
          <span className="text-xs font-medium text-primary">
            {installment.currentTerm}/{installment.installmentMonths} Bulan
          </span>
        </div>
        <div className="h-3 w-full overflow-hidden rounded-full bg-surface-high">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onPay(installment)}
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
      >
        <Banknote className="size-5" />
        {state.button}
      </button>
    </article>
  );
}

function PaymentModal({
  installment,
  wallets,
  isPaying,
  error,
  onClose,
  onPay,
}: {
  installment: Installment | null;
  wallets: Wallet[];
  isPaying: boolean;
  error: string;
  onClose: () => void;
  onPay: (sourceWalletId: string, date: string) => void;
}) {
  const [selectedWalletId, setSelectedWalletId] = useState("");
  const [paymentDate, setPaymentDate] = useState(todayStr);
  const sourceWallets = wallets.filter(
    (wallet) => wallet.type === "BANK" || wallet.type === "CASH",
  );

  if (!installment) return null;

  const dueDate = getDueDate(installment);

  return (
    <AnimatePresence>
      <motion.div
        key="installment-payment-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="fixed inset-0 z-60 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm md:p-10"
        onClick={onClose}
      >
        <motion.div
          key="installment-payment-card"
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 12 }}
          transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
          onClick={(event) => event.stopPropagation()}
          className="flex max-h-[90vh] w-full max-w-[560px] flex-col overflow-hidden rounded-xl border border-border/70 bg-card shadow-2xl"
        >
          <header className="border-b border-border/70 bg-surface-low p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  Bayar Tagihan
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {installment.description || installment.walletName}
                </p>
              </div>
              <button
                type="button"
                aria-label="Tutup modal pembayaran"
                onClick={onClose}
                className="flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>
          </header>

          <div className="flex-1 space-y-6 overflow-y-auto p-6">
            <section className="space-y-3">
              <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Rekening sumber
              </label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {sourceWallets.map((wallet) => {
                  const active = selectedWalletId === wallet.id;
                  const disabled = wallet.balance < installment.monthlyAmount;
                  return (
                    <button
                      key={wallet.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => setSelectedWalletId(wallet.id)}
                      className={`rounded-lg border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
                        active
                          ? "border-mint bg-mint/10"
                          : "border-border/70 bg-surface-low hover:border-primary/30"
                      }`}
                    >
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-primary">
                          {wallet.name}
                        </span>
                        {active ? (
                          <CheckCircle2 className="size-4 text-mint" />
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold tabular-nums text-foreground">
                        {formatCurrency(wallet.balance)}
                      </p>
                    </button>
                  );
                })}
              </div>
              {sourceWallets.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border bg-surface-low p-4 text-sm text-muted-foreground">
                  Tidak ada rekening bank atau kas yang bisa dipakai membayar.
                </p>
              ) : null}
            </section>

            <section className="space-y-4 rounded-xl border border-border/70 bg-card p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">
                    Nama tagihan
                  </p>
                  <p className="text-base font-semibold text-foreground">
                    {installment.description || "Tagihan cicilan"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="mb-1 text-xs text-muted-foreground">
                    Jatuh tempo
                  </p>
                  <p className="text-base font-semibold text-coral">
                    {formatDate(dueDate)}
                  </p>
                </div>
              </div>
              <div className="border-t border-border/70 pt-4">
                <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  Jumlah pembayaran
                </label>
                <div className="relative mt-2">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[28px] font-semibold text-muted-foreground">
                    Rp
                  </span>
                  <input
                    readOnly
                    value={new Intl.NumberFormat("id-ID").format(
                      installment.monthlyAmount,
                    )}
                    className="w-full border-b-2 border-border bg-transparent py-3 pl-12 pr-4 text-[32px] font-semibold tabular-nums text-foreground outline-none"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Opsi pembayaran
              </label>
              <div className="rounded-lg border border-primary bg-surface-low p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-4 items-center justify-center rounded-full border border-primary">
                      <span className="size-2 rounded-full bg-primary" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Bayar cicilan bulan ini
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Menaikkan progres satu term
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-primary">
                    {formatCurrency(installment.monthlyAmount)}
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Tanggal pembayaran
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(event) => setPaymentDate(event.target.value)}
                  className="h-11 w-full rounded-lg border border-border/70 bg-card px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </section>

            {error ? (
              <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
                {error}
              </p>
            ) : null}
          </div>

          <footer className="flex flex-col gap-3 border-t border-border/70 bg-surface-low p-6">
            <button
              type="button"
              disabled={!selectedWalletId || isPaying}
              onClick={() => onPay(selectedWalletId, paymentDate)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/10 transition-all hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isPaying ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-5" />
              )}
              Konfirmasi Pembayaran
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPaying}
              className="h-11 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-muted-foreground transition-colors hover:bg-surface-high disabled:opacity-50"
            >
              Batal
            </button>
          </footer>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function CicilanPage() {
  const { data: installments, isLoading } = useInstallments();
  const { data: walletsData } = useWallets();
  const payInstallment = usePayInstallment();
  const [selectedInstallment, setSelectedInstallment] =
    useState<Installment | null>(null);
  const [paymentError, setPaymentError] = useState("");

  const all = useMemo(() => installments ?? [], [installments]);
  const wallets = useMemo(() => walletsData ?? [], [walletsData]);
  const active = useMemo(
    () =>
      all
        .filter((installment) => installment.status === "ACTIVE")
        .sort((a, b) => getDueDate(a).getTime() - getDueDate(b).getTime()),
    [all],
  );

  const totalMonthly = active.reduce(
    (sum, installment) => sum + installment.monthlyAmount,
    0,
  );
  const totalRemaining = active.reduce(
    (sum, installment) => sum + getRemaining(installment),
    0,
  );
  const attentionCount = active.filter((installment) => {
    const dueDate = getDueDate(installment);
    const daysUntilDue = Math.ceil(
      (dueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
    );
    return daysUntilDue <= 7;
  }).length;
  const institutions = new Set(
    active.map((installment) => installment.walletName),
  ).size;

  async function handlePay(sourceWalletId: string, date: string) {
    if (!selectedInstallment) return;
    setPaymentError("");
    try {
      await payInstallment.mutateAsync({
        installmentId: selectedInstallment.id,
        sourceWalletId,
        amount: selectedInstallment.monthlyAmount,
        date,
      });
      setSelectedInstallment(null);
    } catch (err) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setPaymentError(message ?? "Pembayaran gagal diproses. Coba lagi.");
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoaderCircle
          className="h-12 w-12 animate-spin text-primary"
          aria-label="Memuat cicilan"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="mb-1 text-[32px] font-semibold leading-10 text-primary">
            Cicilan
          </h1>
          <p className="text-base text-muted-foreground">
            Pantau prioritas pembayaran dan lunasi tagihan berkala tepat waktu
          </p>
        </div>
      </section>

      {attentionCount > 0 ? (
        <div className="flex items-center gap-3 rounded-lg border border-amber/30 border-t-4 border-t-amber bg-amber/10 p-4">
          <AlertTriangle className="size-5 text-amber" />
          <p className="text-sm font-medium text-foreground">
            {attentionCount} pembayaran membutuhkan perhatian minggu ini.
          </p>
        </div>
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total Sisa Cicilan"
          value={formatCurrency(totalRemaining)}
          helper="Terhitung dari cicilan aktif"
          icon={<Landmark className="size-5" />}
        />
        <StatCard
          label="Pembayaran Bulan Ini"
          value={formatCurrency(totalMonthly)}
          helper={`${attentionCount} jatuh tempo minggu ini`}
          icon={<CalendarClock className="size-5" />}
        />
        <StatCard
          label="Cicilan Aktif"
          value={String(active.length)}
          helper={`${institutions} institusi berbeda`}
          icon={<WalletIcon className="size-5" />}
        />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {active.map((installment) => (
          <InstallmentCard
            key={installment.id}
            installment={installment}
            onPay={(item) => {
              setPaymentError("");
              setSelectedInstallment(item);
            }}
          />
        ))}
      </section>

      {active.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border bg-card py-10 text-center text-sm text-muted-foreground">
          Tidak ada cicilan aktif.
        </p>
      ) : null}

      <PaymentModal
        installment={selectedInstallment}
        wallets={wallets}
        isPaying={payInstallment.isPending}
        error={paymentError}
        onClose={() => {
          if (!payInstallment.isPending) {
            setSelectedInstallment(null);
            setPaymentError("");
          }
        }}
        onPay={handlePay}
      />
    </div>
  );
}
