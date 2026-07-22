"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  AnalyticsBudgetPerformance,
  AnalyticsCategories,
  AnalyticsDrillDownParams,
  AnalyticsDrillDownResult,
  AnalyticsOverview,
  AnalyticsPeriodParams,
  AnalyticsTrends,
  AnalyticsWallets,
} from "@/src/types/analytics";

const STALE_TIME = 5 * 60 * 1000;

/** Query-param object for a period selection, dropping startDate/endDate unless period is "custom". */
function periodParams(params: AnalyticsPeriodParams): Record<string, string> {
  const query: Record<string, string> = { period: params.period };
  if (params.period === "custom" && params.startDate && params.endDate) {
    query.startDate = params.startDate;
    query.endDate = params.endDate;
  }
  return query;
}

/** Stable query-key tuple for a period selection — shared by all Analytics hooks below. */
function periodKey(params: AnalyticsPeriodParams): (string | undefined)[] {
  return [
    params.period,
    params.period === "custom" ? params.startDate : undefined,
    params.period === "custom" ? params.endDate : undefined,
  ];
}

/** Custom period needs both dates before it's a valid request; every other period is always ready. */
function isPeriodReady(params: AnalyticsPeriodParams): boolean {
  return params.period !== "custom" || !!(params.startDate && params.endDate);
}

export const useAnalyticsOverview = (params: AnalyticsPeriodParams) => {
  return useQuery<AnalyticsOverview, Error>({
    queryKey: ["analytics", "overview", ...periodKey(params)],
    queryFn: async () => {
      const response = await api.get<AnalyticsOverview>("/analytics/overview", { params: periodParams(params) });
      return response.data;
    },
    enabled: isPeriodReady(params),
    staleTime: STALE_TIME,
  });
};

export const useAnalyticsTrends = (params: AnalyticsPeriodParams) => {
  return useQuery<AnalyticsTrends, Error>({
    queryKey: ["analytics", "trends", ...periodKey(params)],
    queryFn: async () => {
      const response = await api.get<AnalyticsTrends>("/analytics/trends", { params: periodParams(params) });
      return response.data;
    },
    enabled: isPeriodReady(params),
    staleTime: STALE_TIME,
  });
};

export const useAnalyticsCategories = (
  params: AnalyticsPeriodParams,
  type: "EXPENSE" | "INCOME" = "EXPENSE",
) => {
  return useQuery<AnalyticsCategories, Error>({
    queryKey: ["analytics", "categories", type, ...periodKey(params)],
    queryFn: async () => {
      const response = await api.get<AnalyticsCategories>("/analytics/categories", {
        params: { ...periodParams(params), type },
      });
      return response.data;
    },
    enabled: isPeriodReady(params),
    staleTime: STALE_TIME,
  });
};

export const useAnalyticsWallets = (params: AnalyticsPeriodParams) => {
  return useQuery<AnalyticsWallets, Error>({
    queryKey: ["analytics", "wallets", ...periodKey(params)],
    queryFn: async () => {
      const response = await api.get<AnalyticsWallets>("/analytics/wallets", { params: periodParams(params) });
      return response.data;
    },
    enabled: isPeriodReady(params),
    staleTime: STALE_TIME,
  });
};

/** No period param — the backend always reports the current budgeting month, matching GET /budgets. */
export const useAnalyticsBudgetPerformance = () => {
  return useQuery<AnalyticsBudgetPerformance[], Error>({
    queryKey: ["analytics", "budget-performance"],
    queryFn: async () => {
      const response = await api.get<AnalyticsBudgetPerformance[]>("/analytics/budget-performance");
      return Array.isArray(response.data) ? response.data : [];
    },
    staleTime: STALE_TIME,
  });
};

/** Drill-down transaction list behind a category/wallet/bucket click. Disabled until explicitly opened. */
export const useAnalyticsTransactions = (params: AnalyticsDrillDownParams, enabled: boolean) => {
  const { type, categoryId, walletId, page = 1, limit = 20, ...period } = params;
  return useQuery<AnalyticsDrillDownResult, Error>({
    queryKey: ["analytics", "transactions", ...periodKey(period), type, categoryId, walletId, page, limit],
    queryFn: async () => {
      const response = await api.get<AnalyticsDrillDownResult>("/analytics/transactions", {
        params: { ...periodParams(period), type, categoryId, walletId, page, limit },
      });
      return response.data;
    },
    enabled: enabled && isPeriodReady(period),
    staleTime: STALE_TIME,
  });
};
