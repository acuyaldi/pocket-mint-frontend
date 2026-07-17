# Landing Content Hierarchy and Active Tabs Design

## Goal

Strengthen the landing page hierarchy, reduce excess whitespace around the privacy section, make the feature tabs' active state unmistakable, and make the header registration action consistent with the primary landing CTA.

## Scope

- Update the privacy section in `app/page.tsx`.
- Update the feature introduction and tab states in `components/ui/vertical-tabs.tsx`.
- Update the header registration link in `components/ui/pocket-mint-hero.tsx`.
- Let `app/login/page.tsx` initialize its existing authentication mode from the URL.
- Preserve existing copy, page order, tab behavior, autoplay, reduced-motion handling, images, and responsive structure.
- Add no dependency, component, state, or new visual asset.

## Visual Design

### Privacy section

- Increase the heading size and emphasis so `Data finansial Anda tetap milik Anda.` becomes the clear focal point.
- Align the left copy block with the full privacy-card stack on desktop instead of anchoring it only to the bottom.
- Use the available vertical space within the left column to distribute the heading and supporting paragraph more deliberately, while reducing section padding where needed so the section does not feel empty.
- Keep the three privacy cards and their copy unchanged.

### Feature introduction

- Increase the heading and supporting-copy sizes for `Semua yang penting, dalam satu alur.` so the introduction reads as a section statement rather than secondary annotation.
- Keep line lengths constrained for readability and preserve the current two-column desktop composition.

### Active vertical tab

- Apply a subtle mint-tinted background and rounded corners to the active tab.
- Keep the existing primary progress rail as the strongest positional accent.
- Increase the active title's size and font weight relative to inactive titles.
- Keep inactive tabs visually quiet, with their current hover and keyboard-focus feedback.
- Preserve `role="tab"`, `aria-selected`, roving tab index, keyboard navigation, autoplay pause behavior, and reduced-motion behavior.

### Header registration action

- Change `Daftar` from `/login` to `/login?mode=register`, because registration is an existing mode on the shared authentication page rather than a separate route.
- Initialize the shared authentication page in register mode when `mode=register` is present, while preserving login as the default for every other value.
- Reuse the existing `landing-cta-sweep` hover treatment used by `Mulai Sekarang`.
- Preserve the current button dimensions, rounded shape, label, focus treatment, and mobile visibility.

## Responsive Behavior

- On desktop, vertically balance the privacy copy against the card stack and retain the feature two-column layout.
- On smaller screens, keep natural document flow; do not force equal-height columns or introduce horizontal overflow.
- Active-tab emphasis must remain readable without causing title clipping or unstable layout.

## Verification

- Extend the landing-page and login-page source contracts to cover `/login?mode=register`, the shared CTA hover class, the stronger section hierarchy, and the active-tab treatment.
- Run the focused landing-page test, lint, and production build.
- Validate the landing page at desktop and mobile widths in the in-app Browser.
- Confirm page identity, meaningful content, no framework overlay, console health, visible hierarchy, active-tab interaction, and that `Daftar` opens the authentication page directly in register mode.

## Non-goals

- No copy changes.
- No visual redesign of the login or registration form.
- No changes to tab timing, image animation, navigation structure, privacy-card content, or final CTA destination.
- No unrelated refactor.
