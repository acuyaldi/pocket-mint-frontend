export interface Transaction {
  id: string;
  userId: string;
  accountId: string;
  categoryId?: string | null;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  amount: number;
  description?: string | null;
  note?: string | null;
  date: string; // ISO date string
  createdAt: string;
  updatedAt: string;
  // optional relations that the backend may include
  account?: {
    id: string;
    name: string;
    type: string;
  } | null;
  category?: {
    id: string;
    name: string;
    type: string;
  } | null;
}
