"use client";

import { useMemo, useState, useCallback, useEffect, FormEvent } from "react";
import { useTransactions, useCreateTransaction } from "@/src/features/transactions/hooks/useTransactions";
import { useWallets } from "@/src/features/wallets/hooks/useWallets";
import { WalletCard } from "@/components/WalletCard";
import { Plus, X, Loader2, TrendingUp, TrendingDown, ChevronDown } from "lucide-react";
import type { Wallet } from "@/src/types/wallet";

const ASSET_TYPES = ["BANK_ACCOUNT", "E_WALLET", "CASH", "SAVINGS", "INVESTMENT", "CRYPTO"];
const DEBT_TYPES = ["CREDIT_CARD", "LOAN", "PAYLATER"];

export default function DashboardPage() {
  const { data, isLoading } = useTransactions();
  const { data: walletsData } = useWallets();
  const createTransaction = useCreateTransaction();
  const transactions = useMemo(() => data ?? [], [data]);
  const wallets = useMemo(() => walletsData ?? [], [walletsData]);

  // ── Add Transaction Modal State ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addDescription, setAddDescription] = useState("");
  const [addAmount, setAddAmount] = useState("");
  const [addType, setAddType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [addWalletId, setAddWalletId] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleAddAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");
    const formatted = raw.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    setAddAmount(formatted);
  }, []);

  const handleAddSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    const rawAmount = addAmount.replace(/\./g, "");
    const parsedAmount = Number(rawAmount);
    if (!addDescription.trim() || isNaN(parsedAmount) || parsedAmount <= 0) return;

    setIsCreating(true);
    try {
      await createTransaction.mutateAsync({
        description: addDescription.trim(),
        amount: parsedAmount,
        type: addType,
        date: new Date().toISOString(),
        walletId: addWalletId || undefined,
      });
      setIsAddModalOpen(false);
      setAddDescription("");
      setAddAmount("");
      setAddType("EXPENSE");
      setAddWalletId("");
    } catch (err) {
      console.error("Gagal menambah transaksi:", err);
    } finally {
      setIsCreating(false);
    }
  }, [addDescription, addAmount, addType, addWalletId, createTransaction]);

  const openAddTransaction = useCallback(() => setIsAddModalOpen(true), []);

  // Listen for FAB button click from TopBar (cross-component event bridge)
  useEffect(() => {
    const handler = () => setIsAddModalOpen(true);
    window.addEventListener("fab-add-transaction", handler);
    return () => window.removeEventListener("fab-add-transaction", handler);
  }, []);

  const { totalAssets, totalDebts, netWorth } = useMemo(() => {
    const assets = wallets
      .filter((w) => ASSET_TYPES.includes(w.type))
      .reduce((sum, w) => sum + w.balance, 0);
    const debts = wallets
      .filter((w) => DEBT_TYPES.includes(w.type))
      .reduce((sum, w) => sum + Math.abs(w.balance), 0);
    return { totalAssets: assets, totalDebts: debts, netWorth: assets - debts };
  }, [wallets]);

  const { income, expense } = useMemo(() => {
    const inc = transactions
      .filter((t) => t.type === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const exp = transactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income: inc, expense: exp };
  }, [transactions]);

  const netSavings = income - expense;

  const formatRupiah = (amount: number) =>
    `Rp ${amount.toLocaleString("id-ID")}`;

  const dashboardWallets = useMemo(
    () => wallets.filter((w) => !w.isArchived).slice(0, 2),
    [wallets],
  );

  return (
    <div className="w-full min-h-full bg-background text-foreground flex flex-col gap-6 select-none overflow-x-hidden">
      {/* ── MAIN TWO-COLUMN SPLIT ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start max-w-7xl mx-auto">
        
        {/* LEFT COLUMN: HERO + WALLETS + TRANSACTIONS */}
        <div className="lg:col-span-2 flex flex-col gap-6 w-full">
          
          {/* 1. NET WORTH HERO CARD */}
          <div className="bg-card border border-border rounded-lg p-6 flex flex-col gap-3 w-full">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
              Total Net Worth
            </span>
            <div className="flex items-baseline gap-4">
              <h2 className="text-3xl font-heading font-bold text-primary">
                {formatRupiah(netWorth)}
              </h2>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                +4.2% bulan ini
              </span>
            </div>
              <div className="flex gap-4 mt-2">
              <div>
                <span className="text-xs text-muted-foreground">Total Aset</span>
                <p className="text-sm font-semibold text-foreground">{formatRupiah(totalAssets)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Total Utang</span>
                <p className="text-sm font-semibold text-destructive">{formatRupiah(totalDebts)}</p>
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Net Savings</span>
                <p className={`text-sm font-semibold ${netSavings >= 0 ? "text-foreground" : "text-destructive"}`}>
                  {formatRupiah(netSavings)}
                </p>
              </div>
            </div>
          </div>

          {/* 2. WALLETS OVERVIEW GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {dashboardWallets.length > 0 &&
              dashboardWallets.map((w) => (
                <WalletCard key={w.id} wallet={w} variant="compact" />
              ))}
            {dashboardWallets.length === 0 &&
              !walletsData &&
              [...Array(2)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse bg-card border border-border rounded-lg"
                  style={{ height: "100px" }}
                />
              ))}
          </div>

          {/* 3. RECENT TRANSACTIONS */}
          <div className="bg-card border border-border rounded-lg p-6 w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono font-semibold">
                Transaksi Terbaru
              </span>
              <span className="text-[11px] font-semibold text-primary cursor-pointer">
                Lihat semua &rarr;
              </span>
            </div>
            {transactions.slice(0, 5).map((t, i) => (
              <div key={t.id || i}>
                {i > 0 && <div className="h-px bg-border" />}
                <div className="flex items-center py-2">
                  <div
                    className="flex items-center justify-center shrink-0 rounded-lg"
                    style={{
                      width: "32px",
                      height: "32px",
                      backgroundColor: t.type === "INCOME" ? "rgba(74,222,128,0.12)" : "rgba(255,180,171,0.12)",
                      color: t.type === "INCOME" ? "#4ade80" : "#ffb4ab",
                    }}
                  >
                    <span className="text-sm">{t.type === "INCOME" ? "\u2191" : "\u2193"}</span>
                  </div>
                  <div className="ml-2 flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">
                      {t.description || "Transaction"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(t.date).toLocaleDateString("id-ID", { day: "numeric", month: "short" })} &middot;{" "}
                      {t.categoryId ?? "Uncategorized"}
                    </div>
                  </div>
                    <div className="text-right shrink-0 ml-2">
                    <div
                      className="text-xs font-mono font-medium"
                      style={{ color: t.type === "EXPENSE" ? "#ffb4ab" : "#4ade80" }}
                    >
                    {t.type === "EXPENSE" ? "-" : "+"}{formatRupiah(t.amount)}
                    </div>
                    <div className="text-[11px] text-disabled">
                      {wallets.find((w) => w.id === t.walletId)?.name ?? "-"}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && !isLoading && (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Belum ada transaksi
              </div>
            )}
            {isLoading && (
              <div className="text-sm text-muted-foreground py-4 text-center">
                Memuat...
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SIDEBAR METRICS */}
        <div className="lg:col-span-1 flex flex-col gap-6 w-full">

          {/* Monthly P&L */}
          <div className="bg-card border border-border rounded-lg p-6 w-full">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono font-semibold mb-3 block">
              Monthly P&L
            </span>
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-primary" />
                <span className="text-xs text-muted-foreground">Pemasukan</span>
              </div>
              <span className="text-xs font-semibold font-heading text-primary">{formatRupiah(income)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <div className="size-1.5 rounded-full bg-destructive" />
                <span className="text-xs text-muted-foreground">Pengeluaran</span>
              </div>
              <span className="text-xs font-semibold font-heading text-destructive">{formatRupiah(expense)}</span>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between py-1.5">
              <div className="flex items-center gap-2">
                <div className={`size-1.5 rounded-full ${netSavings >= 0 ? "bg-primary" : "bg-destructive"}`} />
                <span className="text-xs text-muted-foreground">Net Savings</span>
              </div>
                <span className={`text-xs font-semibold font-heading ${netSavings >= 0 ? "text-foreground" : "text-destructive"}`}>
                {formatRupiah(netSavings)}
              </span>
            </div>
          </div>

          {/* Pengeluaran / Category Limits */}
          <div className="bg-card border border-border rounded-lg p-6 w-full">
            <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono font-semibold mb-3 block">
              Pengeluaran
            </span>
            {(() => {
              const categoryMap = new Map<string, number>();
              transactions
                .filter((t) => t.type === "EXPENSE")
                .forEach((t) => {
                  const cat = t.categoryId ?? "Lainnya";
                  categoryMap.set(cat, (categoryMap.get(cat) || 0) + t.amount);
                });
              const totalExpense = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0) || 1;
              const sorted = Array.from(categoryMap.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5);

              return sorted.map(([cat, amt], i) => {
                const pct = Math.round((amt / totalExpense) * 100);
                return (
                  <div key={cat}>
                    {i > 0 && <div className="h-px bg-border my-1.5" />}
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs text-muted-foreground w-[52px] truncate shrink-0">
                        {cat}
                      </span>
                      <div className="flex-1 h-1 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-medium text-foreground shrink-0">
                        {formatRupiah(amt)}
                      </span>
                    </div>
                  </div>
                );
              });
            })()}
            {transactions.filter((t) => t.type === "EXPENSE").length === 0 && (
              <div className="text-sm text-muted-foreground py-3 text-center">
                Belum ada pengeluaran
              </div>
            )}
          </div>

          {/* Cicilan Aktif */}
          <div className="bg-card border border-border rounded-lg p-6 w-full">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-muted-foreground font-mono font-semibold">
                Cicilan Aktif
              </span>
              <span className="text-xs font-semibold text-primary cursor-pointer">
                Lihat semua &rarr;
              </span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold font-heading text-foreground">Kredivo</span>
                <span className="text-xs text-muted-foreground">3/12</span>
              </div>
              <div className="text-xs text-muted-foreground mb-1.5">
                Cicilan laptop - Rp 350.000/bln
              </div>
              <div className="h-1 bg-border rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-primary" style={{ width: "25%" }} />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>25% lunas</span>
                <span>9 cicilan lagi</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Transaction Modal ── */}
      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center"
          style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
          onClick={() => { if (!isCreating) setIsAddModalOpen(false); }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-lg w-full max-w-md mx-4"
          >
            {/* Header */}
            <div className="pt-5 px-6 pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold font-heading text-foreground">Tambah Transaksi</h3>
                  <p className="text-xs text-disabled mt-0.5">Catat pemasukan atau pengeluaran baru</p>
                </div>
                <button
                  onClick={() => { if (!isCreating) setIsAddModalOpen(false); }}
                  className="flex items-center justify-center size-8 rounded-md text-muted-foreground"
                  style={{ background: "none", border: "none", cursor: "pointer" }}
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="h-px bg-border mx-6" />
            {/* Form */}
            <form onSubmit={handleAddSubmit} className="px-6 pb-6 pt-4 flex flex-col gap-4">
              {/* Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Deskripsi Transaksi</label>
                <input
                  type="text"
                  placeholder="Beli kopi, Gaji bulanan..."
                  value={addDescription}
                  onChange={(e) => setAddDescription(e.target.value)}
                  required
                  className="h-11 px-3 bg-input border border-border rounded-md text-sm text-foreground outline-none"
                />
              </div>
              {/* Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Jumlah / Nominal</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-disabled pointer-events-none">Rp</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="0"
                    value={addAmount}
                    onChange={handleAddAmountChange}
                    required
                    className="h-11 pl-9 pr-3 bg-input border border-border rounded-md text-sm text-foreground outline-none w-full"
                  />
                </div>
              </div>
              {/* Wallet */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Wallet / Sumber Dana</label>
                <div className="relative">
                  <select
                    value={addWalletId}
                    onChange={(e) => setAddWalletId(e.target.value)}
                    className="h-11 pl-3 pr-10 bg-input border border-border rounded-md text-sm text-foreground outline-none w-full appearance-none"
                  >
                    <option value="" className="bg-card text-muted-foreground">Pilih wallet (opsional)</option>
                    {wallets.map((w: Wallet) => (
                      <option key={w.id} value={w.id} className="bg-card text-foreground">
                        {w.name} — {w.type.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="size-4 absolute right-3 top-1/2 -translate-y-1/2 text-disabled pointer-events-none" />
                </div>
              </div>
              {/* Type toggle */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tipe Transaksi</label>
                <div className="flex gap-2">
                  {(["EXPENSE", "INCOME"] as const).map((type) => {
                    const active = addType === type;
                    const label = type === "EXPENSE" ? "Pengeluaran" : "Pemasukan";
                    const TypeIcon = type === "EXPENSE" ? TrendingDown : TrendingUp;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setAddType(type)}
                        className={`flex-1 flex items-center justify-center gap-2 h-11 rounded-md text-sm font-medium cursor-pointer transition-all ${
                          active
                            ? type === "EXPENSE"
                              ? "bg-destructive/15 border border-destructive/40 text-destructive"
                              : "bg-primary/15 border border-primary/40 text-primary"
                            : "bg-card border border-border text-disabled"
                        }`}
                      >
                        <TypeIcon className="size-4" />
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
              {/* Actions */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => { if (!isCreating) setIsAddModalOpen(false); }}
                  className="flex-1 h-11 bg-highlight border border-border rounded-md text-sm text-muted-foreground cursor-pointer transition-opacity hover:opacity-80"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 h-11 bg-primary text-primary-foreground rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreating ? (
                    <><Loader2 className="size-4 animate-spin" /> Menyimpan...</>
                  ) : (
                    "Simpan Transaksi"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}