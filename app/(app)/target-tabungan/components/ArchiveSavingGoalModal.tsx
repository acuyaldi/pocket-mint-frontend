"use client";

import { useTranslations } from "next-intl";
import { Archive } from "lucide-react";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import type { SavingGoal } from "@/src/types/savingGoal";

export default function ArchiveSavingGoalModal({
  goal,
  isArchiving,
  onClose,
  onConfirm,
}: {
  goal: SavingGoal | null;
  isArchiving: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("savingGoalModals.archive");
  const tCommon = useTranslations("common");

  const handleClose = () => {
    if (!isArchiving) onClose();
  };

  return (
    <AppModal
      open={!!goal}
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
      description={goal ? t("description", { name: goal.name }) : undefined}
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
