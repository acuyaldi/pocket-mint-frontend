# Frontend deployment reference

Quick reference for deploying `pocket-mint-fe` (Next.js). Companion to the
backend's `deployment-runbook.md` (repo `pocket-mint-be`). No secret values
appear here — fill placeholders from the secret manager at deploy time.

## Build & runtime

| | |
| --- | --- |
| **Node version** | `22.x` (pinned in `package.json` `engines`; matches `.github/workflows/ci.yml`) |
| **Build command** | `npm run build` (= `next build`) |
| **Start command** | Platform-managed (Vercel serves the build output directly; there is no long-running `next start` process to invoke manually) |

Deployment is Vercel Git integration: Preview deployments track `dev`,
Production tracks `main`. There is no separate deploy script — merging to
the branch is the deploy trigger.

## Production environment variables

All frontend env vars are `NEXT_PUBLIC_*` (bundled into the client — never
put a server-only secret or service-role key here). Source of truth for
names/shape is `.env.example`.

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | yes | **Production** Supabase project URL — never the Dev project's. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | Production project's anon/publishable key. Public value, not the service-role key. |
| `NEXT_PUBLIC_API_URL` | yes | Production Railway backend origin + `/api/v1`. Must not point at the staging/preview backend. |
| `NEXT_PUBLIC_HCAPTCHA_SITE_KEY` | yes | Production hCaptcha site key. |

Cross-environment checks before promoting to production (see backend
`deployment-operations.skill.md` for the matching backend-side checks):

- `NEXT_PUBLIC_API_URL` resolves to the **production** Railway service, not
  staging.
- The production backend's `CORS_ALLOWED_ORIGINS` includes this app's exact
  production origin.
- Supabase auth redirect URLs include this app's production callback/reset
  routes.

## Related documents

- `pocket-mint-be/docs/deployment-runbook.md` — backend build/start/health/env vars.
- `docs/releases/release-checklist.md` — full pre/post-release checklist.
- `docs/releases/README.md` §8–9 — deployment verification and rollback steps.
