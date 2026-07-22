"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import type { MerchantMappingDto } from "@/src/types/merchantMapping";

export function DeleteMerchantMappingModal({
  mapping,
  isDeleting,
  onClose,
  onConfirm,
}: {
  mapping: MerchantMappingDto | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("merchantMappingModals.delete");
  const tCommon = useTranslations("common");

  const handleClose = () => {
    if (!isDeleting) onClose();
  };

  return (
    <AppModal
      open={!!mapping}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={isDeleting}
      size="sm"
      role="alertdialog"
      icon={
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-coral/10 text-coral">
          <Trash2 className="size-5" />
        </div>
      }
      title={t("title")}
      description={mapping ? t("description", { name: mapping.merchantName }) : undefined}
      footer={
        <>
          <ModalCancelButton isPending={isDeleting} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton
            type="button"
            variant="destructive"
            isPending={isDeleting}
            pendingLabel={tCommon("actions.deleting")}
            onClick={onConfirm}
          >
            <Trash2 className="size-4" />
            {t("confirm")}
          </ModalSubmitButton>
        </>
      }
    />
  );
}
