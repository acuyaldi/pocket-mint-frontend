import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const page = readFileSync(root + "app/page.tsx", "utf8");
const heroPath = root + "components/ui/pocket-mint-hero.tsx";
const hero = readFileSync(heroPath, "utf8");
const verticalTabsPath = root + "components/ui/vertical-tabs.tsx";
const verticalTabs = existsSync(verticalTabsPath)
  ? readFileSync(verticalTabsPath, "utf8")
  : "";
const globals = readFileSync(root + "app/globals.css", "utf8");

describe("Pocket Mint public experience contract", () => {
  it("uses the approved product-led section order", () => {
    const markers = [
      'id="privacy"',
      'id="features"',
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
      "analytics.png",
    ]) {
      expect(existsSync(root + `public/landing/${asset}`)).toBe(true);
      expect(page + hero + verticalTabs).toContain(`/landing/${asset}`);
    }
  });

  it("integrates one accessible vertical-tabs showcase", () => {
    expect(existsSync(verticalTabsPath)).toBe(true);
    expect(page).toContain('import { VerticalTabs } from "@/components/ui/vertical-tabs"');
    expect(page).toContain("<VerticalTabs />");
    expect(hero).toContain('href="#features"');
    expect(verticalTabs).toContain('role="tablist"');
    expect(verticalTabs).toContain('role="tab"');
    expect(verticalTabs).toContain("aria-selected");
    expect(verticalTabs).toContain('role="tabpanel"');
  });

  it("uses one top-aligned media frame for every feature", () => {
    expect(verticalTabs).toMatch(/aspect-\[[^\]]+\]/);
    expect(verticalTabs).toContain("items-start");
    expect(verticalTabs).toContain("w-full h-auto");
    expect(verticalTabs).not.toContain("VISIBLE_IMAGE_RATIO");
    expect(verticalTabs).not.toContain("activeScreen.height *");
    expect(verticalTabs).toContain("ArrowLeft");
    expect(verticalTabs).toContain("ArrowRight");
    expect(verticalTabs).not.toMatch(/bg-gradient|backdrop-blur|glass/i);
  });

  it("pauses autoplay for pointer and keyboard interaction", () => {
    expect(verticalTabs).toContain("AUTO_PLAY_DURATION = 3000");
    expect(verticalTabs).toContain("onMouseEnter");
    expect(verticalTabs).toContain("onMouseLeave");
    expect(verticalTabs).toContain("onFocusCapture");
    expect(verticalTabs).toContain("onBlurCapture");
    expect(verticalTabs).toContain("useReducedMotion");
  });

  it("keeps the centered hero and one conversion intent", () => {
    expect(page).toContain("<PocketMintHero />");
    expect(hero).toContain("Clarity Over Complexity");
    expect(hero).toContain("max-w-5xl");
    expect(hero).toContain('href="/login"');
    expect(hero).toContain("useReducedMotion");
    expect(page + hero).not.toMatch(/Moon|Sun|dark:|bg-gradient/);
  });

  it("adds a left-to-right hover sweep to both primary CTAs", () => {
    expect(hero).toContain("landing-cta-sweep");
    expect(page).toContain("landing-cta-sweep");
    expect(globals).toContain(".landing-cta-sweep::before");
    expect(globals).toContain(".landing-cta-sweep:hover::before");
    expect(globals).toContain("translateX(0)");
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
