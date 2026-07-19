"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import api from "@/lib/api";
import { invalidateTransactionDependents } from "@/src/features/transactions/hooks/useTransactions";

export interface BillDto {
  id: string;
  transactionId: string | null;
  kind: "FULL" | "INSTALLMENT";
  description: string | null;
  walletId: string;
  walletName: string;
  walletType: string;
  amountPerTerm: number;
  monthlyAmount?: number;
  currentTerm: number;
  totalTerms: number;
  installmentMonths?: number;
  paidTerms: number;
  nextDueDate: string;
  totalAmount: number;
  grandTotal: number;
  totalInterest: number;
  interestRate: number;
  status: "ACTIVE" | "OVERDUE" | "SETTLED" | "CANCELLED";
  startDate: string;
  balanceDeducted?: boolean;
}

export interface PayBillInput {
  billId: string;
  sourceWalletId: string;
  amount?: number;
  date?: string;
}

function addCalendarDays(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

export function countDueSoon(
  bills: BillDto[],
  today: string,
  windowDays = 3,
): number {
  const end = addCalendarDays(today, windowDays);
  return bills.filter(
    (bill) =>
      (bill.status === "ACTIVE" || bill.status === "OVERDUE") &&
      getJakartaDateKey(new Date(bill.nextDueDate)) <= end,
  ).length;
}

export function getJakartaDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function useBills() {
  return useQuery<BillDto[], Error>({
    queryKey: ["bills"],
    queryFn: async () => {
      const response = await api.get<{ data: BillDto[] }>("/bills");
      const bills = response.data?.data ?? [];
      return Array.isArray(bills) ? bills : [];
    },
    staleTime: 60 * 1000,
  });
}

export function useDueBillCount(): number {
  const { data: bills = [] } = useBills();
  return countDueSoon(bills, getJakartaDateKey(), 3);
}

export function usePayBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ billId, ...payload }: PayBillInput) =>
      api
        .post<{ data: unknown }>(`/bills/${billId}/pay`, payload)
        .then((response) => response.data.data),
    onSuccess: () => {
      invalidateTransactionDependents(queryClient);
      // Installment reminder completion is derived from the installment's
      // nextDueDate/status (see notification.controller.ts), so a payment
      // must refresh the notification list too.
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
  });
}
