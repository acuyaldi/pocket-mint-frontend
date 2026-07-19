export interface Notification {
  id: string;
  templateId: string;
  templateName: string;
  occurrenceDate: string;
  offsetDays: number;
  reminderDate: string;
  readAt: string | null;
  createdAt: string;
}
