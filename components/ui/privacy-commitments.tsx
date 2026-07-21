"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useTranslations } from "next-intl";

import { Card, CardContent } from "@/components/ui/card";

export function PrivacyCommitments() {
  const t = useTranslations("landing.privacy");
  const reducedMotion = useReducedMotion() ?? false;
  const privacyPoints = t.raw("points") as string[];

  return (
    <ul className="grid gap-3" aria-label={t("ariaLabel")}>
      {privacyPoints.map((point, index) => (
        <motion.li
          key={point}
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{
            delay: reducedMotion ? 0 : index * 0.08,
            duration: reducedMotion ? 0 : 0.4,
          }}
        >
          <Card
            size="sm"
            className="py-0 shadow-sm shadow-primary/5 transition-[transform,background-color,box-shadow] duration-300 motion-safe:hover:-translate-y-1 hover:bg-muted/40 hover:shadow-md hover:ring-primary/30 focus-within:bg-muted/40 focus-within:ring-primary/30"
          >
            <CardContent className="flex min-h-20 items-center gap-4 px-4 py-4">
              <span
                aria-hidden="true"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-xs font-semibold tracking-[0.08em] text-primary"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-sm font-medium leading-6 text-foreground">
                {point}
              </p>
            </CardContent>
          </Card>
        </motion.li>
      ))}
    </ul>
  );
}
