"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FormErrorMessage } from "@/components/ui/form-field";
import type { Category } from "@/src/features/categories/hooks/useCategories";
import type { UpdateRuleDto } from "@/src/features/rules/hooks/useRules";
import type { RuleDto, RuleMatchType, RuleOperator } from "@/src/types/rule";
import { RuleConditionFields } from "./RuleConditionFields";
import { mapRuleErrorMessage } from "../lib/error-messages";

interface EditRuleModalProps {
  isOpen: boolean;
  isSaving: boolean;
  rule: RuleDto | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: UpdateRuleDto) => Promise<void>;
}

export function EditRuleModal({ isOpen, isSaving, rule, categories, onClose, onSubmit }: EditRuleModalProps) {
  const t = useTranslations("ruleModals.edit");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("rules.errors");

  const [name, setName] = useState(rule?.name ?? "");
  const [matchType, setMatchType] = useState<RuleMatchType>(rule?.matchType ?? "DESCRIPTION");
  const [operator, setOperator] = useState<RuleOperator>(rule?.operator ?? "CONTAINS");
  const [value, setValue] = useState(rule?.value ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(rule?.categoryId ?? null);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleMatchTypeChange = (next: RuleMatchType) => {
    setMatchType(next);
    if (next === "TRANSACTION_TYPE") {
      setOperator("EQUALS");
      setValue("");
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedValue = value.trim();
    if (!trimmedName || !trimmedValue || !categoryId) return;

    try {
      await onSubmit({ name: trimmedName, matchType, operator, value: trimmedValue, categoryId });
    } catch (err) {
      setError(mapRuleErrorMessage(err, tErrors));
    }
  };

  return (
    <AppModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={isSaving}
      size="md"
      title={t("title")}
      description={t("description")}
      footer={
        <>
          <ModalCancelButton isPending={isSaving} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton form="edit-rule-form" isPending={isSaving} pendingLabel={tCommon("actions.saving")}>
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="edit-rule-form" onSubmit={handleSubmit} className="space-y-6">
        <RuleConditionFields
          idPrefix="edit-rule"
          name={name}
          onNameChange={setName}
          matchType={matchType}
          onMatchTypeChange={handleMatchTypeChange}
          operator={operator}
          onOperatorChange={setOperator}
          value={value}
          onValueChange={setValue}
          categoryId={categoryId}
          onCategoryIdChange={setCategoryId}
          categories={categories}
        />
        <FormErrorMessage message={error} />
      </form>
    </AppModal>
  );
}
