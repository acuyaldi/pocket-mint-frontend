"use client";

import { useTranslations } from "next-intl";
import { Trash2 } from "lucide-react";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import type { RuleDto } from "@/src/types/rule";

export function DeleteRuleModal({
  rule,
  isDeleting,
  onClose,
  onConfirm,
}: {
  rule: RuleDto | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("ruleModals.delete");
  const tCommon = useTranslations("common");

  const handleClose = () => {
    if (!isDeleting) onClose();
  };

  return (
    <AppModal
      open={!!rule}
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
      description={rule ? t("description", { name: rule.name }) : undefined}
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
