# Pocket Mint — Frontend

Next.js (App Router) frontend for Pocket Mint, a personal finance tracker. Talks to the [backend API](../pocket-mint-be) via JWT auth (Supabase), deploys to Vercel.

## Stack

- **Framework**: Next.js 16 (App Router), React 19, TypeScript
- **Data**: TanStack Query
- **UI**: Tailwind CSS, Base UI
- **i18n**: next-intl (Bahasa Indonesia is the primary/only shipped locale for user-facing copy)
- **Auth**: Supabase (`@supabase/ssr`) — sends `Authorization: Bearer <access token>` to the backend
- **Hosting**: Vercel

## Project structure

```text
app/
├── (app)/          Authenticated routes: dashboard, wallets, transactions,
│                    analytics, tagihan (bills), target-tabungan (saving goals),
│                    notifications, cicilan (installments), profile
├── auth/            Login/auth callback routes
├── changelog/        Public changelog page (reads src/lib/changelog.ts)
└── login/

src/
├── features/         One folder per domain (bills, wallets, transactions,
│                       recurring, savingGoals, notifications, categories,
│                       dashboard, installments) — each with its hooks/components
├── lib/               Shared utilities, changelog data
└── types/             Shared TypeScript types
```

## Local setup

```bash
npm install
cp .env.example .env.local   # fill in real values, see below
npm run dev                   # binds http://localhost:4000
```

## Environment variables

See [`.env.example`](.env.example) for the full list. All frontend env vars are `NEXT_PUBLIC_*` (browser-exposed) — there is no backend API key, auth is JWT-only via Supabase:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client config
- `NEXT_PUBLIC_API_URL` — backend base URL
- `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` — captcha on auth forms
- `E2E_EMAIL` / `E2E_PASSWORD` — test account for local Playwright screenshot script

## Testing

```bash
npm test         # vitest run
npm run lint       # eslint .
npx tsc --noEmit    # typecheck (no dedicated script)
```

## Build

```bash
npm run build     # next build
npm start          # build + start on port 4000
```

## Deployment

Deploys to Vercel. Release process (versioning, changelog, checklist) lives under [`docs/releases/`](docs/releases/) — start with [`docs/releases/release-checklist.md`](docs/releases/release-checklist.md).

## Storybook

Component workshop for shared UI (`components/ui/`, `components/layout/`) — develop and inspect components in isolation with real app styling, no backend required. See [`docs/storybook.md`](docs/storybook.md).

```bash
npm run storybook          # http://localhost:6006
npm run build-storybook    # static build to storybook-static/
```

## Related docs

- [`docs/storybook.md`](docs/storybook.md) — Storybook usage, story convention, provider/mocking policy
- [`docs/releases/release-status.md`](docs/releases/release-status.md) — current feature/release status
- [`docs/releases/known-issues.md`](docs/releases/known-issues.md) — tracked issues
- [`docs/qa/`](docs/qa/) — manual QA evidence
- [`src/lib/changelog.ts`](src/lib/changelog.ts) — public changelog data (user-facing, Bahasa Indonesia)
