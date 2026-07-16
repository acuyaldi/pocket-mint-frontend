# Pocket Mint Public and Authentication Cohesion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Pocket Mint landing and authentication pages feel like one calm, product-first experience while preserving all authentication behavior and existing worktree changes.

**Architecture:** Keep the landing page as a Server Component composed around the existing `PocketMintHero` client leaf. Keep authentication logic and presentation in the existing login Client Component, changing only its rendered layout and styling. Use source-contract tests for the public and authentication surfaces, then verify the complete application with lint, build, and browser checks.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, Vitest, existing shadcn components, existing Framer Motion and Lucide dependencies.

## Global Constraints

- Preserve the current English and Bahasa Indonesia mix.
- Theme is locked light.
- Use Inter only.
- Use existing Pocket Mint semantic tokens, 12px default radii, and 16px large-container radii.
- Keep `DESIGN_VARIANCE: 5`, `MOTION_INTENSITY: 2`, and `VISUAL_DENSITY: 3`.
- Add no runtime dependencies, routes, generated imagery, or speculative abstractions.
- Do not change authentication server actions, Supabase behavior, field names, field order, autocomplete attributes, routes, or query-parameter handling.
- Do not add gradients, glass effects, blobs, glows, ornamental graphics, stock photography, bento marketing layouts, or a competing color system.
- Visible page copy must contain no em dash.
- Preserve existing uncommitted changes. Stage only the files named in each task and never restore deleted files.
- Before editing a Next.js file, read the applicable local documentation in `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`, `05-server-and-client-components.md`, and `12-images.md`.

## File map

- Modify `tests/landing-page.test.ts`: replace the obsolete Stitch bento contract with the approved product-led landing contract.
- Modify `app/page.tsx`: compose Privacy, Dashboard, Wallet, Transaction, Installment, CTA, and Footer around the existing hero.
- Keep `components/ui/pocket-mint-hero.tsx` behavior intact except for the smallest correction required by the updated contract.
- Create `tests/login-page.test.ts`: protect authentication modes, field contracts, accessibility labels, and the simplified visual structure.
- Modify `app/login/page.tsx`: simplify the desktop support panel and form shell without changing authentication logic.
- Modify `app/globals.css`: delete only decorative utilities proven unused after the page changes.

---

### Task 1: Replace the landing bento with a product-led sequence

**Files:**

- Modify: `tests/landing-page.test.ts`
- Modify: `app/page.tsx`
- Potential minimal correction: `components/ui/pocket-mint-hero.tsx`

**Interfaces:**

- Consumes: `PocketMintHero(): JSX.Element`, `PocketMintLogo`, local files under `public/landing`.
- Produces: section anchors `privacy`, `dashboard`, `wallet`, `transactions`, `installment`, `cta`, and `about`; the existing `/login` conversion path.

- [ ] **Step 1: Read the current diff and Next.js page, component, and image guidance**

Run:

```powershell
rtk git diff -- app/page.tsx components/ui/pocket-mint-hero.tsx tests/landing-page.test.ts
rtk powershell -NoProfile -Command "Get-Content -Raw 'node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md'; Get-Content -Raw 'node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md'; Get-Content -Raw 'node_modules/next/dist/docs/01-app/01-getting-started/12-images.md'"
```

Expected: the current uncommitted landing edits are visible, and the local Next.js guidance confirms a static page can remain a Server Component while `PocketMintHero` remains the client leaf.

- [ ] **Step 2: Write the failing landing contract**

