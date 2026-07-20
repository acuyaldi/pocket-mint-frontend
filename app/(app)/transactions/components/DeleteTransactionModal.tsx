"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FormErrorMessage } from "@/components/ui/form-field";

interface DeleteTransactionModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteTransactionModal({ isOpen, isDeleting, onClose, onConfirm }: DeleteTransactionModalProps) {
  const t = useTranslations("transactionModals.delete");
  const tCommon = useTranslations("common");
  const [error, setError] = useState("");

  const handleClose = () => {
    if (!isDeleting) {
      setError("");
      onClose();
    }
  };

  const handleConfirm = async () => {
    setError("");
    try {
      await onConfirm();
    } catch (err) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? t("genericError"));
    }
  };

  return (
    <AppModal
      open={isOpen}
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
      description={t("description")}
      footer={
        <>
          <ModalCancelButton isPending={isDeleting} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton
            type="button"
            variant="destructive"
            isPending={isDeleting}
            pendingLabel={t("deleting")}
            onClick={handleConfirm}
          >
            <Trash2 className="size-4" />
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <FormErrorMessage message={error} />
    </AppModal>
  );
}
