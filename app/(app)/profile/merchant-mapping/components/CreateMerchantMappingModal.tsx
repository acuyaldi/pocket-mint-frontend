"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { Input } from "@/components/ui/input";
import { FormField, FormErrorMessage } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/src/features/categories/hooks/useCategories";
import type { CreateMerchantMappingDto } from "@/src/features/merchantMapping/hooks/useMerchantMappings";
import { mapMerchantMappingErrorMessage } from "../lib/error-messages";

interface CreateMerchantMappingModalProps {
  isOpen: boolean;
  isSaving: boolean;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: CreateMerchantMappingDto) => Promise<void>;
}

export function CreateMerchantMappingModal({
  isOpen,
  isSaving,
  categories,
  onClose,
  onSubmit,
}: CreateMerchantMappingModalProps) {
  const t = useTranslations("merchantMappingModals.create");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("merchantMappings.errors");

  const [merchantName, setMerchantName] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const trimmedName = merchantName.trim();
    if (!trimmedName || !categoryId) return;

    try {
      await onSubmit({ merchantName: trimmedName, categoryId });
      setMerchantName("");
      setCategoryId(null);
    } catch (err) {
      setError(mapMerchantMappingErrorMessage(err, tErrors));
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
            form="create-merchant-mapping-form"
            isPending={isSaving}
            pendingLabel={tCommon("actions.saving")}
            disabled={categories.length === 0}
          >
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="create-merchant-mapping-form" onSubmit={handleSubmit} className="space-y-6">
        <FormField label={t("merchantName")} htmlFor="create-merchant-name" required>
          <Input
            id="create-merchant-name"
            type="text"
            value={merchantName}
            onChange={(event) => setMerchantName(event.target.value)}
            placeholder={t("merchantNamePlaceholder")}
            className="h-11 border-border/70 bg-card px-3 text-sm"
            required
          />
        </FormField>

        <FormField label={t("category")} htmlFor="create-merchant-category" required>
          <Select
            value={categoryId ?? undefined}
            onValueChange={(value) => setCategoryId(value ?? null)}
            items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
          >
            <SelectTrigger id="create-merchant-category">
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

        <FormErrorMessage message={error} />
      </form>
    </AppModal>
  );
}
