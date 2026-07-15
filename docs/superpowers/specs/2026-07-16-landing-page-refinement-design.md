# Pocket Mint Landing Page Refinement

Date: 2026-07-16

Status: Approved design direction

## Design read

This is a preserve-mode redesign of the Pocket Mint public landing page for people seeking a calm, private financial workspace. The visual language remains close to Linear, Notion, Raycast, 1Password, and Arc Browser while preserving Pocket Mint's existing identity.

- `DESIGN_VARIANCE: 5`
- `MOTION_INTENSITY: 2`
- `VISUAL_DENSITY: 3`
- Theme: locked light theme using the established off-white canvas
- Typography: Inter only
- Accent and financial semantics: existing Pocket Mint tokens only

## Objective

Present Pocket Mint as software, not as a fintech campaign or startup pitch. Trust comes before features. The real product screens are the only imagery.

The page must not contain social proof, user counts, ratings, testimonials, customer logos, pricing, FAQ, comparison sections, or a "why choose Pocket Mint" section.

## Final page structure

1. Navbar
2. Hero with headline and Dashboard visual
3. Privacy
4. Dashboard showcase
5. Wallet and Transaction in a two-column composition
6. Installment showcase
7. Final CTA
8. Minimal footer

## Navbar

Use a restrained single-line navigation with the Pocket Mint lockup, `Fitur`, `Privasi`, `Login`, and `Daftar`.

- Keep the desktop height at or below 72px.
- Preserve clear keyboard focus and 44px interactive targets.
- Use `Login` as the secondary action and `Daftar` as the solid Slate action.
- On small screens, keep the brand and authentication actions visible. Secondary anchor links may be omitted if space is insufficient.

## Hero

The hero is a split composition. Copy sits on the left and the real Dashboard screen sits on the right.

Headline, unchanged:

> Clarity Over Complexity

Supporting copy:

> Pahami apa yang Anda miliki, kewajiban Anda, dan hal yang perlu perhatian, tanpa distraksi.

Actions:

- Primary: `Mulai Sekarang`
- Secondary: `Lihat Demo`

The visual uses the approved Stitch Dashboard screen. It is not placed inside a laptop, browser frame, floating card composition, or decorative mockup. Use only a thin outline, restrained shadow, and established large radius.

The hero visual may exclude nonessential outer canvas only when needed for fit. The crop must preserve a coherent product view and must not cut through meaningful controls or financial values.

## Privacy

Privacy appears immediately after the hero. It is a quiet, high-confidence statement, not a promotional feature grid.

Primary message:

> Data finansial Anda tetap milik Anda.

Supporting points communicate:

- No advertising
- No tracking
- No unnecessary data collection

Keep the language nontechnical. Use spacing, typography, and restrained dividers instead of decorative cards or illustrations.

## Screenshot cropping contract

All screenshots come from the supplied Google Stitch export. Cropping is based on the message each section must communicate, never merely on container dimensions.

General rules:

- Do not crop through labels, values, input fields, rows, cards, or progress indicators.
- Preserve enough surrounding interface to make each region understandable.
- Do not fabricate or reconstruct missing interface areas.
- Do not add captions, labels, badges, overlays, browser chrome, or floating UI.
- Use CSS object positioning only after the semantic region has been selected.
- On smaller screens, adjust the visible region deliberately rather than applying an automatic center crop.

### Dashboard crop

Communicate only:

- Hero Card
- Wallet Overview
- Recent Activity

The navigation shell and nonessential outer whitespace may be removed. The crop must still read as one coherent Dashboard view.

### Wallet crop

Communicate:

- Wallet List
- Summary Card

Show enough category and balance context to distinguish assets and liabilities. Do not crop financial values or semantic status labels.

### Transaction crop

Communicate:

- Search
- Transaction table or journal rows

Retain the search control, filtering context when necessary, and representative transaction rows. Do not turn rows into invented cards.

