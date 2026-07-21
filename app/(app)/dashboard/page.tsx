"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
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
import { useDashboardSummary } from "@/src/features/dashboard/hooks/useDashboardSummary";
import { formatCurrency } from "@/lib/utils";
import { INTL_LOCALE } from "@/i18n/config";
import { isDebtWallet, type Wallet as WalletType } from "@/src/types/wallet";
import {
  AddTransactionModal,
  type AddTransactionData,
} from "@/app/(app)/transactions/components/AddTransactionModal";
import { DashboardHeroCard } from "@/app/(app)/dashboard/components/DashboardHeroCard";

function useWalletKind() {
  const t = useTranslations("walletKind");
  return (walletItem: WalletType) => {
    if (isDebtWallet(walletItem.type)) {
      return walletItem.type === "CREDIT_CARD" ? t("creditCard") : t("loan");
    }

    if (walletItem.type === "BANK") return t("bankAndCash");
    if (walletItem.type === "E_WALLET") return t("eWallet");
    return t("cash");
  };
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
  const tKind = useTranslations("walletKind");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];
  const getWalletKind = useWalletKind();
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
        {formatCurrency(amount, intlLocale)}
      </p>
      <p
        className={`mt-1 text-xs ${
          isDebt ? "text-muted-foreground" : "text-mint"
        }`}
      >
        {isDebt ? tKind("outstandingBalance") : tKind("activeAsset")}
      </p>
    </Link>
  );
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const tNav = useTranslations("nav");
  const tTx = useTranslations("transactions");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];
  const { data, isLoading } = useTransactions();
  const { data: walletsData } = useWallets();
  const createTransaction = useCreateTransaction();
  const transactions = useMemo(() => data ?? [], [data]);
  const wallets = useMemo(() => walletsData ?? [], [walletsData]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalType, setAddModalType] =
    useState<AddTransactionData["type"]>("EXPENSE");
  // Key naik tiap buka: modal remount bersih dengan tab awal sesuai aksi cepat
  const [addModalKey, setAddModalKey] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  const openAddModal = useCallback((type: AddTransactionData["type"]) => {
    setAddModalType(type);
    setAddModalKey((key) => key + 1);
    setIsAddModalOpen(true);
  }, []);

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
    const handler = () => openAddModal("EXPENSE");
    window.addEventListener("fab-add-transaction", handler);
    return () => window.removeEventListener("fab-add-transaction", handler);
  }, [openAddModal]);

  const {
    data: dashboardSummary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
  } = useDashboardSummary();

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

  return (
    <div
      className="space-y-6"
      style={{
        opacity: isLoading ? 0.64 : 1,
        transition: "opacity 0.2s ease-in-out",
      }}
    >
      <DashboardHeroCard
        netWorth={dashboardSummary?.netWorth ?? 0}
        totalAssets={dashboardSummary?.totalAssets ?? 0}
        totalDebts={dashboardSummary?.totalDebts ?? 0}
        netSavings={netSavings}
        isLoading={isSummaryLoading && !dashboardSummary}
        isError={isSummaryError}
      />

      <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-border/30 bg-surface-low px-6 py-4">
        <div className="flex items-center gap-2">
          <ReceiptText className="size-[18px] text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {t("transactionsRecorded", { count: transactions.length })}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <CalendarClock className="size-[18px] text-amber" />
          <span className="text-sm text-muted-foreground">
            {activeBills.length > 0
              ? t("activeInstallments", { count: activeBills.length })
              : t("noActiveInstallments")}
          </span>
        </div>
      </section>

      <section className="space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
          {t("quickActions")}
        </h3>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Link
            href="/wallets"
            className="group flex h-14 items-center justify-center gap-3 rounded-lg border border-border/60 bg-card px-4 text-sm font-semibold transition-all hover:border-primary/40 hover:bg-surface-low"
          >
            <Wallet className="size-5 text-primary transition-transform group-hover:scale-110" />
            {t("wallets")}
          </Link>

          <Link
            href="/tagihan"
            className="group flex h-14 items-center justify-center gap-3 rounded-lg border border-border/60 bg-card px-4 text-sm font-semibold transition-all hover:border-primary/40 hover:bg-surface-low"
          >
            <ReceiptText className="size-5 text-primary transition-transform group-hover:scale-110" />
            {tNav("installments")}
          </Link>
          <button
            type="button"
            onClick={() => openAddModal("TRANSFER")}
            className="group flex h-14 items-center justify-center gap-3 rounded-lg border border-border/60 bg-card px-4 text-sm font-semibold transition-all hover:border-primary/40 hover:bg-surface-low"
          >
            <Repeat2 className="size-5 text-primary transition-transform group-hover:scale-110" />
            {tTx("filters.transfer")}
          </button>
          <button
            type="button"
            onClick={() => openAddModal("EXPENSE")}
            className="group flex h-14 items-center justify-center gap-3 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
          >
            <Plus className="size-5 transition-transform group-hover:scale-110" />
            {tNav("transactions")}
          </button>
        </div>
      </section>

      {walletsData && dashboardWallets.length === 0 ? (
        <Link
          href="/wallets"
          className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card py-10 text-sm font-semibold text-primary transition-opacity hover:opacity-75"
        >
          <Plus className="size-4" />
          {t("addFirstWallet")}
        </Link>
      ) : (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-bold text-foreground">{t("wallets")}</h3>
            <Link
              href="/wallets"
              className="text-[12px] font-semibold text-primary/70 transition-colors hover:text-primary"
            >
              {tCommon("actions.seeAll")}
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
            {t("recentActivity")}
          </h3>
          <Link
            href="/transactions"
            className="text-[12px] font-semibold text-primary/70 transition-colors hover:text-primary"
          >
            {tCommon("actions.seeAll")}
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="hidden grid-cols-[1fr_180px_180px] border-b border-border/40 bg-surface-low/50 px-6 py-4 text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground md:grid">
            <span>{t("tableHeader.categoryDescription")}</span>
            <span>{t("tableHeader.wallet")}</span>
            <span className="text-right">{t("tableHeader.amount")}</span>
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
                      transaction.type === "INCOME"
                        ? "bg-mint/12"
                        : transaction.type === "EXPENSE"
                        ? "bg-coral/10"
                        : "bg-surface-high"
                    }`}
                  >
                    {transaction.type === "INCOME" ? (
                      <ArrowUpRight className="size-5 text-mint" />
                    ) : transaction.type === "TRANSFER" ? (
                      <Repeat2 className="size-5 text-primary" />
                    ) : (
                      <ArrowDownLeft className="size-5 text-coral" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {transaction.description || t("defaultTransactionLabel")}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(transaction.date).toLocaleDateString(intlLocale, {
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
                    transaction.type === "INCOME"
                      ? "text-mint"
                      : transaction.type === "TRANSFER"
                      ? "text-foreground"
                      : "text-coral"
                  }`}
                >
                  {transaction.type === "EXPENSE" ? "-" : transaction.type === "INCOME" ? "+" : ""}
                  {formatCurrency(transaction.amount, intlLocale)}
                </p>
              </div>
            ))}
          </div>

          {transactions.length === 0 && !isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("noTransactions")}
            </p>
          )}
          {isLoading && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {tCommon("states.loading")}
            </p>
          )}
        </div>
      </section>

      <AddTransactionModal
        key={addModalKey}
        isOpen={isAddModalOpen}
        isCreating={isCreating}
        wallets={wallets}
        initialType={addModalType}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
}
