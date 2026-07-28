import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

/**
 * Source-text contract tests for the top snackbar, matching this repo's
 * convention (no jsdom in the unit project — real DOM/a11y/interaction behavior
 * is covered by the Storybook Vitest project via `toaster.stories.tsx`).
 */
const root = fileURLToPath(new URL("../", import.meta.url));
const toasterSource = readFileSync(root + "components/ui/toaster.tsx", "utf8");
const appLayoutSource = readFileSync(root + "app/(app)/layout.tsx", "utf8");
const packageJson = readFileSync(root + "package.json", "utf8");

describe("snackbar — top viewport, overlaying, single mount", () => {
  it("is fixed to the top and never takes document-flow space (no layout shift)", () => {
    expect(toasterSource).toContain("fixed");
    expect(toasterSource).toContain("top-0");
    // Positioned at the top, not the old bottom anchor.
    expect(toasterSource).not.toContain("bottom-6");
    expect(toasterSource).not.toContain("bottom-[");
  });

  it("accounts for the desktop sidebar and mobile safe area in its offsets", () => {
    expect(toasterSource).toContain("md:left-64");
    expect(toasterSource).toContain("env(safe-area-inset-top");
  });

  it("is mounted exactly once in the authenticated shell, with localized labels", () => {
    expect(appLayoutSource).toContain('import { getTranslations } from "next-intl/server"');
    expect(appLayoutSource).toContain('getTranslations("common.snackbar")');
    expect(appLayoutSource).toContain('<Toaster closeLabel={t("close")} regionLabel={t("regionLabel")} />');
    expect(appLayoutSource.match(/<Toaster\b/g)?.length).toBe(1);
  });
});

describe("snackbar — accessible semantics", () => {
  it("announces errors/warnings assertively and everything else politely, via one live region per toast", () => {
    expect(toasterSource).toContain('role={assertive ? "alert" : "status"}');
    expect(toasterSource).toContain('item.variant === "error" || item.variant === "warning"');
  });

  it("does not double-announce: the container is a labelled region landmark, not a second live region", () => {
    expect(toasterSource).toContain('role="region"');
    expect(toasterSource).toContain("aria-label={regionLabel}");
    // The container itself must not be an aria-live region (that would announce
    // the same message twice alongside the per-toast role).
    expect(toasterSource).not.toContain('aria-live');
  });

  it("exposes an accessible, labelled dismiss button", () => {
    expect(toasterSource).toContain("aria-label={closeLabel}");
    expect(toasterSource).toContain("type=\"button\"");
  });

  it("respects reduced motion", () => {
    expect(toasterSource).toContain("useReducedMotion");
  });
});

describe("snackbar — variants, queue, and deduplication", () => {
  it("supports success, error, warning, and info", () => {
    expect(toasterSource).toContain('"success" | "error" | "warning" | "info"');
  });

  it("shows one snackbar at a time and queues the rest", () => {
    expect(toasterSource).toContain("items.slice(0, 1)");
  });

  it("deduplicates identical messages within a short window", () => {
    expect(toasterSource).toContain("DEDUPE_WINDOW_MS");
  });

  it("auto-dismisses on a per-variant timer", () => {
    expect(toasterSource).toContain("DURATIONS");
    expect(toasterSource).toContain("setTimeout(dismissFirst");
  });
});

describe("snackbar — no second notification dependency", () => {
  it("adapts the existing in-repo toaster rather than adding a notification library", () => {
    for (const lib of ["sonner", "react-hot-toast", "react-toastify", "@radix-ui/react-toast"]) {
      expect(packageJson).not.toContain(lib);
    }
  });
});

describe("snackbar i18n", () => {
  it("defines matching snackbar + generic error keys in both locales", () => {
    for (const messages of [idMessages, enMessages]) {
      const snackbar = messages.common.snackbar as Record<string, string>;
      expect(snackbar.close).toBeTruthy();
      expect(snackbar.regionLabel).toBeTruthy();
      const errors = messages.common.errors as Record<string, string>;
      for (const key of ["requestFailed", "network", "timeout"]) {
        expect(errors[key]).toBeTruthy();
      }
    }
  });
});
