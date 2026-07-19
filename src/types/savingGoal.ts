export type SavingGoalStatus = "ACTIVE" | "COMPLETED" | "ARCHIVED";

export interface SavingGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  /** Derived by the backend — never editable, never stored. */
  remainingAmount: number;
  /** Derived by the backend, capped at 100 even when currentAmount exceeds targetAmount. */
  progressPercentage: number;
  targetDate: string | null;
  notes: string | null;
  status: SavingGoalStatus;
  createdAt: string;
  updatedAt: string;
}
