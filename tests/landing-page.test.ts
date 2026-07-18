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
const privacyCommitmentsPath = root + "components/ui/privacy-commitments.tsx";
const privacyCommitments = existsSync(privacyCommitmentsPath)
  ? readFileSync(privacyCommitmentsPath, "utf8")
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
      "wallets.png",
      "transactions.png",
      "installment.png",
      "analytics.png",
    ]) {
      expect(existsSync(root + `playwright/screenshots/${asset}`)).toBe(true);
      expect(page + hero + verticalTabs).toContain(
        `@/playwright/screenshots/${asset}`
      );
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
    expect(verticalTabs).toContain("aspect-16/10");
    expect(verticalTabs).toContain("items-start");
    expect(verticalTabs).toContain("h-full w-full object-contain object-top");
    expect(verticalTabs).not.toContain("VISIBLE_IMAGE_RATIO");
    expect(verticalTabs).not.toContain("activeScreen.height *");
    expect(verticalTabs).toContain("ArrowLeft");
    expect(verticalTabs).toContain("ArrowRight");
    expect(verticalTabs).not.toMatch(/bg-gradient|backdrop-blur|glass/i);
  });

  it("pauses autoplay for pointer and keyboard interaction", () => {
    expect(verticalTabs).toContain("AUTO_PLAY_DURATION = 5000");
    expect(verticalTabs).toContain("onMouseEnter");
    expect(verticalTabs).toContain("onMouseLeave");
    expect(verticalTabs).toContain("onFocusCapture");
    expect(verticalTabs).toContain("onBlurCapture");
    expect(verticalTabs).toContain("useReducedMotion");
  });

  it("keeps the centered hero and one conversion intent", () => {
    expect(page).toContain("<PocketMintHero />");
    expect(hero).toContain("Clarity Over Complexity");
    expect(hero).toContain("max-w-7xl");
    expect(hero).toContain('href="/login"');
    expect(hero).toContain("useReducedMotion");
    expect(page + hero).not.toMatch(/Moon|Sun|dark:|bg-gradient/);
  });

  it("keeps a legible floating header visible while scrolling", () => {
    expect(hero).toContain("sticky top-4 z-30");
    expect(hero).toContain("bg-background/95");
    expect(hero).toContain("backdrop-blur-md");
    expect(hero.indexOf("<header")).toBeLessThan(
      hero.indexOf('<div className="mx-auto w-full max-w-7xl px-5">')
    );
    expect(page).toContain('<footer id="about" className="scroll-mt-20');
  });

  it("gives desktop navigation stronger weight and an animated underline", () => {
    expect(hero).toContain("font-medium text-foreground");
    expect(hero).toContain("after:scale-x-0");
    expect(hero).toContain("hover:after:scale-x-100");
    expect(hero).toContain("focus-visible:after:scale-x-100");
    expect(hero).toContain("after:duration-200");
  });

  it("makes the tagline and primary actions visually dominant", () => {
    expect(hero).toContain("text-[clamp(3rem,7vw,5.5rem)]");
    expect(hero).toContain("text-balance");
    expect(hero).toContain("px-[50px] py-[17px]");
    expect(page).toContain("px-[50px] py-[17px]");
  });

  it("uses a high-contrast mint sweep for both landing CTAs", () => {
    expect(globals).toContain("background: var(--color-mint)");
    expect(globals).toContain("color: var(--color-primary)");
    expect(globals).toContain("box-shadow 300ms ease");
    expect(globals).toContain(".landing-cta-sweep:hover");
    expect(globals).toContain(".landing-cta-sweep:focus-visible");
  });

  it("keeps CTA text dark over the mint hover sweep", () => {
    const heroCtas =
      hero.match(
        /landing-cta-sweep[^\n]*hover:text-primary focus-visible:text-primary/g
      ) ?? [];

    expect(heroCtas).toHaveLength(2);
    expect(page).toContain("hover:text-primary focus-visible:text-primary");
  });

  it("adds a left-to-right hover sweep to both primary CTAs", () => {
    expect(hero).toContain("landing-cta-sweep");
    expect(page).toContain("landing-cta-sweep");
    expect(globals).toContain(".landing-cta-sweep::before");
    expect(globals).toContain(".landing-cta-sweep:hover::before");
    expect(globals).toContain("translateX(0)");
  });

  it("places pulse beams behind only the hero content", () => {
    expect(hero).toContain(
      'import { PulseBeams } from "@/components/ui/pulse-beams"'
    );
    expect(hero).toContain('<PulseBeams variant="hero"');
    expect(hero).toContain('className="text-primary opacity-75"');
    expect(hero).toContain("isolate overflow-hidden");
    expect(hero).toContain("relative z-10");
  });

  it("removes the bento campaign treatment", () => {
    expect(page).not.toContain("stitch-bento");
    expect(page).not.toContain("Fitur Utama");
    expect(page).not.toContain("Hubungi Tim Kami");
    expect(page).not.toMatch(/device mockup|laptop|monitor/i);
  });

  it("keeps privacy before product and one final call to action", () => {
    expect(page).toContain("Data finansial Anda tetap milik Anda.");
    expect(page).toContain("Kebijakan Privasi");
    expect(page).toContain("Syarat & Ketentuan");
  });

  it("presents each privacy promise as a numbered card", () => {
    expect(privacyCommitments).toContain(
      'import { Card, CardContent } from "@/components/ui/card"'
    );
    expect(privacyCommitments).toContain("const privacyPoints = [");
    expect(privacyCommitments).toContain('<ul className="grid gap-3"');
    expect(privacyCommitments).toContain("privacyPoints.map((point, index)");
    expect(privacyCommitments).toContain("<motion.li");
    expect(privacyCommitments).toContain("<Card");
    expect(privacyCommitments).toContain('size="sm"');
    expect(privacyCommitments).toContain("<CardContent");
    expect(privacyCommitments).toContain('aria-hidden="true"');
    expect(privacyCommitments).toContain(
      'String(index + 1).padStart(2, "0")'
    );
    expect(page).not.toContain('className="space-y-4 text-sm');
    expect(page).not.toContain('className="border-t border-border pt-4"');
  });

  it("animates and highlights each privacy card without making it clickable", () => {
    expect(existsSync(privacyCommitmentsPath)).toBe(true);
    expect(page).toContain(
      'import { PrivacyCommitments } from "@/components/ui/privacy-commitments"'
    );
    expect(page).toContain("<PrivacyCommitments />");
    expect(privacyCommitments).toContain('"use client"');
    expect(privacyCommitments).toContain("useReducedMotion");
    expect(privacyCommitments).toContain("whileInView");
    expect(privacyCommitments).toContain(
      "viewport={{ once: true, amount: 0.35 }}"
    );
    expect(privacyCommitments).toContain("index * 0.08");
    expect(privacyCommitments).toContain("motion-safe:hover:-translate-y-1");
    expect(privacyCommitments).toContain("hover:bg-muted/40");
    expect(privacyCommitments).not.toContain("onClick");
    expect(privacyCommitments).not.toContain("cursor-pointer");
  });

  it("gives the privacy and feature introductions stronger hierarchy", () => {
    expect(page).toContain("lg:items-stretch");
    expect(page).toContain("lg:justify-center");
    expect(page).toContain("lg:text-6xl");
    expect(verticalTabs).toContain("lg:text-6xl");
    expect(verticalTabs).toContain("sm:text-xl");
  });

  it("makes the active feature tab visually unmistakable", () => {
    expect(verticalTabs).toContain(
      'isActive && "bg-mint/10 shadow-sm"'
    );
    expect(verticalTabs).toMatch(
      /isActive\s*\? "text-3xl font-semibold text-primary md:text-4xl"/
    );
  });

  it("uses the privacy-card number badge in vertical tabs", () => {
    expect(verticalTabs).toContain(
      'className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-xs font-semibold tracking-[0.08em] text-primary"'
    );
    expect(verticalTabs).toContain("{screen.number}");
    expect(verticalTabs).not.toContain("/{screen.number}");
    expect(verticalTabs).not.toContain('className="mt-1 text-[10px]');
  });

  it("opens registration directly with the primary CTA sweep", () => {
    expect(hero).toContain('href="/login?mode=register"');
    expect(hero).toMatch(/landing-cta-sweep[^\n]*min-h-11 rounded-\[40px\]/);
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
