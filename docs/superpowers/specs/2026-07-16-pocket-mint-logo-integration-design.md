# Pocket Mint Logo Integration Design

## Goal

Replace every frontend brand treatment with the approved Pocket Fold logo system from `pocket-mint-docs/docs/product/stictch/core/logo`. The frontend must use the supplied geometry without redrawing or altering it.

## Scope

- Replace the legacy SVG in `components/Logo.tsx` with the approved Pocket Fold path.
- Use the horizontal Pocket Mint lockup on landing-page navigation and footer, login and password-reset surfaces, and the expanded application sidebar.
- Use the icon-only mark only where visible space is compact or adjacent text already identifies Pocket Mint.
- Replace the application favicon with the approved fixed-slate favicon asset.
- Remove the sidebar tagline because the approved logo system does not include a tagline.

Existing layout, navigation, authentication behavior, copy, and page imagery remain unchanged except where spacing must adapt to the approved lockup.

## Component Design

`components/Logo.tsx` remains the single source of truth. It will expose the existing `PocketMintLogo` API so current auth callers continue to work, while rendering:

- the official `viewBox="0 0 24 24"` Pocket Fold path;
- a horizontal live-text wordmark using the application's Inter font, semibold weight, and the approved 4:3 mark-to-type ratio;
- `currentColor` so each surface can use its existing semantic foreground color;
- an accessible wrapper named `Pocket Mint`, with the internal mark and wordmark hidden from duplicate announcement.

The existing `className` continues to size the mark. `showText={false}` remains available for compact icon-only contexts. No new dependency or parallel logo component is needed.

## Integration

- Landing header and footer replace plain `Pocket Mint` text with the shared lockup.
- Login and reset-password pages keep their current component calls and receive the new geometry automatically.
- Expanded application sidebar replaces its heading and tagline with a 24px-mark lockup.
- `app/favicon.ico` is replaced by `app/icon.svg` copied from the approved `favicon.svg`, allowing Next.js file-based metadata to serve the official mark.

## Verification

- Add or update focused tests to assert that visible brand locations use `PocketMintLogo` and that the legacy path is gone.
- Run the frontend test suite, lint, and production build.
- Check the rendered landing, login, reset-password, and authenticated shell at desktop and mobile widths when browser testing is available.

## Non-goals

- No redesign of page layout or navigation.
- No new logo variants, colors, animation, badge, or tagline.
- No change to the approved source assets in `pocket-mint-docs`.
