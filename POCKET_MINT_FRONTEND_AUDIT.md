# Pocket Mint Frontend Audit Report

## Executive Summary

Pocket Mint is a compact Next.js 16 App Router frontend built around Supabase Auth, Axios, TanStack Query, Base UI/shadcn-style primitives, Tailwind CSS 4, Framer Motion, and Recharts. Its broad structure is understandable: routes live in `app/`, server-state hooks in `src/features/`, shared types in `src/types/`, transport/auth helpers in `lib/`, and shared UI in `components/`.

The project is an early-to-mid maturity implementation. It has a sound visual direction, strict TypeScript, reusable primitives, centralized server-state caching, shared currency formatting, and several correctly encoded financial rules. It is not ready for production financial use because several screens display fabricated financial history, important form values are silently discarded, protected-route coverage is incomplete, and the API identity boundary is client-spoofable.

Major strengths include clear feature naming, a small and navigable codebase, consistent React Query mutation invalidation, good use of Supabase SSR cookies, no unsafe HTML rendering, no local-storage token handling, reduced-motion CSS, and many correct debt/net-worth calculations.

Major weaknesses are the browser-to-backend authentication design, incomplete route protection, misleading financial presentation, inaccessible custom dialogs/click targets, duplicated and drifting domain contracts, weak error/empty-state separation, and a nonfunctional lint script.

Risk level: **High**. The highest risk comes from cross-user authorization assumptions in `lib/api.ts`; the highest product-integrity risk comes from invented financial trends and form previews that do not match submitted data.

Audit scope: all authored `.ts`, `.tsx`, `.css`, `.mjs`, and project configuration files were read in full. Environment variable names and exposure classes were inspected without reproducing secret values. Generated/third-party material (`node_modules/`, `.next/`, `tsconfig.tsbuildinfo`, lockfile internals, favicon/binary assets, and stock public SVG artwork) was classified rather than treated as authored application source. No source code was modified; this report is the only added artifact.

---

## Project Structure

- `app/` uses the App Router, with public landing/auth routes and an `(app)` route group for the authenticated shell.
- `app/(app)/*/components/` keeps page-specific UI close to its route. This works at the current size, although transaction and wallet modals are already large enough to justify domain-form extraction.
- `src/features/*/hooks/` is the server-state layer. TanStack Query owns wallets, transactions, installments, summaries, mutations, and invalidation.
- `src/types/` contains wallet and transaction response contracts. Installment and form contracts remain duplicated in components.
- `lib/api.ts` is the browser API client. `lib/supabase/*` separates browser/server/middleware Supabase clients. `lib/auth/sync-user.ts` is a server-side backend synchronization helper.
- `components/ui/` provides Base UI/shadcn-style primitives; `components/layout/` owns navigation; root-level `components/` contains cross-feature finance cards/charts.
- There is no global client-state store, and none is currently needed. React Query plus local component state is appropriate.

Module boundaries are understandable but porous: components embed financial rules, date arithmetic, provider matching, and API DTO construction. The application also has no stable auth/session provider, so several client pages independently create Supabase clients and fetch the current user.

---

## Findings Before Implementation

### Critical

#### `lib/api.ts:6-29`

**Severity:** Critical  
**Explanation:** Browser requests include a public/shared `x-api-key` and client-controlled `x-user-id`/`x-user-email` headers, but no Supabase access token or other backend-verifiable proof of identity. The comments state that the backend resolves the user from this header. Any browser user can alter these headers and claim another Supabase UID if the backend follows this contract.  
**Why it matters:** This can become cross-user wallet, transaction, and installment access or mutation—the central confidentiality and integrity boundary of the product.  
**Recommendation:** Send the Supabase access token as `Authorization: Bearer <token>` and have the backend verify signature, issuer, audience, expiry, and subject. Derive the user exclusively from the verified token; delete identity-by-header and do not use a public API key as authentication.

### High

#### `lib/api.ts:9` and `lib/auth/sync-user.ts:25`

