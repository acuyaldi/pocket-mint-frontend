"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Download,
  PieChart,
  Wallet,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { INTL_LOCALE } from "@/i18n/config";
import { PageHeader } from "@/components/layout/page-header";
import { useBills } from "@/src/features/bills/hooks/useBills";
import { useAllTransactions } from "@/src/features/transactions/hooks/useTransactions";
import { isDebtWallet } from "@/src/types/wallet";
import { useWallets } from "@/src/features/wallets/hooks/useWallets";
import {
  buildMonthlyFlow,
  filterTransactionsByPeriod,
  getPeriodMonthKeys,
  type PeriodFilter,
} from "./period";

function getMonthLabel(monthKey: string, intlLocale: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Intl.DateTimeFormat(intlLocale, { month: "short" }).format(
    new Date(year, month - 1, 1),
  );
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return "0%";
  return `${Math.round(value)}%`;
}

function SummaryCard({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper: string;
  tone?: "neutral" | "positive" | "warning";
}) {
  const t = useTranslations("analytics");
  const toneClass =
    tone === "positive"
      ? "text-mint"
      : tone === "warning"
        ? "text-amber"
        : "text-primary";

  return (
    <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {label}
        </p>
        <span className="rounded bg-surface-high px-2 py-1 text-[10px] font-semibold text-muted-foreground">
          {t("realData")}
        </span>
      </div>
      <p className={`text-[28px] font-semibold leading-tight tabular-nums ${toneClass}`}>
        {value}
      </p>
      <p className="mt-3 text-sm text-muted-foreground">{helper}</p>
    </article>
  );
}

