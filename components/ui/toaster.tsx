"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2 } from "lucide-react";

type ToastVariant = "success" | "error";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

let pushToast: ((message: string, variant: ToastVariant) => void) | null = null;
let nextId = 0;

/** Tampilkan toast dari mana saja: toast("Akun disimpan") / toast("Gagal", "error"). */
export function toast(message: string, variant: ToastVariant = "success") {
  pushToast?.(message, variant);
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    pushToast = (message, variant) => {
      const id = ++nextId;
      setToasts((current) => [...current, { id, message, variant }]);
      setTimeout(() => {
        setToasts((current) => current.filter((item) => item.id !== id));
      }, 3500);
    };
    return () => {
      pushToast = null;
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-100 flex flex-col items-center gap-2 md:inset-x-auto md:right-6 md:bottom-6 md:items-end"
    >
      <AnimatePresence>
        {toasts.map((item) => (
          <motion.div
            key={item.id}
            role="status"
            initial={{ opacity: 0, y: 12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-auto flex items-center gap-2.5 rounded-lg border border-border/60 bg-card px-4 py-3 text-sm text-foreground shadow-lg"
          >
            {item.variant === "error" ? (
              <AlertCircle className="size-4 shrink-0 text-coral" />
            ) : (
              <CheckCircle2 className="size-4 shrink-0 text-mint" />
            )}
            {item.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
