# Pocket Mint Public and Authentication Experience

Date: 2026-07-16

Status: Approved design direction

## Design read

This is a preserve-mode redesign of the Pocket Mint landing and authentication pages for privacy-conscious Indonesian users. Both pages should feel like one calm, product-first financial workspace while retaining the product's current English and Bahasa Indonesia mix.

- `DESIGN_VARIANCE: 5`
- `MOTION_INTENSITY: 2`
- `VISUAL_DENSITY: 3`
- Theme: locked light theme
- Typography: Inter only
- Foundation: existing Pocket Mint tokens and components

## Objective

Create a cohesive path from the public landing page into authentication without changing product behavior, routes, information architecture, or the approved Pocket Mint identity.

Trust comes from restraint, clear product screenshots, direct copy, and reliable form behavior. The result must not resemble a promotional fintech campaign, generic startup template, or decorative dashboard showcase.

## Shared visual system

- Use the existing off-white canvas, white surfaces, Slate primary actions, and established semantic colors.
- Keep Inter throughout.
- Use 12px default radii and 16px large-container radii.
- Keep elevation minimal and tinted neutrally.
- Use Mint only where it has positive or security-related meaning.
- Do not add gradients, glass effects, blobs, glows, ornamental graphics, stock photography, or a competing color system.
- Keep visible focus states, logical keyboard order, 44px minimum touch targets, and reduced-motion support.
- Keep the current mixed-language copy style. Do not translate the entire experience or silently rewrite product terminology.

## Landing page

### Structure

The landing page uses this fixed sequence:

1. Navbar
2. Centered hero with the real Dashboard image
3. Privacy statement
4. Dashboard showcase
5. Wallet and Transaction showcase
6. Installment showcase
7. Final CTA
8. Minimal footer

### Navbar and hero

Keep the existing single-line navbar and centered hero composition.

- Preserve the current destinations and labels.
- Keep `Clarity Over Complexity` as the headline.
- Keep the existing supporting-copy language style.
- Use one primary action leading to `/login`.
- Use the real local Dashboard image as the visual anchor.
- Present the screenshot without device chrome, perspective, overlays, or decorative framing.
- Motion is limited to the current purposeful entrance sequence and must respect reduced-motion preferences.

### Privacy and product showcases

Privacy appears immediately after the hero and reads as a quiet trust statement rather than a promotional card.

Replace the current generic bento feature grid with a product-led sequence using the supplied local screenshots:

- Dashboard receives one wide showcase.
- Wallet and Transaction share equal hierarchy in a two-column desktop composition and stack in that order on mobile.
- Installment receives one wide showcase.
- Screenshot crops must preserve meaningful controls, labels, financial values, rows, and context.
- Do not fabricate interface elements, analytics, captions, badges, or product claims.

### CTA and footer

Use one final CTA intent leading to `/login`. Keep the footer visually light and preserve existing legal and navigation labels unless a later request explicitly changes them.

## Authentication page

### Layout

Keep the desktop split layout while simplifying its presentation.

- The form remains the primary task and occupies the right column on desktop.
- The left panel contains one concise trust statement and restrained supporting details.
- Remove decorative gradients, excessive cards, promotional text strips, and duplicated branding.
- On mobile, show the authentication form first and supporting context below it.
- Keep the page on the same light theme as the landing page.

### Behavior preservation

Preserve all existing authentication behavior:

- Sign in
- Sign up
- Forgot-password flow
- Google OAuth
- Client-side sign-up validation
- Password visibility control
- Loading and duplicate-submission prevention
- OAuth and form error display
- Reset-email confirmation
- Return navigation to the landing page

Do not change server actions, Supabase behavior, field names, field order, autocomplete attributes, routes, or query-parameter handling.

### States and accessibility

- Loading states retain component dimensions.
- Errors remain adjacent to or clearly associated with the form.
- Success messages remain distinguishable from errors without relying on color alone.
- Every control remains keyboard accessible.
- Focus-visible treatment must meet contrast requirements.
- Password controls keep explicit accessible labels.

## Component boundaries

- `app/page.tsx` owns the landing-page section composition and screenshot showcases.
- `components/ui/pocket-mint-hero.tsx` owns the navbar, centered hero, reduced-motion entrance, and Dashboard visual.
- `app/login/page.tsx` retains authentication logic and owns the simplified authentication presentation.
- `app/globals.css` changes are limited to removing obsolete decorative utilities when repository search proves they are unused.
- Reuse existing components, icons, assets, tokens, and routes.
- Add no runtime dependencies, new routes, speculative abstractions, or generated imagery.

## Responsive behavior

- Desktop uses the existing maximum-width system and 40px safe area where applicable.
- Tablet reduces simultaneous columns without changing visual identity.
- Mobile uses 20px horizontal margins and a single reading column.
- The hero remains complete and free of horizontal overflow.
- Wallet precedes Transaction when the two-column showcase stacks.
- The authentication form appears before supporting context on mobile.
- Screenshot positioning is deliberate at each breakpoint and does not cut through meaningful content.

## Existing worktree preservation

The worktree already contains uncommitted landing-page, test, generated type, audit, and image changes. Implementation must inspect and preserve those changes. It must not restore deleted files, overwrite modified screenshots, or discard edits outside the approved redesign scope.

## Test strategy

Follow test-driven development for behavior and structural contracts:

1. Update or add focused contract tests before production edits.
2. Run the focused test and confirm it fails for the intended missing structure.
3. Make the minimum production change required to pass.
4. Run the focused test again, then the full test suite.

Contract tests should cover:

- Landing section order and required local product imagery.
- Absence of the replaced bento marketing structure and prohibited decorative treatments.
- Preservation of the centered hero and `/login` action.
- Authentication modes and existing field names.
- Absence of the removed login decoration while retaining required form behavior.

Visual verification must cover desktop and mobile layouts, screenshot fit, contrast, keyboard focus, and reduced-motion behavior.

## Completion criteria

- Landing and authentication pages clearly belong to one Pocket Mint system.
- The landing page follows the approved product-led section order.
- Privacy appears before product showcases.
- The authentication form remains fully functional in sign-in, sign-up, and forgot-password modes.
- No route, server action, field contract, or query-parameter behavior changes.
- No new dependency is added.
- No existing uncommitted work is lost.
- Visible copy contains no em dash.
- Tests, lint, and production build pass.
- Desktop and mobile visual checks show no horizontal overflow or clipped meaningful content.
