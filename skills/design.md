---
name: Pocket Mint Design Contract
authority: ../pocket-mint-docs/docs/product/stictch/core/DESIGN.md
version: '2.0'
status: derived
language: id-ID
colors:
  canvas: '#f9f9f8'
  surface: '#ffffff'
  surface-muted: '#f4f3f3'
  border: '#c0c8c7'
  ink: '#1a1c1c'
  ink-muted: '#414848'
  mint: '#2DD4BF'
  slate: '#0F172A'
  amber: '#F59E0B'
  coral: '#F87171'
typography:
  family: Inter
  financial-figures: tabular-nums
radius:
  default: 12px
  large: 16px
  pill: 999px
spacing:
  base: 8px
  internal: 16px
  card: 24px
  section: 32px
  desktop-safe-area: 40px
  tablet-safe-area: 32px
  mobile-margin: 20px
layout:
  max-content-width: 1280px
  desktop-columns: 12
  tablet-columns: 8
  mobile-columns: 4
---

# Pocket Mint Design Direction

This document is an agent-facing derivative of the authoritative Pocket Mint `DESIGN.md`. If any wording differs, `DESIGN.md` wins. Do not treat existing implementation as permission to override the authority.

## Product Identity

Pocket Mint is a private financial workspace, not a generic admin dashboard, banking app, crypto or trading product, gamified expense tracker, or marketing-heavy fintech site. It must feel calm, professional, trustworthy, organized, private, information-first, and premium through restraint. Every visual element must improve financial comprehension.

The primary application language is Bahasa Indonesia. Use these navigation labels exactly and never translate or rename them: `Dashboard`, `Dompet`, `Transaksi`, `Cicilan`, `Akun`.

## Visual Foundation

- Use the light off-white canvas and white card surfaces defined in the frontmatter.
- Use Slate for navigation, primary text emphasis, and solid primary buttons.
- Use Mint only for assets, income, positive values, and positive financial meaning.
- Use Coral only for debt, destructive actions, negative balances, overdue obligations, and critical negative states.
- Use Amber only for warnings, upcoming payments, pending states, or items requiring attention.
- Ordinary expense amounts are dark neutral, not automatically Coral.
- Color must never be the only status cue. Pair it with text, iconography, or another structural indicator.
- Use semantic tokens. Do not add arbitrary raw colors or alternate warm/cool neutral systems.
- Cards have white backgrounds, 12px radius, 24px padding, and minimal elevation. Large containers use 16px radius.
- No glassmorphism, gradients, decorative blobs, ornamental graphics, excessive shadows, or decorative card side stripes.

## Typography

Use Inter throughout the product. Establish hierarchy in this order: financial values, section titles, body, metadata. Keep headings controlled and application-scaled; never use oversized marketing typography.

All currency, balances, payments, percentages, and other financial values use Inter with tabular figures. Do not introduce a competing display or monospace font. Preserve complete financial values with Indonesian locale formatting. Long values may resize responsively or wrap as one readable amount; never abbreviate or truncate them in a misleading way. Negative values use a minus sign and the correct semantic context. Zero values remain neutral.

## Layout and Responsive Composition

Desktop is the master breakpoint. Use a maximum content width of 1280px, an 8px spacing rhythm, 32px major section spacing, and the safe areas defined in the frontmatter.

- Desktop: persistent sidebar, page header, then content on a 12-column grid.
- Tablet: compact navigation and content on an 8-column grid.
- Mobile: top app bar, single reading column on a 4-column grid, then bottom navigation.

Responsive behavior changes width, columns, wrapping, and stacking only. Shared components retain the same typography hierarchy, colors, radius, elevation, spacing scale, icon style, content, and interaction behavior at every breakpoint. Keep the page free of horizontal overflow.

## Information and Screen Hierarchy

Every screen reads from primary information to supporting information, actions, then history. Preserve the authoritative information architecture and existing product scope.

The Dashboard reading order is fixed: Financial Position, Needs Attention, Quick Actions, Wallet Overview, Current Period Summary, Recent Activity. It is not an analytics dashboard.

The Hero Card contains only Net Worth, Total Assets, Total Outstanding Debt, and Reporting Cutoff. Never add a chart, sparkline, trend graph, decorative analytic, or fabricated comparison.

Wallet Cards contain wallet name, wallet type, balance, and optionally institution. Balance is dominant. Asset and debt semantics may use functional labels, icons, borders, or status treatments; a decorative side stripe is never mandatory.

Transaction rows contain category icon, title, metadata, and a tabular amount. Income is Mint, ordinary expense is dark neutral, and debt is Coral.

Installment cards contain installment name, monthly payment, remaining balance, and due date. Progress communicates repayment only and is never gamified.

## Components and States

Every shared component has one visual definition. Buttons are compact: primary is solid Slate, secondary is outlined, and danger is Coral. Inputs use labels above fields and errors beside or below the relevant field.

Define hover, focus-visible, pressed, selected, disabled, loading, skeleton, empty, error, no-search-result, overdue, upcoming-payment, and destructive-confirmation states. State changes must preserve dimensions and component identity. Loading must prevent duplicate submission. Skeletons match real geometry and contain no fabricated data. Errors never masquerade as zero or empty data.

Use a visible high-contrast focus indicator, logical keyboard order, native control semantics, and 44px minimum touch targets. Selected and status states require a non-color cue. Respect reduced-motion preferences.

Desktop modals are centered contained dialogs. Tablet and Mobile keep the same visual definition and may adapt width, wrapping, action stacking, and internal scrolling only. Trap focus, make the background inert, support Escape, and restore focus to the trigger.

On narrow screens, tables keep their semantic headers, row styling, information order, and financial alignment. If columns cannot fit, contain horizontal scrolling within a labelled table region; never allow page-level horizontal overflow and never turn rows into decorative cards.

## Truthfulness and Prohibited Patterns

Generate only from real fields and supported product actions. Distinguish loading, error, empty, and zero states. Never invent financial values, trends, insights, comparisons, charts, sections, controls, or actions.

Never introduce glassmorphism, gradients, fake sparklines, decorative analytics, bento marketing layouts, oversized hero headings, multiple visual directions, generic dashboard patterns, English navigation labels, breakpoint-specific component redesigns, or competing font systems.
