"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  Filter,
  Plus,
  ReceiptText,
  Repeat2,
  Wallet,
  CreditCard,
  Banknote,
  Smartphone,
} from "lucide-react";
import {
  useCreateTransaction,
  useMonthlySummary,
  useTransactions,
} from "@/src/features/transactions/hooks/useTransactions";
import { useWallets } from "@/src/features/wallets/hooks/useWallets";
import { useBills } from "@/src/features/bills/hooks/useBills";
import { formatCurrency } from "@/lib/utils";
import { isDebtWallet, type Wallet as WalletType } from "@/src/types/wallet";
import {
  AddTransactionModal,
  type AddTransactionData,
} from "@/app/(app)/transactions/components/AddTransactionModal";

function getWalletKind(walletItem: WalletType) {
  if (isDebtWallet(walletItem.type)) {
    return walletItem.type === "CREDIT_CARD" ? "Kartu kredit" : "Pinjaman";
  }

  if (walletItem.type === "BANK") return "Kas & Bank";
  if (walletItem.type === "E_WALLET") return "E-Wallet";
  return "Kas";
}

function renderWalletIcon(walletItem: WalletType, className: string) {
  if (isDebtWallet(walletItem.type)) {
    return <CreditCard className={className} />;
  }

  if (walletItem.type === "BANK") {
    return <Banknote className={className} />;
  }

  if (walletItem.type === "E_WALLET") {
    return <Smartphone className={className} />;
  }

  return <Wallet className={className} />;
}

