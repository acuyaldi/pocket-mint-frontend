export type RuleMatchType = "DESCRIPTION" | "MERCHANT" | "TRANSACTION_TYPE";
export type RuleOperator = "CONTAINS" | "EQUALS" | "STARTS_WITH" | "ENDS_WITH";

export interface RuleDto {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  matchType: RuleMatchType;
  operator: RuleOperator;
  value: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}
