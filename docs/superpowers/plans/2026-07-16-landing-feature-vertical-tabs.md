# Landing Feature Vertical Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the separate landing feature sections with one accessible, animated vertical-tabs showcase for Dashboard, Wallet, Transaction, Installment, and Analytics.

**Architecture:** Keep `app/page.tsx` as a Server Component and place all interactive state in a focused `components/ui/vertical-tabs.tsx` Client Component. The component owns a local immutable screen definition, autoplay state, keyboard-accessible tabs, and a responsive image panel whose height is exactly 70% of each image's intrinsic rendered height.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, framer-motion, lucide-react, Vitest.

## Global Constraints

- Keep the existing hero, privacy section, CTA, and footer unchanged.
- Use only the five existing files in `public/landing` and add no dependency.
- Follow the Pocket Mint semantic color, Inter typography, 16px large radius, minimal shadow, no-gradient, and no-glass rules.
- Keep screenshots full-width, top-aligned, uncropped horizontally, and clip them after 70% of intrinsic height.
- Preserve reduced-motion, keyboard navigation, visible focus, and 44px minimum touch targets.
- Preserve unrelated working-tree changes.

---

### Task 1: Define the vertical-tabs landing contract

**Files:**
- Modify: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: source files `app/page.tsx`, `components/ui/pocket-mint-hero.tsx`, and the planned `components/ui/vertical-tabs.tsx`.
- Produces: a source-level regression contract covering section order, five local assets, crop ratio, tab semantics, controls, autoplay pause, and reduced motion.

- [ ] **Step 1: Write failing tests**

Update the test fixture to read `vertical-tabs.tsx`; replace the old individual section markers with `id="features"`; require all five assets; and add assertions for `role="tablist"`, `role="tab"`, `aria-selected`, `role="tabpanel"`, `0.7`, `onMouseEnter`, `onFocusCapture`, `useReducedMotion`, `ArrowLeft`, and `ArrowRight`.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/landing-page.test.ts`

Expected: FAIL because `components/ui/vertical-tabs.tsx` does not exist and the page still contains the old feature sections.

- [ ] **Step 3: Keep the failing test unchanged for Task 2**

No production code is added in this task.

---

### Task 2: Implement the vertical-tabs component and page integration

**Files:**
- Create: `components/ui/vertical-tabs.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: local landing image paths, `cn` from `@/lib/utils`, `Image` from `next/image`, `AnimatePresence`, `motion`, and `useReducedMotion` from `framer-motion`, and `ArrowLeft`/`ArrowRight` from `lucide-react`.
- Produces: `export function VerticalTabs(): React.JSX.Element` and default export `VerticalTabs`.

- [ ] **Step 1: Add the minimal Client Component**

Create a five-item `SCREENS` constant with exact dimensions: Dashboard `1280x1312`, Wallet `1384x1600`, Transaction `1489x1600`, Installment `1600x1280`, and Analytics `676x541`. Implement local `activeIndex`, `direction`, and hover/focus pause state; five-second autoplay; previous/next controls; and click selection.

- [ ] **Step 2: Implement the exact 70% crop**

Set the animated frame's CSS `aspectRatio` to ```${active.width} / ${active.height * 0.7}```. Render each `Image` at `width`/`height`, with `w-full h-auto`, top alignment, responsive `sizes`, and an overflow-hidden parent so the sides stay intact and the bottom 30% is clipped.

- [ ] **Step 3: Add accessible tabs and reduced-motion handling**

Use `role="tablist"`, `role="tab"`, `aria-selected`, `aria-controls`, `role="tabpanel"`, `aria-labelledby`, native buttons, visible focus styles, and Bahasa Indonesia labels for previous/next. Disable vertical translation and progress animation when `useReducedMotion()` is true.

- [ ] **Step 4: Replace old landing feature sections**

In `app/page.tsx`, remove the local `screens` object and the standalone Dashboard, Wallet, Transaction, and Installment markup. Import `VerticalTabs` and render it once inside `<section id="features">` after privacy and before CTA. Keep `<PocketMintHero />` untouched.

- [ ] **Step 5: Run the focused test and verify GREEN**

Run: `npm test -- tests/landing-page.test.ts`

Expected: all landing-page tests PASS.

- [ ] **Step 6: Run lint and fix only relevant issues**

Run: `npm run lint`

Expected: exit code 0 with no errors.

---

### Task 3: Rendered interaction and responsive verification

**Files:**
- Modify if needed: `components/ui/vertical-tabs.tsx`
- Modify if needed: `app/page.tsx`

**Interfaces:**
- Consumes: the finished `/` landing route at `http://localhost:4000`.
- Produces: verified desktop and mobile rendering with a working tab interaction and healthy console.

- [ ] **Step 1: Start the existing development server**

Run: `npm run dev`

Expected: Next.js reports the app ready on `http://localhost:4000`.

- [ ] **Step 2: Verify the desktop flow in the in-app Browser**

Flow: `/` loads -> click `Analytics` tab -> the tab becomes selected and the Analytics screenshot appears. Check page identity, meaningful DOM, no framework overlay, console errors/warnings, and a desktop screenshot.

- [ ] **Step 3: Verify the mobile layout**

At a narrow viewport, confirm the active screenshot appears before the vertical tab list, the page has no horizontal overflow, controls remain reachable, and capture a mobile screenshot.

- [ ] **Step 4: Fix mismatches and repeat the same checks**

Keep a mismatch ledger for layout, crop, focus, overflow, and console issues. Apply only changes needed to satisfy the approved spec, reload, and repeat the failed checks.

- [ ] **Step 5: Run final verification**

Run: `npm test`

Run: `npm run lint`

Run: `npm run build`

Expected: every command exits 0; all tests pass; lint has no errors; production build completes.

- [ ] **Step 6: Review the final diff**

Run: `git diff --check`

Run: `git diff -- app/page.tsx components/ui/vertical-tabs.tsx tests/landing-page.test.ts docs/superpowers/plans/2026-07-16-landing-feature-vertical-tabs.md`

Expected: no whitespace errors and no unrelated files in the feature diff.
