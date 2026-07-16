# Landing Topbar and Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the landing topbar and hero with the approved centered, animated composition while showing the complete Stitch dashboard.

**Architecture:** Add one focused client component at `components/ui/pocket-mint-hero.tsx` for the topbar, hero, and `framer-motion` entrance sequence. Keep `app/page.tsx` as the server-composed landing page and leave Privacy, Features, CTA, and Footer markup unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, `framer-motion`, Next.js Image and Link, Vitest.

## Global Constraints

- Light-only; do not add theme state or a theme toggle.
- Use the existing Pocket Mint color tokens and 8px spacing rhythm.
- Use `/landing/dashboard.png` and show the complete image with `object-contain`.
- Do not add gradients, perspective, browser chrome, devices, floating decoration, continuous motion, or dependencies.
- Keep every landing section after the hero unchanged.
- Respect `prefers-reduced-motion` and retain 44px minimum touch targets.

---

### Task 1: Animated Pocket Mint topbar and hero

**Files:**
- Create: `components/ui/pocket-mint-hero.tsx`
- Modify: `app/page.tsx`
- Test: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: the existing local asset `/landing/dashboard.png` and Pocket Mint Tailwind tokens.
- Produces: `export function PocketMintHero(): React.JSX.Element`.

- [ ] **Step 1: Write the failing landing contract test**

Add component-source loading and a contract that requires the new boundary, motion library, full image treatment, Pocket Mint navigation/copy, and excludes dark mode and gradient masks:

```ts
const heroPath = root + "components/ui/pocket-mint-hero.tsx";

it("uses the approved centered animated Pocket Mint hero", () => {
  expect(existsSync(heroPath)).toBe(true);
  const hero = existsSync(heroPath) ? readFileSync(heroPath, "utf8") : "";

  expect(page).toContain("<PocketMintHero />");
  expect(hero).toContain('from "framer-motion"');
  expect(hero).toContain("Clarity Over Complexity");
  expect(hero).toContain("Lihat Demo");
  expect(hero).toContain('/landing/dashboard.png');
  expect(hero).toContain("object-contain");
  expect(hero).toContain("max-w-5xl");
  expect(hero).not.toMatch(/Moon|Sun|dark:|bg-gradient|from-background/);
});
```

- [ ] **Step 2: Run the targeted test and verify RED**

Run: `npm test -- tests/landing-page.test.ts`

Expected: FAIL because `components/ui/pocket-mint-hero.tsx` does not exist and `<PocketMintHero />` is absent.

- [ ] **Step 3: Create the minimal client component**

Implement `PocketMintHero` with:

```tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const enter = (delay: number, y = 20, reduced = false) => ({
  initial: reduced ? false : { opacity: 0, y },
  animate: { opacity: 1, y: 0 },
  transition: { delay: reduced ? 0 : delay, duration: reduced ? 0 : y === 40 ? 0.8 : 0.5 },
});

export function PocketMintHero() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div className="mx-auto w-full max-w-5xl px-5">
      <header className="relative pt-4">
        <nav aria-label="Navigasi utama" className="flex min-h-16 items-center justify-between rounded-xl border border-border bg-background px-4 py-2 shadow-sm">
          <div className="flex items-center gap-6">
            <Link href="/" className="inline-flex min-h-11 items-center font-semibold text-primary">Pocket Mint</Link>
            <div className="hidden items-center gap-6 md:flex">
              <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Fitur</Link>
              <Link href="#privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Privasi</Link>
              <Link href="#about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">Tentang Kami</Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground">Login</Link>
            <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "min-h-11 rounded-full px-4 shadow-sm shadow-primary/10")}>Daftar</Link>
          </div>
        </nav>
      </header>

      <div className="relative px-0 sm:px-2">
        <section className="w-full py-16 md:py-24 lg:py-32">
          <motion.div className="flex flex-col items-center gap-6 text-center" {...enter(0, 20, reducedMotion)}>
            <motion.div {...enter(0.1, 20, reducedMotion)} className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-secondary">
              <LockKeyhole aria-hidden="true" className="size-4" />
              <span className="text-xs font-medium tracking-[0.02em]">Private &amp; Secured</span>
            </motion.div>
            <motion.h1 {...enter(0.2, 20, reducedMotion)} className="text-4xl font-semibold tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl">Clarity Over Complexity</motion.h1>
            <motion.p {...enter(0.3, 20, reducedMotion)} className="mx-auto max-w-2xl text-base leading-6 text-muted-foreground sm:text-xl">Pahami apa yang Anda miliki, apa yang Anda tanggung, dan apa yang perlu diperhatikan. Tanpa distraksi.</motion.p>
            <motion.div {...enter(0.4, 20, reducedMotion)} className="flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row">
              <Link href="/login" className={cn(buttonVariants({ size: "lg" }), "min-h-11 rounded-xl px-6 shadow-sm shadow-primary/10")}>Mulai Sekarang</Link>
              <Link href="#features" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "min-h-11 rounded-xl px-6")}>Lihat Demo</Link>
            </motion.div>
            <motion.div {...enter(0.5, 20, reducedMotion)} className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground"><span>Data Anda</span><span>Tanpa iklan</span><span>Tanpa pelacakan</span></motion.div>
            <motion.div {...enter(0.6, 40, reducedMotion)} className="w-full rounded-3xl border border-border bg-card p-2">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <Image src="/landing/dashboard.png" alt="Dashboard Pocket Mint dari ekspor Google Stitch" width={720} height={737} sizes="(max-width: 1024px) calc(100vw - 40px), 1024px" className="h-auto w-full object-contain" priority />
              </div>
            </motion.div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Compose the component from the landing page**

Import `PocketMintHero`, remove the old topbar and hero markup, render `<PocketMintHero />` before the existing `<main>`, and remove imports/constants that are no longer used. Do not alter Privacy, Features, CTA, or Footer.

- [ ] **Step 5: Run targeted tests and verify GREEN**

Run: `npm test -- tests/landing-page.test.ts`

Expected: all landing tests pass.

- [ ] **Step 6: Commit the functional change**

```bash
git add components/ui/pocket-mint-hero.tsx app/page.tsx tests/landing-page.test.ts
git commit -m "feat: refresh landing topbar and hero"
```

### Task 2: Responsive and production verification

**Files:**
- Verify: `components/ui/pocket-mint-hero.tsx`
- Verify: `app/page.tsx`

**Interfaces:**
- Consumes: `PocketMintHero` from Task 1.
- Produces: verified desktop and mobile landing behavior.

- [ ] **Step 1: Verify desktop rendering**

Run the app at `http://localhost:4000`, set a 1440x1000 viewport, and confirm the floating topbar, centered copy, complete dashboard, restrained frame, and unchanged Privacy section.

- [ ] **Step 2: Verify mobile rendering**

Set a 390x844 viewport and confirm Pocket Mint, Login, and Daftar remain available; actions stack; the dashboard is complete; and `scrollWidth === clientWidth`.

- [ ] **Step 3: Run the complete verification suite**

Run: `npm test; npm run lint; npm run build; git diff --check`

Expected: all tests pass, lint exits 0, build exits 0, and diff check emits no errors.

- [ ] **Step 4: Commit any verification-only adjustment**

If visual QA required a scoped adjustment, commit only the files changed by that adjustment with `git commit -m "fix: refine landing hero responsiveness"`. If no adjustment was required, do not create an empty commit.
