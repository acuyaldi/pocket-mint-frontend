import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = readFileSync(root + "scripts/capture-authenticated-pages.mjs", "utf8");

describe("authenticated page capture source contract", () => {
  it("captures every current private product route", () => {
    for (const route of [
      '"/dashboard"',
      '"/wallets"',
      '"/transactions"',
      '"/tagihan"',
      '"/analytics"',
    ]) {
      expect(source).toContain(route);
    }
    expect(source).not.toContain('"/cicilan"');
  });

  it("targets the real login inputs without label ambiguity", () => {
    expect(source).toContain("locator('input[name=\"email\"]')");
    expect(source).toContain("locator('input[name=\"password\"]')");
  });

  it("hides only the Next development portal before screenshots", () => {
    expect(source).toContain("nextjs-portal");
    expect(source).toContain("display: none !important");
  });

  it("verifies the final route and route-specific content before capturing", () => {
    for (const readyText of [
      '"Posisi keuangan bersih"',
      '"Dompet"',
      '"Transaksi"',
      '"Cicilan"',
      '"Analitik"',
    ]) {
      expect(source).toContain(readyText);
    }

    expect(source).toContain("waitForURL");
    expect(source).toContain("getByText(readyText");
    expect(source).toContain("new URL(page.url()).pathname");
  });
});
