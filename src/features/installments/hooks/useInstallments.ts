"use client";

import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

export interface PaylaterRate {
  match: string;
  name: string;
  rate: number;
  adminFee: number;
}

export function usePaylaterRates() {
  return useQuery<PaylaterRate[], Error>({
    queryKey: ["paylater-rates"],
    queryFn: async () => {
      const response = await api.get<{ data: PaylaterRate[] }>("/installments/rates");
      return response.data?.data ?? [];
    },
    staleTime: Infinity,
  });
}
