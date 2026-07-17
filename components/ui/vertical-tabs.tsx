"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import dashboard from "@/playwright/screenshots/dashboard.png";
import wallet from "@/playwright/screenshots/wallets.png";
import transaction from "@/playwright/screenshots/transactions.png";
import installment from "@/playwright/screenshots/installment.png";
import analytics from "@/playwright/screenshots/analytics.png";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SCREENS = [
  {
    id: "dashboard",
    number: "01",
    title: "Dashboard",
    description: "Lihat posisi keuangan Anda dalam satu ringkasan.",
    image: dashboard,
    alt: "Tampilan Dashboard Pocket Mint",
    width: 1280,
    height: 1312,
  },
  {
    id: "wallet",
    number: "02",
    title: "Wallet",
    description: "Semua aset dan kewajiban dalam satu ledger.",
    image: wallet,
    alt: "Tampilan Wallet Pocket Mint",
    width: 1384,
    height: 1600,
  },
  {
    id: "transaction",
    number: "03",
    title: "Transaction",
    description: "Riwayat yang cepat dicari dan mudah diperbaiki.",
    image: transaction,
    alt: "Tampilan Transaction Pocket Mint",
    width: 1489,
    height: 1600,
  },
  {
    id: "installment",
    number: "04",
    title: "Installment",
    description: "Pantau kewajiban tanpa kehilangan tanggal jatuh tempo.",
    image: installment,
    alt: "Tampilan Installment Pocket Mint",
    width: 1600,
    height: 1280,
  },
  {
    id: "analytics",
    number: "05",
    title: "Analytics",
    description: "Baca pola pemasukan dan pengeluaran dengan lebih jelas.",
    image: analytics,
    alt: "Tampilan Analytics Pocket Mint",
    width: 676,
    height: 541,
  },
] as const;

const AUTO_PLAY_DURATION = 3000;