**Severity:** High  
**Explanation:** A shared API credential has a hardcoded fallback, and the browser client uses a `NEXT_PUBLIC_*` credential path. Public frontend values and shipped fallbacks cannot be treated as secrets.  
**Why it matters:** Credential rotation and environment separation are undermined, and any backend authorization based on this key is bypassable.  
**Recommendation:** Remove hardcoded fallbacks, fail fast on missing server configuration, and keep privileged backend credentials exclusively in server-only code.

#### `lib/supabase/middleware.ts:33-47`

**Severity:** High  
**Explanation:** Middleware protects only paths beginning with `/dashboard`. `/wallets`, `/transactions`, `/cicilan`, and `/profile` all use the authenticated `(app)` shell but are not covered.  
**Why it matters:** Authentication policy is inconsistent and relies on page-level/client behavior for most sensitive routes.  
**Recommendation:** Protect the entire `(app)` URL surface with an explicit allowlist of public routes, or enforce authenticated user retrieval in the `(app)` server layout.

#### `app/(app)/dashboard/page.tsx:129` and `app/(app)/wallets/components/WalletSummaryCard.tsx:24-34`

**Severity:** High  
**Explanation:** The dashboard hardcodes `+4.2% vs last month`; the wallet summary fabricates previous net worth as `netWorth * 0.958` and manufactures an upward sparkline.  
**Why it matters:** A financial product presents invented performance as real account history.  
**Recommendation:** Use authoritative historical snapshots or render an explicit unavailable state.

#### `app/(app)/cicilan/page.tsx:20-21`, `app/(app)/cicilan/components/HeroCard.tsx:26-32`, and `app/(app)/cicilan/components/OutstandingLiabilityCard.tsx:28-36`

**Severity:** High  
**Explanation:** The installment trend repeats the current total while claiming a comparison with last month, and liability composition assumes an unsupported 70/30 principal/interest split.  
**Why it matters:** Users are shown false debt trends and composition.  
**Recommendation:** Obtain historical and principal/interest data from the backend; omit claims that cannot be derived.

#### `app/(app)/dashboard/page.tsx:247-275`

**Severity:** High  
**Explanation:** Transfer transactions fall through conflicting binary branches: expense-style iconography but positive-income sign treatment.  
**Why it matters:** Cash movement is misclassified, undermining ledger comprehension.  
**Recommendation:** Render `INCOME`, `EXPENSE`, and `TRANSFER` exhaustively with neutral transfer direction/context.

#### `app/(app)/transactions/page.tsx:116`

**Severity:** High  
**Explanation:** The add-transaction modal has no code path that sets its open state to `true`.  
**Why it matters:** The main transaction-creation workflow is unreachable.  
**Recommendation:** Add an accessible “Add transaction” trigger or remove the unreachable modal until the flow is ready.

#### `app/(app)/transactions/components/EditTransactionModal.tsx:21-32`

**Severity:** High  
**Explanation:** Form state is initialized only on first mount and does not reset when `tx` changes. Transfers are also coerced to `EXPENSE`.  
**Why it matters:** Users can edit stale values or accidentally change transaction semantics.  
**Recommendation:** Reset/key the form by transaction ID and implement transfer-aware editing or explicitly disallow it.

#### `app/(app)/transactions/components/AddTransactionModal.tsx:148-154`, `:235-247`, and `:501-525`

**Severity:** High  
**Explanation:** The category selector is not included in the payload. The editable admin fee affects the preview but is not sent to the backend.  
**Why it matters:** User input is silently lost and the preview can disagree with the locked financial result.  
**Recommendation:** Define one typed command DTO that drives both preview and submission; remove controls the API cannot persist.

#### `app/(app)/wallets/components/CreateWalletModal.tsx:44-59` and `lib/constants/paylater-presets.ts:1-17`