Replace `tests/landing-page.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const page = readFileSync(root + "app/page.tsx", "utf8");
const heroPath = root + "components/ui/pocket-mint-hero.tsx";
const hero = readFileSync(heroPath, "utf8");

describe("Pocket Mint public experience contract", () => {
  it("uses the approved product-led section order", () => {
    const markers = [
      'id="privacy"',
      'id="dashboard"',
      'id="wallet"',
      'id="transactions"',
      'id="installment"',
      'id="cta"',
    ];
    const positions = markers.map((marker) => page.indexOf(marker));

    expect(positions.every((position) => position >= 0)).toBe(true);
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });

  it("uses every approved local product screen", () => {
    for (const asset of [
      "dashboard.png",
      "wallet.png",
      "transaction.png",
      "installment.png",
    ]) {
      expect(existsSync(root + `public/landing/${asset}`)).toBe(true);
      expect(page + hero).toContain(`/landing/${asset}`);
    }
  });

  it("keeps the centered hero and one conversion intent", () => {
    expect(page).toContain("<PocketMintHero />");
    expect(hero).toContain("Clarity Over Complexity");
    expect(hero).toContain("max-w-5xl");
    expect(hero).toContain('href="/login"');
    expect(hero).toContain("useReducedMotion");
    expect(page + hero).not.toMatch(/Moon|Sun|dark:|bg-gradient/);
  });

  it("removes the bento campaign treatment", () => {
    expect(page).not.toContain("stitch-bento");
    expect(page).not.toContain("Fitur Utama");
    expect(page).not.toContain("Hubungi Tim Kami");
    expect(page).not.toMatch(/device mockup|laptop|monitor/i);
  });

  it("keeps privacy before product and one final call to action", () => {
    expect(page).toContain("Data finansial Anda tetap milik Anda.");
    expect(page).toContain("Mulai bangun ruang kerja finansial privat Anda.");
    expect(page).toContain("Kebijakan Privasi");
    expect(page).toContain("Syarat & Ketentuan");
  });

  it("contains no em dash in visible source copy", () => {
    expect(page + hero).not.toContain("—");
  });
});
```

- [ ] **Step 3: Run the focused test and confirm the intended failure**

Run:

```powershell
rtk npm test -- tests/landing-page.test.ts
```

Expected: FAIL because `dashboard`, `wallet`, `transactions`, and `installment` anchors and the approved privacy copy are not all present.

- [ ] **Step 4: Implement the minimum product-led landing composition**

In `app/page.tsx`:

1. Remove the Lucide imports and the `largeSecondaryButton` constant.
2. Keep `Image`, `Link`, `PocketMintLogo`, `PocketMintHero`, and `largePrimaryButton`.
3. Define the local image paths exactly:

```ts
const screens = {
  dashboard: "/landing/dashboard.png",
  wallet: "/landing/wallet.png",
  transaction: "/landing/transaction.png",
  installment: "/landing/installment.png",
} as const;
```

4. Keep `<PocketMintHero />`, then replace the existing Privacy, Features, and CTA markup with this section structure and copy:

```tsx
<main className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">
  <section id="privacy" className="scroll-mt-20 border-b border-border py-16 md:py-24">
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)] lg:items-end">
      <div>
        <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-primary md:text-4xl">
          Data finansial Anda tetap milik Anda.
        </h2>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
          Pocket Mint membantu Anda membaca kondisi finansial tanpa iklan,
          pelacakan marketing, atau pengumpulan data yang tidak diperlukan.
        </p>
      </div>
      <div className="space-y-4 text-sm leading-6 text-muted-foreground">
        <p className="border-t border-border pt-4">Tanpa iklan.</p>
        <p className="border-t border-border pt-4">Tanpa pelacakan marketing.</p>
        <p className="border-t border-border pt-4">Hanya data yang diperlukan untuk workspace Anda.</p>
      </div>
    </div>
  </section>

  <section id="dashboard" className="scroll-mt-20 py-16 md:py-24">
    <div className="mb-8 max-w-xl">
      <h2 className="text-3xl font-semibold tracking-tight text-primary">Dashboard</h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">
        Lihat posisi keuangan Anda dalam satu ringkasan.
      </p>
    </div>
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
      <Image src={screens.dashboard} alt="Dashboard Pocket Mint" width={569} height={552} sizes="(max-width: 1280px) calc(100vw - 40px), 1200px" className="h-auto w-full object-contain" />
    </div>
  </section>

  <section className="grid gap-12 border-t border-border py-16 md:py-24 lg:grid-cols-2">
    <article id="wallet" className="scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight text-primary">Wallet</h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">Semua aset dan kewajiban dalam satu ledger.</p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
        <Image src={screens.wallet} alt="Wallet Pocket Mint" width={1200} height={900} sizes="(max-width: 1023px) calc(100vw - 40px), 560px" className="h-auto w-full object-contain" />
      </div>
    </article>
    <article id="transactions" className="scroll-mt-20">
      <h2 className="text-2xl font-semibold tracking-tight text-primary">Transaction</h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">Riwayat yang cepat dicari dan mudah diperbaiki.</p>
      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
        <Image src={screens.transaction} alt="Transaction Pocket Mint" width={1200} height={900} sizes="(max-width: 1023px) calc(100vw - 40px), 560px" className="h-auto w-full object-contain" />
      </div>
    </article>
  </section>

  <section id="installment" className="scroll-mt-20 border-t border-border py-16 md:py-24">
    <div className="mb-8 max-w-xl">
      <h2 className="text-3xl font-semibold tracking-tight text-primary">Installment</h2>
      <p className="mt-3 text-base leading-7 text-muted-foreground">Pantau kewajiban tanpa kehilangan tanggal jatuh tempo.</p>
    </div>
    <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
      <Image src={screens.installment} alt="Installment Pocket Mint" width={1200} height={900} sizes="(max-width: 1280px) calc(100vw - 40px), 1200px" className="h-auto w-full object-contain" />
    </div>
  </section>

  <section id="cta" className="border-t border-border py-20 text-center md:py-28">
    <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-primary md:text-4xl">
      Mulai bangun ruang kerja finansial privat Anda.
    </h2>
    <Link href="/login" className={`${largePrimaryButton} mt-8`}>Mulai Sekarang</Link>
  </section>
</main>
```

