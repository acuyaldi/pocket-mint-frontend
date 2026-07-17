# Landing Pulse Beams Design

## Goal

Make the landing hero feel less empty by keeping animated pulse beams visibly flowing around both the introductory copy and the dashboard screenshot. The dashboard remains the dominant visual.

## Root Cause

The current landing beam layer spans a tall hero while its SVG uses a short, landscape view box with `preserveAspectRatio="xMidYMid slice"`. Scaling the landscape geometry into the tall container enlarges and crops most paths outside the visible composition. The same component remains visible on login because that panel has a closer aspect ratio.

## Design

- Keep one continuous, non-interactive beam layer behind the entire landing hero.
- Give the landing variant portrait-aware path geometry that runs along the left and right sides of the copy and dashboard frame.
- Use SVG scaling that preserves the complete landing geometry instead of cropping it.
- Increase landing-only opacity and pulse contrast above the login treatment while retaining thin base paths.
- Keep content above the decoration through the existing isolated stacking context.
- Preserve `aria-hidden`, pointer-event passthrough, and reduced-motion behavior.
- Do not alter the login variant.

## Responsive Behavior

On desktop, beams should frame the headline and continue down both sides of the dashboard screenshot. On narrow screens, the complete paths should remain visible without covering controls or creating horizontal overflow. The decoration may become subtler as paths compress, but it must remain perceptible.

## Verification

- Add or update a focused source contract that protects the landing-specific SVG scaling and stronger landing opacity.
- Run the PulseBeams and landing page tests.
- Run lint or the nearest relevant static check.
- Visually inspect the landing page at desktop and mobile widths for visibility, clipping, overlap, console errors, and reduced readability.

## Scope

Only the shared PulseBeams component, its landing usage, and focused tests are in scope. No new dependencies, new decoration components, or unrelated landing redesign will be introduced.
