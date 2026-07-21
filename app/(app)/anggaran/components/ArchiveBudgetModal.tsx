"use client";

import { useTranslations } from "next-intl";
import { Archive } from "lucide-react";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import type { BudgetDto } from "@/src/types/budget";

export function ArchiveBudgetModal({
  budget,
  isArchiving,
  onClose,
  onConfirm,
}: {
  budget: BudgetDto | null;
  isArchiving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("budgetModals.archive");
  const tCommon = useTranslations("common");

  const handleClose = () => {
    if (!isArchiving) onClose();
  };

  return (
    <AppModal
      open={!!budget}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={isArchiving}
      size="sm"
      role="alertdialog"
      icon={
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-amber/10 text-amber">
          <Archive className="size-5" />
        </div>
      }
      title={t("title")}
      description={budget ? t("description", { name: budget.category.name }) : undefined}
      footer={
        <>
          <ModalCancelButton isPending={isArchiving} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton
            type="button"
            isPending={isArchiving}
            pendingLabel={tCommon("actions.archiving")}
            onClick={onConfirm}
          >
            <Archive className="size-4" />
            {t("confirm")}
          </ModalSubmitButton>
        </>
      }
    />
  );
}
