# Landing Hero and Sticky Header Emphasis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the landing header persist while scrolling, strengthen the `Clarity Over Complexity` hierarchy, and give both primary landing CTAs a clearly visible mint hover/focus treatment.

**Architecture:** Keep the current `PocketMintHero` component boundary and use native CSS/Tailwind states only. Extend the existing source-level landing contract first, then make the smallest markup/class and shared CSS changes needed to satisfy it; no new component, state, listener, or dependency is required.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS v4, Vitest, existing `framer-motion` and shadcn button variants.

## Global Constraints

- Preserve the existing landing content order, copy, dashboard image, pulse-beam background, routes, logo, and entrance-motion structure.
- Use `sticky top-4`; do not add a JavaScript scroll listener.
- Use `clamp(3rem, 7vw, 5.5rem)` for the hero headline.
- Use a 200ms ease-out navigation underline transition and mint for the shared CTA sweep.
- Keep 44px minimum interactive targets, visible keyboard focus, and reduced-motion support.
- Add no dependency, theme switcher, mobile menu, imagery, route, or authenticated-app change.
- Preserve all pre-existing working-tree changes and do not stage or commit modified implementation files that already contain user work.

---

### Task 1: Lock the Landing Emphasis Contract

**Files:**
- Modify: `tests/landing-page.test.ts`
- Test: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: Source strings from `components/ui/pocket-mint-hero.tsx` and `app/globals.css`.
- Produces: Regression contracts for sticky positioning, nav underline/focus behavior, fluid headline scale, CTA size parity, and mint sweep contrast.

- [ ] **Step 1: Write the failing tests**

Add these tests inside the existing `describe("Pocket Mint public experience contract", ...)` block:

```ts
it("keeps a legible floating header visible while scrolling", () => {
  expect(hero).toContain("sticky top-4 z-30");
  expect(hero).toContain("bg-background/95");
  expect(hero).toContain("backdrop-blur-md");
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
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/landing-page.test.ts`

Expected: FAIL because the current header is `relative`, the headline uses breakpoint text utilities, the nav has no underline pseudo-element, and the CTA sweep uses `--color-secondary` without hover shadow/color transitions.

- [ ] **Step 3: Review the failure signal**

Confirm every failure maps to one requested visual behavior. Do not relax an assertion merely to match the current implementation.

---

### Task 2: Implement Header, Navigation, Headline, and CTA Emphasis

**Files:**
- Modify: `components/ui/pocket-mint-hero.tsx`
- Modify: `app/globals.css`
- Verify: `app/page.tsx`
- Test: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: Existing `PocketMintHero`, `buttonVariants`, `.landing-cta-sweep`, `--color-mint`, `--color-primary`, and final CTA sizing in `app/page.tsx`.
- Produces: A sticky landing header, reusable nav-link interaction class string, fluid hero headline, and shared high-contrast CTA sweep used by hero and final CTA.

- [ ] **Step 1: Add one local nav-link class constant**

In `components/ui/pocket-mint-hero.tsx`, define this module-level constant below `enter` so all three section links share the exact interaction treatment without introducing a component or dependency:

```ts
const landingNavLink =
  "relative inline-flex min-h-11 items-center text-sm font-medium text-foreground transition-colors duration-200 ease-out after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-mint after:transition-transform after:duration-200 after:ease-out hover:text-primary hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";
```

Replace the three duplicated desktop section-link class strings with `className={landingNavLink}`.

- [ ] **Step 2: Make the header sticky and readable**

Change the header and nav classes to:

```tsx
<header className="sticky top-4 z-30 pt-4">
  <nav
    aria-label="Navigasi utama"
    className="flex min-h-16 items-center justify-between rounded-xl border border-border bg-background/95 px-4 py-2 shadow-sm backdrop-blur-md"
  >
```

This keeps the existing layout footprint while ensuring the rounded surface remains readable over scrolled content.

- [ ] **Step 3: Strengthen the headline and login interaction**

Replace the headline class with:

```tsx
className="max-w-5xl text-balance text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-primary"
```

Give the Login link an explicit `transition-colors duration-200 ease-out`, medium weight, and its existing focus-visible outline while preserving its 44px target.

- [ ] **Step 4: Match the hero CTA to the final CTA**

Keep `buttonVariants({ size: "lg" })` and change the hero-specific class string to:

```ts
"landing-cta-sweep min-h-11 rounded-[40px] px-[50px] py-[17px] text-base shadow-sm shadow-primary/20"
```

Do not alter the `/login` destination or add another hero action.

- [ ] **Step 5: Strengthen the shared CTA sweep**

In `app/globals.css`, update `.landing-cta-sweep` to transition color and shadow, use mint for `::before`, and add explicit hover/focus-visible states:

```css
.landing-cta-sweep {
  /* retain existing positioning, border, radius, cursor, weight, and line-height */
  box-shadow: 0 6px 18px rgba(0, 20, 20, 0.16);
  transition: color 300ms ease, box-shadow 300ms ease;
}

.landing-cta-sweep::before {
  /* retain existing positioning, content, transform, and transform transition */
  background: var(--color-mint);
}

.landing-cta-sweep:hover,
.landing-cta-sweep:focus-visible {
  color: var(--color-primary);
  box-shadow: 0 10px 28px rgba(45, 212, 191, 0.28);
}
```

Preserve the existing `::before` transform selector and the `> span` stacking rule.

- [ ] **Step 6: Run the focused test and verify GREEN**

Run: `npm test -- tests/landing-page.test.ts`

Expected: PASS for all landing-page contract tests.

- [ ] **Step 7: Inspect the implementation diff**

Run: `git diff --check -- components/ui/pocket-mint-hero.tsx app/globals.css tests/landing-page.test.ts`

Expected: exit code 0 with no whitespace errors. Confirm `app/page.tsx` retains `px-[50px] py-[17px]`, both CTAs still use `landing-cta-sweep`, and no unrelated code was rewritten.

---

### Task 3: Verify Behavior and Rendering

**Files:**
- Verify: `components/ui/pocket-mint-hero.tsx`
- Verify: `app/globals.css`
- Verify: `app/page.tsx`
- Verify: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: Completed landing emphasis implementation.
- Produces: Test, lint, build, and visual evidence that the implementation is safe to hand off.

- [ ] **Step 1: Run the full frontend test suite**

Run: `npm test`

Expected: all Vitest suites pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit code 0 with no lint errors.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: exit code 0 and a successful Next.js production build.

- [ ] **Step 4: Perform desktop and mobile visual QA**

Start the existing local development server and inspect `/` at 1440px and 390px widths. At desktop width, hover/focus each section link and CTA, then scroll to Privacy, Features, and the final CTA. At mobile width, confirm the headline does not clip and the header stays within the viewport.

Expected: the header remains visible with no overlap or horizontal overflow; the tagline dominates the hero; nav underlines reveal left-to-right; both CTAs sweep to mint with dark text and stronger shadow; keyboard focus is visible; anchors remain readable below the sticky header.

- [ ] **Step 5: Leave implementation changes unstaged**

Because the target files contained pre-existing user changes before this task, do not create an implementation commit that could capture unrelated work. Report the exact modified files and verification evidence instead.
