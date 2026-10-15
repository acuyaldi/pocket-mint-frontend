"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

export type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: number;
  message: string;
  variant: ToastVariant;
}

/**
 * Auto-dismiss duration per variant (ms). Attention-demanding variants linger a
 * little longer so they stay readable; none is so long that a stale
 * notification lingers across the workspace.
 */
const DURATIONS: Record<ToastVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
};

/**
 * A repeat of the same (message + variant) within this window is treated as the
 * same notification and dropped. This is the deduplication guarantee behind
 * "exactly one snackbar per failure" — even if two layers fire for one request,
 * only one is shown.
 */
const DEDUPE_WINDOW_MS = 4000;

const ICONS: Record<ToastVariant, typeof AlertCircle> = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

/** Decorative icon tint per variant — paired with role + text, never the only cue. */
const ICON_CLASS: Record<ToastVariant, string> = {
  success: "text-mint",
  error: "text-coral-strong",
  warning: "text-warning",
  info: "text-slate",
};

let pushToast: ((message: string, variant: ToastVariant) => void) | null = null;
let nextId = 0;

/**
 * Show a top snackbar from anywhere: `toast("Tersimpan")` /
 * `toast("Gagal", "error")`. Safely no-ops when no <Toaster/> is mounted yet
 * (e.g. a call that races first paint), so callers never need a null guard.
 */
export function toast(message: string, variant: ToastVariant = "success") {
  pushToast?.(message, variant);
}

interface ToasterProps {
  /** Accessible label for each toast's dismiss button. Localized at the mount site. */
  closeLabel?: string;
  /** Accessible name for the notification region landmark. Localized at the mount site. */
  regionLabel?: string;
}

/**
 * Application-level snackbar viewport. Mounted exactly once in the authenticated
 * shell (`app/(app)/layout.tsx`), so it survives client-side route transitions
 * and never re-mounts per page.
 *
 * Behavior:
 * - Overlays content with `position: fixed` — it never takes document-flow
 *   space, so showing/hiding a snackbar can't shift the page (no CLS).
 * - One snackbar is visible at a time; further messages queue (FIFO) and appear
 *   as each is dismissed.
 * - Identical messages are deduplicated within {@link DEDUPE_WINDOW_MS}.
 * - Errors/warnings announce assertively (`role="alert"`); success/info announce
 *   politely (`role="status"`). The container is a plain region landmark, not a
 *   live region, so nothing is announced through two live regions.
 * - Auto-dismisses; hovering or focusing a toast pauses the timer so it stays
 *   readable. Respects `prefers-reduced-motion`. Never traps or moves focus.
 */
export function Toaster({
  closeLabel = "Close notification",
  regionLabel = "Notifications",
}: ToasterProps) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const lastShownRef = useRef<Map<string, number>>(new Map());

  const dismissFirst = useCallback(() => {
    setItems((current) => current.slice(1));
  }, []);

  useEffect(() => {
    pushToast = (message, variant) => {
      const key = `${variant}|${message}`;
      const now = Date.now();
      const last = lastShownRef.current.get(key);
      setItems((current) => {
        // Already visible or queued, or a rapid repeat of a just-shown message:
        // drop it so one failure can never stack multiple identical snackbars.
        if (current.some((item) => `${item.variant}|${item.message}` === key)) return current;
        if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return current;
        lastShownRef.current.set(key, now);
        return [...current, { id: ++nextId, message, variant }];
      });
    };
    return () => {
      pushToast = null;
    };
  }, []);

  // Drive the auto-dismiss timer for the currently visible toast only. Pausing
  // (hover/focus) tears the timer down; leaving restarts it so the message stays
  // readable while the pointer/focus is on it.
  useEffect(() => {
    if (items.length === 0 || paused) return;
    const timer = setTimeout(dismissFirst, DURATIONS[items[0].variant]);
    return () => clearTimeout(timer);
  }, [items, paused, dismissFirst]);

  const enterExit = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.15 },
      }
    : {
        initial: { opacity: 0, y: -12, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -8, scale: 0.98 },
        transition: { duration: 0.2 },
      };

  return (
    <div
      role="region"
      aria-label={regionLabel}
      className="pointer-events-none fixed inset-x-0 top-0 z-100 flex flex-col items-center px-4 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] md:left-64 md:pt-19"
    >
      <AnimatePresence>
        {items.slice(0, 1).map((item) => {
          const Icon = ICONS[item.variant];
          const assertive = item.variant === "error" || item.variant === "warning";
          return (
            <motion.div
              key={item.id}
              {...enterExit}
              role={assertive ? "alert" : "status"}
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              className="pointer-events-auto flex w-full max-w-md items-start gap-2.5 rounded-lg border border-border bg-card px-4 py-3 text-sm text-foreground shadow-lg"
            >
              <Icon className={`mt-0.5 size-4 shrink-0 ${ICON_CLASS[item.variant]}`} aria-hidden="true" />
              <span className="min-w-0 flex-1 wrap-break-word">{item.message}</span>
              <button
                type="button"
                onClick={dismissFirst}
                aria-label={closeLabel}
                className="-my-1.5 -mr-1.5 inline-flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
