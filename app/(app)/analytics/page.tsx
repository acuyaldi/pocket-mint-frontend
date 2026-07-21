"use client";

import { useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toaster";
import { INTL_LOCALE } from "@/i18n/config";
import { formatCurrency } from "@/lib/utils";
import { exportTransactionsCsv } from "@/src/features/transactions/hooks/useTransactions";
import {
  parseAnalyticsSearchParams,
  serializeAnalyticsSearchParams,
  formatPeriodRangeLabel,
} from "@/src/features/analytics/period";
import {
  useAnalyticsOverview,
  useAnalyticsTrends,
  useAnalyticsCategories,
  useAnalyticsWallets,
  useAnalyticsBudgetPerformance,
  useAnalyticsTransactions,
} from "@/src/features/analytics/hooks/useAnalytics";
import type { AnalyticsUrlState } from "@/src/features/analytics/period";
import type { AnalyticsPeriod } from "@/src/types/analytics";
import { AnalyticsPeriodSelector } from "./components/AnalyticsPeriodSelector";
import { AnalyticsSummaryCard } from "./components/AnalyticsSummaryCard";
import { CashFlowTrend } from "./components/CashFlowTrend";
import { CategoryBreakdown } from "./components/CategoryBreakdown";
import { WalletBreakdown } from "./components/WalletBreakdown";
import { BudgetPerformance } from "./components/BudgetPerformance";
import { TransactionDrillDown } from "./components/TransactionDrillDown";

/** Map new period presets to the old export endpoint's period param where possible. Arrow-function to satisfy react-hooks lint. */
const toExportPeriod = (p: AnalyticsPeriod): "month" | "quarter" | "six-months" | null => {
  if (p === "current-month" || p === "previous-month") return "month";
  if (p === "last-3-months") return "quarter";
  if (p === "last-6-months") return "six-months";
  return null; // current-year, custom → no direct export mapping, disabled
};

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- Period state (URL-persisted) ---
  const [periodState, setPeriodState] = useState<AnalyticsUrlState>(() =>
    parseAnalyticsSearchParams(searchParams),
  );

  const periodParams = {
    period: periodState.period,
    ...(periodState.period === "custom" && periodState.startDate && periodState.endDate
      ? { startDate: periodState.startDate, endDate: periodState.endDate }
      : {}),
  } as const;
  const apiPeriodParams = periodParams as {
    period: AnalyticsPeriod;
    startDate?: string;
    endDate?: string;
  };

  const handlePeriodChange = useCallback(
    (next: AnalyticsUrlState) => {
      setPeriodState(next);
      const query = serializeAnalyticsSearchParams(next);
      router.replace(`/analytics?${query}`, { scroll: false });
    },
    [router],
  );

  // --- Data queries ---
  const overview = useAnalyticsOverview(apiPeriodParams);
  const trends = useAnalyticsTrends(apiPeriodParams);
  const categories = useAnalyticsCategories(apiPeriodParams, "EXPENSE");
  const wallets = useAnalyticsWallets(apiPeriodParams);
  const budgetPerf = useAnalyticsBudgetPerformance();

  // --- Drill-down state (filters + pagination from a clicked bucket/category/wallet) ---
  const [drillDown, setDrillDown] = useState<{
    type?: "INCOME" | "EXPENSE";
    categoryId?: string;
    walletId?: string;
    page: number;
  } | null>(null);
  const drillDownEnabled = drillDown !== null;
  const drillDownTxns = useAnalyticsTransactions(
    {
      ...apiPeriodParams,
      type: drillDown?.type,
      categoryId: drillDown?.categoryId,
      walletId: drillDown?.walletId,
      page: drillDown?.page ?? 1,
    },
    drillDownEnabled,
  );

  // --- CSV export ---
  const exportPeriod = toExportPeriod(periodState.period);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (isExporting || !exportPeriod) return;
    setIsExporting(true);
    try {
      const anchor = new Date().toISOString().slice(0, 7); // YYYY-MM
      await exportTransactionsCsv(exportPeriod, anchor);
    } catch {
      toast(t("exportFailed"), "error");
    } finally {
      setIsExporting(false);
    }
  };

  // --- Derived loading state: any top-level query is fetching ---
  const isLoading =
    overview.isLoading || trends.isLoading || categories.isLoading || wallets.isLoading || budgetPerf.isLoading;
  const isAnyError =
    overview.isError || trends.isError || categories.isError || wallets.isError || budgetPerf.isError;

  const periodLabel =
    overview.data
      ? formatPeriodRangeLabel(overview.data.periodStart, overview.data.periodEnd, intlLocale)
      : "";

  return (
    <div
      className="space-y-8"
      style={{
        opacity: isLoading ? 0.68 : 1,
        transition: "opacity 0.2s ease-in-out",
      }}
    >
      <PageHeader title={t("pageTitle")} description={t("pageDescription")} />

      {/* --- Period selector + export --- */}
      <section className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-4 border-y border-border/50 bg-background py-3">
        <AnalyticsPeriodSelector state={periodState} onChange={handlePeriodChange} />
        <button
          type="button"
          disabled={isExporting || !exportPeriod}
          onClick={handleExport}
          className="flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-low disabled:cursor-not-allowed disabled:opacity-60"
          title={!exportPeriod ? "Export is only available for month, quarter, or 6-month periods." : undefined}
        >
          <Download className="size-4" />
          {t("exportReport")}
        </button>
      </section>

      {/* --- Error state --- */}
      {isAnyError && (
        <div className="rounded-xl border border-border/70 bg-card p-8 text-center">
          <p className="text-sm font-medium text-coral">
            Failed to load analytics data. Please try again later.
          </p>
        </div>
      )}

      {/* --- Overview cards --- */}
      {overview.data && (
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <AnalyticsSummaryCard
            label={t("overview.income")}
            value={formatCurrency(overview.data.income, intlLocale)}
            change={overview.data.change.income}
            percentageChange={overview.data.percentageChange.income}
            intlLocale={intlLocale}
            increaseIsGood={true}
          />
          <AnalyticsSummaryCard
            label={t("overview.expense")}
            value={formatCurrency(overview.data.expense, intlLocale)}
            change={overview.data.change.expense}
            percentageChange={overview.data.percentageChange.expense}
            intlLocale={intlLocale}
            increaseIsGood={false}
          />
          <AnalyticsSummaryCard
            label={t("overview.netCashFlow")}
            value={formatCurrency(overview.data.netCashFlow, intlLocale)}
            change={overview.data.change.netCashFlow}
            percentageChange={overview.data.percentageChange.netCashFlow}
            intlLocale={intlLocale}
            increaseIsGood={true}
          />
          <AnalyticsSummaryCard
            label={t("overview.transactionCount")}
            value={overview.data.transactionCount.toLocaleString(intlLocale)}
            change={0}
            percentageChange={{ value: null, reason: "ZERO_BASELINE" }}
            intlLocale={intlLocale}
            changeIsCurrency={false}
          />
        </section>
      )}

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* --- Cash flow trend --- */}
        <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-primary">{t("trends.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("trends.subtitle")} &middot; {periodLabel}
            </p>
          </div>
          {trends.data ? (
            <CashFlowTrend data={trends.data} intlLocale={intlLocale} />
          ) : null}
        </article>

        {/* --- Category breakdown --- */}
        <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-primary">{t("categories.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("categories.subtitle")} &middot; {periodLabel}
            </p>
          </div>
          {/* ponytail: type toggle deferred — only EXPENSE for now; add INCOME toggle when categories model supports it meaningfully */}
          {categories.data ? (
            <CategoryBreakdown data={categories.data} intlLocale={intlLocale} />
          ) : null}
        </article>

        {/* --- Wallet breakdown --- */}
        <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-primary">{t("wallets.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("wallets.subtitle")} &middot; {periodLabel}
            </p>
          </div>
          {wallets.data ? (
            <WalletBreakdown data={wallets.data} intlLocale={intlLocale} />
          ) : null}
        </article>

        {/* --- Budget performance --- */}
        <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm lg:col-span-2">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-primary">{t("budgetPerformance.title")}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("budgetPerformance.subtitle")}
            </p>
          </div>
          {budgetPerf.data ? (
            <BudgetPerformance data={budgetPerf.data} intlLocale={intlLocale} />
          ) : null}
        </article>
      </section>

      {/* --- Drill-down (conditional, shown when a breakdown item is clicked) --- */}
      {drillDown && drillDownTxns.data && (
        <section>
          <TransactionDrillDown
            transactions={drillDownTxns.data.transactions}
            total={drillDownTxns.data.pagination.total}
            page={drillDownTxns.data.pagination.page}
            totalPages={drillDownTxns.data.pagination.totalPages}
            onPageChange={(page) => setDrillDown((prev) => (prev ? { ...prev, page } : null))}
            onClose={() => setDrillDown(null)}
            intlLocale={intlLocale}
          />
        </section>
      )}
    </div>
  );
}
