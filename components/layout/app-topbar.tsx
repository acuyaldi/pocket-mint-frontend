"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

function formatTopbarDate(date: Date, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AppTopbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [accountLabel, setAccountLabel] = useState(t("account"));
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active || !user) return;
      const meta = user.user_metadata ?? {};
      setAccountLabel(meta.full_name || meta.name || user.email || t("account"));
    });

    return () => {
      active = false;
    };
  }, [t]);

  return (
    <header className="sticky top-0 z-20 hidden h-16 shrink-0 bg-background/85 px-10 backdrop-blur-sm md:block">
      <div className="mx-auto flex h-full w-full max-w-[1280px] items-center justify-between">
        <div className="flex flex-col">
          <p className="text-xs text-muted-foreground">
            {t("welcome")}{" "}
            <span className="font-semibold text-primary">{accountLabel}</span>
          </p>
          <p
            suppressHydrationWarning
            className="mt-0.5 text-xs tabular-nums text-muted-foreground"
          >
            {formatTopbarDate(now, locale)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher />
          <button
            type="button"
            aria-label={t("notifications")}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-high hover:text-primary active:scale-95"
          >
            <Bell className="size-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
