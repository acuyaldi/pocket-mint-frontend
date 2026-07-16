# Landing Hero and Sticky Header Emphasis Design

## Goal

Strengthen the landing-page first impression around the tagline `Clarity Over Complexity`, keep the primary navigation available while scrolling, and make the `Mulai Sekarang` action visibly interactive and consistent with the final-page call to action.

## Scope

Change only the landing header, hero typography, landing navigation interactions, and the shared landing CTA treatment. Preserve the existing content order, copy, dashboard image, pulse-beam background, routes, logo, and entrance-motion structure.

## Header

- Keep the existing rounded, centered navigation container and all current destinations.
- Make the header `sticky` with a `top-4` offset and a deliberate stacking level so it remains visible above landing content while scrolling.
- Keep the header inside the existing `max-w-7xl` page width; sticky positioning must not cause horizontal movement or change the hero alignment.
- Use a nearly opaque background plus restrained backdrop blur so content passing behind it does not reduce legibility. Retain the existing border and subtle shadow rather than adding decorative elevation.
- Keep the current mobile composition: logo, Login, and Daftar remain visible; section links remain desktop-only.

## Navigation Interaction

- Increase desktop section-link weight from regular to medium and use primary ink at rest so the menu is easier to scan.
- Give each section link a left-to-right mint underline reveal on hover and keyboard focus. The underline must be structural, not a color-only state.
- Animate color and underline over 200ms with an ease-out curve.
- Preserve a high-contrast `focus-visible` outline and the existing 44px minimum target where applicable.
- Apply a clear color transition to `Login`; do not turn it into another filled CTA.

## Hero Typography

- Keep `Clarity Over Complexity` as the only `h1` and the dominant item in the hero.
- Use a fluid `clamp(3rem, 7vw, 5.5rem)` scale: 48px minimum on mobile and 88px maximum on wide screens.
- Tighten line height and tracking, retain semibold weight, and use balanced wrapping so the tagline stays visually composed without creating horizontal overflow.
- Keep the supporting paragraph subordinate at its current readable width and scale.

## Primary CTA

- Keep one hero conversion action and the existing `/login` destination.
- Match the hero CTA's minimum height, horizontal padding, font size, and pill geometry to the final landing CTA so both feel like the same action family.
- Strengthen the resting state with the existing solid primary fill and a restrained primary-tinted shadow.
- Change the shared hover/focus sweep to mint and switch the label to dark primary ink during the completed sweep, producing a clearly visible contrast change.
- Add a modest shadow-strength transition on hover/focus without translating or resizing the button.
- Keep pressed feedback within the existing primary treatment and preserve the component's dimensions.
- Apply the improved shared treatment to both `Mulai Sekarang` links, keeping the visual language consistent from hero to page end.

## Motion and Accessibility

- Reuse CSS transitions and the existing `framer-motion` setup; add no dependency and no JavaScript scroll listener.
- Respect `prefers-reduced-motion`: existing global reduced-motion rules must collapse hover/entrance transition duration without hiding content.
- Ensure sticky navigation does not cover section headings by retaining or increasing section scroll margins where needed.
- Keep semantic `header`, `nav`, `h1`, and link elements, accessible navigation labeling, logical keyboard order, and visible focus states.

## Component Boundaries

- Update `components/ui/pocket-mint-hero.tsx` for sticky positioning, navigation link styling, headline scale, and hero CTA sizing.
- Update `app/globals.css` only for the shared CTA sweep; express the navigation underline with Tailwind pseudo-element utilities in the existing component.
- Update `app/page.tsx` only if the final CTA class needs alignment or a section scroll offset needs correction.
- Extend `tests/landing-page.test.ts` with source-level contracts for sticky header behavior, stronger headline sizing, nav hover/focus structure, and the mint CTA sweep.

## Responsive Behavior

- Desktop shows the full navigation with hover/focus underline animation.
- Mobile keeps the compact existing controls and uses a headline size that remains prominent without clipping.
- At every breakpoint, the sticky header stays within the viewport, the hero remains centered, and the page has no horizontal overflow.

## Verification

- Run the focused landing-page test and confirm the new contract passes.
- Run the complete frontend test suite, lint, and production build.
- Visually inspect the landing page at desktop and mobile widths.
- During visual inspection, scroll through Privacy, Features, and the final CTA to confirm the header remains visible, anchors are not obscured, both CTA hover states are obvious, and the hero headline remains the dominant element.

## Out of Scope

- New landing sections, copy changes, route changes, a mobile menu, theme switching, new imagery, or new dependencies.
- Changes to authenticated application navigation or buttons.
- Decorative gradients, glow effects, scroll-driven header state, or continuous animation.
