# Landing CTA Hover Sweep Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a left-to-right fill sweep to both landing-page `Mulai Sekarang` links.

**Architecture:** Use one CSS utility with a `::before` pseudo-element and apply it to the two existing links. Keep the effect CSS-only, use the current color tokens, and retain existing link semantics and focus outlines.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest.

## Global Constraints

- Apply only to the two landing-page `Mulai Sekarang` links.
- Use no new dependency or JavaScript state.
- Use a 300ms left-to-right sweep and preserve reduced-motion handling.
- Preserve `/login`, visible focus, and a minimum 44px target.
- Preserve unrelated working-tree changes.

---

### Task 1: Define and implement the CTA sweep contract

**Files:**
- Modify: `tests/landing-page.test.ts`
- Modify: `app/globals.css`
- Modify: `components/ui/pocket-mint-hero.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: the two existing `/login` CTA links and the global utilities layer.
- Produces: `.landing-cta-sweep` with hover/focus fill behavior.

- [ ] **Step 1: Write the failing regression test**

Read `app/globals.css` and assert:

```ts
expect(hero).toContain("landing-cta-sweep");
expect(page).toContain("landing-cta-sweep");
expect(globals).toContain(".landing-cta-sweep::before");
expect(globals).toContain(".landing-cta-sweep:hover::before");
expect(globals).toContain("translateX(0)");
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- tests/landing-page.test.ts`

Expected: FAIL because the class and pseudo-element do not exist.

- [ ] **Step 3: Add the CSS utility**

Add to `@layer utilities`:

```css
.landing-cta-sweep {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  border-radius: 40px;
  border: 1px solid var(--color-primary);
  font-weight: 500;
  transition: color 300ms ease;
}

.landing-cta-sweep::before {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--color-mint);
  content: "";
  transform: translateX(-101%);
  transition: transform 300ms ease;
}

.landing-cta-sweep:hover::before,
.landing-cta-sweep:focus-visible::before {
  transform: translateX(0);
}
```

- [ ] **Step 4: Apply the class to both CTA links**

Add `landing-cta-sweep` to the hero CTA class passed through `cn(...)` and to `largePrimaryButton` in `app/page.tsx`. Do not apply it to `Daftar`.

- [ ] **Step 5: Verify GREEN and the project**

Run: `npm test -- tests/landing-page.test.ts`

Run: `npm test -- --run`

Run: `npm run lint`

Run: `npm run build`

Expected: all commands exit 0.

- [ ] **Step 6: Inspect the final diff**

Run: `git diff --check`

Expected: no whitespace errors and no unrelated changes.
