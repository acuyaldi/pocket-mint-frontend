"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { Input } from "@/components/ui/input";
import { FormField, FormErrorMessage } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Category } from "@/src/features/categories/hooks/useCategories";
import type { MerchantMappingDto } from "@/src/types/merchantMapping";
import type { UpdateMerchantMappingDto } from "@/src/features/merchantMapping/hooks/useMerchantMappings";
import { mapMerchantMappingErrorMessage } from "../lib/error-messages";

interface EditMerchantMappingModalProps {
  isOpen: boolean;
  isSaving: boolean;
  mapping: MerchantMappingDto | null;
  categories: Category[];
  onClose: () => void;
  onSubmit: (data: UpdateMerchantMappingDto) => Promise<void>;
}

export function EditMerchantMappingModal({
  isOpen,
  isSaving,
  mapping,
  categories,
  onClose,
  onSubmit,
}: EditMerchantMappingModalProps) {
  const t = useTranslations("merchantMappingModals.edit");
  const tCommon = useTranslations("common");
  const tErrors = useTranslations("merchantMappings.errors");

  const [merchantName, setMerchantName] = useState(mapping?.merchantName ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(mapping?.categoryId ?? null);
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
            form="edit-merchant-mapping-form"
            isPending={isSaving}
            pendingLabel={tCommon("actions.saving")}
          >
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="edit-merchant-mapping-form" onSubmit={handleSubmit} className="space-y-6">
        <FormField label={t("merchantName")} htmlFor="edit-merchant-name" required>
          <Input
            id="edit-merchant-name"
            type="text"
            value={merchantName}
            onChange={(event) => setMerchantName(event.target.value)}
            placeholder={t("merchantNamePlaceholder")}
            className="h-11 border-border/70 bg-card px-3 text-sm"
            required
          />
        </FormField>

        <FormField label={t("category")} htmlFor="edit-merchant-category" required>
          <Select
            value={categoryId ?? undefined}
            onValueChange={(value) => setCategoryId(value ?? null)}
            items={Object.fromEntries(categories.map((c) => [c.id, c.name]))}
          >
            <SelectTrigger id="edit-merchant-category">
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