function DashboardWalletCard({ walletItem }: { walletItem: WalletType }) {
  const isDebt = isDebtWallet(walletItem.type);
  const amount = isDebt ? Math.abs(walletItem.balance) : walletItem.balance;

  return (
    <Link
      href="/wallets"
      className={`group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md ${
        isDebt ? "hover:border-coral/40" : "hover:border-mint/40"
      }`}
    >
      <div
        className={`absolute left-0 top-0 h-1 w-full ${
          isDebt ? "bg-coral/40" : "bg-mint/40"
        }`}
      />
      <div className="mb-6 flex items-start justify-between">
        {renderWalletIcon(
          walletItem,
          `size-5 ${isDebt ? "text-coral" : "text-mint"}`,
        )}
        <span className="text-xs text-muted-foreground">{walletItem.name}</span>
      </div>
      <p className="mb-1 text-sm text-muted-foreground">
        {getWalletKind(walletItem)}
      </p>
      <p className="text-xl font-bold tabular-nums text-foreground">
        {formatCurrency(amount)}
      </p>
      <p
        className={`mt-1 text-xs ${
          isDebt ? "text-muted-foreground" : "text-mint"
        }`}
      >
        {isDebt ? "Saldo terutang" : "Aset aktif"}
      </p>
    </Link>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useTransactions();
  const { data: walletsData } = useWallets();
  const createTransaction = useCreateTransaction();
  const transactions = useMemo(() => data ?? [], [data]);
  const wallets = useMemo(() => walletsData ?? [], [walletsData]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleAddSubmit = useCallback(
    async (transactionData: AddTransactionData) => {
      setIsCreating(true);
      try {
        await createTransaction.mutateAsync(transactionData);
        setIsAddModalOpen(false);
      } catch (err) {
        console.error("Failed to add transaction:", err);
        throw err;
      } finally {
        setIsCreating(false);
      }
    },
    [createTransaction],
  );

  useEffect(() => {
    const handler = () => setIsAddModalOpen(true);
    window.addEventListener("fab-add-transaction", handler);
    return () => window.removeEventListener("fab-add-transaction", handler);
  }, []);

  const { totalAssets, totalDebts, netWorth } = useMemo(() => {
    const assets = wallets
      .filter((walletItem) => !isDebtWallet(walletItem.type))
      .reduce((sum, walletItem) => sum + walletItem.balance, 0);
    const debts = wallets
      .filter((walletItem) => isDebtWallet(walletItem.type))
      .reduce((sum, walletItem) => sum + Math.abs(walletItem.balance), 0);

    return { totalAssets: assets, totalDebts: debts, netWorth: assets };
  }, [wallets]);

  const { data: summary } = useMonthlySummary();
  const netSavings = summary?.netSavings ?? 0;
  const { data: bills = [] } = useBills();
  const activeBills = bills.filter(
    (bill) => bill.status === "ACTIVE" || bill.status === "OVERDUE",
  );

  const dashboardWallets = useMemo(
    () => wallets.filter((walletItem) => !walletItem.isArchived).slice(0, 4),
    [wallets],
  );

  const reportingCutoff = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date()),
    [],
  );

  return (
    <div
      className="space-y-6"
      style={{
        opacity: isLoading ? 0.64 : 1,
        transition: "opacity 0.2s ease-in-out",
      }}
    >
      <section className="rounded-xl border border-primary/20 bg-primary p-6 text-primary-foreground shadow-sm md:p-8">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-white/60">
              Posisi keuangan bersih
            </p>
            <h2 className="mt-3 text-[32px] font-semibold leading-tight tabular-nums md:text-[40px]">
              {formatCurrency(netWorth)}
            </h2>
          </div>
          <div className="text-sm text-white/45 md:text-right">
            <p>Cutoff: {reportingCutoff}</p>
            <p className="mt-1">Terakhir diperbarui: sekarang</p>
          </div>
        </div>
        <div className="grid gap-8 border-t border-white/10 pt-8 md:grid-cols-3">
          <div>
            <p className="text-[12px] font-semibold text-mint">Total aset</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatCurrency(totalAssets)}
            </p>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-coral">Total hutang</p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatCurrency(totalDebts)}
            </p>
          </div>
          <div>
            <p className="text-[12px] font-semibold text-white/60">
              Selisih bulan ini
            </p>
            <p className="mt-1 text-xl font-semibold tabular-nums">
              {formatCurrency(netSavings)}
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/30 bg-surface-low px-6 py-4">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div className="flex items-center gap-2">
            <ReceiptText className="size-[18px] text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {transactions.length} transaksi tercatat
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarClock className="size-[18px] text-amber" />
            <span className="text-sm text-muted-foreground">
              {activeBills.length > 0
                ? `${activeBills.length} tagihan aktif`
                : "Tidak ada tagihan aktif"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-mint/10 px-3 py-1 text-mint">
          <CheckCircle2 className="size-4" />
          <span className="text-xs font-semibold">Data sinkron</span>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          Aksi cepat
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link
            href="/wallets"
            className="group flex h-14 items-center justify-center gap-3 rounded-lg border border-border/60 bg-card px-4 text-sm font-semibold transition-all hover:border-primary/40 hover:bg-surface-low"
          >
            <Wallet className="size-5 text-primary transition-transform group-hover:scale-110" />
            Dompet
          </Link>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="group flex h-14 items-center justify-center gap-3 rounded-lg border border-border/60 bg-card px-4 text-sm font-semibold transition-all hover:border-primary/40 hover:bg-surface-low"
          >
            <Repeat2 className="size-5 text-primary transition-transform group-hover:scale-110" />
            Transfer
          </button>
          <Link
            href="/tagihan"
            className="group flex h-14 items-center justify-center gap-3 rounded-lg border border-border/60 bg-card px-4 text-sm font-semibold transition-all hover:border-primary/40 hover:bg-surface-low"
          >
            <ReceiptText className="size-5 text-primary transition-transform group-hover:scale-110" />
            Tagihan
          </Link>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="group flex h-14 items-center justify-center gap-3 rounded-lg border border-border/60 bg-card px-4 text-sm font-semibold transition-all hover:border-primary/40 hover:bg-surface-low"
          >
            <Plus className="size-5 text-primary transition-transform group-hover:scale-110" />
            Transaksi
          </button>
        </div>
      </section>

      {walletsData && dashboardWallets.length === 0 ? (
        <Link
          href="/wallets"
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-10 text-sm font-semibold text-primary transition-opacity hover:opacity-75"
        >
          <Plus className="size-4" />
          Tambah dompet
        </Link>
      ) : (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-foreground">Dompet</h3>
            <Link
              href="/wallets"
              className="text-[12px] font-semibold text-primary/70 transition-colors hover:text-primary"
            >
              Lihat semua
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
            {dashboardWallets.map((walletItem) => (
              <DashboardWalletCard
                key={walletItem.id}
                walletItem={walletItem}
              />
            ))}
            {dashboardWallets.length === 0 &&
              !walletsData &&
              [...Array(4)].map((_, index) => (
                <div
                  key={index}
                  className="h-[150px] animate-pulse rounded-xl border border-border bg-card"
                />
              ))}
          </div>
        </section>
      )}

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">
            Aktivitas terakhir
          </h3>
          <button
            type="button"
            aria-label="Filter aktivitas"
            className="rounded-lg border border-border/60 p-2 text-muted-foreground transition-colors hover:bg-surface-low"
          >
            <Filter className="size-5" />
          </button>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="hidden grid-cols-[1fr_180px_180px] border-b border-border/40 bg-surface-low/50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground md:grid">
            <span>Kategori & deskripsi</span>
            <span>Dompet</span>
            <span className="text-right">Jumlah</span>
          </div>
          <div className="divide-y divide-border/30">
            {transactions.slice(0, 5).map((transaction, index) => (
              <div
                key={transaction.id || index}
                className="grid gap-4 px-6 py-5 transition-colors hover:bg-surface-low/40 md:grid-cols-[1fr_180px_180px] md:items-center"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                      transaction.type === "INCOME" ? "bg-mint/12" : "bg-surface-high"
                    }`}
                  >
                    {transaction.type === "INCOME" ? (
                      <ArrowUpRight className="size-5 text-mint" />
                    ) : (
                      <ArrowDownLeft className="size-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {transaction.description || "Transaksi"}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground md:text-foreground/75">
                  {wallets.find((walletItem) => walletItem.id === transaction.walletId)
                    ?.name ?? "-"}
                </p>
                <p
                  className={`text-left text-sm font-bold tabular-nums md:text-right ${
                    transaction.type === "INCOME" ? "text-mint" : "text-coral"
                  }`}
                >
                  {transaction.type === "EXPENSE" ? "-" : "+"}
                  {formatCurrency(transaction.amount)}
                </p>
              </div>
            ))}
          </div>

          {transactions.length === 0 && !isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Belum ada transaksi
            </p>
          )}
          {isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Memuat...
            </p>
          )}
        </div>
      </section>

      <AddTransactionModal
        isOpen={isAddModalOpen}
        isCreating={isCreating}
        wallets={wallets}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
}
