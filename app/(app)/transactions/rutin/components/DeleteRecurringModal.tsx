"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import type { RecurringTransaction } from "@/src/types/recurringTransaction";

export default function DeleteRecurringModal({
  template,
  isDeleting,
  onClose,
  onConfirm,
}: {
  template: RecurringTransaction | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("recurringTransactionModals.delete");
  const tCommon = useTranslations("common");

  const handleClose = () => {
    if (!isDeleting) onClose();
  };

  return (
    <AppModal
      open={!!template}
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
      description={template ? t("description", { name: template.name }) : undefined}
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