**Severity:** High  
**Explanation:** Provider rates are duplicated/hardcoded despite the project rule that backend/wallet rates are authoritative. Several labels do not match lookup keys, and a failed lookup can retain the previous provider's values.  
**Why it matters:** New debt wallets can be created with stale or wrong financial terms.  
**Recommendation:** Use stable backend provider IDs through `usePaylaterRates()`, reset on misses, and delete the duplicate preset source.

#### `app/(app)/wallets/components/CreateWalletModal.tsx:172` and `EditWalletModal.tsx:62`

**Severity:** High  
**Explanation:** Debt outstanding can exceed credit limit.  
**Why it matters:** The UI permits an invalid core domain state.  
**Recommendation:** Enforce `abs(balance) <= creditLimit` in shared frontend validation and on the backend.

#### `app/(app)/wallets/components/CreateWalletModal.tsx:29` and `:185-187`

**Severity:** High  
**Explanation:** An asynchronous parent callback is typed as returning `void` and is not awaited, so the modal closes and clears data even when creation fails.  
**Why it matters:** Failure is presented as success and entered data is lost.  
**Recommendation:** Type and await `Promise<void>`; close/reset only after success.

#### `app/(app)/cicilan/components/InstallmentCard.tsx:137-160`

**Severity:** High  
**Explanation:** “View Details,” “Pay Off Now,” and “Cancel Installment” have no handlers, links, or disabled explanation.  
**Why it matters:** Consequential financial actions appear available but do nothing.  
**Recommendation:** Implement confirmed mutation/navigation workflows with pending/error states, or remove/disable them transparently.

#### `app/globals.css:37-40`

**Severity:** High  
**Explanation:** `--font-heading` and `--font-mono` both resolve to Inter although Hanken Grotesk and JetBrains Mono are loaded.  
**Why it matters:** The documented typography system, including tabular financial typography, is not actually applied.  
**Recommendation:** Map semantic variables to the loaded font variables and load every requested weight.

#### `app/(app)/profile/page.tsx:72-77`

**Severity:** High  
**Explanation:** The change-password form waits 900 ms and then shows success without calling Supabase or any backend.  
**Why it matters:** Users are falsely told that a security-sensitive action succeeded.  
**Recommendation:** Implement verified reauthentication and `supabase.auth.updateUser`, or remove/disable the form with honest copy.

#### `app/auth/reset-password/page.tsx:41-57`

**Severity:** High  
**Explanation:** The reset page treats any existing Supabase session as recovery-ready. The auth callback ignores its event, while `getSession()` also enables the form for an ordinary logged-in session.  
**Why it matters:** The recovery-only password-change surface is not actually gated on a `PASSWORD_RECOVERY` flow.  
**Recommendation:** Require the recovery event/verified PKCE recovery transition and do not promote an unrelated existing session to recovery-ready.

### Medium

#### `app/(app)/dashboard/page.tsx:26-27`, `app/(app)/wallets/page.tsx:104`, `app/(app)/transactions/page.tsx:29`, and `app/(app)/cicilan/page.tsx:12-13`

Queries routinely ignore one or more loading/error states and convert failures into zeros or empty arrays. This falsely communicates “no money/no records” instead of “data unavailable.” Consume each query's pending/error state and render retryable errors separately from legitimate empty states.

#### `app/(app)/wallets/page.tsx:196-206`

Debt status and progress-bar thresholds disagree with each other and the documented `<30`, `30-60`, `>60` rule. Centralize the calculation in a typed domain helper and reuse it.

#### `app/(app)/cicilan/page.tsx:26-39`

Aggregate remaining debt is not clamped per installment, and “nearest due” can choose the oldest overdue record while labelling it “Next Due Date.” Share a domain helper and represent overdue versus future dates explicitly.

#### `app/(app)/cicilan/components/InstallmentList.tsx:11-19`

The list silently drops all items after ten and supplies no empty state. Add pagination/load-more plus a genuine empty state.

#### `app/(app)/cicilan/components/InstallmentCard.tsx:147-160`

Terminal `SETTLED` and `CANCELLED` items can display “Cancel Installment.” Model status actions exhaustively.

