# Landing Content Hierarchy and Active Tabs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve landing-page content hierarchy, emphasize the active feature tab, and open registration directly from the header.

**Architecture:** Keep the existing landing component boundaries and express visual changes with Tailwind classes only. Reuse the existing CTA sweep utility, and derive the auth page's initial mode from the existing `useSearchParams()` value without adding a route, effect, or dependency.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, Vitest, in-app Browser

## Global Constraints

- Preserve existing copy, page order, tab behavior, autoplay, reduced-motion handling, images, and responsive structure.
- Add no dependency, component, state, or visual asset.
- Preserve tab semantics and keyboard behavior.
- Do not redesign the authentication form.
- Do not perform unrelated refactors.

---

### Task 1: Encode the landing hierarchy and registration contract

**Files:**
- Modify: `tests/landing-page.test.ts`
- Modify: `tests/login-page.test.ts`

**Interfaces:**
- Consumes: landing and auth source files as UTF-8 strings.
- Produces: regression contracts for hierarchy classes, active-tab classes, CTA sweep reuse, and `mode=register` initialization.

- [ ] **Step 1: Write the failing tests**

Add assertions that require the privacy grid to use desktop stretch alignment, both section headings to use the approved larger responsive scale, the active tab to include mint background and stronger conditional title classes, the `Daftar` link to use `/login?mode=register` and `landing-cta-sweep`, and the login state initializer to map `mode=register` to `signup`.

- [ ] **Step 2: Run tests to verify RED**

Run: `rtk npm test -- tests/landing-page.test.ts tests/login-page.test.ts`

Expected: FAIL only on the newly added assertions because the approved behavior is absent.

- [ ] **Step 3: Commit the test contract together with the implementation after GREEN**

No test-only commit; the repository's current branch contains unrelated user changes, so stage only the four task files after verification.

### Task 2: Implement the minimal hierarchy and navigation changes

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/ui/vertical-tabs.tsx`
- Modify: `components/ui/pocket-mint-hero.tsx`
- Modify: `app/login/page.tsx`

**Interfaces:**
- Consumes: `cn`, `buttonVariants`, `useSearchParams`, the existing `landing-cta-sweep` CSS utility, and `AuthMode`.
- Produces: a registration deep link at `/login?mode=register` and an auth initializer returning `"signup"` for that query value or `"signin"` otherwise.

- [ ] **Step 1: Adjust the privacy layout**

Change the desktop grid alignment from bottom alignment to stretch alignment, make the left block a desktop flex column that distributes heading and copy, reduce oversized section padding, and raise the heading and paragraph responsive sizes without changing copy.

- [ ] **Step 2: Strengthen the feature introduction and active tab**

Increase the feature heading and paragraph responsive classes. Conditionally add `rounded-xl bg-mint/10` to the active button and use `cn()` on the title to make the active title larger and semibold while leaving inactive titles quieter.

- [ ] **Step 3: Reuse the CTA sweep and deep-link registration**

Set the header `Daftar` href to `/login?mode=register` and add `landing-cta-sweep` to its existing class list.

- [ ] **Step 4: Initialize the auth mode from the query**

Move `useSearchParams()` before the state declarations and initialize `authMode` with `useState<AuthMode>(() => searchParams.get("mode") === "register" ? "signup" : "signin")`. Do not add an effect or synchronize subsequent URL mutations.

- [ ] **Step 5: Run focused tests to verify GREEN**

Run: `rtk npm test -- tests/landing-page.test.ts tests/login-page.test.ts`

Expected: both files PASS.

- [ ] **Step 6: Run static verification**

Run: `rtk npm run lint`

Expected: exit 0 with no new lint errors.

Run: `rtk npm run build`

Expected: exit 0 and Next.js production build completes.

- [ ] **Step 7: Commit the scoped implementation**

Stage only `app/page.tsx`, `app/login/page.tsx`, `components/ui/pocket-mint-hero.tsx`, `components/ui/vertical-tabs.tsx`, `tests/landing-page.test.ts`, `tests/login-page.test.ts`, and this plan. Commit with `feat: refine landing hierarchy and registration flow`.

### Task 3: Verify rendered desktop and mobile behavior

**Files:**
- No committed files.

**Interfaces:**
- Consumes: local app at `http://localhost:4000/`.
- Produces: Browser evidence for layout, active-tab state, and registration navigation.

- [ ] **Step 1: Start the existing app**

Run the repository's `npm run dev` script on its configured port 4000 without adding dependencies.

- [ ] **Step 2: Validate desktop**

At 1440x900, confirm page identity, nonblank content, no framework overlay, clean relevant console output, balanced privacy alignment, emphasized feature heading, and visible active tab background/title hierarchy.

- [ ] **Step 3: Exercise interactions**

Click a non-active feature tab and confirm `aria-selected` and the displayed screenshot change. Click `Daftar` and confirm the URL becomes `/login?mode=register` and the signup form is visible.

- [ ] **Step 4: Validate mobile**

At 390x844, confirm no horizontal overflow, readable section headings, stable active-tab layout, and visible Login/Daftar actions.
