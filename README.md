# Pocket Mint — Frontend

[![Frontend CI](https://github.com/acuyaldi/pocket-mint-frontend/actions/workflows/ci.yml/badge.svg?branch=dev)](https://github.com/acuyaldi/pocket-mint-frontend/actions/workflows/ci.yml)

Web app for Pocket Mint, a personal finance tracker. It includes an assistant that turns a typed message into a transaction draft that you review, correct and explicitly confirm.

Next.js 16 (App Router) + React 19 + TypeScript. Backend and architecture: [pocket-mint-backend](https://github.com/acuyaldi/pocket-mint-backend).

## Status

- Personal project, **beta**. `main` holds 0.6.0. `dev` holds the next release (0.7.0), which has not been cut.
- **No production deployment is running right now** (see the backend's [CONTINUE notes](https://github.com/acuyaldi/pocket-mint-backend/blob/dev/docs/CONTINUE.md)).
- Last verified on `dev` (2026-10-21): typecheck, lint (0 errors), 834/834 unit tests and build all pass.

## Screenshots

_To be added._ Planned images (in `docs/screenshots/`):

1. `assistant-draft.png`: Assistant with a draft card (expense, wallet, category, date)
2. `assistant-clarification.png`: wallet clarification card (two similar wallet names)
3. `assistant-transfer.png`: transfer draft showing the source and destination wallets
4. `assistant-recovery.png`: recovery state after refresh (expired or archived draft banner)
5. `wallet-aliases.png`: wallet alias manager
6. `dashboard.png`: dashboard overview
7. `mobile-assistant.png`: Assistant on a phone-width viewport

## Features

**Assistant** (`/assistant`, [src/features/assistant](src/features/assistant))

- **Draft card:** shows a preview of the parsed transaction. Amount, wallet, category, description and date can be edited before confirming. Confirm and Cancel are explicit actions.
- **Clarification cards:** pick-one options when a wallet, category or merchant is ambiguous. For transfers, the question says whether it is asking for the source or the destination wallet.
- **Transfer drafts:** preview both wallets before confirming.
- **Recovery state:** after a refresh, the active draft or clarification comes back. If it has expired, failed, been cancelled or belongs to an archived conversation, a terminal banner is shown instead. These states are driven by the backend's structured `code`/`detail` fields, not by parsing message text.
- **Safe retries:** the confirm `Idempotency-Key` is created once per draft, reused on every retry (including after a `503`), and only cleared on success ([utils/idempotency.ts](src/features/assistant/utils/idempotency.ts)).
- **Conversation history:** archive, restore and delete. Conversations started in Telegram get a badge, and replies show their delivery status.

**Elsewhere:** wallets with alias management, Telegram account linking (Profile), transactions, budgets (anggaran), bills (tagihan), installments (cicilan), saving goals (target tabungan), notifications, analytics with CSV export, and a public changelog.

## Tech stack

Next.js 16 · React 19 · TypeScript · TanStack Query · Tailwind CSS 4 · Base UI / shadcn · next-intl (Indonesian default, English available) · Supabase Auth (`@supabase/ssr`, Bearer JWT to the backend) · Vitest · Storybook 10 (+ a11y addon) · Playwright.

## Getting started

```bash
npm ci
cp .env.example .env.local    # fill in values; names below
npm run dev                   # http://localhost:4000
```

The app expects the backend running and reachable at `NEXT_PUBLIC_API_URL`.

**Environment variables** (names only, see [.env.example](.env.example)):

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase client
- `NEXT_PUBLIC_API_URL`: backend base URL
- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`: listed in `.env.example` and CI. The app code does not read it currently.
- `E2E_EMAIL`, `E2E_PASSWORD`, optional `E2E_BASE_URL`: test account for Playwright and the screenshot script

All `NEXT_PUBLIC_*` values are bundled into the browser. Never put a server secret in one.

## Tests

```bash
npx tsc --noEmit                      # typecheck
npm run lint                          # eslint
npm test                              # vitest unit project
npx vitest run --project=storybook    # story interaction + a11y tests (needs: npx playwright install chromium)
npm run test:e2e                      # Playwright against a running app + backend; needs E2E_EMAIL/E2E_PASSWORD
```

CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs lint, typecheck, unit tests, the production build, the Storybook build with a11y/interaction tests, and a scan of the production bundle.

## Storybook

```bash
npm run storybook          # http://localhost:6006
npm run build-storybook    # static build to storybook-static/
```

Stories sit next to their components (shared UI in `components/ui`, plus every Assistant component). They run without a backend. Conventions: [docs/storybook.md](docs/storybook.md).

## Structure

```text
app/                 Next.js routes; authenticated pages under app/(app)/
components/ui/       Shared primitives (button, card, modal, form field, …) with stories
components/layout/   App shell, sidebar, bottom nav, top bar
src/features/<x>/    One folder per domain: api/, hooks/, components/, utils/, types/
lib/                 API client, API error helpers, Supabase/auth helpers
src/lib/changelog.ts Public changelog data
messages/            next-intl copy (id.json, en.json)
e2e/                 Playwright specs (Assistant draft, transfer, alias, history, mobile)
tests/               Vitest unit tests
```

## Design system

Semantic color, type and radius tokens live in [app/globals.css](app/globals.css), with Inter throughout and tabular figures for money. The design rules (calm, information-first, color never the only status cue, Mint/Coral/Amber reserved for meaning) are in [.claude/skills/design.md](.claude/skills/design.md).

## Known limitations

- A draft correction does not survive a reload while that draft is being confirmed (known issue carried over from 0.6.0).
- Resending a message only works when the original message is on the loaded history page.
- After a conversation is archived and restored, a Telegram Confirm button cannot be pressed again, so the user has to confirm on the web.
- The Assistant menu is always visible. There is no per-user flag; the backend controls availability globally.
- One lint warning remains: an unused `DraftActionBar` import in `AssistantConversation.tsx`.

## More docs

- [docs/storybook.md](docs/storybook.md): Storybook conventions
- [docs/authentication.md](docs/authentication.md): Supabase auth flow
- [docs/deployment.md](docs/deployment.md): Vercel deployment reference (written for the earlier Railway backend)
- [docs/releases/](docs/releases/): release workflow, checklist, known issues (Indonesian; status pages date from the 0.3.0–0.4.0 period)
- [src/lib/changelog.ts](src/lib/changelog.ts): user-facing changelog (Indonesian)
