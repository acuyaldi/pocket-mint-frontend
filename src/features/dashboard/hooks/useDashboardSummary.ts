"use client";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

export interface DashboardSummary {
  totalAssets: number;
  totalDebts: number;
  netWorth: number;
}

interface DashboardSummaryResponse {
  total_aset: number;
  total_utang: number;
  net_worth: number;
}

const STALE_TIME = 60 * 1000;

/**
 * GET /dashboard/summary — backend is the single source of truth for net worth
 * (PD-001: assets − outstanding debt). The endpoint returns a bare, snake_case
 * object (no {status, data} envelope), unlike most other endpoints.
 */
export const useDashboardSummary = () => {
  return useQuery<DashboardSummary, Error>({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const response = await api.get<DashboardSummaryResponse>("/dashboard/summary");
      return {
        totalAssets: response.data.total_aset,
        totalDebts: response.data.total_utang,
        netWorth: response.data.net_worth,
      };
    },
    staleTime: STALE_TIME,
  });
};
