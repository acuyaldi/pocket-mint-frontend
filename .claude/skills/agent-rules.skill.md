# Agent Rules — Pocket Mint Frontend
> Load this first. These rules override default behavior.

This repository is a standalone Next.js frontend (`pocket-mint-fe`). It has
no backend code, no Prisma schema, and no `apps/` monorepo layout — the
backend is a separate repository the frontend talks to over HTTP through
`lib/api.ts`. Nothing here should assume backend source is present or
editable from this repo.

---

# Skill Load Order

Before any task, read in this order:

1. `agent-rules.skill.md` ← this file
2. `git-workflow.skill.md` ← branching, PR, and release process
3. `frontend-architecture.skill.md` ← Next.js, auth, API, state, Storybook, testing
4. `ui-system.skill.md` (any component/page/style work)
5. `financial-logic.skill.md` (any wallet/transaction/installment work)
6. `design.md` (product design intent, when a UI decision needs product rationale)

Only load additional skills when the current task actually requires them.

---

# General Behavior

## Focus

- Work on ONE task at a time.
- Finish the current task completely before starting another.
- Never perform unrelated refactors.
- Never "improve" code outside the requested scope.

---

# Planning Behavior

The implementation prompt provided by the user is considered the approved
specification unless explicitly stated otherwise.

Therefore:

- Do NOT create temporary planning Markdown files.
- Do NOT create design documents.
- Do NOT create implementation-plan documents.
- Do NOT stop to request design approval.
- Do NOT pause after repository inspection.

Perform repository inspection internally, then proceed directly to
implementation.

Only stop when:

- destructive repository operations require confirmation
- requirements are genuinely ambiguous
- required credentials or secrets are unavailable

Architecture decisions that become permanent belong only in official project
documentation (this skill system, `AGENTS.md`, or docs the user names).

---

# Repository Inspection

Before modifying code:

- Inspect the existing implementation first.
- Reuse existing components, hooks, and utilities before writing new ones.
- Search first, implement second — a few files over is the most common
  place to find something already solving the problem.

If a feature area already has a page, hook, or component:

- extend or fix it
- never build a competing/parallel version next to it

---

# Never Introduce Duplicate Layers

- Never introduce a second API client alongside `lib/api.ts`. See
  `frontend-architecture.skill.md` → API layer.
- Never introduce a second async-state system alongside TanStack Query
  (no Redux, no Zustand, no ad-hoc global stores). See
  `frontend-architecture.skill.md` → State management.
- Never write a new currency formatter, auth session reader, or API error
  type when `lib/utils.ts`, `lib/auth/`, and `lib/api-errors.ts` already
  provide one.

---

# File Safety

Never modify:

- `app/globals.css`
- root `layout.tsx`
- `proxy.ts`

unless the task explicitly requires it.

Never delete unrelated files.

Never touch local configuration files such as:

```
.claude/settings.local.json
```

Preserve tracked generated artifacts (e.g. `next-env.d.ts`) as committed —
do not hand-edit or revert them outside of the tooling that generates them.

---

# Frontend Conventions

- Use semantic design tokens only — see `ui-system.skill.md`. Never
  hardcode colors or reintroduce Tailwind's default palette utilities.
- Financial numbers use `formatCurrency` from `lib/utils.ts` and tabular
  figures — see `financial-logic.skill.md`.
- Every data-fetching component defines loading and error states.
- Never use mock or hardcoded data when a real API/hook already exists.

---

# Git Workflow

Full process lives in `git-workflow.skill.md` — this file only points to it.

- Always create a task branch from `dev`.
- Never commit directly to `dev` or `main`.
- Never open a PR targeting `main` unless explicitly requested as a release.

---

# Testing and Completion

A task is DONE only when it satisfies the actual CI gate (`.github/workflows/ci.yml`),
not an assumed one:

- `npx tsc --noEmit`
- `npm run lint`
- `npx vitest run --project=unit`
- `npm run build`
- `npm run build-storybook` and `npx vitest run --project=storybook` when the
  change touches any component with stories, or shared UI primitives

Run the full CI-equivalent set before declaring a task complete when the
change touches shared components, providers, routing, or auth. Narrower
changes may run only the directly relevant tests, but must not skip
typecheck/lint.

---

# Completion Criteria

A task is DONE only when:

- No TypeScript errors
- Lint passes
- Relevant tests pass (Storybook + unit, when applicable)
- Build passes
- Existing behavior has no regressions
- Repository is clean (no stray files, no unrelated diffs)

---

# Final Report

Do not stop after implementation. Complete the workflow:

Inspect → Implement → Test → Validate → Final Report

The final report must include:

- implementation summary
- files created / modified
- tests added or run
- validation results
- remaining limitations
- git status

Do not stop for intermediate approval.

---

# Common Mistakes

Do NOT:

- create temporary design or plan documents
- stop after planning
- duplicate existing components, hooks, or the API/state layers
- bypass authentication or route protection
- commit generated junk
- push without instruction
- open a PR without instruction
- modify unrelated files
- refactor outside scope
