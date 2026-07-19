import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const sidebar = readFileSync(root + "components/layout/app-sidebar.tsx", "utf8");
const bottomNav = readFileSync(root + "components/layout/bottom-nav.tsx", "utf8");
const legacyRoute = readFileSync(root + "app/(app)/cicilan/page.tsx", "utf8");

describe("bill navigation source contract", () => {
  it("uses the Cicilan label and route on desktop and mobile", () => {
    for (const source of [sidebar, bottomNav]) {
      expect(source).toContain('label: t("installments")');
      expect(source).toContain('href: "/tagihan"');
      expect(source).not.toContain('href: "/cicilan"');
    }
    expect(idMessages.nav.installments).toBe("Cicilan");
  });

  it("uses the shared due-bill count and hides a zero badge", () => {
    for (const source of [sidebar, bottomNav]) {
      expect(source).toContain("useDueBillCount()");
      expect(source).toContain("dueBillCount > 0");
      expect(source).toContain('dueBillCount > 9 ? "9+"');
      expect(source).toContain('t("dueBillsAria", { count: dueBillCount })');
    }
    expect(idMessages.nav.dueBillsAria).toContain("cicilan perlu diperhatikan");
  });

  it("redirects the legacy Cicilan route", () => {
    expect(legacyRoute).toContain('redirect("/tagihan")');
  });
});
