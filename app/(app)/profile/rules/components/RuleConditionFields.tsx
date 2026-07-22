"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { FormField } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/src/features/categories/hooks/useCategories";
import type { RuleMatchType, RuleOperator } from "@/src/types/rule";

const MATCH_TYPES: RuleMatchType[] = ["DESCRIPTION", "MERCHANT", "TRANSACTION_TYPE"];
const OPERATORS: RuleOperator[] = ["CONTAINS", "EQUALS", "STARTS_WITH", "ENDS_WITH"];
const TRANSACTION_TYPES = ["INCOME", "EXPENSE", "TRANSFER"] as const;

interface RuleConditionFieldsProps {
  idPrefix: string;
  name: string;
  onNameChange: (value: string) => void;
  matchType: RuleMatchType;
  onMatchTypeChange: (value: RuleMatchType) => void;
  operator: RuleOperator;
  onOperatorChange: (value: RuleOperator) => void;
  value: string;
  onValueChange: (value: string) => void;
  categoryId: string | null;
  onCategoryIdChange: (value: string | null) => void;
  categories: Category[];
}

/**
 * Shared name/condition/category fields for the create and edit rule
 * modals. A TRANSACTION_TYPE rule only ever means equality, so the
 * operator picker is hidden and the free-text value becomes a closed
 * INCOME/EXPENSE/TRANSFER picker instead — mirrors what rule.service.ts
 * validates server-side.
 */
export function RuleConditionFields({
  idPrefix,
  name,
  onNameChange,
  matchType,
  onMatchTypeChange,
  operator,
  onOperatorChange,
  value,
  onValueChange,
  categoryId,
  onCategoryIdChange,
  categories,
}: RuleConditionFieldsProps) {
  const t = useTranslations("ruleModals.fields");
  const isTransactionType = matchType === "TRANSACTION_TYPE";

  return (
    <>
      <FormField label={t("name")} htmlFor={`${idPrefix}-name`} required>
        <Input
          id={`${idPrefix}-name`}
          type="text"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          placeholder={t("namePlaceholder")}
          className="h-11 border-border/70 bg-card px-3 text-sm"
          required
        />
      </FormField>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label={t("matchType")} htmlFor={`${idPrefix}-match-type`} required>
          <Select
            value={matchType}
            onValueChange={(next) => next && onMatchTypeChange(next as RuleMatchType)}
            items={Object.fromEntries(MATCH_TYPES.map((mt) => [mt, t(`matchTypeOptions.${mt}`)]))}
          >
            <SelectTrigger id={`${idPrefix}-match-type`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MATCH_TYPES.map((mt) => (
                <SelectItem key={mt} value={mt}>
                  {t(`matchTypeOptions.${mt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        {!isTransactionType && (
          <FormField label={t("operator")} htmlFor={`${idPrefix}-operator`} required>
            <Select
              value={operator}
              onValueChange={(next) => next && onOperatorChange(next as RuleOperator)}
              items={Object.fromEntries(OPERATORS.map((op) => [op, t(`operatorOptions.${op}`)]))}
            >
              <SelectTrigger id={`${idPrefix}-operator`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATORS.map((op) => (
                  <SelectItem key={op} value={op}>
                    {t(`operatorOptions.${op}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        )}
      </div>

      {isTransactionType ? (
        <FormField label={t("value")} htmlFor={`${idPrefix}-value`} required>
          <Select
            value={value || undefined}
            onValueChange={(next) => onValueChange(next ?? "")}
            items={Object.fromEntries(TRANSACTION_TYPES.map((tt) => [tt, t(`transactionTypeOptions.${tt}`)]))}
          >
            <SelectTrigger id={`${idPrefix}-value`}>
              <SelectValue placeholder={t("valuePlaceholderTransactionType")} />
            </SelectTrigger>
            <SelectContent>
              {TRANSACTION_TYPES.map((tt) => (
                <SelectItem key={tt} value={tt}>
                  {t(`transactionTypeOptions.${tt}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      ) : (
        <FormField label={t("value")} htmlFor={`${idPrefix}-value`} required description={t("valueDescription")}>
          <Input
            id={`${idPrefix}-value`}
            type="text"
            value={value}
            onChange={(event) => onValueChange(event.target.value)}
            placeholder={t("valuePlaceholder")}
            className="h-11 border-border/70 bg-card px-3 text-sm"
            required
          />
        </FormField>
      )}

      <FormField label={t("category")} htmlFor={`${idPrefix}-category`} required>
        <Select
          value={categoryId ?? undefined}
          onValueChange={(next) => onCategoryIdChange(next ?? null)}
          items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
        >
          <SelectTrigger id={`${idPrefix}-category`}>
            <SelectValue placeholder={t("categoryPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FormField>
    </>
  );
}
