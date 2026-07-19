# Phase 8 — Saving Goals (Target Tabungan) Review Summary

Generated: 2026-07-20. Documentation-only pass — no application code, database schema, or git state was changed by this review. Evidence is under `playwright/reviews/phase-8-saving-goals/`.

## Migration Status — Expected, Not a Blocker

**The `saving_goals` table does not exist in the shared Supabase Dev database.** This is expected at this stage and does not block committing this feature branch.

Every `GET/POST /api/v1/saving-goals` call against the shared Dev environment returns `500 INTERNAL_ERROR`:

```
Invalid `db.savingGoal.findMany()` invocation ... The table `public.saving_goals` does not exist in the current database.
```

Reason: `pocket-mint-be/prisma/migrations/20260719181136_add_saving_goals/` is part of this uncommitted feature branch and has intentionally **not** been applied to the shared Supabase Dev database. Per `pocket-mint-be/.claude/skills/prisma-database.skill.md`, migrations must never be run against the `.env` `DATABASE_URL` (it points at Supabase) — shared dev/production migrations remain controlled manual operations, applied as a deliberate rollout step, not as a prerequisite for committing or opening a PR. No shared database should be modified merely to capture screenshots.

**Migration validation already completed** via the sanctioned disposable-Postgres workflow:

- The full migration chain (including this Phase 8 migration) replayed successfully against a disposable local Postgres instance.
- `prisma migrate deploy` reported no pending migrations afterward.
- `prisma migrate diff` reported no schema difference.

This confirms the migration itself is correct and additive. What remains is the separate, later step of rolling it out to the shared Supabase Dev database — not a defect in this branch.

**Practical effect on this evidence package:** because the shared Dev database has not received the migration, the saving-goals list page renders its error state in these screenshots, not a populated list, and the create-goal modal's submit path hits the same missing table. Edit, Update Progress, and Archive modals could not be captured this way — they only open from an existing goal card, and no goal can be created against the unmigrated shared database. These are data-backed states that require the post-migration environment, not implementation gaps.

## Visual Review

- **Dashboard** (`desktop/dashboard.png`, `mobile/dashboard.png`) — renders correctly with real wallet/transaction data. Net worth, assets, debt, quick actions, wallet cards, and recent activity all present per the fixed reading order. No issues.
- **Saving Goals page** (`desktop/saving-goals-page.png`, `mobile/saving-goals-page.png`) — correctly documents the current shared-environment error state (`"Gagal memuat target tabungan. Coba lagi."`), reflecting the not-yet-migrated shared Dev database rather than the intended populated view. Page header, "Tambah Target" button, and layout shell all render correctly; the error card uses the correct coral/error styling from the design system.
- **Saving Goal Detail** — no standalone detail route exists in the implementation (confirmed: only `app/(app)/target-tabungan/page.tsx` + `components/`, no `[id]` route). Goal details/actions are inline on each card in the list. `desktop/saving-goal-detail.png` is a duplicate of the list capture for traceability; it does not represent a distinct screen.
- **Navigation** — Sidebar: "Target Tabungan" is placed correctly between "Analitik" and "Akun", with a `PiggyBank` icon, consistent with the other five nav items. Bottom nav (mobile): 7 icons total (Dashboard, Dompet, Transaksi, Cicilan, Analitik, Target Tabungan, Akun) fit in one row without visible crowding or clipping in the 390px capture; icons are evenly aligned. Active-state highlight (light-blue background) is correctly applied to "Target Tabungan" on both breakpoints.
- **Modals** — Only `modals/create-saving-goal.png` could be captured (dialog opens and renders correctly: title, description, 5 labeled fields, Rp-prefixed numeric inputs, cancel/submit footer buttons — all consistent with the shadcn Dialog pattern used elsewhere). `edit-saving-goal.png`, `update-progress.png`, and `archive-confirmation.png` are **not present** — they can only be opened from an existing goal card, which requires the shared Dev database to have received the migration; this is a pending post-migration verification item, not a UI defect. No claim is made that the feature has passed full browser E2E verification.

## UX Review

