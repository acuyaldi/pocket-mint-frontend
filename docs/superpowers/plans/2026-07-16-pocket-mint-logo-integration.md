# Pocket Mint Logo Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every frontend brand treatment with the approved Pocket Fold logo and favicon.

**Architecture:** Keep `components/Logo.tsx` as the only runtime logo implementation and render the exact approved path with a live-text wordmark. Existing pages consume that component; Next.js serves the approved SVG through its `app/icon.svg` metadata convention.

**Tech Stack:** Next.js 16.2.9 App Router, React 19.2.4, TypeScript, Tailwind CSS 4, Vitest 4.1.10.

## Global Constraints

- Do not redraw or alter the approved Pocket Fold path geometry.
- Use a horizontal lockup for landing navigation/footer, authentication, and the expanded application sidebar.
- Use `currentColor` for runtime logo color and the fixed Slate `#0F172A` favicon.
- Do not add dependencies, logo effects, badges, alternate variants, or taglines.
- Preserve unrelated working-tree changes in landing files and tests.

---

### Task 1: Approved Logo Component and Contract Test

**Files:**
- Create: `tests/logo-system.test.ts`
- Modify: `components/Logo.tsx`

**Interfaces:**
- Consumes: approved path data from `pocket-mint-docs/docs/product/stictch/core/logo/pocket-fold.svg`
- Produces: `PocketMintLogo({ className?, markSize?, showText?, wrapperClassName? }): React.JSX.Element`

- [ ] **Step 1: Write the failing logo contract test**

Create `tests/logo-system.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const frontendRoot = fileURLToPath(new URL("../", import.meta.url));
const logo = readFileSync(frontendRoot + "components/Logo.tsx", "utf8");
const approvedPath =
  "M5 1.75h12L13.75 5h-7A1.5 1.5 0 0 0 5.25 6.5v11.25a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V9l3.5-3.5V19A3.25 3.25 0 0 1 19 22.25H5A3.25 3.25 0 0 1 1.75 19V5A3.25 3.25 0 0 1 5 1.75Z";

describe("Pocket Mint logo system", () => {
  it("uses the approved Pocket Fold geometry and accessible live-text lockup", () => {
    expect(logo).toContain('viewBox="0 0 24 24"');
    expect(logo).toContain(approvedPath);
    expect(logo).toContain('fill="currentColor"');
    expect(logo).toContain('aria-label="Pocket Mint"');
    expect(logo).toContain("Pocket Mint");
    expect(logo).not.toContain("M6 10V28H26V10");
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm test -- tests/logo-system.test.ts`

Expected: FAIL because the old geometry remains and `app/icon.svg` does not exist.

- [ ] **Step 3: Replace the legacy component with the minimal approved implementation**

Replace `components/Logo.tsx` with:

```tsx
interface LogoProps {
  className?: string;
  markSize?: number;
  showText?: boolean;
  wrapperClassName?: string;
}

export function PocketMintLogo({
  className,
  markSize = 24,
  showText = true,
  wrapperClassName,
}: LogoProps) {
  return (
    <span
      className={wrapperClassName}
      role="img"
      aria-label="Pocket Mint"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: markSize / 4,
        color: "currentColor",
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={markSize}
        height={markSize}
        className={`shrink-0 ${className ?? ""}`}
        aria-hidden="true"
        focusable="false"
      >
        <path
          fill="currentColor"
          d="M5 1.75h12L13.75 5h-7A1.5 1.5 0 0 0 5.25 6.5v11.25a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V9l3.5-3.5V19A3.25 3.25 0 0 1 19 22.25H5A3.25 3.25 0 0 1 1.75 19V5A3.25 3.25 0 0 1 5 1.75Z"
        />
      </svg>
      {showText ? (
        <span
          aria-hidden="true"
          style={{
            fontSize: markSize * 0.75,
            fontWeight: 600,
            lineHeight: 1,
            letterSpacing: "-0.0125em",
            whiteSpace: "nowrap",
          }}
        >
          Pocket Mint
        </span>
      ) : null}
    </span>
  );
}
```

- [ ] **Step 4: Run the focused test**

