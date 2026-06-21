export type WalletType = 'CASH' | 'BANK' | 'E_WALLET' | 'CREDIT_CARD' | 'LOAN_PAYLATER';

export type WalletCategory = 'asset' | 'debt';

export type AssetSubType = 'bank_account' | 'e_wallet' | 'cash_on_hand' | 'piutang';

export type DebtSubType = 'credit_card' | 'paylater' | 'utang_personal' | 'line_of_credit';

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  balance: number;
  creditLimit: number;
  interestRate: number;
  currency: string;
  icon?: string | null;
  color?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