#### `app/(app)/transactions/components/AddTransactionModal.tsx:196-247`

Ordinary transfers are not required to have distinct source and destination wallets before submission. Add client validation while retaining backend enforcement.

#### `app/(app)/transactions/page.tsx:103-108`

Pagination can remain beyond the last page after deletion/refetch. Clamp the current page when `totalPages` shrinks.

#### `app/(app)/transactions/page.tsx:28-43`

The Supabase browser client is created during render and its changing auth reference can repeat `getUser()` effects. Create it once or provide stable session context.

#### `src/features/wallets/hooks/useWallets.ts:54-58`

Wallet deletion always appends `force=true`; this collapses backend history safeguards into a UI assumption. Pass force only after a specific history-conflict response and explicit confirmation.

#### `lib/auth/sync-user.ts:18-33`

The sync helper ignores non-2xx responses because `fetch` only throws for transport failure. Login/signup can continue while backend provisioning silently failed. Check `response.ok`, log a sanitized failure, and give the application a recoverable provisioning state.

#### `app/actions/auth.ts:58-80`

Signup provisions the returned user and redirects to `/dashboard` without checking whether `authData.session` exists. With email confirmation enabled, Supabase may return a user but no authenticated session. Branch on the session: show a confirmation-pending state and provision only after the verified callback/session according to backend policy.

#### `app/auth/reset-password/page.tsx:92-98`

Post-reset `signOut()` errors are ignored before the UI claims a clean sign-in is required. Inspect the result and show a retry/error state if session invalidation fails.

#### `app/(app)/wallets/page.tsx:80`, `TransactionTable.tsx:115-119`, and custom modal files

Multiple clickable `<div>` elements and custom overlays lack keyboard semantics, dialog roles, focus trapping, initial/restored focus, inert backgrounds, and/or Escape behavior. Affected overlays include `WalletCard.tsx:234`, `TransactionDetailPanel.tsx:42`, `EditTransactionModal.tsx:57`, `DeleteTransactionModal.tsx:19`, and `AddTransactionModal.tsx:301`. Replace them with the existing Base UI dialog primitive and semantic buttons.

#### `components/WalletCard.tsx:138`, `TransactionTable.tsx:278-308`, and modal close buttons

Icon-only controls lack accessible names and sometimes expanded/controlled state. Add `aria-label`, `aria-expanded`, `aria-controls`, and consistent focus-visible styles.

#### `TransactionFilters.tsx:58-268`, `EditTransactionModal.tsx:99-159`, `AddTransactionModal.tsx:345-699`, `CreateWalletModal.tsx:220-223`, and `EditWalletModal.tsx:100-147`

Many captions are `<span>`/`<p>` or unassociated `<label>` elements. Associate labels and inputs; use `fieldset`/`legend`, radio-group, or `aria-labelledby` semantics for grouped choices.

#### `TransactionBreakdownChart.tsx:74-95` and progress/sparkline components

Charts and progress indicators lack accessible summaries/roles. Add textual value summaries; mark redundant graphics decorative; expose `role="progressbar"` with value metadata where meaningful.

#### `components/ui/sidebar.tsx:58`

Pinned sidebar state never persists despite the documented requirement. Store a versioned preference and handle hydration without layout shift.

#### `components/ui/dock-morph.tsx:122` and `:204`

Each dock item registers the same media-query listener, and a global motion layout ID can collide across docks. Evaluate capability once and scope the layout group/ID.

#### `app/(app)/wallets/components/FullWidthSparkline.tsx:30` and `app/(app)/cicilan/components/Sparkline.tsx:14-81`

SVG gradient IDs are global constants and collide across instances. The one-point installment sparkline also maps IDR values directly to pixel coordinates. Use `useId()` and render one-point data as a centered/normalized flat state.

#### `app/layout.tsx:51`

React Query wraps the static landing and auth surfaces, adding unnecessary provider hydration/JavaScript. Place it in the authenticated route-group layout.

