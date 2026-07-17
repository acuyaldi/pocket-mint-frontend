# Pocket Mint Landing Page Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing marketing-heavy landing page with a concise, trust-first Pocket Mint product introduction using only approved Google Stitch screenshots.

**Architecture:** Keep the landing page as a single Next.js App Router server page. Store the four approved Stitch screenshots under `public/landing`, render them through one local screenshot-frame component, and encode the approved page order directly in semantic sections. Use a source-level Vitest contract to protect required copy, section order, asset paths, and prohibited startup-pitch content.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript, Tailwind CSS 4, Next Image, Vitest 4.1.10

## Global Constraints

- Preserve `Clarity Over Complexity` exactly.
- Section order is Navbar, Hero, Privacy, Dashboard, Wallet and Transaction, Installment, CTA, Footer.
- Use only approved Google Stitch screenshots from `stitch_pocket_mint_design_system(4).zip`.
- Crop screenshots by product message, never by automatic center crop.
- Do not add gradients, glass, blobs, stock photography, social proof, user counts, ratings, testimonials, pricing, FAQ, or a why-choose section.
- Use Inter and existing Pocket Mint semantic tokens only.
- Use no new runtime dependencies.
- Do not modify authentication, backend APIs, financial logic, or authenticated screens.
- Keep visible page copy free of em dash and en dash characters.

---

### Task 1: Add the landing-page contract test

**Files:**
- Create: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: `app/page.tsx` source and assets under `public/landing`
- Produces: A regression contract for approved order, copy, asset paths, and prohibited content

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const page = readFileSync(root + "app/page.tsx", "utf8");

