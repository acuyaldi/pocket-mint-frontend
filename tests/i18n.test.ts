import { describe, it, expect, vi, beforeEach } from "vitest";
import { defaultLocale, locales, LOCALE_COOKIE, INTL_LOCALE } from "@/i18n/config";
import { formatCurrency } from "@/lib/utils";
import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

describe("locale config", () => {
  it("defaults to Indonesian", () => {
    expect(defaultLocale).toBe("id");
  });

  it("supports exactly id and en", () => {
    expect(locales).toEqual(["id", "en"]);
  });

  it("maps each locale to a BCP-47 Intl tag", () => {
    expect(INTL_LOCALE.id).toBe("id-ID");
    expect(INTL_LOCALE.en).toBe("en-US");
  });
});

// Node's ICU data may render a non-breaking space in currency output —
// collapse all whitespace so the assertion isn't tied to that quirk.
function collapseWhitespace(value: string): string {
  return value.replace(/\s+/gu, " ");
}

describe("formatCurrency", () => {
  it("formats IDR the Indonesian way by default", () => {
    expect(collapseWhitespace(formatCurrency(1250000))).toBe("Rp 1.250.000");
  });

  it("formats IDR the English way when given the en-US locale", () => {
    expect(collapseWhitespace(formatCurrency(1250000, INTL_LOCALE.en))).toBe("IDR 1,250,000");
  });
});

function collectKeys(obj: unknown, prefix = ""): string[] {
  if (typeof obj !== "object" || obj === null) return [prefix];
  return Object.entries(obj).flatMap(([key, value]) =>
    collectKeys(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe("translation catalogs", () => {
  it("have the same set of keys in id and en", () => {
    const idKeys = collectKeys(idMessages).sort();
    const enKeys = collectKeys(enMessages).sort();
    expect(idKeys).toEqual(enKeys);
  });

  it("expose the critical navigation and profile keys", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.nav.dashboard).toBeTruthy();
      expect(messages.nav.wallets).toBeTruthy();
      expect(messages.profile.language.id).toBeTruthy();
      expect(messages.profile.language.en).toBeTruthy();
    }
  });
});

describe("setLocale server action", () => {
  const cookieSet = vi.fn();

  beforeEach(() => {
    cookieSet.mockClear();
    vi.doMock("next/headers", () => ({
      cookies: async () => ({ set: cookieSet }),
    }));
  });

  it("persists a supported locale to the NEXT_LOCALE cookie", async () => {
    vi.resetModules();
    const { setLocale } = await import("@/app/actions/locale");
    await setLocale("en");
    expect(cookieSet).toHaveBeenCalledWith(
      LOCALE_COOKIE,
      "en",
      expect.objectContaining({ path: "/" }),
    );
  });

  it("ignores an unsupported locale", async () => {
    vi.resetModules();
    const { setLocale } = await import("@/app/actions/locale");
    // @ts-expect-error intentionally invalid locale for the runtime guard
    await setLocale("fr");
    expect(cookieSet).not.toHaveBeenCalled();
  });
});