- **Progress bar** — cannot be verified visually (no goal ever renders), but the component code (`SavingGoalCard` in `page.tsx`) computes width from `goal.progressPercentage` and is present for non-archived cards. Code-level check only, not visually confirmed.
- **Completed state** — `statusCompleted` badge logic exists (mint-colored pill) but unverified visually for the same reason.
- **Archive flow** — code shows a proper custom `alertdialog` confirmation (`ArchiveSavingGoalModal`) naming the goal and consequence, consistent with the design system's destructive-confirmation requirement. Unverified visually.
- **Empty state** — not captured; the account used has no goals, but the page never reached the empty state because the API request errors before an empty list can be returned.
- **Loading state** — observed directly: on first render the page shows `"Memuat target tabungan..."` for roughly 10–15 seconds (react-query's default retry/backoff) before falling back to the error message. This is a real UX gap worth a follow-up: a fetch failure currently reads to the user as prolonged loading, not a fast fail.
- **Error state** — confirmed and correctly styled (`"Gagal memuat target tabungan. Coba lagi."` in a coral/error card), but only reachable after the extended loading delay above.

## Responsive Review

- **Desktop (1440×900)**: ✅ — sidebar, page header, and content column all render with correct spacing; no overflow observed on any captured screen.
- **Tablet**: not checked (not in scope of what could be captured without a working feature to test at that breakpoint).
- **Mobile (390×844)**: ✅ for what could be captured — dashboard and the saving-goals error state both render without clipping, overlap, or horizontal scroll; bottom nav stays usable and un-obscured.

## Git Review

From `reports/git-diff-stat.txt` / `reports/git-diff-files.txt` (tracked-file diff only):

- **4 tracked files modified**: `components/layout/app-sidebar.tsx`, `components/layout/bottom-nav.tsx`, `messages/en.json`, `messages/id.json` — all directly explained by adding the "Target Tabungan" nav entry and its translation strings.
- **Note**: `next-env.d.ts` was transiently modified during this review by a required dev-server restart (Next.js auto-generated, "should not be edited" per its own header) and has been reverted (`git checkout -- next-env.d.ts`) before generating this report, so it is not in the diff below.
- **No lockfile changes**, no configuration/migration file changes among tracked modifications.
- **New (untracked) Phase 8 source**: `app/(app)/target-tabungan/`, `src/features/savingGoals/`, `src/types/savingGoal.ts`, `tests/saving-goals.test.ts` — all in-scope for this feature.
- **New (untracked) review/tooling artifacts from this task**: `playwright/reviews/` (this evidence package) and `scripts/capture-phase8-review.mjs` (the capture script used to generate it). These are documentation/tooling, not application code; decide deliberately whether to commit the script alongside the feature or discard it.
- Nothing outside Phase 8 scope was found in the tracked diff.
- **Not in this frontend repo's diff, but relevant**: `pocket-mint-be` has an unapplied migration (`add_saving_goals`) against the shared Supabase Dev database, alongside other pending migrations already tracked outside Phase 8 scope. This is expected — shared dev/production migrations remain controlled manual operations, and rollout to the shared environment is a later step, not a prerequisite for committing or opening a PR. Migration correctness has already been validated on disposable PostgreSQL (full chain replay, `prisma migrate deploy` clean, `prisma migrate diff` clean); optional isolated browser QA may additionally be performed by temporarily running the local backend and frontend against a disposable PostgreSQL instance, without changing committed configuration or touching shared resources.

## Readiness Summary

1. **Implementation readiness** — Backend implementation and automated tests are ready. Frontend implementation, automated tests, type-check, lint, and build are ready.
2. **Migration validation** — The additive `add_saving_goals` migration has been validated successfully on disposable PostgreSQL: full migration chain replay succeeded, `prisma migrate deploy` reported no pending migrations afterward, and `prisma migrate diff` reported no schema difference.
3. **Shared-environment rollout status** — The shared Supabase Dev database was intentionally not modified, per repository policy against running migrations against the `.env`-configured Supabase URL. Rollout to shared Dev (and later production) is a controlled manual step that happens after commit/PR, not before.
4. **Browser visual evidence limitations** — Screenshots correctly document the current shared-environment error state. Data-backed UI states (populated goal list, edit/update-progress/archive modals) could not be captured because the shared environment has not received the migration. Live browser E2E and the remaining modal screenshots are post-migration verification items to complete before release or merge approval, depending on the project's review gate. No claim is made that the feature has passed full browser E2E verification.

## Final Recommendation

```
READY FOR COMMIT WITH NOTES
```

Implementation, automated validation, build validation, and disposable-database migration validation are complete. The shared Supabase Dev database was intentionally left untouched under the project's migration policy, so data-backed browser states remain pending post-migration verification. This does not block committing or opening a PR, but it must be completed before production release and, if required by the team's gate, before merge. Separately, `next-env.d.ts` should be reverted from the tracked diff if unintentional, and the extended loading-before-error delay is worth a follow-up ticket.
