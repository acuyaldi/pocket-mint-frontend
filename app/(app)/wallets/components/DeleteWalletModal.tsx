"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Wallet } from "@/src/types/wallet";

export default function DeleteWalletModal({
  wallet,
  isDeleting,
  onClose,
  onConfirm,
}: {
  wallet: Wallet | null;
  isDeleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const handleClose = () => {
    if (!isDeleting) onClose();
  };

  return (
    <AnimatePresence>
      {wallet && (
        <motion.div
          key="delete-wallet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-60 flex items-center justify-center bg-primary/40 p-4 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            key="delete-wallet-card"
            initial={{ opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 12 }}
            transition={{ duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(event) => event.stopPropagation()}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-wallet-title"
            className="w-full max-w-sm overflow-hidden rounded-xl border border-border/60 bg-card shadow-xl"
          >
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-coral/10 text-coral">
                <Trash2 className="size-5" />
              </div>
              <h2
                id="delete-wallet-title"
                className="text-xl font-semibold text-foreground"
              >
                Hapus Akun?
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">
                Akun{" "}
                <strong className="font-semibold text-foreground">
                  {wallet.name}
                </strong>{" "}
                beserta riwayat transaksinya akan dihapus permanen. Tindakan ini
                tidak dapat dibatalkan.
              </p>
            </div>
            <footer className="flex flex-col-reverse gap-3 border-t border-border/50 bg-surface-low px-6 py-4 sm:flex-row">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isDeleting}
                className="h-11 flex-1 bg-card"
              >
                Batal
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={onConfirm}
                disabled={isDeleting}
                className="h-11 flex-1 gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Menghapus
                  </>
                ) : (
                  <>
                    <Trash2 className="size-4" />
                    Hapus Akun
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
