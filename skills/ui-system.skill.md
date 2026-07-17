# UI System — Pocket Mint

> Read this before touching any component, page, or style file. The authoritative source is `../pocket-mint-docs/docs/product/stictch/core/DESIGN.md`; `skills/design.md` is its frontend-agent summary. When code or older guidance conflicts, the authoritative `DESIGN.md` wins.

## Non-Negotiable Product Contract

- Pocket Mint is a calm, private, information-first financial workspace.
- Primary UI language: Bahasa Indonesia.
- Navigation labels, unchanged: `Dashboard`, `Dompet`, `Transaksi`, `Cicilan`, `Akun`.
- Do not make the product resemble an admin dashboard, bank, crypto exchange, trading platform, gamified tracker, or marketing-heavy fintech site.
- Preserve the existing backend, APIs, authentication, routes, query hooks, mutations, validation, calculations, and business rules unless a separate implementation task explicitly authorizes changes.

## Semantic Tokens

Use semantic theme tokens rather than default Tailwind palette utilities or arbitrary raw colors.

| Semantic role | Established value | Use |
|---|---:|---|
| Canvas | `#f9f9f8` | Application background |
| Surface | `#ffffff` | Cards, panels, dialogs |
| Muted surface | `#f4f3f3` | Restrained secondary surfaces and hover states |
| Border | `#c0c8c7` | Structural borders and dividers |
| Ink | `#1a1c1c` | Primary text and financial values |
| Muted ink | `#414848` | Supporting text and metadata |
| Mint | `#2DD4BF` | Assets, income, positive values, focus indication |
| Slate | `#0F172A` | Navigation, neutral emphasis, solid primary buttons |
| Amber | `#F59E0B` | Warning, upcoming, pending, attention |
| Coral | `#F87171` | Debt, destructive actions, negative balances, overdue, critical states |

Mint is not the default primary-button fill. Primary buttons are solid Slate. Ordinary expenses use Ink, not Coral. Never communicate state through color alone.

## Typography and Financial Values

- Use Inter for display, headings, body, labels, metadata, and financial figures.
- Do not add Hanken Grotesk, JetBrains Mono, or another competing font system.
- Apply tabular figures to every currency amount, balance, payment, percentage, and financial total.
- Financial values lead the hierarchy, followed by section titles, body, then metadata.
- Keep headings restrained and application-scaled; no oversized marketing headings.
- Preserve full, locale-formatted values. Long amounts may resize or wrap as one unit but must not be misleadingly rounded or truncated.
- Negative asset/debt values use a minus sign and Coral plus explicit context. Expenses remain neutral. Zero remains neutral.

## Geometry, Spacing, and Elevation

- Base rhythm: 8px.
- Internal spacing: 16px.
- Card padding: 24px.
- Major section spacing: 32px.
- Default radius: 12px.
- Large-container radius: 16px.
- Pill radius: 999px only for true pills and status labels.
- Maximum content width: 1280px.
- Safe areas: Desktop 40px, Tablet 32px, Mobile 20px horizontal margin.
- Use minimal elevation: canvas, card, then modal. Shadows are subtle separators, not decoration.
- Card surfaces are white. No glass, gradient surface, glow, neumorphism, or decorative elevation.

## Responsive System

Desktop is the master breakpoint.

- Desktop: persistent sidebar, page header, 12-column content grid.
- Tablet: compact navigation, 8-column content grid.
- Mobile: top app bar, single reading column within a 4-column grid, bottom navigation.

Only composition changes across breakpoints: width, column count, wrapping, and stacking. Components keep identical visual tokens, content hierarchy, spacing scale, radius, elevation, icons, and interaction states. Do not create alternate mobile card styles. Keep the page free of horizontal overflow.

## Shared Component Definitions

### Navigation

Use the five mandatory Bahasa Indonesia labels exactly. Expose the active item with `aria-current="page"` and a non-color indicator. Preserve logical keyboard order and visible focus.

### Hero Card

Contains only Net Worth, Total Assets, Total Outstanding Debt, and Reporting Cutoff. It is the dashboard's primary visual anchor. Do not add charts, sparklines, gradients, trends, ratios, decorative analytics, or fabricated comparisons.

### Wallet Card

Contains wallet name, wallet type, balance, and optional institution. Balance is dominant and tabular. Use Mint semantics for assets and Coral semantics for debt through meaningful status treatment; never require a decorative side stripe.

### Summary Card and Quick Action

Use one restrained card definition. Summary values are information-first. Quick actions are compact controls, not promotional tiles. Do not introduce decorative analytics or generic equal-card dashboard rows.

### Transaction Row

Order: category icon, title, metadata, amount. Income is Mint; ordinary expense is Ink; debt is Coral. The amount uses tabular figures. Transfers and any other supported type must use truthful, explicit semantics rather than being forced into income or expense styling.

### Installment Card

Show installment name, monthly payment, remaining balance, due date, and repayment progress only when supported by real data. Amber marks upcoming or pending obligations; Coral marks overdue or critical obligations. Pair both with explicit text and dates. Never gamify repayment.

### Buttons and Inputs

Primary buttons are compact Solid Slate; secondary buttons are outlined; danger buttons are Coral. Inputs use a visible label above, optional helper text, and an associated error below or beside the field. Minimum interactive target is 44px.

### Modals and Tables

Desktop modals are centered contained dialogs. Tablet and Mobile retain the same styling and content order while adapting width, wrapping, action stacking, and internal scrolling. Require an accessible name, focus trap, inert background, Escape close where dismissible, and trigger-focus restoration.

Narrow tables retain semantic headers, row styling, information order, and financial alignment. If necessary, the labelled table region may scroll horizontally; the page may not. Do not transform rows into decorative cards.

## Interaction and Data States

Every applicable component defines hover, focus-visible, pressed, selected, disabled, loading, skeleton, empty, error, no-search-result, overdue, upcoming-payment, and destructive-confirmation states.

- Hover is restrained and only applies on hover-capable devices.
- Focus-visible is high contrast and distinct from hover and selected states.
- Pressed feedback never moves or resizes surrounding layout.
- Selected and status states use a non-color cue and programmatic state.
- Disabled controls stay legible, cannot activate, and have no hover/pressed feedback.
- Loading preserves geometry, prevents duplicate submission, and never claims success early.
- Skeletons match real layout, use neutral surfaces, respect reduced motion, and contain no fake data.
- Empty, no-result, error, and zero are separate states. Errors never render as zero or empty.
- Destructive confirmation names the item and consequence; Coral is reserved for the destructive action while cancel remains clear.

## Dashboard and Screen Rules

Dashboard order is fixed: Financial Position, Needs Attention, Quick Actions, Wallet Overview, Current Period Summary, Recent Activity. Wallets are an inventory, Transactions are a journal, Cicilan prioritizes obligations, and the landing page builds trust without becoming marketing-heavy.

Generate or implement only one coherent direction. Do not invent features, sections, charts, financial data, trends, insights, or unsupported actions. Do not preserve an existing implementation pattern when it conflicts with `DESIGN.md`.

## Prohibited Patterns

- Glassmorphism, gradients, decorative blobs, ornamental graphics, excessive shadows, or glow effects.
- Hero charts, fake sparklines, decorative analytics, or fabricated financial claims.
- Mandatory decorative wallet side stripes.
- Multiple font systems or monospace financial typography.
- English navigation labels.
- Oversized marketing typography, bento marketing layouts, or generic dashboard composition.
- Breakpoint-specific component redesigns.
- Arbitrary colors, default Tailwind palette utilities, and color-only status communication.
- Multiple visual directions.
