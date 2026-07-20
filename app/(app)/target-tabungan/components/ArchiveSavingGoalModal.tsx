"use client";

import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    if (!goal || isArchiving) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [goal, isArchiving, onClose]);

  return (
    <AnimatePresence>
      {goal && (
        <motion.div
          key="archive-goal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            key="archive-goal-card"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="archive-goal-title"
            className="w-full max-w-sm overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl"
          >
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-amber/10 text-amber">
                <Archive className="size-5" />
              </div>
              <h2 id="archive-goal-title" className="text-xl font-semibold text-foreground">
                {t("title")}
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                {t("description", { name: goal.name })}
              </p>
            </div>
            <footer className="flex flex-col-reverse gap-3 border-t border-border/50 bg-surface-low px-6 py-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isArchiving}
                className="h-11 flex-1 bg-card"
              >
                {tCommon("actions.cancel")}
              </Button>
              <Button
                type="button"
                onClick={onConfirm}
                disabled={isArchiving}
                className="h-11 flex-1 gap-2"
              >
                {isArchiving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    {tCommon("actions.archiving")}
                  </>
                ) : (
                  <>
                    <Archive className="size-4" />
                    {t("confirm")}
                  </>
                )}
              </Button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
