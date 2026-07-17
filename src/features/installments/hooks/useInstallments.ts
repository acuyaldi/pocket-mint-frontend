"use client";

import { useQuery } from "@tanstack/react-query";

import api from "@/lib/api";

export {
  useBills as useInstallments,
  usePayBill as usePayInstallment,
} from "@/src/features/bills/hooks/useBills";
export type {
  BillDto as Installment,
  PayBillInput as PayInstallmentInput,
} from "@/src/features/bills/hooks/useBills";

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