#### `app/(app)/layout.tsx:6-10` and `app/layout.tsx:47`

The shell uses `h-screen` instead of dynamic viewport units, lacks a skip link/main target, and declares English despite substantial Indonesian content. Use `dvh`, add skip navigation, and set/annotate language correctly.

#### `components/ui/separator.tsx:17`

`bg-outline` is outside the declared token set and may not resolve. Use `bg-border`.

#### `package.json:8`

The lint script is `next lint`, which Next.js 16 interprets as a project path and fails with “Invalid project directory .../lint.” Use the ESLint CLI with the flat config, and add a CI command that runs lint and typecheck.

### Low

- `src/types/transaction.ts:19-32` widens related wallet/category `type` fields to `string`; use domain unions or shared response types.
- `src/features/transactions/hooks/useTransactions.ts:67-95` derives create/update payloads from the broad response model, permitting relation/read-only fields. Define explicit command DTOs.
- `app/(app)/cicilan/components/InstallmentCard.tsx:5-18` duplicates the installment contract and widens wallet types; import one canonical type.
- `components/WalletCard.tsx:42-60` exposes an unused `variant` prop; implement or remove it.
- `ActiveInstallmentsWidget.tsx:3-8` requires but ignores `remaining`; remove or render it.
- `app/(app)/cicilan/components/StatCard.tsx:3-20` accepts arbitrary color strings; use a semantic tone union.
- `app/(app)/cicilan/components/JatuhTempoCard.tsx:3-39` encodes missing dates as an em-dash string sentinel and renders a misleading arrow affordance; use `Date | null` and one clear display.
- `TransactionDetailPanel.tsx:125-131` always labels transactions “Cleared” without a status field. Remove or use authoritative state.
- `TransactionBreakdownChart.tsx:107-113` omits a positive `+` sign; `constants.ts:32-38` colors transfers as income; make sign/tone rules exhaustive.
- `constants.ts:58-76` recreates date formatters and duplicates currency formatting; hoist formatters and compose the shared `formatCurrency`.
- `CreateWalletModal.tsx:115-119` recreates `Intl.NumberFormat` on keystrokes; hoist it.
- `WalletSparkline.tsx:3` and chart consumers statically bundle Recharts into client routes. Dynamically load nonessential charts and verify bundle impact.
- `QueryProvider.tsx:14-15` globally keeps financial data fresh for five minutes and disables focus refetch. Choose freshness by query criticality.
- `components/ui/sidebar.tsx:63` recreates context values; memoize if parent render frequency grows.
- `components/ui/dock-morph.tsx`, `tooltip.tsx`, and several charts need explicit per-component reduced-motion/decorative behavior in addition to the global fallback.
- `app/layout.tsx:23` loads only JetBrains Mono 500 while components request heavier weights.
- `app/layout.tsx:35` gives every route the same title; add a template and route metadata.
- `tsconfig.json:5-7` enables unchecked JavaScript and skips library checks. Prefer `allowJs: false`; consider a stricter CI typecheck.
- `components/ui/tooltip.tsx:3` has an unused React import.

---

## Security Review

The primary security finding is the API identity design in `lib/api.ts`: the browser asserts identity via editable headers and does not provide a backend-verifiable access token. The shared/public API key cannot repair that boundary. This must be corrected before production or multi-user testing with sensitive data.

Authentication positives:

- `lib/supabase/middleware.ts` uses `getUser()` rather than trusting local session payloads and propagates refreshed SSR cookies.
- `lib/supabase/server.ts` and `client.ts` correctly separate server/browser clients.
- Auth is cookie-based; no tokens are written to `localStorage` or `sessionStorage`.
- `logout()` calls Supabase sign-out, revalidates the layout, and redirects.
- No `dangerouslySetInnerHTML`, `eval`, `new Function`, or user-controlled script sink was found.

Security concerns:

