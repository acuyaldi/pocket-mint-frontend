# Frontend Performance Remediation — Navigation & LCP

**Branch:** `perf/frontend-navigation-lcp` (from `dev`)
**Reported symptom:** LCP ≈ 7.52s on `/dashboard` (element resembling
`h2.mt-3.text-[32px].font-semibold`, the Net Worth heading); route
transitions felt frozen with no immediate feedback. CLS ≈ 0.01 and
INP ≈ 16ms were already healthy and are unaffected by this work.

## Measurement environment

- Local machine, Windows, Node 24, `next build` + `next start` (production
  build — **treated as authoritative** per task scope), served on
  `localhost:4010` to avoid an unrelated stray `next dev -p 4000` process
  already running on the conventional port.
- Backend: local `pocket-mint-be` on `localhost:5001`, real Supabase-backed
  test account (`E2E_EMAIL`/`E2E_PASSWORD`).
- Tooling: Playwright (Chromium) driving a real authenticated session,
  `PerformanceObserver` (`largest-contentful-paint`, `longtask`) and the
  Navigation/Resource Timing APIs — the same login flow already used by
  `e2e/auth.setup.ts`. CDP `Network.emulateNetworkConditions` /
  `Emulation.setCPUThrottlingRate` used for a throttled (~1.6 Mbps, 150ms
  RTT, 4× CPU) pass approximating Lighthouse mobile conditions, since
  localhost otherwise has no realistic network latency.
- No profiling scripts, screenshots, or traces were committed; all were
  temporary files removed before finishing.

## Dev mode vs. production build

The 7.52s figure was almost certainly captured against the Next.js **dev**
server (Turbopack on-demand route compilation, unminified bundles, React
dev overhead) rather than a production build — this is a well-known
characteristic of `next dev` (first request to an uncompiled route can take
several seconds) and is not present in `next start`. On the production
build, measured **cold-load LCP was 180–380ms**, even under throttled
network/CPU — nowhere near 7.52s. This was the first thing confirmed per
the task's Phase 1 instruction, and it reframes the rest of the
investigation: production is already fast; the remaining work is fixing
genuine, reproducible defects that would matter under worse real-world
conditions (slow networks, larger accounts, cold caches) and that were
visible in the code regardless of dev/prod.

## Root causes confirmed

1. **Dashboard Net Worth `<h2>` was conditionally unmounted while loading**
   (`DashboardHeroCard.tsx`). While `useDashboardSummary()` was pending, the
   component rendered a plain skeleton `<div>` instead of the heading; the
   `<h2>` only entered the DOM once the summary request resolved. Since
   this heading is the page's largest paintable text element, any delay in
   that network request (slow account, cold cache, bad network) directly
   became a **later, second LCP candidate** — exactly matching the reported
   LCP element. This is fixable independently of the dev/prod distinction.
2. **Tagihan (`/tagihan`) fully blocked its own page heading behind a
   spinner.** `TagihanPage` returned early with a full-page `LoaderCircle`
   while `useBills()` was loading, before `PageHeader` (the `<h1>`) ever
   rendered — a "root-level loading gate returns blank" pattern, on one of
   the app's primary nav destinations (has its own sidebar badge). Verified
   with an artificial 3s delay on `GET /bills`: before the fix the heading
   was blocked for the full 3s; after the fix it rendered in ~300ms.
3. **No immediate feedback on nav-link clicks**, matching the reported
   "feels frozen" symptom.

## A blind fix that was measured and reverted

Per the task's explicit warning not to apply loading skeletons without
evidence: the obvious first attempt — adding a `loading.tsx` to every
`app/(app)/*` route — was implemented, measured, and **reverted** because
it made things worse:

| Scenario | dashboard → wallets, time to `<h1>` visible |
|---|---:|
| Before any change | ~220ms |
| With `loading.tsx` added | ~880–1030ms (unthrottled) |
| After reverting `loading.tsx`, adding `useLinkStatus` hint instead | ~210ms (unthrottled), ~690ms (throttled) |

