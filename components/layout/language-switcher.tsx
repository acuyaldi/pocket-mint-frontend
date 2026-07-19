"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check } from "lucide-react";
import { setLocale } from "@/app/actions/locale";
import { locales, type Locale } from "@/i18n/config";
import { FlagID, FlagGB } from "@/components/icons/flags";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FLAGS: Record<Locale, typeof FlagID> = { id: FlagID, en: FlagGB };

function useLocaleChange() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleChange(next: Locale) {
    if (next === locale || isPending) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return { locale, isPending, handleChange };
}

/** Shared menu items — dropped into the topbar's own dropdown (desktop) and
 * into the account menu (mobile), so both surfaces stay in sync. */
export function LanguageMenuItems() {
  const t = useTranslations("profile.language");
  const { locale, isPending, handleChange } = useLocaleChange();

  return (
    <>
      {locales.map((item) => {
        const Flag = FLAGS[item];
        return (
          <DropdownMenuItem
            key={item}
            disabled={isPending}
            onClick={() => handleChange(item)}
            aria-pressed={locale === item}
          >
            <Flag className="size-4 shrink-0 rounded-xs" />
            <span className="flex-1">{t(item)}</span>
            {locale === item && <Check className="text-primary" />}
          </DropdownMenuItem>
        );
      })}
    </>
  );
}

/** Compact topbar control: flag + language code, opens the same menu items. */
export function LanguageSwitcher() {
  const t = useTranslations("nav");
  const { locale } = useLocaleChange();
  const Flag = FLAGS[locale as Locale];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={t("language")}
            className="flex items-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-high hover:text-primary active:scale-95"
          >
            <Flag className="size-4 shrink-0 rounded-xs" />
            <span className="uppercase">{locale}</span>
          </button>
        }
      />
      <DropdownMenuContent align="end">
        <LanguageMenuItems />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