describe("Pocket Mint landing page contract", () => {
  it("keeps the approved section order", () => {
    const markers = [
      'id="privacy"',
      'id="dashboard"',
      'id="product-pair"',
      'id="installment"',
      'id="cta"',
    ];
    const positions = markers.map((marker) => page.indexOf(marker));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("uses the approved concise copy", () => {
    for (const copy of [
      "Clarity Over Complexity",
      "Data finansial Anda tetap milik Anda.",
      "Lihat posisi keuangan Anda dalam satu ringkasan.",
      "Semua aset dan kewajiban dalam satu ledger.",
      "Riwayat yang cepat dicari dan mudah diperbaiki.",
      "Pantau kewajiban tanpa kehilangan tanggal jatuh tempo.",
      "Mulai bangun ruang kerja finansial privat Anda.",
    ]) {
      expect(page).toContain(copy);
    }
  });

  it("does not contain startup-pitch content", () => {
    for (const forbidden of [
      "Trusted by",
      "10,000",
      "★★★★★",
      "Kenapa memilih Pocket Mint",
      "testimonial",
    ]) {
      expect(page).not.toContain(forbidden);
    }
    expect(page).not.toMatch(/[—–]/);
  });

  it("references four approved local Stitch assets", () => {
    for (const asset of [
      "dashboard.png",
      "wallet.png",
      "transaction.png",
      "installment.png",
    ]) {
      expect(existsSync(root + `public/landing/${asset}`)).toBe(true);
      expect(page).toContain(`/landing/${asset}`);
    }
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- tests/landing-page.test.ts`

Expected: FAIL because the approved section markers, copy, and local Stitch assets do not exist yet.

- [ ] **Step 3: Commit the failing contract test**

```bash
git add tests/landing-page.test.ts
git commit -m "test: define landing page contract"
```

### Task 2: Add approved Stitch assets and implement the landing page

**Files:**
- Create: `public/landing/dashboard.png`
- Create: `public/landing/wallet.png`
- Create: `public/landing/transaction.png`
- Create: `public/landing/installment.png`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `PocketMintLogo`, `buttonVariants`, `cn`, existing `/login` route, and approved Stitch PNGs
- Produces: Default `LandingPage` server component at `/`

- [ ] **Step 1: Copy the approved assets**

Copy these exact ZIP entries without image generation or interface reconstruction:

```text
pocket_mint_dashboard_wallet_centric_layout/screen.png -> public/landing/dashboard.png
pocket_mint_dompet_refined_with_actions_desktop/screen.png -> public/landing/wallet.png
pocket_mint_transaksi_desktop_master_aligned/screen.png -> public/landing/transaction.png
pocket_mint_cicilan_desktop_prioritized_actions/screen.png -> public/landing/installment.png
```

- [ ] **Step 2: Replace the page with the approved composition**

Implement `app/page.tsx` with these exact local interfaces and semantic regions:

```tsx
type ProductScreenProps = {
  src: string;
  alt: string;
  imageClassName: string;
  sizes: string;
};

function ProductScreen({
  src,
  alt,
  imageClassName,
  sizes,
}: ProductScreenProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(15,23,42,0.08)]">
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={cn("max-w-none object-cover", imageClassName)}
      />
    </div>
  );
}
```

The page structure must be:

```tsx
<div className="min-h-dvh bg-background text-foreground">
  <header>{/* brand, Fitur, Privasi, Login, Daftar */}</header>
  <main>
    <section aria-labelledby="hero-title">{/* copy + Dashboard visual */}</section>
    <section id="privacy">{/* ownership + three privacy points */}</section>
    <section id="dashboard">{/* one-line copy + Dashboard message crop */}</section>
    <section id="product-pair">
      <article>{/* Wallet copy + Wallet message crop */}</article>
      <article>{/* Transaction copy + Transaction message crop */}</article>
    </section>
    <section id="installment">{/* one-line copy + Installment message crop */}</section>
    <section id="cta">{/* one message + one primary CTA */}</section>
  </main>
  <footer>{/* exact minimal links */}</footer>
</div>
```

Use these screenshot-window intentions:

```text
Hero Dashboard: coherent broad product view with the dashboard hero and supporting content visible.
Dashboard showcase: hero card, wallet overview, and recent activity.
Wallet: wallet list and summary context, with asset and liability values intact.
Transaction: search, filters, and representative journal rows.
Installment: reminder, obligation cards, due dates, and repayment progress.
```

Use explicit responsive image transforms or object positions for each window. Do not use a shared automatic `object-center` crop.

- [ ] **Step 3: Run the contract test**

Run: `npm test -- tests/landing-page.test.ts`

Expected: PASS with 4 passing tests.

- [ ] **Step 4: Run static verification**

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0 and `/` generated successfully.

- [ ] **Step 5: Commit the implementation**

```bash
git add app/page.tsx public/landing tests/landing-page.test.ts
git commit -m "feat: refine landing page with Stitch screens"
```

### Task 3: Perform responsive visual QA and refine semantic crops

**Files:**
- Modify if needed: `app/page.tsx`

**Interfaces:**
- Consumes: Rendered `/` page and the crop intentions from Task 2
- Produces: Verified desktop and mobile landing page

- [ ] **Step 1: Inspect desktop at 1440 by 1000**

Verify visually:

```text
The hero headline, supporting copy, both CTAs, and Dashboard visual fit in the first viewport.
Privacy immediately follows the hero.
Dashboard crop shows Hero Card, Wallet Overview, and Recent Activity as one coherent message.
Wallet and Transaction form a balanced two-column section.
Installment crop keeps reminder, cards, due dates, and progress together.
There is no decorative animation, fake browser frame, stock image, or startup social proof.
```

- [ ] **Step 2: Inspect mobile at 390 by 844**

Verify visually:

```text
The page has no horizontal overflow.
Hero copy precedes the Dashboard image.
Wallet stacks before Transaction.
Every screenshot has a deliberate mobile crop and no important label or value is cut.
Buttons remain at least 44px high and labels stay on one line.
```

- [ ] **Step 3: Inspect runtime health**

Check the browser console after desktop and mobile navigation.

Expected: no application errors, hydration errors, missing-image errors, or accessibility warnings caused by the landing page.

- [ ] **Step 4: Apply only evidence-based crop or spacing corrections**

If a semantic region is cut, change only the affected screenshot height, transform, or object position in `app/page.tsx`. Do not add new sections, copy, decorations, or dependencies.

- [ ] **Step 5: Run the complete verification suite**

Run: `npm test`

Expected: all tests pass.

Run: `npm run lint`

Expected: exit code 0.

Run: `npm run build`

Expected: exit code 0.

- [ ] **Step 6: Commit visual refinements if any**

```bash
git add app/page.tsx
git commit -m "fix: refine landing screenshot crops"
```

Skip this commit if visual QA requires no code changes.
