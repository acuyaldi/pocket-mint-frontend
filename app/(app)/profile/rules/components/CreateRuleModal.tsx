"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FormErrorMessage } from "@/components/ui/form-field";
import type { Category } from "@/src/features/categories/hooks/useCategories";
import type { CreateRuleDto } from "@/src/features/rules/hooks/useRules";
import type { RuleMatchType, RuleOperator } from "@/src/types/rule";
import { RuleConditionFields } from "./RuleConditionFields";
import { mapRuleErrorMessage } from "../lib/error-messages";

interface CreateRuleModalProps {
  isOpen: boolean;
  isSaving: boolean;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: CreateRuleDto) => Promise<void>;
}

export function CreateRuleModal({ isOpen, isSaving, categories, onClose, onSubmit }: CreateRuleModalProps) {
  const t = useTranslations("ruleModals.create");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("rules.errors");

  const [name, setName] = useState("");
  const [matchType, setMatchType] = useState<RuleMatchType>("DESCRIPTION");
  const [operator, setOperator] = useState<RuleOperator>("CONTAINS");
  const [value, setValue] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
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
      setName("");
      setMatchType("DESCRIPTION");
      setOperator("CONTAINS");
      setValue("");
      setCategoryId(null);
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
          <ModalSubmitButton
            form="create-rule-form"
            isPending={isSaving}
            pendingLabel={tCommon("actions.saving")}
            disabled={categories.length === 0}
          >
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="create-rule-form" onSubmit={handleSubmit} className="space-y-6">
        <RuleConditionFields
          idPrefix="create-rule"
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