5. Keep the existing footer and `id="about"`, but remove any decorative footer treatment. Preserve `Kebijakan Privasi` and `Syarat & Ketentuan`.
6. In `pocket-mint-hero.tsx`, make no structural change unless the focused test exposes a mismatch. If needed, remove only duplicate conversion copy or an em dash while retaining the centered composition, `useReducedMotion`, and `/landing/dashboard.png`.

- [ ] **Step 5: Run the focused landing contract**

Run:

```powershell
rtk npm test -- tests/landing-page.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit only the landing task files**

Run:

```powershell
rtk git diff --check -- app/page.tsx components/ui/pocket-mint-hero.tsx tests/landing-page.test.ts
rtk git add app/page.tsx components/ui/pocket-mint-hero.tsx tests/landing-page.test.ts
rtk git commit -m "feat: align landing with product-led story"
```

Expected: one commit containing only the three named files. Do not stage image changes or deleted files.

---

### Task 2: Simplify the authentication shell without changing behavior

**Files:**

- Create: `tests/login-page.test.ts`
- Modify: `app/login/page.tsx`

**Interfaces:**

- Consumes: existing `login`, `signup`, `signInWithGoogle`, `createClient`, `Button`, `Input`, `Card`, and query parameters `error` and `message`.
- Produces: unchanged form names `name`, `email`, `password`, `confirmPassword`; unchanged modes `signin`, `signup`, `forgot`.

- [ ] **Step 1: Write the failing authentication presentation contract**

Create `tests/login-page.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const loginPage = readFileSync(root + "app/login/page.tsx", "utf8");

describe("Pocket Mint authentication page contract", () => {
  it("preserves every authentication mode and action", () => {
    for (const value of [
      '"signin"',
      '"signup"',
      '"forgot"',
      "login(formData)",
      "signup(formData)",
      "signInWithGoogle()",
      "resetPasswordForEmail",
    ]) {
      expect(loginPage).toContain(value);
    }
  });

  it("preserves field and autocomplete contracts", () => {
    for (const name of ["name", "email", "password", "confirmPassword"]) {
      expect(loginPage).toContain(`name="${name}"`);
    }
    for (const autocomplete of ["name", "email", "new-password", "current-password"]) {
      expect(loginPage).toContain(`"${autocomplete}"`);
    }
  });

  it("keeps accessible status and password controls", () => {
    expect(loginPage).toContain('role="alert"');
    expect(loginPage).toContain('showPassword ? "Hide password" : "Show password"');
    expect(loginPage).toContain("disabled={busy}");
    expect(loginPage).toContain("Check your email inbox for the password reset link.");
  });

  it("uses a quiet split shell with the form first on mobile", () => {
    expect(loginPage).toContain("PRIVATE FINANCIAL WORKSPACE");
    expect(loginPage).toContain("order-2");
    expect(loginPage).toContain("order-1");
    expect(loginPage).not.toContain("surface-grid");
    expect(loginPage).not.toContain("radial-gradient");
    expect(loginPage).not.toContain("SECURE FINTECH WORKSPACE");
    expect(loginPage).not.toContain("ENCRYPTED ACCESS | PRIVACY-FIRST");
  });

  it("contains no em dash in visible source copy", () => {
    expect(loginPage).not.toContain("—");
  });
});
```

- [ ] **Step 2: Run the focused test and verify the visual contract fails**

Run:

```powershell
rtk npm test -- tests/login-page.test.ts
```

Expected: FAIL because the current page still contains `surface-grid`, radial gradients, the fintech badge, the promotional text strip, and an em dash.

- [ ] **Step 3: Replace only the authentication presentation shell**

In `app/login/page.tsx`:

1. Keep all state, validation, handlers, forms, field names, and actions unchanged.
2. Keep `ShieldCheck`, `Wallet`, and `CalendarClock`, but change `accessHighlights` copy to:

```ts
const accessHighlights = [
  { label: "Encrypted access", value: "Secure email and Google sign-in", icon: ShieldCheck },
  { label: "Readable obligations", value: "Assets, debt, and cicilan in one workspace", icon: Wallet },
  { label: "Private by default", value: "Your financial data stays under your control", icon: CalendarClock },
];
```

3. Replace the outer two wrappers with:

```tsx
<div className="min-h-[100dvh] bg-background px-5 py-5 text-foreground md:px-8 md:py-8">
  <div className="mx-auto grid min-h-[calc(100dvh-2.5rem)] w-full max-w-7xl overflow-hidden rounded-2xl border border-border bg-card md:min-h-[calc(100dvh-4rem)] lg:grid-cols-[minmax(0,1fr)_440px]">
