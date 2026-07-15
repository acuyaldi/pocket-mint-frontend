import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const page = readFileSync(root + "app/page.tsx", "utf8");
const heroPath = root + "components/ui/pocket-mint-hero.tsx";
const hero = existsSync(heroPath) ? readFileSync(heroPath, "utf8") : "";

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
      "Lihat Demo",
    ]) {
      expect(page + hero).toContain(copy);
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

  it("uses real local Stitch screens without device mockups", () => {
    for (const asset of ["dashboard.png", "transaction.png"]) {
      expect(existsSync(root + `public/landing/${asset}`)).toBe(true);
      expect(page).toContain(`/landing/${asset}`);
    }

    expect(page).not.toContain("lh3.googleusercontent.com");
    expect(page).not.toMatch(/laptop|monitor/i);
  });

  it("fits the Stitch screens without forced zoom crops", () => {
    const landingSources = page + hero;

    expect(landingSources.match(/object-contain/g)).toHaveLength(3);
    expect(landingSources).not.toContain("-translate-x-[8%]");
    expect(landingSources).not.toContain("translate-x-12 translate-y-12");
    expect(landingSources).not.toMatch(/scale-\[1\.(?:24|3|34)\]/);
  });

  it("uses the approved centered animated Pocket Mint hero", () => {
    expect(existsSync(heroPath)).toBe(true);

    expect(page).toContain("<PocketMintHero />");
    expect(hero).toContain('from "framer-motion"');
    expect(hero).toContain("Clarity Over Complexity");
    expect(hero).toContain("Lihat Demo");
    expect(hero).toContain("/landing/dashboard.png");
    expect(hero).toContain("object-contain");
    expect(hero).toContain("max-w-5xl");
    expect(hero).not.toMatch(/Moon|Sun|dark:|bg-gradient|from-background/);
  });
});
