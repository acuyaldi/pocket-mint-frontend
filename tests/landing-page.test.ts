import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const page = readFileSync(root + "app/page.tsx", "utf8");
const heroPath = root + "components/ui/pocket-mint-hero.tsx";
const hero = readFileSync(heroPath, "utf8");
const globals = readFileSync(root + "app/globals.css", "utf8");

describe("Pocket Mint public experience contract", () => {
  it("uses the approved product-led section order", () => {
    const markers = [
      'id="privacy"',
      'id="dashboard"',
      'id="wallet"',
      'id="transactions"',
      'id="installment"',
      'id="cta"',
    ];
    const positions = markers.map((marker) => page.indexOf(marker));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("uses every approved local product screen", () => {
    for (const asset of [
      "dashboard.png",
      "wallet.png",
      "transaction.png",
      "installment.png",
    ]) {
      expect(existsSync(root + `public/landing/${asset}`)).toBe(true);
      expect(page + hero).toContain(`/landing/${asset}`);
    }
  });

  it("keeps the centered hero and one conversion intent", () => {
    expect(page).toContain("<PocketMintHero />");
    expect(hero).toContain("Clarity Over Complexity");
    expect(hero).toContain("max-w-5xl");
    expect(hero).toContain('href="/login"');
    expect(hero).toContain("useReducedMotion");
    expect(page + hero).not.toMatch(/Moon|Sun|dark:|bg-gradient/);
  });

  it("removes the bento campaign treatment", () => {
    expect(page).not.toContain("stitch-bento");
    expect(page).not.toContain("Fitur Utama");
    expect(page).not.toContain("Hubungi Tim Kami");
    expect(page).not.toMatch(/device mockup|laptop|monitor/i);
  });

  it("keeps privacy before product and one final call to action", () => {
    expect(page).toContain("Data finansial Anda tetap milik Anda.");
    expect(page).toContain("Mulai bangun ruang kerja finansial privat Anda.");
    expect(page).toContain("Kebijakan Privasi");
    expect(page).toContain("Syarat & Ketentuan");
  });

  it("contains no em dash in visible source copy", () => {
    expect(page + hero).not.toContain("—");
  });

  it("removes obsolete landing decoration utilities", () => {
    for (const utility of [
      ".stitch-float",
      ".stitch-bento",
      ".surface-grid",
      ".animate-gradient",
      ".animate-shake",
      ".delay-1000",
      ".delay-2000",
    ]) {
      expect(globals).not.toContain(utility);
    }
  });
});
