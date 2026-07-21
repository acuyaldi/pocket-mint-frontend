export type BudgetStatus = "HEALTHY" | "APPROACHING" | "REACHED" | "EXCEEDED" | "ARCHIVED";

export interface BudgetDto {
  id: string;
  category: {
    id: string;
    name: string;
    type: "EXPENSE";
  };
  amount: number;
  spent: number;
  remaining: number;
  /** Exact (unrounded) percentage. Never recomputed client-side. */
  percentUsed: number | null;
  /** Always backend-computed. Never derived from percentUsed. */
  status: BudgetStatus;
  isArchived: boolean;
  periodStart: string;
  periodEnd: string;
  createdAt: string;
  updatedAt: string;
}
