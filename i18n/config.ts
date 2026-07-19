export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "id";

export const LOCALE_COOKIE = "NEXT_LOCALE";

/** BCP-47 tags for `Intl` formatters — next-intl's `Locale` is just "id" | "en". */
export const INTL_LOCALE: Record<Locale, string> = {
  id: "id-ID",
  en: "en-US",
};
