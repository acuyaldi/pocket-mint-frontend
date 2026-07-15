import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const page = readFileSync(root + "app/page.tsx", "utf8");

describe("Pocket Mint Stitch landing page contract", () => {
  it("keeps the Stitch section order", () => {
    const markers = ['id="privacy"', 'id="features"', 'id="cta"'];
    const positions = markers.map((marker) => page.indexOf(marker));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("uses the Stitch hero copy and actions", () => {
    for (const copy of [
      "Private &amp; Secured",
      "Clarity Over Complexity",
      "Mulai Sekarang",
      "Pelajari Demo",
    ]) {
      expect(page).toContain(copy);
    }
  });

  it("uses the Stitch privacy panel", () => {
    for (const copy of [
      "Privasi adalah Prioritas Kami",
      "Data Terlokalisasi",
      "Tanpa Pelacakan",
    ]) {
      expect(page).toContain(copy);
    }
  });

  it("uses the five Stitch feature cells", () => {
    for (const feature of [
      "Dashboard Workspace",
      "Inventory Dompet",
      "Laporan Analitik",
      "Transaksi",
      "Cicilan",
    ]) {
      expect(page).toContain(feature);
    }
  });

  it("uses the Stitch CTA and footer copy", () => {
    for (const copy of [
      "Siap Meraih Kejernihan Finansial?",
      "Mulai Gratis Sekarang",
      "Hubungi Tim Kami",
      "Kebijakan Privasi",
      "Syarat & Ketentuan",
    ]) {
      expect(page).toContain(copy);
    }
  });

  it("does not use the previous editorial section structure", () => {
    expect(page).not.toContain('id="wallet"');
    expect(page).not.toContain('id="transactions"');
    expect(page).not.toContain('id="installment"');
    expect(page).not.toContain("data-crop={crop}");
  });
});
