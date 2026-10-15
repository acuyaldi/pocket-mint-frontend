# Assistant Snackbar Error UX & Layout Remediation

**Branch:** `feat/assistant-snackbar-error-ux` (from `dev`)
**Scope:** Frontend only. No backend, API-contract, financial-domain,
clarification, draft, idempotency, or recovery-behavior changes.

**Reported symptoms**

- The Assistant page rendered request failures such as `Assistant provider is
  unavailable` as **inline red text directly below the command input** — a
  field-level error presentation for what is actually a global/API failure.
  This shifted the form layout and wrongly associated the failure with the
  input field (red ring + `aria-invalid`).
- Large vertical gaps between header, empty state, and composer made the page
  feel like disconnected blocks; the "Percakapan baru" action was visually
  detached and the composer sat far below the empty state.

## Previous behavior

`components/ui/toaster.tsx` was a small custom singleton (`toast(message,
variant)`), mounted in `app/(app)/layout.tsx`, rendering **bottom**-anchored
toasts with only `success`/`error` variants, no close button, no queue, no
deduplication, an `aria-live="polite"` container **and** `role="status"` per
item (double live region), and no reduced-motion handling.

Assistant error ownership was **inconsistent**:

- `useAssistantConversationFlow.submit`'s definite (non-ambiguous) errors were
  written to `formError` and rendered **inline** on the command input.
- Every other Assistant action (clarification select/cancel, draft
  confirm/cancel, outcome retry) already routed its error message to
  `toast(message, "error")`.

The friendly-copy leak: `readAssistantErrorMessage` had no mapping for
`ASSISTANT_PROVIDER_UNAVAILABLE` (backend 503,
`pocket-mint-be/src/controllers/assistant.controller.ts`), so it fell through
to the raw backend string `Assistant provider is unavailable`.

## Notification call-site audit

`toast()` is used in 11 files; all were preserved by keeping the `toast()` API
and upgrading only the underlying viewport (adapt, not replace):

| Area | File | Kind |
|---|---|---|
| Assistant | `app/(app)/assistant/page.tsx` | success + error (all workflow actions) |
| Analytics export | `app/(app)/analytics/page.tsx` | error |
| Budgets | `app/(app)/anggaran/page.tsx`, `anggaran/[id]/page.tsx` | success + error |
| Merchant mapping | `app/(app)/profile/merchant-mapping/page.tsx` | success + error |
| Saving goals | `app/(app)/target-tabungan/page.tsx` | error |
| Transactions | `transactions/components/AddTransactionModal.tsx`, `transactions/rutin/page.tsx` | success + error |
| Wallets | `wallets/page.tsx`, `wallets/components/EditWalletModal.tsx` | success + error |
| Auth | `components/LogoutProvider.tsx` | error |

`lib/api.ts` interceptors emit **no** notifications (401 → redirect only), so
there is no global middleware notification layer that could double-fire.

## Error-classification rules

