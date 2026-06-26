---
name: Pro-Fintech Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bccabb'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#869486'
  outline-variant: '#3d4a3e'
  surface-tint: '#4de082'
  primary: '#6bfb9a'
  on-primary: '#003919'
  primary-container: '#4ade80'
  on-primary-container: '#005e2d'
  inverse-primary: '#006d36'
  secondary: '#bcc7de'
  on-secondary: '#263143'
  secondary-container: '#3e495d'
  on-secondary-container: '#aeb9d0'
  tertiary: '#ffd9c1'
  on-tertiary: '#4f2500'
  tertiary-container: '#ffb47f'
  on-tertiary-container: '#794418'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#6dfe9c'
  primary-fixed-dim: '#4de082'
  on-primary-fixed: '#00210c'
  on-primary-fixed-variant: '#005227'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#ffdcc6'
  tertiary-fixed-dim: '#ffb784'
  on-tertiary-fixed: '#301400'
  on-tertiary-fixed-variant: '#6c3a0f'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Hanken Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-md:
    fontFamily: Hanken Grotesk
    fontSize: 20px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  container-max: 1280px
  gutter: 20px
---

## Brand & Style
The design system is engineered for high-stakes financial environments, prioritizing clarity, precision, and a premium "pro" aesthetic. It utilizes a **High-Contrast Modern** style, leaning into the sophistication of deep blacks and the energy of vibrant mint accents. 

The brand personality is authoritative yet forward-thinking. It evokes a sense of security and technological edge through sharp execution and controlled use of color. The interface focuses on "data-density without clutter," using depth and contrast rather than excessive decoration to guide the user's eye.

## Colors
The palette is rooted in a "Deep Black" (#000000) foundation to maximize OLED efficiency and provide the highest possible contrast for data visualization. 

- **Primary:** "Pocket Mint" (#4ade80) is reserved for growth, success, primary actions, and brand identification.
- **Surface Strategy:** We use a tiered gray system (Slate and Charcoal) to create a sense of physical layering. Higher elevation components use lighter shades of dark gray to "lift" off the pure black background.
- **Functional Colors:** Red is used sparingly for risk/loss, while the Mint remains the hero color for all positive interactions.

## Typography
The typography system balances the precision of developer-centric tools with the approachability of a modern fintech app.

- **Headlines:** Uses **Hanken Grotesk** for a sharp, contemporary look that feels professional and technical.
- **Body:** **Inter** provides maximum legibility for financial statements and dense data tables.
- **Data Labels:** **JetBrains Mono** is utilized for transaction IDs, numerical data, and timestamps to emphasize the "pro-fintech" technical nature of the platform.

## Layout & Spacing
The design system employs a **12-column fluid grid** for desktop and a **4-column grid** for mobile. 

A strict **4px baseline grid** governs all vertical rhythm. Large margins (24px+) are used on the edges of the screen to create a "contained" feel that mirrors premium terminal software. Data-dense areas (like portfolios or watchlists) should use the `sm` (8px) and `md` (16px) tokens to keep information compact but readable.

## Elevation & Depth
In this high-contrast dark mode, depth is communicated through **Tonal Layering** rather than traditional shadows.

1.  **Level 0 (Floor):** Pure Black (#000000) for the main application background.
2.  **Level 1 (Cards):** Deep Charcoal (#0a0a0a) with a subtle 1px border (#262626).
3.  **Level 2 (Modals/Popovers):** Slate Gray (#111111) with a sharper, more visible border.

Shadows are used only on Level 2 and 3 components, appearing as a subtle, large-radius "glow" of deep black to create a silhouette against lower layers, never as a light-source shadow.

## Shapes
This design system uses a **Soft (0.25rem)** roundedness profile. This specific radius strikes a balance between the aggressive "sharpness" of institutional trading platforms and the friendliness of consumer fintech. 

- **Buttons & Inputs:** Use the base 4px (0.25rem) radius.
- **Cards & Containers:** Use the `rounded-lg` 8px (0.5rem) radius for a more structural appearance.
- **Status Pills:** Use a full pill-shape for high-contrast distinction from interactive buttons.

## Components

- **Buttons:** 
  - *Primary:* Solid Mint background with Black text for maximum impact. 
  - *Secondary:* Ghost style with a Mint border and Mint text.
  - *Tertiary:* All-white text on a transparent background for low-priority actions.
- **Input Fields:** Dark background (#0a0a0a) with a subtle border. On focus, the border transitions to Mint with a subtle outer glow.
- **Cards:** Used to group financial data. They should never have a background lighter than #111111 to maintain the dark-mode aesthetic.
- **Chips/Badges:** For status updates (e.g., "Market Open"). These use a low-opacity Mint background with high-opacity Mint text.
- **Lists:** Transaction lists should use thin, #1a1a1a dividers. Hover states for list items should use a subtle highlight of #111111.
- **Data Visualization:** Line charts and bars should use the Primary Mint for positive trends and a muted "Rose" or "Coral" for negative trends, ensuring they pop against the deep black background.