- `lib/supabase/middleware.ts:38` protects only `/dashboard`, not the complete app surface.
- `app/actions/auth.ts:14-21` constructs OAuth origins from request headers when `Origin` is absent. Production deployment should use an allowlisted canonical application URL rather than accepting arbitrary forwarded host/protocol input.
- `app/auth/callback/route.ts:13-37` should constrain `next` to a normalized internal path even though current string concatenation keeps ordinary values under `url.origin`; explicit validation prevents future redirect regressions.
- `lib/auth/sync-user.ts` continues auth after unsuccessful backend provisioning and does not inspect HTTP status.
- Environment files contain public Supabase/site values as expected, but different public anon keys exist across `.env` variants; document precedence and keep real deployment configuration out of committed local files.
- No CSP or security headers are configured in `next.config.ts`. Add a deployment-appropriate CSP, `frame-ancestors`, `Referrer-Policy`, and related headers after enumerating required Supabase/font/API origins.
- No client retry queue exists for expired sessions/API authorization, although Supabase middleware refresh is correctly present. Prefer token verification and one bounded auth retry over generic mutation retries.

---

## Performance Review

Strengths:

- Derived transaction filtering/statistics use `useMemo`.
- Query keys are stable and mutation invalidation is centralized.
- QueryClient is lazily initialized once.
- Static landing content remains a Server Component.
- Lists generally use stable IDs.
- Event/media-query listeners seen in reviewed code are cleaned up.

Concerns:

- Root-level QueryProvider hydrates routes that do not need React Query (`app/layout.tsx:51`).
- Recharts is used in client components without route/component-level dynamic loading.
- Multiple chart SVGs animate by default and some lack reduced-motion handling.
- Dock items duplicate media-query subscriptions (`dock-morph.tsx:122`).
- Repeated formatter construction occurs in `constants.ts` and `CreateWalletModal.tsx`.
- A global five-minute stale window plus disabled focus refetch can show stale finance data.
- The largest client components—`AddTransactionModal.tsx` (~763 lines) and `CreateWalletModal.tsx` (~572 lines)—bundle many conditional workflows into one island.
- There are no measured bundle reports, performance tests, or route budgets. Memoization should follow profiling; the material opportunities are provider placement, chart loading, subscription deduplication, and component splitting.

---

## React Best Practices

Correct patterns include server layouts, local state for local UI, React Query for remote state, lazy QueryClient construction, cleanup of global listeners, stable list keys, and derived state computed rather than synchronized through effects in the transaction page.

Violations and risks:

- Stale prop-derived state in `EditTransactionModal.tsx`.
- Repeated Supabase client creation/effect dependency in `transactions/page.tsx`.
- Context value recreation in `sidebar.tsx`.
- Monolithic form components combine state machine, domain math, validation, presentation, and transport DTO assembly.
- Numerous custom dialogs bypass an already-available accessible primitive.
- Several apparently interactive elements are nonsemantic `<div>` elements.
- Silent promise/error handling closes UI optimistically without verified success in wallet creation.

There is no evidence of invalid hook calls or conditional hook execution.

---

## TypeScript Review

TypeScript strict mode is enabled, and `npx tsc --noEmit --incremental false` completed with no errors. Domain unions for wallet and transaction types are a good foundation.

Weaknesses:

- Response models are reused as mutation input models.
- Installment contracts are duplicated and widened.
- `status?: string` in `useInstallments()` should be the installment-status union.
- Related transaction types use `string` instead of wallet/category unions.
- Async callback typing in `CreateWalletModal` incorrectly promises `void`.
- UI state is sometimes encoded with string sentinels or arbitrary color strings rather than discriminated unions.
- `allowJs` without `checkJs` weakens the otherwise strict source graph.

Recommended approach: define schema-aligned response DTOs and separate explicit `Create*Command`/`Update*Command` types in each feature, then derive form models independently.

---

## API Layer Review

Request flow is: client hook → shared Axios instance → request interceptor → Supabase browser `getSession()` → client-supplied identity headers → backend. This is simple but insecure because the backend identity claim is not cryptographically bound.

