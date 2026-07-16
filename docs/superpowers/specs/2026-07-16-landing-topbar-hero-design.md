# Pocket Mint Landing Topbar and Hero Design

## Scope

Replace only the landing-page topbar and hero with a Pocket Mint adaptation of the supplied Acme hero component. Keep every section after the hero unchanged.

## Design direction

The result is light-only, quiet, and product-first. Layout and entrance motion follow the supplied reference, while color, typography, spacing, radius, and elevation follow the authoritative Pocket Mint `DESIGN.md` from the Stitch export.

## Topbar

- Place the topbar inside a centered `max-w-5xl` container with top padding.
- Use a 12px rounded container, thin Pocket Mint border, background token, and restrained shadow.
- Keep the existing labels and destinations: Pocket Mint, Fitur, Privasi, Tentang Kami, Login, and Daftar.
- Do not add a light/dark toggle.
- Desktop displays the section links. Mobile displays Pocket Mint, Login, and Daftar without a drawer.
- Maintain 44px minimum touch targets and visible keyboard focus.

## Hero layout

- Change the hero from a split layout to one centered vertical stack.
- Preserve the badge, headline `Clarity Over Complexity`, supporting copy, and the two existing actions.
- Use `Mulai Sekarang` as the primary action and `Lihat Demo` as the secondary action.
- Add one restrained metadata line below the actions, adapted to Pocket Mint rather than copied from Acme.
- Keep the hero within the same centered `max-w-5xl` container and use the Pocket Mint 8px spacing rhythm.

## Product visual

- Use the approved local Stitch dashboard at `/landing/dashboard.png`.
- Show the complete dashboard without cropping, forced translation, perspective, gradient masking, browser chrome, device mockups, or decorative layers.
- Match the reference composition with a thin outer frame, 8px inset, and a rounded inner frame.
- Use `object-contain` and responsive intrinsic sizing so the complete image remains visible on desktop and mobile.
- Keep border and shadow restrained according to `DESIGN.md`.

## Motion

- Use the already-installed `framer-motion`; do not add `motion/react` or another dependency.
- Animate the hero group from opacity 0 and y 20 to its resting position over 0.5 seconds.
- Stagger headline, supporting copy, actions, and metadata at 0.2, 0.3, 0.4, and 0.5 seconds.
- Animate the dashboard from opacity 0 and y 40 over 0.8 seconds with a 0.6-second delay.
- Disable positional movement when the user prefers reduced motion, leaving content immediately readable.
- Do not add continuous floating motion, hover lift, or animated decoration.

## Component boundary

Create one focused client component in `components/ui` that owns the topbar, hero markup, and entrance motion. The landing page remains responsible for composing that component with the existing Privacy, Features, CTA, and Footer sections. Reuse Next.js `Link`, Next.js `Image`, existing Lucide icons, and existing design tokens.

## Responsive behavior

- Desktop and tablet use the centered hero composition and full-width dashboard frame.
- Mobile stacks the actions, keeps 20px horizontal margins, and shows the complete dashboard at the available width.
- No breakpoint may introduce horizontal scrolling or crop the dashboard.

## Verification

- Add a landing-page contract test for the new component, centered structure, local full dashboard image, and absence of dark-mode and gradient-mask behavior.
- Verify the regression test fails before implementation and passes afterward.
- Run all tests, lint, and production build.
- Visually verify desktop and mobile renderings, including reduced horizontal width and image fit.

## Out of scope

- Redesigning Privacy, Features, CTA, or Footer.
- Adding dark mode, a mobile drawer, new sections, new copy themes, new imagery, or new dependencies.
- Changing the approved Pocket Mint color system.
