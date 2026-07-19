export interface Notification {
  id: string;
  templateId: string;
  templateName: string;
  templateType: "INCOME" | "EXPENSE";
  templateAmountMode: "FIXED" | "FLEXIBLE";
  templateAmount: number | null;
  occurrenceDate: string;
  offsetDays: number;
  reminderDate: string;
  readAt: string | null;
  completedAt: string | null;
  generatedTransactionId: string | null;
  createdAt: string;
}
