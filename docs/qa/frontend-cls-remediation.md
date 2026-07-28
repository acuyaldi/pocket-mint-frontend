# Frontend Performance Remediation — Cumulative Layout Shift (CLS)

**Branch:** `perf/frontend-cls-remediation` (from `dev`)
**Reported symptom:** CLS ≈ 0.17 with one dominant layout-shift cluster
(LCP ≈ 1.26s and INP ≈ 80ms were already healthy). LCP, INP, PR #70's
navigation feedback, route prefetch, accessibility, and visual design must not
regress.

## Reproduction route and steps

The dominant cluster is on **`/analytics`**, not `/dashboard` or `/tagihan`.
The other primary routes were measured and are already stable (see below), so
the investigation was scoped to `/analytics` once the trace pointed there.

1. `next build` + `next start -p 4000` (production build — **authoritative**).
   Port 4000 is the only origin the backend's `CORS_ALLOWED_ORIGINS` accepts,
   so a build served on any other port receives **zero data** and cannot
   exercise the data-dependent shift.
2. Log in with the real Supabase test account (`E2E_EMAIL` / `E2E_PASSWORD`),
   the same flow as `e2e/auth.setup.ts`.
3. Cold-load `/analytics` in a fresh browser context (no warm cache), let all
   analytics queries resolve, and read `layout-shift` `PerformanceObserver`
   entries (skipping `hadRecentInput`), including `entry.sources[].node` and
   before/after rects.

## Environment

- Local macOS, `next build` + `next start` on `localhost:4000` (production).
- Backend `pocket-mint-be` on `localhost:5001`; Supabase-backed test account.
- System Google Chrome driven by Playwright; `layout-shift` and
  `largest-contentful-paint` `PerformanceObserver`s.
- Viewports: **desktop 1440×900** and **mobile 390×844**.
- Cold navigation, 5 iterations per configuration.
- To expose the transition under a fast local backend (which otherwise answers
  in single-digit ms so data lands within the first paint), a deterministic
  **+1s delay** was applied to the `/analytics/*` API responses, identically to
  the before and after builds. Both throttled and unthrottled numbers are
  reported.

## Before measurements (production, `/analytics`, 5 cold loads)

| Config | Viewport | CLS values | Median | Worst |
|---|---|---|---:|---:|
| unthrottled | desktop | 0.128, 0.205, 0.205, 0.153, 0.128 | **0.153** | 0.205 |
| unthrottled | mobile | 0.580, 0.500, 0.500, 0.500, 0.000 | **0.500** | 0.580 |
| +1s API | desktop | 0.128, 0.205, 0.128, 0.348, 0.182 | **0.182** | 0.348 |
| +1s API | mobile | 0.621, 0.500, 0.580, 0.500, 0.500 | **0.500** | 0.621 |

Development-mode probe (directional only, not authoritative): desktop 0.128,
mobile 0.500 — same cluster, matching the ~0.17 originally reported.

## Dominant layout-shift elements

From the trace (desktop, unthrottled):

- **+0.082** — `<section class="grid grid-cols-1 gap-8 lg:grid-cols-2">` (the
  charts grid) moved `y 282 → 485` (**Δ203px** down). 203px = the overview
  summary-cards `<section>` height (171px) + the `space-y-8` gap (32px).
- **+0.046** — the chart `<article>` bodies (Cash flow, Spending by category,
  Wallet activity, Budget performance) reflowing as their chart contents
  mounted.

Mobile (+0.50): the same charts grid pushed down by the **676px** overview
block (four cards stacked) inserted above it.

## Root cause

`app/(app)/analytics/page.tsx` mounted the overview summary-cards `<section>`
**conditionally**, only after the query resolved:

```tsx
{overview.data && (
  <section className="grid ... lg:grid-cols-4"> …4 cards… </section>
)}
```

On first paint `overview.data` is `undefined`, so the section is absent and the
charts grid paints directly under the sticky period selector. When the query
resolves (~1s under load), the section is **inserted above** the already-painted
charts, shoving them (and everything below) down by the section's full height —
203px on desktop, 676px on mobile. A secondary contributor: each chart
`<article>` rendered `{query.data ? <Chart/> : null}`, so its body grew from
zero to full height when data arrived.

This is independent of the in-flight analytics API-envelope change in the
working tree: the section mounts as soon as `overview.data` is truthy under
either version of the hook.

## Rejected hypotheses (measured, not assumed)

- **Fonts / `next/font` / font swap.** `--font-sans: Inter` is declared in
  `globals.css` but Inter is **never actually loaded** (no `next/font`, no
  `@font-face`, no Google Fonts link, no `public/*.woff`). The browser uses
  `system-ui`/`sans-serif` from first paint — there is no web-font swap, so
  fonts cannot cause CLS here. (Adding `next/font` now could *introduce* swap
  CLS, so it was deliberately not touched.)
- **Dashboard hero / PR #70 work.** `/dashboard` measured CLS ≈ 0.0009
  (desktop) / 0.003 (mobile) — the Net Worth `<h2>` is already always-mounted.
- **Tagihan loading spinner.** `/tagihan` measured 0.000 — PR #70 keeps the
  `<h1>` mounted and the spinner is the last block, so nothing above it moves.
