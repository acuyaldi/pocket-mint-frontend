# Storybook

Component workshop for Pocket Mint's shared UI (`components/ui/`, `components/layout/`). Lets you develop and inspect components in isolation, with real app styling, without running the full app or a backend.

## Running

```bash
npm run storybook          # dev server on http://localhost:6006
npm run build-storybook    # static build to storybook-static/ (gitignored, not deployed)
```

## Story convention

Stories live next to their component: `Component.tsx` + `Component.stories.tsx`. Use CSF3 (`satisfies Meta<typeof Component>`), strongly typed, no `any`.

## Catalog hierarchy

Titles follow `Area/ComponentName` (e.g. `UI/Button`, `UI/AppModal`). Only components that actually exist get a story — do not add placeholder stories to fill out categories.

## Adding a new story

1. Create `Component.stories.tsx` next to the component.
2. Cover the states that are actually reachable through the component's real props: default, variants/sizes, disabled, loading, with/without optional content, validation error, destructive action — whatever applies.
3. For loading/error/empty states, drive them through props/args, never through a live request — see "No network" below.
4. Add a one-line `parameters.docs.description.component` when the component's purpose or Pocket Mint-specific intent isn't obvious from its name.
5. Reusable UI components (`components/ui/`) should get a story when added or materially changed.

## Providers and mocking

`.storybook/preview.tsx` wraps every story in the same provider order as `app/layout.tsx` (`NextIntlClientProvider` + a fresh `QueryClientProvider` per story), using empty/deterministic fixtures — not live app state. A `Theme` toolbar item toggles the `.dark` ancestor class the app's Tailwind `dark:` variant relies on.

If a component needs router context, Redux-style state, or other app runtime, add a small dedicated decorator on that story file rather than expanding the global decorator — keep the global wrapper minimal.

## No real network rule

Stories must never hit the real backend, Supabase, or any external API. Drive every state (loading, error, empty, populated) from static args/fixtures.

## Accessibility

The a11y addon (axe-core) runs against every story and surfaces violations in the Storybook "Accessibility" panel (`test: 'todo'` — visible, not build-breaking). Check it when adding or changing a component; fix regressions you introduce.

## Testing integration

`@storybook/addon-vitest` runs stories as a `storybook` Vitest project (`npx vitest --project=storybook`), separate from the existing `tests/**/*.test.ts` suite — it does not replace or duplicate that suite. Add a `play` function only where an interaction has real value (e.g. opening/closing `AppModal`, selecting a `Select` item); don't write play functions that just assert a component rendered.
