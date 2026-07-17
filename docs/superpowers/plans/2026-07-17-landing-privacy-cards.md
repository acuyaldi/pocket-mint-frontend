# Landing Privacy Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three privacy divider rows with stacked numbered cards using the project's existing card primitives.

**Architecture:** Keep the privacy section inside `app/page.tsx`, hoist its three strings into one module-level constant, and map them into semantic list items containing `Card` and `CardContent`. Extend the existing source-level landing contract before implementation; no new component, state, dependency, or interaction is needed.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS v4, existing shadcn `Card`, Vitest.

## Global Constraints

- Preserve the privacy heading, supporting paragraph, point copy, section order, routes, and surrounding landing layout.
- Keep the cards stacked in the existing right column with `gap-3` and full-width stacking below the copy on narrow screens.
- Use existing `Card` and `CardContent`; do not modify `components/ui/card.tsx` or add a dependency.
- Use semantic `ul` and `li` markup with decorative two-digit markers hidden from assistive technology.
- Add no icons, descriptions, links, buttons, hover states, or animation.
- Run focused tests, full tests, lint, and build only. Do not run Playwright or browser automation unless the user explicitly requests it.
- Preserve all pre-existing working-tree changes and leave implementation files unstaged.

---

### Task 1: Add the Privacy Card Contract

**Files:**
- Modify: `tests/landing-page.test.ts`
- Test: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: Source text from `app/page.tsx`.
- Produces: A regression contract for existing card primitives, the privacy data source, semantic list structure, numbered markers, and removal of the divider treatment.

- [ ] **Step 1: Write the failing test**

Add this test inside the existing `describe("Pocket Mint public experience contract", ...)` block:

```ts
it("presents each privacy promise as a numbered card", () => {
  expect(page).toContain(
    'import { Card, CardContent } from "@/components/ui/card"'
  );
  expect(page).toContain("const privacyPoints = [");
  expect(page).toContain('<ul className="grid gap-3"');
  expect(page).toContain("privacyPoints.map((point, index)");
  expect(page).toContain("<li key={point}>");
  expect(page).toContain('<Card size="sm"');
  expect(page).toContain("<CardContent");
  expect(page).toContain('aria-hidden="true"');
  expect(page).toContain('String(index + 1).padStart(2, "0")');
  expect(page).not.toContain('className="space-y-4 text-sm');
  expect(page).not.toContain('className="border-t border-border pt-4"');
});
```

- [ ] **Step 2: Run the focused test and verify RED**

Run: `npm test -- tests/landing-page.test.ts`

Expected: FAIL because `app/page.tsx` still renders three divider paragraphs and has no card import, data array, semantic list, or numbered markers.

---

### Task 2: Render the Numbered Privacy Cards

**Files:**
- Modify: `app/page.tsx`
- Test: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: Existing `Card` and `CardContent` exports from `components/ui/card.tsx`.
- Produces: `privacyPoints: readonly string[]` rendered as three numbered, non-interactive semantic cards.

- [ ] **Step 1: Import the existing card primitives**

Add this import with the other component imports:

```ts
import { Card, CardContent } from "@/components/ui/card";
```

- [ ] **Step 2: Define the existing privacy copy once**

Add this module-level constant below `largePrimaryButton`:

```ts
const privacyPoints = [
  "Tanpa iklan.",
  "Tanpa pelacakan marketing.",
  "Hanya data yang diperlukan untuk workspace Anda.",
] as const;
```

- [ ] **Step 3: Replace the divider paragraphs with semantic cards**

Replace the current right-column `div` and its three `p` elements with:

```tsx
<ul className="grid gap-3" aria-label="Komitmen privasi Pocket Mint">
  {privacyPoints.map((point, index) => (
    <li key={point}>
      <Card
        size="sm"
        className="py-0 shadow-sm shadow-primary/5"
      >
        <CardContent className="flex min-h-20 items-center gap-4 px-4 py-4">
          <span
            aria-hidden="true"
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-xs font-semibold tracking-[0.08em] text-primary"
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <p className="text-sm font-medium leading-6 text-foreground">
            {point}
          </p>
        </CardContent>
      </Card>
    </li>
  ))}
</ul>
```

- [ ] **Step 4: Run the focused test and verify GREEN**

Run: `npm test -- tests/landing-page.test.ts`

Expected: all landing-page contract tests pass.

- [ ] **Step 5: Inspect the focused diff**

Run: `git diff --check -- app/page.tsx tests/landing-page.test.ts`

Expected: exit code 0 with no whitespace errors. Confirm the heading and supporting paragraph are unchanged and `components/ui/card.tsx` is untouched.

---

### Task 3: Run Automated Quality Gates

**Files:**
- Verify: `app/page.tsx`
- Verify: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: Completed privacy-card implementation.
- Produces: Automated test, lint, and production-build evidence for handoff.

- [ ] **Step 1: Run the complete frontend test suite**

Run: `npm test`

Expected: all Vitest suites pass.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: exit code 0 with no lint errors.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: exit code 0 and a successful Next.js production build.

- [ ] **Step 4: Confirm no browser automation ran**

Check the executed command log for this task. It must contain no Playwright, browser plugin, or screenshot command.

- [ ] **Step 5: Leave implementation changes unstaged**

Because `app/page.tsx` and `tests/landing-page.test.ts` already contained user changes before this task, do not create an implementation commit that could capture unrelated work. Report the modified files and automated verification evidence instead.
