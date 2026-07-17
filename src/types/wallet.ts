export type WalletType =
  | "CASH"
  | "BANK"
  | "E_WALLET"
  | "CREDIT_CARD"
  | "PAYLATER"
  | "LOAN";

export const ASSET_WALLET_TYPES: WalletType[] = ["CASH", "BANK", "E_WALLET"];
export const CREDIT_WALLET_TYPES: WalletType[] = ["CREDIT_CARD", "PAYLATER"];
export const LIABILITY_WALLET_TYPES: WalletType[] = [...CREDIT_WALLET_TYPES, "LOAN"];

export const isCreditWallet = (type: WalletType): boolean =>
  CREDIT_WALLET_TYPES.includes(type);

export const isLiabilityWallet = (type: WalletType): boolean =>
  LIABILITY_WALLET_TYPES.includes(type);

/** Compatibility alias for existing dashboard and transaction views. */
export const isDebtWallet = isLiabilityWallet;

export interface Wallet {
  id: string;
  userId: string;
  name: string;
  type: WalletType;
  balance: number;
  creditLimit: number;
  cutoffDay?: number | null;
  paymentDueDay?: number | null;
  outstanding?: number | null;
  remainingCredit?: number | null;
  interestRate: number;
  adminFee?: number;
  adminFeeType?: "FLAT" | "PERCENT";
  currency: string;
  icon?: string | null;
  color?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}