- **Field validation (inline):** local, pre-request checks only. The only such
  case today is an over-length instruction (client-side guard mirroring the
  backend's `MAX_ASSISTANT_MESSAGE_LENGTH = 10_000`). Rendered inline via
  `FormField` `error`, which is the *only* thing that sets `aria-invalid` on the
  input.
- **Request/global failures (snackbar):** provider unavailable (503), HTTP 5xx,
  auth/session, rate-limit, unknown server error. Normalized via
  `readAssistantErrorMessage` and shown through the top snackbar. Never inline,
  never `aria-invalid`.
- **Workflow result states (dedicated Assistant UI — unchanged):** clarification
  required, draft ready, cancelled, succeeded, and the ambiguous
  "outcome unknown" recovery flow. A network/timeout on send has **no HTTP
  response** → still classified `ambiguous` → still routed to the existing
  `actionOutcomeUnknown` recovery UI (because the mutation may have succeeded),
  **not** the snackbar.

### Single ownership

Each notification has exactly one emit point. Assistant `submit` errors are
emitted once by the page-level `toast(message, "error")` callback the hook is
handed; the hook never also writes them inline. The snackbar's dedupe window is
a second safety net.

## Snackbar architecture

Adapted `components/ui/toaster.tsx` in place (no new dependency):

- **Position:** `position: fixed`, top, centered over content. Offsets account
  for the desktop sidebar (`md:left-64`) and clear the desktop topbar
  (`md:pt-19` ≈ 4.75rem > the 4rem `h-16` topbar) and the mobile safe-area
  (`env(safe-area-inset-top)`). It overlays content and never takes
  document-flow space → cannot cause layout shift.
- **Variants:** `success` (mint), `error` (coral-strong), `warning` (amber/
  warning), `info` (slate) — semantic design tokens only. Icon + text + role;
  never color-only.
- **Mounted once** in the authenticated shell `app/(app)/layout.tsx`, which is
  stable across client-side route transitions within `(app)/` — so a snackbar
  persists across navigations and the viewport never remounts per page.
- **Accessible close button** (44px target, localized `aria-label`), keyboard
  reachable; focus is never trapped or moved automatically.
- **Auto-dismiss** per variant (4s / 5s warning / 6s error); hover/focus pauses
  the timer. Respects `prefers-reduced-motion`.

### Live-region policy (no double announcement)

The container is a **labelled region landmark** (`role="region"` +
`aria-label`), **not** a live region. Each toast is its own single live region:
`role="alert"` (assertive) for error/warning, `role="status"` (polite) for
success/info. A message is therefore announced exactly once.

### Queue / deduplication policy

Deterministic: **one snackbar visible at a time**; additional messages queue
FIFO and surface as each is dismissed. An identical `(message + variant)` that
is already visible/queued, or was shown within `DEDUPE_WINDOW_MS` (4s), is
dropped — so one failed request can never produce two snackbars even if two
layers fire.

### Error copy

Raw exception/stack text is never shown. `readAssistantErrorMessage` normalizes
via the existing layer; `ASSISTANT_PROVIDER_UNAVAILABLE` /
`ASSISTANT_PROVIDER_CONFIGURATION_ERROR` now map to friendly localized copy:

- EN: `Assistant is temporarily unavailable. Please try again shortly.`
- ID: `Asisten sedang tidak tersedia. Silakan coba lagi sebentar lagi.`

## Assistant layout changes

- **Compact header:** title/description on the left; **New conversation** +
  **History** grouped on the right, wrapping cleanly below the title on narrow
  screens. The disconnected right-aligned "Percakapan baru" button row was
  removed from `AssistantConversation` and relocated into the header group.
- **Connected workspace:** top-level `space-y-8` → `gap-6`; the conversation
  region `space-y-6` → `gap-5`, so the composer sits directly under the
  conversation instead of far below.
- **Empty state:** restrained icon anchor → title → short explanation
  (`max-w-md` for readable line length) → example inputs as bordered rows. It
  guides the first message without dominating the viewport; the composer stays
  in view just below.
- The command form's submit button gained a fixed `min-w-32` so idle/pending
  labels never change its geometry.

## Accessibility behavior

- Error/warning → `role="alert"`; success/info → `role="status"`; container is a
  non-live region landmark → each message announced once.
- Input gets `aria-invalid` **only** for real field validation; a global failure
  never marks it invalid and is never wired to the field via `aria-describedby`.
- Close button labelled and keyboard operable; 44px target; visible focus ring.
- Reduced-motion respected; status paired with icon + text (never color-only).

## Performance / layout-stability considerations

- Snackbar is `position: fixed` → out of document flow → **no CLS** from
  show/hide, and it never moves the heading, empty state, composer, or submit
  button.
- Mounted exactly once (asserted); no per-route provider, no duplicate provider,
  no new broad Redux/global subscription, no new notification library.
- Notification state is local `useState` inside the single `Toaster` — app-wide
  re-renders are not triggered by showing a toast.
- Route prefetching, navigation pending feedback (PR #70 work), and the LCP/INP
  posture are untouched (no changes to nav, links, or the paintable headings).

## Testing results

All CI-equivalent gates pass locally:

| Gate | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npm run lint` | pass |
| `npx vitest run --project=unit` | **714 passed** (incl. new `tests/snackbar.test.ts`, updated `tests/assistant.test.ts`) |
| `npx vitest run --project=storybook` | **174 passed** (incl. 12 new `UI/Toaster` stories) |
| `npm run build` | pass (21 routes, `/assistant` included) |
| `npm run build-storybook` | pass |

New/updated coverage:

- **Snackbar (source contract + i18n):** `tests/snackbar.test.ts` — fixed/top
  position, sidebar + safe-area offsets, single localized mount, alert/status
  semantics, non-live-region container, labelled close, variants, queue,
  dedupe, per-variant timers, no second dependency, i18n parity.
- **Snackbar (real DOM / a11y / interaction):** `components/ui/toaster.stories.tsx`
  — success/error/warning/info, long EN/ID message, mobile, dark, queued,
  deduplicated, fixed-position (computed `position: fixed`), close-dismiss, and
  an Assistant provider-unavailable snackbar.
- **Assistant error routing:** `tests/assistant.test.ts` updated to assert
  submit's definite failure goes to `onRequestError` (snackbar), never
  `setFormError`; inline `formError` is reserved for the over-length validation;
  the page wires a single `toast(message, "error")` owner; provider-unavailable
  maps to friendly, non-raw copy in both locales.

## Manual verification

Verified against a production build (`next build` + `next start`) with the
Assistant endpoint forced to a 503 provider-unavailable response:

- A single top snackbar appears with the friendly localized copy; no inline API
  error under the input; the input keeps its value and is not marked invalid;
  no layout shift of heading/empty state/composer; the snackbar is dismissible
  and a retry works without retyping. Mobile (top, safe-area) and desktop
  (below topbar, right of sidebar) both clear primary navigation and page
  actions.

## Remaining limitations

- Ambiguous send failures (network/timeout with no HTTP response) intentionally
  continue to use the existing "outcome unknown" recovery UI rather than the
  snackbar, because the financial mutation may have succeeded — this is
  deliberate preservation of a domain workflow state, not a gap.
- The `common.errors.network` / `common.errors.timeout` strings are provided per
  the localization spec but are not yet consumed by a call site (available for
  future non-Assistant use); they are kept in en/id parity.
- Timer/auto-dismiss durations are asserted by source contract; exact
  wall-clock dismissal timing is not asserted in the browser tests to avoid
  flakiness.
