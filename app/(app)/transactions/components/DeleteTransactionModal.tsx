"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  const [wasOpen, setWasOpen] = useState(false);

  // Clear a stale error from a previous delete attempt when this reopens for
  // a (possibly different) transaction. Adjusted during render per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  if (isOpen && !wasOpen) {
    setWasOpen(true);
    setError("");
  } else if (!isOpen && wasOpen) {
    setWasOpen(false);
  }

  useEffect(() => {
    if (!isOpen || isDeleting) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, isDeleting, onClose]);

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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="delete-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => { if (!isDeleting) onClose(); }}
        >
          <motion.div
            key="delete-modal-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-tx-title"
            aria-describedby="delete-tx-description"
            className="w-full max-w-sm mx-4"
          >
            <Card className="border shadow-2xl" style={{ backgroundColor: "var(--color-popover)", borderColor: "var(--color-border)" }}>
              <CardContent className="pt-6 pb-6">
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="size-12 rounded-full flex items-center justify-center" style={{ backgroundColor: "rgba(186,26,26,0.08)" }}>
                    <Trash2 className="size-5" style={{ color: "var(--color-destructive)" }} />
                  </div>
                  <div>
                    <h3 id="delete-tx-title" className="text-base font-semibold" style={{ color: "var(--color-foreground)", fontFamily: "var(--font-hanken)" }}>
                      {t("title")}
                    </h3>
                    <p id="delete-tx-description" className="text-sm mt-1" style={{ color: "var(--color-muted-foreground)", fontFamily: "var(--font-inter)" }}>
                      {t("description")}
                    </p>
                  </div>
                  {error ? (
                    <p className="w-full rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
                      {error}
                    </p>
                  ) : null}
                  <div className="flex items-center gap-3 w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => { if (!isDeleting) onClose(); }}
                      disabled={isDeleting}
                      className="flex-1 h-11 transition-all"
                      style={{ backgroundColor: "var(--color-accent)", border: "1px solid var(--color-border)", color: "var(--color-accent-foreground)" }}
                    >
                      {tCommon("actions.cancel")}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleConfirm}
                      disabled={isDeleting}
                      className="flex-1 h-11 font-medium gap-2"
                    >
                      {isDeleting ? (<><Loader2 className="size-4 animate-spin" />{t("deleting")}</>) : t("submit")}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
