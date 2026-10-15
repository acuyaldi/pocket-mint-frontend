---
name: new-feature
description: Scaffold a new frontend feature folder under app/(app)/<name>/ following Pocket Mint's component-structure conventions. Use when the user asks to add a new page/feature/section to the frontend, e.g. "/new-feature budgets".
disable-model-invocation: true
---

Scaffold a new feature at `app/(app)/<name>/` (the existing route-group
structure — see `src/features/` for the established per-feature layout of
hooks/components; do not scaffold under `app/feature/`).

Given `<name>` (kebab-case, e.g. `budgets`):

1. Create `app/(app)/<name>/page.tsx` — layout + data fetching only. No
   business logic or heavy JSX inline; import from `components/` and
   `src/features/<name>/` below.
2. Create `src/features/<name>/components/` — feature-specific components,
   one component per file, PascalCase filenames matching the component name
   (e.g. `<Name>Summary.tsx`, `<Name>List.tsx`).
3. Create `src/features/<name>/hooks/` — feature-specific hooks, camelCase
   with `use` prefix (e.g. `use<Name>.ts`), using `@tanstack/react-query`'s
   `useQuery`/`useMutation` through `lib/api.ts`. Never `useEffect` for data
   fetching.
4. Wire up any shared UI from `components/ui/` or `components/layout/`
   rather than duplicating — check those folders before creating new
   primitives.

Follow the rules already loaded automatically for this repo (`AGENTS.md` →
`.claude/skills/*.md`):

- Use design tokens from `ui-system.skill.md`, never Tailwind's default
  slate/gray/zinc/indigo/emerald/rose.
- Format all money with `formatCurrency` from `lib/utils.ts` — never write a
  new formatter.
- Icons from `lucide-react` only.
- Explicit TypeScript interfaces for all props and return types; no `any`.

After scaffolding, ask the user what data/fields the feature needs before
writing real logic — don't invent an API contract.
