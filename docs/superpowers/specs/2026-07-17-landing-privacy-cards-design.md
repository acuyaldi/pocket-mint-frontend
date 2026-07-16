# Landing Privacy Cards Design

## Goal

Replace the visually weak divider list in the landing privacy section with three compact cards that make each privacy promise easier to scan while preserving the current calm, information-first layout.

## Scope

Change only the three privacy points on the right side of the `Data finansial Anda tetap milik Anda.` section. Preserve the section heading, supporting paragraph, section order, existing copy, routes, and surrounding landing-page layout.

## Composition

- Keep the existing two-column desktop composition: heading and supporting copy on the left, privacy points on the right.
- Keep the three privacy cards stacked vertically in the right column with Tailwind `gap-3` (12px).
- On mobile and tablet widths, retain the existing single-column flow so the card stack appears below the supporting copy at full available width.
- Keep the section's existing vertical spacing and bottom border.

## Card Treatment

- Reuse the existing `Card` and `CardContent` components from `components/ui/card.tsx`; do not create another card component or add a dependency.
- Render each item as `Card size="sm"` with `py-0 shadow-sm shadow-primary/5`, retaining the existing surface, radius, and border system.
- Use `CardContent` with `flex min-h-20 items-center gap-4 px-4 py-4` to align the marker and copy.
- Display `01`, `02`, and `03` in `size-10` markers with `rounded-lg bg-mint/15`, primary text, 12px semibold type, and restrained positive tracking.
- Keep the current point copy unchanged:
  - `Tanpa iklan.`
  - `Tanpa pelacakan marketing.`
  - `Hanya data yang diperlukan untuk workspace Anda.`
- Use medium-weight primary text for each point. Do not add descriptions, icons, links, buttons, or hover states.
- The cards are informational and must not visually imply clickability.

## Data and Markup

- Define the three existing strings as one module-level constant array in `app/page.tsx`.
- Map the array to the card stack and derive the two-digit marker from the array index.
- Use semantic list markup: the stack is a `ul`, each card is contained by an `li`, and the numbered marker is decorative with `aria-hidden="true"`.
- Keep the visible copy available as ordinary text for screen readers.

## Responsive and Accessibility Requirements

- Cards must remain within the page width and must not create horizontal overflow at 390px.
- Preserve the current reading order: heading, supporting paragraph, then privacy promises.
- Do not rely on the mint marker alone to communicate meaning; the complete privacy statement remains visible in every card.
- Preserve the existing color tokens and text contrast.

## Files

- Modify `app/page.tsx` to import the existing card primitives, define the privacy-point array, and replace the divider paragraphs with semantic cards.
- Modify `tests/landing-page.test.ts` to contract-test the existing card import, three-item data source, semantic list structure, numbered markers, unchanged copy, and removal of the divider-list treatment.
- Do not modify `components/ui/card.tsx`; its existing API and visual definition already cover this use case.

## Verification

- Follow TDD: add the new landing contract first and verify it fails for the missing card treatment.
- Run the focused landing-page test after implementation.
- Run the complete frontend test suite, lint, and production build.
- Do not run Playwright or another browser automation tool unless the user explicitly requests it.

## Out of Scope

- Changes to the privacy heading or supporting paragraph.
- New copy, icons, illustrations, card interactions, entrance animations, or hover effects.
- Changes to the hero, features, final CTA, footer, authenticated pages, or shared card implementation.
