import type { Transaction } from "@/src/types/transaction";

/** Analytics v2 period presets — mirrors the backend's `period` query param. */
export type AnalyticsPeriod =
  | "current-month"
  | "previous-month"
  | "last-3-months"
  | "last-6-months"
  | "current-year"
  | "custom";

export interface AnalyticsPeriodParams {
  period: AnalyticsPeriod;
  /** Required (ISO date, e.g. "2026-07-01") only when period === "custom". */
  startDate?: string;
  /** Required (ISO date) only when period === "custom". */
  endDate?: string;
}

export interface PercentageChange {
  value: number | null;
  reason: null | "ZERO_BASELINE";
}

export interface AnalyticsOverview {
  period: string;
  periodStart: string;
  periodEnd: string;
  income: number;
  expense: number;
  netCashFlow: number;
  transactionCount: number;
  previousPeriod: {
    periodStart: string;
    periodEnd: string;
    income: number;
    expense: number;
    netCashFlow: number;
  };
  change: {
    income: number;
    expense: number;
    netCashFlow: number;
  };
  percentageChange: {
    income: PercentageChange;
    expense: PercentageChange;
    netCashFlow: PercentageChange;
  };
}

export interface AnalyticsTrendBucket {
  start: string;
  end: string;
  income: number;
  expense: number;
  netCashFlow: number;
}

export interface AnalyticsTrends {
  period: string;
  periodStart: string;
  periodEnd: string;
  granularity: "daily" | "monthly";
  buckets: AnalyticsTrendBucket[];
}

export interface AnalyticsCategory {
  categoryId: string | null;
  name: string;
  amount: number;
  transactionCount: number;
  percentage: number | null;
}

export interface AnalyticsCategories {
  period: string;
  periodStart: string;
  periodEnd: string;
  type: "EXPENSE" | "INCOME";
  total: number;
  categories: AnalyticsCategory[];
}

export interface AnalyticsWallet {
  id: string;
  name: string;
  income: number;
  expense: number;
  netCashFlow: number;
  transactionCount: number;
}

export interface AnalyticsWallets {
  period: string;
  periodStart: string;
  periodEnd: string;
  wallets: AnalyticsWallet[];
}

export interface AnalyticsBudgetPerformance {
  id: string;
  category: { id: string; name: string; type: string };
  limit: number;
  spent: number;
  remaining: number;
  percentUsed: number | null;
  status: "HEALTHY" | "APPROACHING" | "REACHED" | "EXCEEDED" | "ARCHIVED";
  isArchived: boolean;
  periodStart: string;
  periodEnd: string;
}

export interface AnalyticsDrillDownParams extends AnalyticsPeriodParams {
  type?: "INCOME" | "EXPENSE" | "TRANSFER";
  categoryId?: string;
  walletId?: string;
  page?: number;
  limit?: number;
}

export interface AnalyticsDrillDownResult {
  period: string;
  periodStart: string;
  periodEnd: string;
  transactions: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