### Installment crop

Communicate:

- Reminder
- Installment cards
- Repayment progress

Preserve due-date and obligation context. Do not crop progress indicators away from the installment they describe.

## Dashboard showcase

Dashboard is the second visual hero and receives a wide, single-feature composition.

Heading:

> Dashboard

Body:

> Lihat posisi keuangan Anda dalam satu ringkasan.

Use the approved Dashboard crop defined above. Text remains short and does not compete with the product.

## Wallet and Transaction

Wallet and Transaction share one two-column section because they have equal product hierarchy.

### Wallet

Heading:

> Wallet

Body:

> Semua aset dan kewajiban dalam satu ledger.

Use the approved Wallet crop.

### Transaction

Heading:

> Transaction

Body:

> Riwayat yang cepat dicari dan mudah diperbaiki.

Use the approved Transaction crop.

Both columns use the same spacing, image treatment, and content weight. On mobile, stack Wallet before Transaction without changing their component styling.

## Installment showcase

Installment receives a wide showcase after the two-column section.

Heading:

> Installment

Body:

> Pantau kewajiban tanpa kehilangan tanggal jatuh tempo.

Use the approved Installment crop. Its width may be broad enough to preserve reminder, cards, and progress as one readable story.

## Final CTA

Use one final CTA only.

Message:

> Mulai bangun ruang kerja finansial privat Anda.

Primary action:

> Mulai Sekarang

Do not promise wealth, success, freedom, or better financial outcomes. Do not add a secondary contact or sales action.

## Footer

Keep the footer visually light and limited to:

- Pocket Mint
- Private Financial Workspace
- Privacy
- Terms
- GitHub
- Contact

## Visual system

- Off-white `#f9f9f8` canvas and white surfaces
- Inter typography
- Slate solid primary actions
- Existing Mint, Amber, and Coral financial semantics only inside product screenshots or meaningful states
- 12px default radius and 16px large-container radius
- Minimal tinted shadows
- Functional whitespace and restrained dividers
- No gradients, glass, blobs, glows, stock photography, lifestyle photography, or ornamental graphics

## Motion and interaction

Motion intensity remains at 2.

- No floating animation, parallax, scroll hijacking, or decorative reveal sequences.
- Hover changes only communicate interactivity.
- Pressed and focus-visible states remain accessible and restrained.
- Respect reduced-motion preferences.

## Responsive behavior

- Desktop uses a maximum content width of 1280px and 40px safe area.
- Tablet uses 32px safe area and reduces simultaneous columns.
- Mobile uses 20px horizontal margins and a single reading column.
- The hero stacks copy before the Dashboard visual on narrow screens.
- Wallet and Transaction stack in that order below 768px.
- Screenshot regions are repositioned intentionally for each breakpoint.
- No page-level horizontal overflow.

## Implementation boundaries

- Refine the existing `app/page.tsx` rather than adding a second landing route.
- Reuse the existing logo, button styling, tokens, and routes where they satisfy the design contract.
- Copy the selected Stitch assets into a dedicated landing-page asset directory under `public`.
- Do not add new runtime dependencies for this page.
- Do not modify authentication, application routes, backend APIs, financial logic, or authenticated product screens.

## Verification

The implementation is complete when:

- The hero communicates Pocket Mint and shows the real Dashboard in the first viewport.
- Privacy appears before product features.
- The section rhythm matches Hero, Privacy, Dashboard, Wallet and Transaction, Installment, CTA, Footer.
- Every screenshot crop communicates its specified product message.
- No screenshot is center-cropped by default or cut through meaningful UI.
- All visible copy is concise, grammatical, and contains no em dash.
- There is no social proof, startup pitching, marketing statistic, testimonial, or invented product claim.
- Desktop and mobile layouts preserve the same story and visual language.
- Keyboard focus, touch targets, contrast, and reduced-motion behavior remain accessible.
- Lint, tests, and production build pass.