- **`nav-link-pending-hint` (PR #70).** Always mounted at `size-1.5 shrink-0`,
  animates opacity only — reserves its own space, contributes no shift.
- **Sidebar due-bill badge / account label.** Horizontal (`ml-auto`) and
  `truncate` respectively — no vertical displacement.
- `/wallets`, `/transactions`, `/cicilan`, `/anggaran`, `/target-tabungan`
  all measured 0.000.

## Implemented changes

- **`app/(app)/analytics/page.tsx`**
  - The overview summary-cards `<section>` is **always mounted** (except on
    overview error, which the existing banner handles). While loading it
    renders four `<AnalyticsSummaryCard loading />` skeletons that reserve the
    same geometry the loaded cards occupy, so the section is never inserted
    above the charts.
  - Each chart body renders a height-reserving `<ChartSkeleton>` while its
    query is loading instead of `null`, so the `<article>` doesn't grow when
    the chart mounts. Cash flow reserves its deterministic height (300px chart
    + legend); the data-sized charts reserve a representative height.
  - Added an `sr-only role="status"` loading announcement (the visual skeletons
    are `aria-hidden`), with a new `analytics.loading` message (en + id).
- **`app/(app)/analytics/components/AnalyticsSummaryCard.tsx`**
  - Added a type-safe `loading` variant that reuses the exact same card frame
    and the same three text line-boxes, replaced by neutral, reduced-motion-safe
    skeleton bars (no fabricated data, `aria-hidden`).
  - Fixed a **pre-existing** accessibility defect the new stories surfaced: the
    change-text tone used the bright decorative `text-mint` / `text-coral`
    (contrast 1.7–2.8:1 on the white card — an axe color-contrast failure). It
    now uses the design system's AA-safe `text-mint-strong` / `text-coral-strong`
    variants (documented in `globals.css` for exactly this case). The direction
    arrow remains the non-color status cue. Geometry is unchanged.
- **`AnalyticsSummaryCard.stories.tsx`** (new) — loading, income-up,
  expense-up, no-comparison, loaded-vs-loading grid, large value, and long
  translated label stories. All pass the Storybook a11y (`test: "error"`) gate.
- **`tests/analytics-summary-card.test.ts`**, **`tests/analytics-page-cls.test.ts`**
  (new) — regression coverage (see below).
- **`messages/en.json` / `messages/id.json`** — `analytics.loading`.

No business logic, API contract, authentication behavior, financial
calculation, routing, or data-fetching hook was changed. `lib/api.ts`,
TanStack Query usage, and the analytics queries are untouched.

## After measurements (production, `/analytics`, 5 cold loads)

| Config | Viewport | CLS values | Median | Worst |
|---|---|---|---:|---:|
| unthrottled | desktop | 0.0052 ×5 | **0.0052** | 0.0052 |
| unthrottled | mobile | 0.000 ×5 | **0.0000** | 0.0000 |
| +1s API | desktop | 0.0052 ×5 | **0.0052** | 0.0052 |
| +1s API | mobile | 0.000 ×5 | **0.0000** | 0.0000 |

- Desktop **0.153–0.182 → 0.0052** (≈ 97% reduction; ≤ 0.05 preferred target).
- Mobile **0.500 → 0.000**.

The residual desktop 0.0052 is the overview card growing ~20px when its change
text wraps from one line to two in the narrow 4-column desktop layout
(151px → 171px). Forcing it to exactly 0 would require reserving two change
lines on mobile too, adding empty space there (mobile is already 0.000), so it
was left as-is — comfortably under the 0.05 preferred target.

## LCP and INP — no regression

- **LCP** (`largest-contentful-paint`, unthrottled): desktop **832 → 852ms**
  (run-to-run noise); mobile **208 → 976ms**. Under +1s throttling LCP peaks at
  ~2.2s. **All configurations remain well under the 2.5s target.** The mobile
  difference reflects which element the browser selects as the LCP candidate
  once the overview is painted early (the reserved-then-filled value text
  becomes the LCP) — not extra load work: no network requests, no new
  dependencies, and one ~10-line skeleton component were added.
- **INP** — unchanged. No event handlers, interaction paths, or client state
  logic were modified; the fix is pure layout reservation. Reported INP ≈ 80ms
  is unaffected.
- PR #70's `useLinkStatus` navigation hint and route prefetch are untouched.

## Regression coverage

- `tests/analytics-summary-card.test.ts` — the loading variant renders the same
  card frame as the loaded card (reserves final geometry), uses a
  reduced-motion-safe `aria-hidden` skeleton, and fabricates no financial data.
- `tests/analytics-page-cls.test.ts` — the overview section is not conditionally
  mounted behind `overview.data`; the loading skeleton variant is used; every
  chart reserves body height via `ChartSkeleton` gated on its own loading flag;
  the `<h1>` precedes every data-dependent section; the accessible loading
  status and `analytics.loading` messages exist.
- Storybook stories cover loading, loaded, long translated text, large numeric
  values, and the loaded-vs-loading geometry comparison.

## Validation

- `npx tsc --noEmit` — clean.
- `npm run lint` — clean.
- `npx vitest run --project=unit` — 705 passed (55 files).
- `npm run build-storybook` — succeeded.
- `npx vitest run --project=storybook` (a11y + interaction) — 170 passed
  (28 files).
- `npm run build` (production) — succeeded; `/analytics` still `ƒ` (dynamic).
- Manual production-mode Web Vitals verification on `:4000` (above).

## Remaining limitations

- The data-sized charts (Spending by category, Wallet activity, Budget
  performance) reserve a representative body height, not their exact
  data-dependent height, so a small residual shift is possible if the loaded
  content differs substantially from the reserved height. In the measured
  account this did not register (these charts sit in rows below the fold on
  desktop and below the 676px overview stack on mobile), and total CLS is
  0.0052 / 0.000. Cash flow, the one above-the-fold chart, has a deterministic
  height and is reserved exactly.
- No profiling scripts, traces, screenshots, or debug instrumentation are
  committed; all measurement was done with temporary files outside the repo.
