# Agent Rules — Pocket Mint
> Load this first. These rules override default behavior.

## Skill Load Order
Before any task, read in this order:
1. `agent-rules.skill.md` ← this file
2. `git-workflow.skill.md` ← branching, PR, and release process — read before any task that will create commits or a PR
3. `ui-system.skill.md` ← for any frontend/component work
4. `financial-logic.skill.md` ← for any wallet/transaction/installment work

## Behavior Rules

### Focus
- Work on ONE task at a time. Finish it, confirm it works, then move on.
- If a task requires backend AND frontend, do backend first. Never touch frontend before the endpoint exists.
- Do not refactor unrelated code while fixing a bug.

### Before Writing Code
- Check if the file/function already exists. Never duplicate.
- If a Prisma model change is needed, write migration first, run it, then write the route.
- If an endpoint already exists, fix it — don't create a new one.

### File Safety
- NEVER touch `globals.css`, `layout.tsx`, or any root layout file unless the task explicitly requires it.
- NEVER change Prisma schema without running `npx prisma migrate dev` immediately after.
- NEVER hardcode data that should come from the API.

### API Conventions
- All endpoints return `{ data, error }` shape
- Auth is always required — check middleware before adding new routes
- Net worth is always computed, never stored

### Frontend Conventions
- Use design tokens from `ui-system.skill.md` — never Tailwind defaults
- Financial figures always use `font-mono` (JetBrains Mono)
- Positive = `text-[#4ade80]`, Negative = `text-[#ffb4ab]`
- Loading state required for every data-fetching component

### Git & Pull Request Conventions (Staging vs Production)
Full process lives in `git-workflow.skill.md` — this is the summary:
- **Branch Roles:** Branch `main` adalah Production (Live App), branch `dev` adalah Staging/pre-production (Development/Testing), dan branch `master` sudah **retired** (jangan dipakai untuk task baru).
- **Feature Branching:** Setiap kali mulai mengerjakan task baru, Agent **WAJIB** membuat branch baru dari base `dev` (misal: `feature/nama-fitur` atau `fix/nama-bug`). JANGAN PERNAH commit atau push langsung ke branch `dev` atau `main`.
- **Target Pull Request:** Saat membuat Pull Request (PR) tanpa base/head eksplisit, source branch-nya adalah branch task saat ini, dan **TARGET BRANCH-nya HARUS `dev` (Staging)**. Jangan merge PR kecuali diminta eksplisit.
- **Pengecualian:** JANGAN PERNAH menargetkan PR ke branch `main` kecuali ada perintah tertulis eksplisit dari pengguna untuk rilis produksi (`dev` → `main`).

### Documentation Maintenance
- **Automated Audit Update:** Setiap kali Agent melakukan modifikasi, penambahan, atau penghapusan file halaman baru di dalam direktori `apps/frontend/app/` atau mengubah struktur komponen utama, Agent **WAJIB** langsung memperbarui berkas peta fitur di `docs/audit.md`.
- File `docs/audit.md` harus mencakup: pemetaan halaman (route), daftar komponen utama yang digunakan, dan hubungan antar layout parent-child. Jangan biarkan file ini out-of-date.

### Completion Criteria
A task is DONE only when:
- [ ] No TypeScript errors
- [ ] `npm run build` passes
- [ ] API returns correct shape (test with curl or check response in code)
- [ ] UI renders without console errors
- [ ] Berhasil memperbarui dokumen status fitur di `docs/audit.md` jika ada perubahan halaman/komponen
- [ ] No regressions to existing features

## Common Mistakes to Avoid
- **SALAH ALUR GIT:** Membuat Pull Request langsung menuju branch `main` (Alur yang benar: Bikin branch dari `dev`, push, lalu buat PR dengan target merge ke `dev`; PR ke `main` hanya untuk rilis eksplisit).
- Melakukan commit atau push langsung (*direct push*) ke branch `dev` atau `main`.
- Menganggap `master` masih menjadi branch produksi — branch itu sudah retired.
- Lupa mengupdate berkas `docs/audit.md` setelah selesai melakukan tweak/refactor komponen halaman frontend.
- Starting frontend before backend is ready
- Forgetting to recalculate net worth after wallet mutation
- Using hardcoded mock data instead of live API
- Skipping loading/error states in UI components
- Touching global styles for a component-level fix