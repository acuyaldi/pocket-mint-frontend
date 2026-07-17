# Landing Pulse Beams Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep animated pulse beams visibly framing the landing copy and dashboard screenshot on desktop and mobile.

**Architecture:** Retain the existing shared `PulseBeams` component and its `hero`/`panel` variants. Change only the hero SVG geometry and scaling behavior, then strengthen the landing-only presentation class; the login panel remains unchanged.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Framer Motion, Vitest.

## Global Constraints

- Use one continuous, non-interactive beam layer behind the entire landing hero.
- Preserve `aria-hidden`, pointer-event passthrough, and reduced-motion behavior.
- Do not alter the login variant.
- Add no dependencies or unrelated landing redesign.

---

### Task 1: Protect landing-specific beam geometry

**Files:**
- Modify: `tests/pulse-beams.test.ts`
- Modify: `tests/landing-page.test.ts`
- Modify: `components/ui/pulse-beams.tsx`
- Modify: `components/ui/pocket-mint-hero.tsx`

**Interfaces:**
- Consumes: `PulseBeamsProps` with `variant?: "hero" | "panel"`.
- Produces: the same public component interface; only landing rendering changes.

- [ ] **Step 1: Write the failing tests**

Add source contracts that require a portrait landing view box and complete-geometry scaling:

```ts
expect(component).toContain('variant === "hero" ? "0 0 858 1180" : "0 0 858 434"');
expect(component).toContain('variant === "hero" ? "xMidYMin meet" : "xMidYMid slice"');
```

Strengthen the landing usage contract:

```ts
expect(hero).toContain('className="text-primary opacity-75"');
```

- [ ] **Step 2: Run tests to verify RED**

Run: `npm test -- tests/pulse-beams.test.ts tests/landing-page.test.ts`

Expected: FAIL because the component still uses `viewBox="0 0 858 434"`, always uses `xMidYMid slice`, and the landing opacity is `opacity-55`.

- [ ] **Step 3: Implement the minimum geometry fix**

Extend `heroBeams` with paths distributed through a `858 × 1180` coordinate space so lines frame the headline and continue beside the screenshot. Select SVG attributes by variant:

```tsx
const viewBox = variant === "hero" ? "0 0 858 1180" : "0 0 858 434";
const preserveAspectRatio =
  variant === "hero" ? "xMidYMin meet" : "xMidYMid slice";

<svg
  className="h-full w-full"
  viewBox={viewBox}
  fill="none"
  preserveAspectRatio={preserveAspectRatio}
>
```

Keep panel paths and animation behavior intact. In `pocket-mint-hero.tsx`, use:

```tsx
<PulseBeams variant="hero" className="text-primary opacity-75" />
```

- [ ] **Step 4: Run focused tests to verify GREEN**

Run: `npm test -- tests/pulse-beams.test.ts tests/landing-page.test.ts`

Expected: both files PASS.

- [ ] **Step 5: Run static verification**

Run: `npm run lint -- components/ui/pulse-beams.tsx components/ui/pocket-mint-hero.tsx tests/pulse-beams.test.ts tests/landing-page.test.ts`

Expected: exit code 0 with no relevant lint errors.

- [ ] **Step 6: Verify rendered behavior**

Run the app at `http://localhost:4000/`, inspect desktop `1440 × 900` and mobile `390 × 844`, and confirm:

- beams are visible around the copy and both sides of the dashboard;
- headline, CTA, and screenshot remain readable and clickable;
- no clipping, horizontal overflow, framework overlay, or relevant console warning/error;
- at least the primary CTA navigation changes the route to `/login`.

- [ ] **Step 7: Commit the focused implementation**

```bash
git add components/ui/pulse-beams.tsx components/ui/pocket-mint-hero.tsx tests/pulse-beams.test.ts tests/landing-page.test.ts docs/superpowers/plans/2026-07-17-landing-pulse-beams.md
git commit -m "fix: reveal landing pulse beams"
```
