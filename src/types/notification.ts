export interface Notification {
  id: string;
  templateId: string | null;
  templateName: string | null;
  templateType: "INCOME" | "EXPENSE" | null;
  templateAmountMode: "FIXED" | "FLEXIBLE" | null;
  templateAmount: number | null;
  installmentId: string | null;
  installmentDescription: string | null;
  installmentWalletName: string | null;
  installmentAmount: number | null;
  occurrenceDate: string;
  offsetDays: number;
  reminderDate: string;
  readAt: string | null;
  completed: boolean;
  completedAt: string | null;
  generatedTransactionId: string | null;
  createdAt: string;
}
