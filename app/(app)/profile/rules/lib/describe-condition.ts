import type { RuleDto } from "@/src/types/rule";

/**
 * Human-readable summary of a rule's condition, e.g. `Description contains "GOPAY"`
 * or `Transaction type is Transfer`. `t` is the `ruleConditionSummary` namespace.
 */
export function describeRuleCondition(rule: RuleDto, t: (key: string, values?: Record<string, string>) => string): string {
  if (rule.matchType === "TRANSACTION_TYPE") {
    return t("transactionType", { value: t(`transactionTypeValue.${rule.value}`) });
  }
  const field = t(`field.${rule.matchType}`);
  const operator = t(`operator.${rule.operator}`);
  return t("template", { field, operator, value: rule.value });
}