Root cause of the regression: every `app/(app)/*` page is a full `"use
client"` component with no server-side Suspense-worthy data fetching, so a
`loading.tsx` boundary has no streaming work to fill. Next.js intentionally
narrows `<Link>` prefetch scope to "up to the loading boundary" when a route
has a `loading.js` file, trading prefetch cost for an instant fallback —
but with no async server segment to stream, that trade only removed the
existing full-page prefetch that was already making these transitions
instant, with no compensating benefit. This is explicitly called out in the
official `useLinkStatus` docs ("if the linked route has been prefetched,
the pending state is skipped"; "the route has a `loading.js` file, enabling
instant transitions" are treated as alternative, not additive, strategies).
All `loading.tsx` files and the shared skeleton component were removed
before finishing.

## Fixes implemented

- **`app/(app)/dashboard/components/DashboardHeroCard.tsx`** — the Net
  Worth `<h2>` is now always mounted; only its inner content toggles
  between an `aria-hidden` skeleton bar (with an `sr-only` accessible
  loading label) and the real formatted value. The element's first paint
  now happens immediately regardless of how long the summary request
  takes, eliminating the late LCP candidate. No change to the financial
  calculation itself (still sourced from `GET /dashboard/summary`, PD-001).
- **`app/(app)/tagihan/page.tsx`** — `PageHeader` now renders
  unconditionally; only the bill list/stat section below it is replaced by
  the loading spinner while `useBills()` is pending.
- **`components/layout/nav-link-pending-hint.tsx`** (new) + wired into
  **`components/layout/app-sidebar.tsx`** — a small, fixed-size, `aria-hidden`
  dot using Next.js's `useLinkStatus()` hook. It only becomes visible once
  a transition is genuinely pending (i.e. prefetch hasn't already
  completed), giving instant click feedback without narrowing prefetch
  scope. Reserves its own space, so it introduces no layout shift.
  Scoped to the desktop sidebar (the primary nav surface, desktop being the
  design system's master breakpoint); the mobile bottom dock
  (`DockMorph`) was left out of scope — see Remaining limitations.
- `messages/en.json` / `messages/id.json` — added the `dashboard.loadingNetWorth`
  accessible-loading-label string in both locales.

## Before / after measurements (production build, same machine)

| Metric | Before | After |
|---|---:|---:|
| `/dashboard` cold-load LCP (unthrottled) | 380ms | 180–304ms |
| `/dashboard` cold-load LCP (throttled: ~1.6Mbps/150ms RTT/4× CPU) | 268ms | ~270ms (no regression) |
| dashboard → wallets, time to `<h1>` visible (unthrottled) | 220ms | 213ms |
| dashboard → wallets, time to `<h1>` visible (throttled) | 744ms | 691ms |
| `/tagihan` time to `<h1>` visible with `GET /bills` artificially delayed 3s | ~3000ms+ (blocked) | ~300ms |

Production LCP was already well under the 2.5s target before this work
(the 7.52s figure was not reproducible against the production build); the
fixes address the two concrete defects that were confirmed by code
inspection and would matter under worse real-world conditions than this
local test environment, plus the missing click-feedback affordance.

## Bundle size

No measurable change: one new ~15-line client component
(`nav-link-pending-hint.tsx`) using an existing Next.js API (`useLinkStatus`
from `next/link`, already shipped in the framework), no new dependencies,
no `loading.tsx` boundaries retained.

## Remaining limitations / follow-ups

- The mobile bottom nav (`DockMorph`/`BottomNav`) does not yet have the same
  `useLinkStatus` click-feedback hint as the desktop sidebar. `DockMorph`'s
  `<Link>` is wrapped in shared, animation-heavy logic shared with a
  non-Link (button) trigger path; wiring the hint in cleanly is more
  involved and wasn't backed by the same direct evidence (desktop is the
  design system's master breakpoint and the explicit "primary menu item"
  surface). Worth a small follow-up if mobile nav responsiveness is
  reported as an issue.
- If the original 7.52s figure was in fact captured in production against a
  much larger real account (many wallets/transactions/bills) or a slower
  network than this local test environment, the dashboard's `useTransactions`
  / `useWallets` / `useBills` / `useDashboardSummary` queries are already
  independent and parallel (no serial waterfall) — but their absolute
  response time still depends on backend query performance at scale, which
  is outside this frontend-only task's scope.

## Tests and validation

- `npx tsc --noEmit` — no errors.
- `npm run lint` — no issues.
- `npx vitest run --project=unit` — 696/696 passed (219 suites), including
  new/updated cases: `tests/dashboard-hero-card.test.ts` (heading stays
  mounted while loading, still has an accessible name),
  `tests/tagihan-page.test.ts` (`PageHeader` renders before the loading
  gate in source order), `tests/navigation.test.ts` (sidebar wires the
  pending hint, doesn't disable prefetch).
- `npm run build-storybook` — succeeded.
- `npx vitest run --project=storybook` (a11y + interaction) — 163/163
  passed (27 suites).
- `npm run build` (production) — succeeded, all routes still `ƒ` (dynamic,
  unchanged — auth-gated as before).
- Manual verification: artificial 3s delay on `GET /bills` confirmed the
  Tagihan heading now renders immediately instead of being blocked.

No business logic, authorization rules, API contracts, or financial
calculations were changed.
