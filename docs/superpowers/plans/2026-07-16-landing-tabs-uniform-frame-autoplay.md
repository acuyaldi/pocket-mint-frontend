# Landing Tabs Uniform Frame and Autoplay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every landing-page feature tab the same top-aligned screenshot frame and advance the active tab every three seconds with a matching progress bar.

**Architecture:** Keep all behavior inside the existing `VerticalTabs` client component. Replace the active-image-derived aspect ratio with one responsive fixed frame, keep each image full-width and top-aligned inside the clipped frame, and reuse the existing timeout/progress animation with a three-second duration.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, framer-motion, Vitest.

## Global Constraints

- Use the existing five local images and add no dependency.
- Every tab must use the same responsive frame height.
- Images remain full-width, centered horizontally, and aligned to the top; only the bottom may be clipped.
- The image topbar through approximately half of the product screen must remain visible.
- Autoplay and the active-tab progress bar use an exact duration of 3000 milliseconds.
- Hover, keyboard-focus pause, keyboard navigation, and reduced-motion behavior remain intact.
- Preserve unrelated working-tree changes.

---

### Task 1: Lock the revised landing-tabs contract

**Files:**
- Modify: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: source text from `components/ui/vertical-tabs.tsx`.
- Produces: regression assertions for `AUTO_PLAY_DURATION = 3000`, one fixed `aspect-*` frame, `items-start`, and removal of the active-screen aspect-ratio calculation.

- [ ] **Step 1: Write the failing assertions**

Replace the old 70% crop and five-second assertions with:

```ts
expect(verticalTabs).toContain("AUTO_PLAY_DURATION = 3000");
expect(verticalTabs).toMatch(/aspect-\[[^\]]+\]/);
expect(verticalTabs).toContain("items-start");
expect(verticalTabs).not.toContain("VISIBLE_IMAGE_RATIO");
expect(verticalTabs).not.toContain("activeScreen.height *");
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/landing-page.test.ts`

Expected: FAIL because the component still uses 5000 milliseconds and an active-image-derived aspect ratio.

- [ ] **Step 3: Leave production code unchanged**

Keep the failing regression assertions for Task 2.

---

### Task 2: Implement the fixed frame and three-second cycle

**Files:**
- Modify: `components/ui/vertical-tabs.tsx`

**Interfaces:**
- Consumes: the existing `SCREENS`, active-tab state, timeout, progress animation, and image transition.
- Produces: the unchanged `VerticalTabs()` public component with revised presentation and timing.

- [ ] **Step 1: Use one duration**

Set:

```ts
const AUTO_PLAY_DURATION = 3000;
```

Keep both the timeout and progress transition derived from that constant.

- [ ] **Step 2: Use one frame geometry**

Remove `VISIBLE_IMAGE_RATIO` and `visibleAspectRatio`. Replace the dynamic inline `aspectRatio` with a responsive fixed aspect utility:

```tsx
className="relative aspect-[16/11] overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
```

- [ ] **Step 3: Keep images centered and top-aligned**

Make the animated image wrapper fill the frame and align content to the top:

```tsx
className="absolute inset-0 flex items-start justify-center"
```

Keep the image at `w-full h-auto` so no horizontal crop is introduced and overflow clips only the bottom.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- tests/landing-page.test.ts`

Expected: all landing-page tests PASS.

---

### Task 3: Verify code and rendered behavior

**Files:**
- Modify if required: `components/ui/vertical-tabs.tsx`

**Interfaces:**
- Consumes: landing route `http://localhost:4000/`.
- Produces: evidence that the fixed frame, click navigation, progress, and autoplay work on desktop and mobile.

- [ ] **Step 1: Run static verification**

Run: `npm test`

Run: `npm run lint`

Run: `npm run build`

Expected: every command exits 0.

- [ ] **Step 2: Run rendered desktop checks**

Open `/`, confirm the feature frame does not change height between Dashboard and Analytics, click a tab, and verify the selected state and screenshot update without relevant console warnings or errors.

- [ ] **Step 3: Run rendered mobile checks**

Confirm the media remains above the tab list, the frame is not horizontally clipped, controls remain reachable, and the active tab advances after approximately three seconds.

- [ ] **Step 4: Inspect the final diff**

Run: `git diff --check`

Run: `git diff -- components/ui/vertical-tabs.tsx tests/landing-page.test.ts docs/superpowers/plans/2026-07-16-landing-tabs-uniform-frame-autoplay.md`

Expected: no whitespace errors and no unrelated edits.
