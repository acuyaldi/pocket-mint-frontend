"use client";

import { useTranslations } from "next-intl";
import { RotateCcw } from "lucide-react";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import type { BudgetDto } from "@/src/types/budget";

export function RestoreBudgetModal({
  budget,
  isRestoring,
  onClose,
  onConfirm,
}: {
  budget: BudgetDto | null;
  isRestoring: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("budgetModals.restore");
  const tCommon = useTranslations("common");

  const handleClose = () => {
    if (!isRestoring) onClose();
  };

  return (
    <AppModal
      open={!!budget}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={isRestoring}
      size="sm"
      role="alertdialog"
      icon={
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-mint/10 text-mint">
          <RotateCcw className="size-5" />
        </div>
      }
      title={t("title")}
      description={budget ? t("description", { name: budget.category.name }) : undefined}
      footer={
        <>
          <ModalCancelButton isPending={isRestoring} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton
            type="button"
            isPending={isRestoring}
            pendingLabel={tCommon("actions.restoring")}
            onClick={onConfirm}
          >
            <RotateCcw className="size-4" />
            {t("confirm")}
          </ModalSubmitButton>
        </>
      }
    />
  );
}