export function VerticalTabs() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPointerPaused, setIsPointerPaused] = useState(false);
  const [isFocusPaused, setIsFocusPaused] = useState(false);
  const reducedMotion = useReducedMotion() ?? false;
  const isPaused = isPointerPaused || isFocusPaused || reducedMotion;
  const activeScreen = SCREENS[activeIndex];

  const selectScreen = useCallback(
    (index: number) => {
      if (index === activeIndex) return;
      setDirection(index > activeIndex ? 1 : -1);
      setActiveIndex(index);
    },
    [activeIndex]
  );

  const handleNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((current) => (current + 1) % SCREENS.length);
  }, []);

  const handlePrevious = useCallback(() => {
    setDirection(-1);
    setActiveIndex(
      (current) => (current - 1 + SCREENS.length) % SCREENS.length
    );
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const timeout = window.setTimeout(handleNext, AUTO_PLAY_DURATION);
    return () => window.clearTimeout(timeout);
  }, [activeIndex, handleNext, isPaused]);

  const handleTabKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number
  ) => {
    const keys = ["ArrowDown", "ArrowRight", "ArrowUp", "ArrowLeft", "Home", "End"];
    if (!keys.includes(event.key)) return;

    event.preventDefault();
    const nextIndex =
      event.key === "Home"
        ? 0
        : event.key === "End"
          ? SCREENS.length - 1
          : event.key === "ArrowDown" || event.key === "ArrowRight"
            ? (index + 1) % SCREENS.length
            : (index - 1 + SCREENS.length) % SCREENS.length;

    selectScreen(nextIndex);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>(
      '[role="tab"]'
    );
    tabs?.[nextIndex]?.focus();
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsFocusPaused(false);
    }
  };

  const imageVariants = {
    enter: (travelDirection: number) => ({
      y: reducedMotion ? 0 : travelDirection > 0 ? "-12%" : "12%",
      opacity: 0,
    }),
    center: { y: 0, opacity: 1 },
    exit: (travelDirection: number) => ({
      y: reducedMotion ? 0 : travelDirection > 0 ? "12%" : "-12%",
      opacity: 0,
    }),
  };

  return (
    <div
      className="grid gap-10 lg:grid-cols-12 lg:items-start lg:gap-12"
      onMouseEnter={() => setIsPointerPaused(true)}
      onMouseLeave={() => setIsPointerPaused(false)}
      onFocusCapture={() => setIsFocusPaused(true)}
      onBlurCapture={handleBlur}
    >
      <div className="order-2 flex flex-col lg:order-1 lg:col-span-5">
        <div className="mb-8 flex flex-col gap-3 md:mb-10">
          <h2 className="max-w-lg text-4xl font-semibold tracking-tight text-primary md:text-5xl lg:text-6xl">
            Semua yang penting, dalam satu alur.
          </h2>
          <p className="max-w-md text-base leading-7 text-muted-foreground sm:text-xl sm:leading-8">
            Berpindah dari ringkasan ke detail tanpa kehilangan konteks
            finansial Anda.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Fitur Pocket Mint"
          aria-orientation="vertical"
          className="flex flex-col"
        >
          {SCREENS.map((screen, index) => {
            const isActive = index === activeIndex;

            return (
              <button
                key={screen.id}
                id={`feature-tab-${screen.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-controls={`feature-panel-${screen.id}`}
                tabIndex={isActive ? 0 : -1}
                onClick={() => selectScreen(index)}
                onKeyDown={(event) => handleTabKeyDown(event, index)}
                className={cn(
                  "group relative flex min-h-11 items-start gap-4 border-t border-border py-5 pl-6 text-left outline-none transition-colors first:border-t-0 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:py-6",
                  isActive && "rounded-xl bg-mint/20 shadow-sm ring-1 ring-primary/15",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "absolute inset-y-0 left-0 w-0.5 bg-border",
                    isActive && "bg-primary/25"
                  )}
                >
                  {isActive ? (
                    <motion.span
                      key={`${screen.id}-${isPaused}`}
                      className="absolute inset-x-0 top-0 h-full origin-top bg-primary"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: isPaused ? 0 : 1 }}
                      transition={{
                        duration: isPaused ? 0.15 : AUTO_PLAY_DURATION / 1000,
                        ease: "linear",
                      }}
                    />
                  ) : null}
                </span>

                <span
                  aria-hidden="true"
                  className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-xs font-semibold tracking-[0.08em] text-primary"
                >
                  {screen.number}
                </span>
                <span className="flex flex-1 flex-col gap-2">
                  <span
                    className={cn(
                      "text-2xl font-medium tracking-tight md:text-3xl",
                      isActive
                        ? "text-3xl font-semibold text-primary md:text-4xl"
                        : null
                    )}
                  >
                    {screen.title}
                  </span>
                  <AnimatePresence initial={false}>
                    {isActive ? (
                      <motion.span
                        initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: reducedMotion ? 0 : 0.25 }}
                        className="overflow-hidden"
                      >
                        <span className="block max-w-sm pb-1 text-sm leading-6 text-muted-foreground md:text-base">
                          {screen.description}
                        </span>
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="order-1 self-end lg:order-2 lg:col-span-7 lg:pt-2">
        <div
          id={`feature-panel-${activeScreen.id}`}
          role="tabpanel"
          aria-labelledby={`feature-tab-${activeScreen.id}`}
          className="relative aspect-16/10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
        >
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={activeScreen.id}
              custom={direction}
              variants={imageVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reducedMotion ? 0 : 0.45, ease: [0.23, 1, 0.32, 1] }}
              className="absolute inset-0 flex items-start justify-center"
            >
              <Image
                src={activeScreen.image}
                alt={activeScreen.alt}
                width={activeScreen.width}
                height={activeScreen.height}
                sizes="(max-width: 1023px) calc(100vw - 40px), 720px"
                className="h-full w-full object-contain object-top"
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute bottom-4 right-4 flex gap-2 md:bottom-6 md:right-6">
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-11 rounded-full shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              aria-label="Fitur sebelumnya"
              onClick={handlePrevious}
            >
              <ArrowLeft />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              className="size-11 rounded-full shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground"
              aria-label="Fitur berikutnya"
              onClick={handleNext}
            >
              <ArrowRight />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VerticalTabs;