```

4. Replace the entire current left section with:

```tsx
<section className="order-2 flex flex-col justify-between border-t border-border bg-muted px-6 py-10 sm:px-10 lg:order-1 lg:border-r lg:border-t-0 lg:px-12 lg:py-12">
  <div>
    <PocketMintLogo wrapperClassName="text-primary" markSize={32} />
    <div className="mt-16 max-w-xl lg:mt-28">
      <p className="text-xs font-semibold tracking-[0.08em] text-muted-foreground">
        PRIVATE FINANCIAL WORKSPACE
      </p>
      <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight text-foreground lg:text-5xl">
        Your numbers stay readable, private, and under your control.
      </h1>
      <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
        Return to one workspace for assets, debt, transactions, and cicilan.
      </p>
    </div>
    <div className="mt-12 max-w-xl">
      {accessHighlights.map((highlight) => {
        const Icon = highlight.icon;
        return (
          <div key={highlight.label} className="grid grid-cols-[24px_1fr] gap-4 border-t border-border py-4">
            <Icon aria-hidden="true" className="mt-0.5 size-5 text-primary" strokeWidth={1.75} />
            <div>
              <p className="text-sm font-semibold text-foreground">{highlight.label}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{highlight.value}</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</section>
```

5. Change the form section opening tag to:

```tsx
<section className="order-1 flex items-center justify-center px-5 py-8 sm:px-8 lg:order-2">
```

6. Change the `Card` class to:

```tsx
className="w-full max-w-md border-border bg-card py-0 shadow-none"
```

7. Remove the logo block from `CardHeader`; the shared logo remains in the support panel.
8. Replace every `bg-white`, `border-white`, and transparency-based shell class with `bg-card`, `border-border`, or an existing semantic token. Do not alter form layout, labels, inputs, messages, buttons, or actions.
9. Replace the sentence containing the em dash with `Pocket Mint keeps the numbers direct, precise, and under your control from the first screen onward.` if it remains after the left-panel replacement.

- [ ] **Step 4: Run the authentication contract**

Run:

```powershell
rtk npm test -- tests/login-page.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run existing authentication and logo regression tests**

Run:

```powershell
rtk npm test -- tests/session-token.test.ts tests/sync-user.test.ts tests/logo-system.test.ts tests/login-page.test.ts
```

Expected: PASS with the existing authentication actions and shared logo integration intact.

- [ ] **Step 6: Commit only the authentication task files**

Run:

```powershell
rtk git diff --check -- app/login/page.tsx tests/login-page.test.ts
rtk git add app/login/page.tsx tests/login-page.test.ts
rtk git commit -m "feat: simplify authentication experience"
```

Expected: one commit containing only `app/login/page.tsx` and `tests/login-page.test.ts`.

---

### Task 3: Remove obsolete decoration and verify the complete experience

**Files:**

- Modify: `tests/landing-page.test.ts`
- Modify: `app/globals.css`

**Interfaces:**

- Consumes: completed landing and authentication compositions.
- Produces: a stylesheet without now-unused Stitch animation helpers, while preserving shared `surface-panel` and `surface-card` utilities used by authenticated screens.

- [ ] **Step 1: Prove which decorative utilities are unused**

Run:

```powershell
rtk rg -n "stitch-float|stitch-bento|animate-gradient|animate-shake|delay-1000|delay-2000" app components tests --glob "!app/globals.css"
```

Expected: no matches after Tasks 1 and 2. If any match remains outside the redesigned pages, preserve that utility and exclude it from the next test.

- [ ] **Step 2: Add a failing stylesheet cleanup contract**

Add these declarations beside the existing `page` and `hero` test fixtures in `tests/landing-page.test.ts`:

```ts
const globals = readFileSync(root + "app/globals.css", "utf8");
```

Add this test inside the existing `describe` block:

```ts
it("removes obsolete landing decoration utilities", () => {
  for (const utility of [
    ".stitch-float",
    ".stitch-bento",
    ".animate-gradient",
    ".animate-shake",
    ".delay-1000",
    ".delay-2000",
  ]) {
    expect(globals).not.toContain(utility);
  }
});
```

- [ ] **Step 3: Run the focused test and verify it fails**

Run:

```powershell
rtk npm test -- tests/landing-page.test.ts
```

Expected: FAIL because one or more obsolete utility selectors remain in `app/globals.css`.

- [ ] **Step 4: Delete only the proven-unused CSS blocks**

Remove these complete blocks from `app/globals.css`:

```css
@keyframes stitch-float {
  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-10px);
  }
}

.stitch-float {
  animation: stitch-float 6s ease-in-out infinite;
}

.stitch-bento {
  transition: transform 200ms ease-in-out;
}

.stitch-bento:hover {
  transform: translateY(-4px);
}

@keyframes gradient {
  0%,
  100% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 3s ease infinite;
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }

  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-4px);
  }

  20%,
  40%,
  60%,
  80% {
    transform: translateX(4px);
  }
}

.animate-shake {
  animation: shake 0.5s;
}

.delay-1000 {
  animation-delay: 1000ms;
}

.delay-2000 {
  animation-delay: 2000ms;
}
```

Keep the reduced-motion media query and the shared `surface-panel`, `surface-card`, `surface-grid`, and token definitions unless repository search separately proves one is unused everywhere.

- [ ] **Step 5: Run focused and full automated verification**

Run:

```powershell
rtk npm test -- tests/landing-page.test.ts tests/login-page.test.ts
rtk npm test
rtk npm run lint
rtk npm run build
```

Expected: every command exits 0 with no test failures, lint errors, TypeScript errors, or production-build errors.

- [ ] **Step 6: Run the design pre-flight source checks**

Run:

```powershell
rtk rg -n "—|stitch-bento|radial-gradient|bg-gradient|h-screen|SECURE FINTECH WORKSPACE|ENCRYPTED ACCESS \| PRIVACY-FIRST" app/page.tsx app/login/page.tsx components/ui/pocket-mint-hero.tsx
rtk rg -n "dark:|window.addEventListener\('scroll'\)|window.addEventListener\(\"scroll\"" app/page.tsx app/login/page.tsx components/ui/pocket-mint-hero.tsx
```

Expected: no matches. If `h-screen` is reported, replace it with `min-h-[100dvh]` and rerun the relevant contract test.

- [ ] **Step 7: Verify desktop and mobile rendering**

Start the existing development server:

```powershell
rtk npm run dev
```

Using the in-app Browser workflow, inspect `/` and `/login` at approximately 1440px and 390px widths. Verify:

- Navbar remains one line on desktop and usable on mobile.
- The hero CTA and Dashboard visual are visible without horizontal overflow.
- Privacy precedes Dashboard, Wallet, Transaction, and Installment.
- Screenshots are not clipped through meaningful labels, values, rows, or controls.
- The login form appears before supporting context on mobile.
- Sign-in, sign-up, forgot-password, password visibility, disabled loading, success, and error states retain their controls and dimensions.
- Focus indicators are visible and contrast remains readable.
- Reduced-motion emulation removes positional entrance movement.

Expected: both routes match the approved quiet product-workspace direction at desktop and mobile widths.

- [ ] **Step 8: Commit stylesheet cleanup and contract update**

Run:

```powershell
rtk git diff --check -- app/globals.css tests/landing-page.test.ts
rtk git add app/globals.css tests/landing-page.test.ts
rtk git commit -m "chore: remove obsolete landing decoration"
```

Expected: one commit containing only the stylesheet cleanup and its contract test.

- [ ] **Step 9: Confirm unrelated worktree changes remain untouched**

Run:

```powershell
rtk git status --short
rtk git log -4 --oneline
```

Expected: the three implementation commits plus the design documentation commit are present. Pre-existing image, generated type, audit, and deletion changes remain exactly as the user left them unless a named task explicitly consumed one.