Good aspects:

- One Axios instance centralizes base URL and headers.
- React Query owns request deduplication by query key.
- Mutations invalidate relevant wallet/transaction aggregates.
- Error objects are typed as `Error` and most mutation promises are awaited.

Missing/weak aspects:

- No verified bearer token, centralized response error normalization, authorization retry, cancellation policy, or request timeout.
- Request interceptor creates a Supabase client and retrieves session state on every request.
- UI code handles Axios failures inconsistently (visible error, console-only, or silent empty state).
- Mutation commands are too broad and previews do not always use the submitted DTO.
- Generic retries should remain disabled for financial mutations; idempotent GET retry, timeout, and cancellation can be added deliberately.

---

## State Management Review

TanStack Query is the correct choice for this application's server state. Redux/Zustand would add little value today. Query keys are understandable, and invalidation prefixes intentionally refresh summaries.

Improvements:

- Add a stable auth/session provider or server-provided user boundary rather than independent page-level checks.
- Create shared query-key factories to avoid future string drift.
- Define query-specific stale/refetch policies, especially for dashboard balances.
- Use optimistic updates only after commands and rollback semantics are well defined; current invalidation-first behavior is safer.
- Keep ephemeral modal/filter state local.

---

## Routing Review

The public landing, login, OAuth callback, reset-password route, and `(app)` route group are conceptually clean. Next.js `Link` is used consistently, and the authenticated shell is shared.

Defects:

- Middleware guards only `/dashboard`.
- The `(app)` layout itself performs no server-side auth assertion.
- Client-side profile redirect is too late to be the primary guard.
- Root metadata does not distinguish routes.
- There is no route-level error boundary (`error.tsx`) or loading boundary (`loading.tsx`) for authenticated sections.
- Heavy feature pages are already route-split by App Router, but large optional charts/modals are not component-split.

---

## UI Consistency Review

The semantic palette, radii, Base UI primitives, sidebar behavior, responsive app shell, and shared `formatCurrency` establish a useful design-system base. The active sidebar correctly uses text emphasis and `aria-current`, finance positives/negatives often use semantic colors, and global reduced-motion handling exists.

Inconsistencies:

- Semantic font variables point to the wrong fonts.
- Financial values repeatedly use heading/body fonts instead of mono.
- Raw hex/RGBA, `border-white/*`, and non-system tokens occur across pages/charts/primitives.
- Transfer colors and signs are inconsistent.
- Custom dialogs duplicate and undercut the accessible Dialog primitive.
- Button/select groups often communicate selection by color only.
- Empty/loading/error states vary widely and sometimes misstate failures as zero balances.

---

## Code Smells

- Large components: `AddTransactionModal.tsx`, `CreateWalletModal.tsx`, dashboard and transaction pages.
- Duplicated domain logic: installment remaining/due dates, financial signs/colors, provider presets, currency/date formatting.
- Duplicated types: installment interfaces and form/response shapes.
- Placeholder behavior presented as complete: profile password update and installment actions.
- Fabricated display data: dashboard/wallet/installment trends and liability composition.
- Console-only mutation errors in dashboard, wallet, and transaction flows.
- Dead/stale API elements: unused WalletCard `variant`, ignored `remaining`, unused tooltip import, unreachable add-modal opener.
- `shadcn` appears to be tooling but is listed in runtime dependencies; move it to development dependencies if it is not imported at runtime.
- Generated `tsconfig.tsbuildinfo` is tracked/dirty and should normally be ignored.

---

## Technical Debt