Run: `npm test -- tests/logo-system.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit the independently reviewable component change**

```bash
git add components/Logo.tsx tests/logo-system.test.ts
git commit -m "feat: adopt approved Pocket Fold logo"
```

---

### Task 2: Frontend Integration and Official Favicon

**Files:**
- Modify: `components/ui/pocket-mint-hero.tsx`
- Modify: `app/page.tsx`
- Modify: `app/login/page.tsx`
- Modify: `app/auth/reset-password/page.tsx`
- Modify: `components/layout/app-sidebar.tsx`
- Create: `app/icon.svg`
- Delete: `app/favicon.ico`
- Modify: `tests/logo-system.test.ts`

**Interfaces:**
- Consumes: `PocketMintLogo({ className?, markSize?, showText?, wrapperClassName? })` from Task 1
- Produces: consistent brand lockups across every visible frontend identity surface

- [ ] **Step 1: Extend the integration contract test**

Add `existsSync` to the `node:fs` import, then append these constants and tests inside `tests/logo-system.test.ts`:

```ts
const integrationFiles = [
  "components/ui/pocket-mint-hero.tsx",
  "app/page.tsx",
  "app/login/page.tsx",
  "app/auth/reset-password/page.tsx",
  "components/layout/app-sidebar.tsx",
];

it("uses the shared lockup on every frontend brand surface", () => {
  for (const file of integrationFiles) {
    const source = readFileSync(frontendRoot + file, "utf8");
    expect(source, file).toContain("PocketMintLogo");
  }

  const sidebar = readFileSync(
    frontendRoot + "components/layout/app-sidebar.tsx",
    "utf8"
  );
  expect(sidebar).not.toContain("Private Financial Workspace");
});

it("installs the approved file-based app icon", () => {
  expect(existsSync(frontendRoot + "app/icon.svg")).toBe(true);
  expect(existsSync(frontendRoot + "app/favicon.ico")).toBe(false);
});
```

- [ ] **Step 2: Run the focused test and verify the new assertion fails**

Run: `npm test -- tests/logo-system.test.ts`

Expected: FAIL for landing and sidebar files that do not yet import `PocketMintLogo`.

- [ ] **Step 3: Integrate the shared lockup without changing surrounding behavior**

Add `import { PocketMintLogo } from "@/components/Logo";` where absent, then make these exact replacements:

```tsx
// components/ui/pocket-mint-hero.tsx, landing navigation link
<Link href="/" className="inline-flex min-h-11 items-center text-primary">
  <PocketMintLogo />
</Link>

// app/page.tsx, footer link
<Link href="/" className="inline-flex text-primary">
  <PocketMintLogo />
</Link>

// components/layout/app-sidebar.tsx, replace heading and tagline
<PocketMintLogo wrapperClassName="text-primary" />

// app/login/page.tsx, both authentication lockups
<PocketMintLogo wrapperClassName="text-primary" markSize={32} />

// app/auth/reset-password/page.tsx, identity lockup without an added badge
<PocketMintLogo wrapperClassName="text-primary" markSize={32} />
```

Remove the wrapper around the reset logo that draws a bordered/background badge. Keep the adjacent `SECURE RESET` status pill because it is UI status, not part of the logo.

- [ ] **Step 4: Install the official app icon**

Copy the exact contents of `pocket-mint-docs/docs/product/stictch/core/logo/favicon.svg` to `app/icon.svg`, then remove `app/favicon.ico`. The resulting file must be:

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" role="img" aria-label="Pocket Mint">
  <title>Pocket Mint</title>
  <path fill="#0F172A" d="M5 1.75h12L13.75 5h-7A1.5 1.5 0 0 0 5.25 6.5v11.25a1.5 1.5 0 0 0 1.5 1.5h10.5a1.5 1.5 0 0 0 1.5-1.5V9l3.5-3.5V19A3.25 3.25 0 0 1 19 22.25H5A3.25 3.25 0 0 1 1.75 19V5A3.25 3.25 0 0 1 5 1.75Z"/>
</svg>
```

- [ ] **Step 5: Run focused and full verification**

Run in order:

```bash
npm test -- tests/logo-system.test.ts
npm test
npm run lint
npm run build
```

Expected: every command exits 0. If unrelated pre-existing landing contract assertions fail, record them separately and do not rewrite unrelated user changes.

- [ ] **Step 6: Commit only logo integration files**

```bash
git add components/Logo.tsx components/ui/pocket-mint-hero.tsx app/page.tsx app/login/page.tsx app/auth/reset-password/page.tsx components/layout/app-sidebar.tsx app/icon.svg app/favicon.ico tests/logo-system.test.ts
git commit -m "feat: apply Pocket Mint logo across frontend"
```
