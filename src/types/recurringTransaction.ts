export type RecurrenceFrequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
export type RecurringAmountMode = "FIXED" | "FLEXIBLE";

export interface RecurringTransaction {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  amountMode: RecurringAmountMode;
  amount: number | null;
  description?: string | null;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate?: string | null;
  isActive: boolean;
  walletId: string;
  wallet?: { id: string; name: string; type: string };
  categoryId?: string | null;
  category?: { id: string; name: string; type: string } | null;
  createdAt: string;
  updatedAt: string;
}