1. **P0 — Identity boundary:** Replace client-asserted identity with backend-verified Supabase JWT authentication.
2. **P0 — Financial truthfulness:** Remove every fabricated trend/composition/status and preview/submission mismatch.
3. **P0 — Auth coverage:** Guard the entire authenticated route group server-side.
4. **P1 — Transaction/wallet command integrity:** Introduce exact DTOs, shared validation, and awaited success semantics.
5. **P1 — Accessibility:** Replace custom overlays and clickable divs with primitives/semantic controls; associate every label.
6. **P1 — Error boundaries/states:** Separate pending, error, empty, and settled data globally.
7. **P2 — Domain consolidation:** Centralize debt thresholds, installment dates/remaining values, provider IDs, and display semantics.
8. **P2 — Component decomposition:** Split large modal state machines into typed hooks, domain calculators, and presentational sections.
9. **P2 — Design-token enforcement:** Correct fonts and eliminate raw/default palette values.
10. **P3 — Tooling/performance:** Repair lint, add CI, measure bundles, and lazy-load charts.

---

## Recommended Refactoring Order

### Phase 1

- Redesign backend authentication around verified Supabase bearer tokens.
- Protect all `(app)` routes.
- Remove hardcoded/shared API-secret fallbacks.
- Delete fabricated finance data and label unavailable metrics honestly.
- Disable placeholder password/installment actions.

### Phase 2

- Define canonical feature contracts and exact create/update commands.
- Make form preview use the exact submitted command.
- Centralize financial constraints, debt thresholds, provider matching, and installment calendar logic.
- Add consistent query error/empty/loading components and route error boundaries.

### Phase 3

- Migrate every custom modal to the shared dialog primitive.
- Repair labels, keyboard targets, chart summaries, focus management, and skip navigation.
- Correct semantic fonts and token violations.
- Split the two large form components into workflow hooks and focused sections.

### Phase 4

- Move QueryProvider deeper, lazy-load charts, deduplicate listeners, and profile bundles/renders.
- Repair lint and add CI checks for ESLint, TypeScript, tests, accessibility, and token rules.
- Add integration tests for auth boundaries and financial commands.

---

## Architecture Improvements

Recommended target:

```text
app/
  (public)/
  (auth)/
  (app)/
    layout.tsx          # server auth gate + app shell
    error.tsx
    loading.tsx
features/
  auth/
    server/             # verified session helpers
    components/
  wallets/
    api/                # query keys, requests, command/response DTOs
    domain/             # constraints, debt calculations
    components/
  transactions/
    api/
    domain/             # signs, transfer rules, form commands
    components/
  installments/
    api/
    domain/             # calendar-safe due/remaining logic
    components/
components/
  ui/                   # accessible primitives only
lib/
  api/                  # authenticated transport + normalized errors
```

The backend must derive `userId` from a verified JWT subject. Feature API modules should expose narrow functions and query-key factories. Domain helpers should be pure and unit tested. Pages should compose queries and sections; they should not implement financial formulas or transport DTOs inline.

---

## Quick Wins

- Fix `package.json` lint script to call ESLint.
- Correct `--font-heading` and `--font-mono` mappings.
- Remove hardcoded percentage/trend/liability claims.
- Add one server auth check to `(app)/layout.tsx` and broaden middleware coverage.
- Add the missing Add Transaction trigger.
- Reset edit form state on `tx.id` changes.
- Remove/disable no-op installment and password controls.
- Check `response.ok` in `sync-user.ts`.
- Add error handling to every React Query page.
- Replace custom overlays with the existing Dialog primitive.
- Hoist `Intl` formatters and reuse `formatCurrency`.
- Replace `bg-outline`, `border-white/*`, and raw chart colors with semantic tokens.

---

## Final Verdict

Overall code quality score:

- Architecture: **6/10**
- Maintainability: **5/10**
- Security: **3/10**
- Performance: **7/10**
- Scalability: **5/10**
- Developer Experience: **5/10**
- Accessibility: **4/10**
- Financial correctness: **3/10**
- Overall: **5/10**

The project has a credible foundation and is small enough to correct without a rewrite. Implementation should not continue on new features until the identity boundary, authenticated routing, fabricated financial data, and command/preview integrity issues are fixed. After those P0 items, the existing feature organization and UI primitives can support a clean refactor toward production readiness.