function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-lg border border-dashed border-border bg-surface-low px-6 text-center text-sm text-muted-foreground">
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];
  const PERIODS: Array<{ key: PeriodFilter; label: string }> = [
    { key: "month", label: t("periods.month") },
    { key: "quarter", label: t("periods.quarter") },
    { key: "six-months", label: t("periods.sixMonths") },
  ];
  const [period, setPeriod] = useState<PeriodFilter>("six-months");
  const { data: transactionData, isLoading: isTransactionsLoading } =
    useAllTransactions();
  const { data: walletData } = useWallets();
  const { data: bills = [] } = useBills();
  const activeBillCount = bills.filter(
    (bill) => bill.status === "ACTIVE" || bill.status === "OVERDUE",
  ).length;

  const transactions = useMemo(() => transactionData ?? [], [transactionData]);
  const wallets = useMemo(() => walletData ?? [], [walletData]);

  const filteredTransactions = useMemo(
    () => filterTransactionsByPeriod(transactions, period),
    [transactions, period],
  );

  const totals = useMemo(() => {
    return filteredTransactions.reduce(
      (acc, transaction) => {
        if (transaction.type === "INCOME") acc.income += transaction.amount;
        if (transaction.type === "EXPENSE") acc.expenses += transaction.amount;
        return acc;
      },
      { income: 0, expenses: 0 },
    );
  }, [filteredTransactions]);

  const cashFlow = totals.income - totals.expenses;
  const savingsRate = totals.income > 0 ? (cashFlow / totals.income) * 100 : 0;
  const expenseRatio =
    totals.income > 0 ? (totals.expenses / totals.income) * 100 : 0;

  const debtSummary = useMemo(() => {
    return wallets.reduce(
      (acc, walletItem) => {
        if (isDebtWallet(walletItem.type)) {
          acc.debt += Math.abs(walletItem.balance);
          acc.limit += walletItem.creditLimit || 0;
        } else {
          acc.assets += walletItem.balance;
        }
        return acc;
      },
      { assets: 0, debt: 0, limit: 0 },
    );
  }, [wallets]);

  const debtRatio =
    debtSummary.limit > 0 ? (debtSummary.debt / debtSummary.limit) * 100 : 0;

  const monthlyFlow = useMemo(
    () => buildMonthlyFlow(transactions, getPeriodMonthKeys("six-months")),
    [transactions],
  );

  const maxMonthlyAmount = Math.max(
    1,
    ...monthlyFlow.flatMap((item) => [item.income, item.expenses]),
  );

  const expenseCategories = useMemo(() => {
    const categories = new Map<string, number>();
    filteredTransactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .forEach((transaction) => {
        const label = transaction.category?.name || t("allocation.noCategory");
        categories.set(label, (categories.get(label) ?? 0) + transaction.amount);
      });

    return Array.from(categories.entries())
      .map(([label, amount]) => ({ label, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [filteredTransactions, t]);

  const maxCategoryAmount = Math.max(
    1,
    ...expenseCategories.map((category) => category.amount),
  );

  const insights = useMemo(() => {
    const items: string[] = [];
    if (totals.income === 0 && totals.expenses === 0) {
      items.push(t("insights.noTransactions"));
    } else {
      if (cashFlow >= 0) {
        items.push(t("insights.positiveCashFlow", { amount: formatCurrency(cashFlow, intlLocale) }));
      } else {
        items.push(t("insights.negativeCashFlow", { amount: formatCurrency(Math.abs(cashFlow), intlLocale) }));
      }
      if (totals.income > 0) {
        items.push(t("insights.expenseRatio", { percent: formatPercent(expenseRatio) }));
      }
      if (expenseCategories[0]) {
        items.push(
          t("insights.topCategory", {
            label: expenseCategories[0].label,
            amount: formatCurrency(expenseCategories[0].amount, intlLocale),
          }),
        );
      }
    }

    if (activeBillCount > 0) {
      items.push(t("insights.activeInstallments", { count: activeBillCount }));
    }

    return items.slice(0, 4);
  }, [
    activeBillCount,
    cashFlow,
    expenseCategories,
    expenseRatio,
    intlLocale,
    t,
    totals.expenses,
    totals.income,
  ]);

  return (
    <div
      className="space-y-8"
      style={{
        opacity: isTransactionsLoading ? 0.68 : 1,
        transition: "opacity 0.2s ease-in-out",
      }}
    >
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
      />

      <section className="sticky top-16 z-10 flex flex-wrap items-center justify-between gap-4 border-y border-border/50 bg-background py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm text-foreground">
            <CalendarDays className="size-4 text-muted-foreground" />
            {new Intl.DateTimeFormat(intlLocale, {
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </div>
          <div className="hidden h-8 w-px bg-border md:block" />
          <div className="flex flex-wrap gap-2">
            {PERIODS.map((item) => {
              const isActive = item.key === period;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => setPeriod(item.key)}
                  className={`h-9 rounded-full px-4 text-xs font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "border border-border bg-card text-muted-foreground hover:bg-surface-low"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
        <button
          type="button"
          className="flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition-colors hover:bg-surface-low"
        >
          <Download className="size-4" />
          {t("exportReport")}
        </button>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <SummaryCard
          label={t("savingsRate")}
          value={formatPercent(savingsRate)}
          helper={t("savingsRateHelper", { amount: formatCurrency(cashFlow, intlLocale) })}
          tone={cashFlow >= 0 ? "positive" : "warning"}
        />
        <SummaryCard
          label={t("cashFlow")}
          value={`${cashFlow >= 0 ? "+" : "-"}${formatCurrency(Math.abs(cashFlow), intlLocale)}`}
          helper={t("cashFlowHelper", {
            income: formatCurrency(totals.income, intlLocale),
            expenses: formatCurrency(totals.expenses, intlLocale),
          })}
          tone={cashFlow >= 0 ? "positive" : "warning"}
        />
        <SummaryCard
          label={t("debtRatio")}
          value={formatPercent(debtRatio)}
          helper={t("debtRatioHelper", {
            debt: formatCurrency(debtSummary.debt, intlLocale),
            limit: formatCurrency(debtSummary.limit, intlLocale),
          })}
          tone={debtRatio >= 60 ? "warning" : "neutral"}
        />
      </section>

      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm lg:col-span-2">
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-primary">{t("cashFlowChart.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("cashFlowChart.subtitle")}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-primary" />
                {t("cashFlowChart.income")}
              </span>
              <span className="flex items-center gap-2">
                <span className="size-3 rounded-sm bg-coral" />
                {t("cashFlowChart.expenses")}
              </span>
            </div>
          </div>

          {transactions.length === 0 ? (
            <EmptyPanel>{t("cashFlowChart.empty")}</EmptyPanel>
          ) : (
            <div className="grid min-h-[300px] grid-cols-6 items-end gap-4 border-b border-border/70 pb-3">
              {monthlyFlow.map((item) => {
                const incomeHeight = Math.max(
                  6,
                  (item.income / maxMonthlyAmount) * 240,
                );
                const expenseHeight = Math.max(
                  6,
                  (item.expenses / maxMonthlyAmount) * 240,
                );
                return (
                  <div key={item.month} className="flex flex-col items-center gap-3">
                    <div className="flex h-[250px] items-end gap-1.5">
                      <div
                        className="w-5 rounded-t bg-primary transition-all"
                        style={{ height: `${incomeHeight}px` }}
                        title={t("cashFlowChart.incomeTooltip", {
                          month: getMonthLabel(item.month, intlLocale),
                          amount: formatCurrency(item.income, intlLocale),
                        })}
                      />
                      <div
                        className="w-5 rounded-t bg-coral transition-all"
                        style={{ height: `${expenseHeight}px` }}
                        title={t("cashFlowChart.expenseTooltip", {
                          month: getMonthLabel(item.month, intlLocale),
                          amount: formatCurrency(item.expenses, intlLocale),
                        })}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {getMonthLabel(item.month, intlLocale)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </article>

        <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-primary">
                {t("allocation.title")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("allocation.subtitle")}
              </p>
            </div>
            <PieChart className="size-5 text-muted-foreground" />
          </div>

          {expenseCategories.length === 0 ? (
            <EmptyPanel>{t("allocation.empty")}</EmptyPanel>
          ) : (
            <div className="space-y-5">
              {expenseCategories.map((category) => (
                <div key={category.label} className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-foreground">
                      {category.label}
                    </p>
                    <p className="text-sm font-semibold tabular-nums text-primary">
                      {formatCurrency(category.amount)}
                    </p>
                  </div>
                  <div className="h-2 rounded-full bg-surface-high">
                    <div
                      className="h-2 rounded-full bg-primary"
                      style={{
                        width: `${Math.max(4, (category.amount / maxCategoryAmount) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-primary">
                {t("composition.title")}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("composition.subtitle")}
              </p>
            </div>
            <Wallet className="size-5 text-muted-foreground" />
          </div>

          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <ArrowUpRight className="size-4 text-mint" />
                  {t("composition.assets")}
                </span>
                <span className="tabular-nums text-primary">
                  {formatCurrency(debtSummary.assets, intlLocale)}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-surface-high">
                <div
                  className="h-2 rounded-full bg-mint"
                  style={{
                    width: `${Math.max(
                      4,
                      (debtSummary.assets /
                        Math.max(1, debtSummary.assets + debtSummary.debt)) *
                        100,
                    )}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-semibold text-foreground">
                  <ArrowDownLeft className="size-4 text-coral" />
                  {t("composition.liabilities")}
                </span>
                <span className="tabular-nums text-primary">
                  {formatCurrency(debtSummary.debt, intlLocale)}
                </span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-surface-high">
                <div
                  className="h-2 rounded-full bg-coral"
                  style={{
                    width: `${Math.max(
                      4,
                      (debtSummary.debt /
                        Math.max(1, debtSummary.assets + debtSummary.debt)) *
                        100,
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-xl border border-border/70 bg-card p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-primary">{t("insights.title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("insights.subtitle")}
              </p>
            </div>
            <BarChart3 className="size-5 text-muted-foreground" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight) => (
              <div
                key={insight}
                className="flex gap-3 rounded-lg border border-border/50 bg-surface-low p-4"
              >
                <span className="mt-1 size-2 shrink-0 rounded-full bg-mint" />
                <p className="text-sm leading-6 text-muted-foreground">
                  {insight}
                </p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
