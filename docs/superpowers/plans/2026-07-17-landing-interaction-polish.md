# Landing Interaction Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Memperbaiki warna teks CTA saat hover, mengarahkan pulse beams hero ke CTA, menganimasikan card privasi, dan menyamakan badge nomor vertical tabs dengan card privasi.

**Architecture:** Pertahankan `app/page.tsx` sebagai server component dan pindahkan hanya stack card privasi yang membutuhkan Framer Motion ke client component kecil. Gunakan utility Tailwind untuk state hover/focus, lalu perluas geometry dan arah gradient pada `PulseBeams` tanpa mengubah varian login.

**Tech Stack:** Next.js 16.2.9, React 19.2.4, TypeScript, Tailwind CSS 4, Framer Motion 12.40.0, Vitest 4.1.10.

## Global Constraints

- Tidak menambah dependency.
- Copy, route, urutan section, data tab, autoplay, gambar, login panel, backend, dan authenticated workspace tidak berubah.
- Gunakan token warna Pocket Mint; teks hover memakai `primary` (`#001414`).
- Geometry beam harus deterministik dan semua animasi menghormati reduced motion.
- Card privasi tetap informasional: tanpa click handler dan tanpa cursor pointer.
- Jangan stage atau commit perubahan implementation karena file target sudah memiliki perubahan user yang belum dikomit; verifikasi diff dan serahkan worktree tetap tidak ter-stage.

---

### Task 1: CTA Hover Text Contrast

**Files:**
- Modify: `tests/landing-page.test.ts`
- Modify: `components/ui/pocket-mint-hero.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: class utility `landing-cta-sweep` dari `app/globals.css`.
- Produces: setiap CTA sweep memiliki `hover:text-primary focus-visible:text-primary` yang menang terhadap `text-primary-foreground` bawaan `buttonVariants`.

- [ ] **Step 1: Write the failing source contract**

Tambahkan test berikut ke `tests/landing-page.test.ts`:

```ts
it("keeps CTA text dark over the mint hover sweep", () => {
  const heroCtas =
    hero.match(
      /landing-cta-sweep[^\n]*hover:text-primary focus-visible:text-primary/g
    ) ?? [];
  expect(heroCtas).toHaveLength(2);
  expect(page).toContain("hover:text-primary focus-visible:text-primary");
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: `npm test -- tests/landing-page.test.ts`

Expected: FAIL karena CTA `Daftar`, CTA hero, dan CTA akhir belum semuanya memiliki utility warna state eksplisit.

- [ ] **Step 3: Add the minimal state utilities**

Di `components/ui/pocket-mint-hero.tsx`, tambahkan utility yang sama pada string class `Daftar` dan CTA hero:

```tsx
"landing-cta-sweep min-h-11 rounded-full px-4 shadow-sm shadow-primary/10 hover:text-primary focus-visible:text-primary"
```

```tsx
"landing-cta-sweep min-h-11 rounded-[40px] px-[50px] py-[17px] text-base shadow-sm shadow-primary/20 hover:text-primary focus-visible:text-primary"
```

Di `app/page.tsx`, tambahkan utility tersebut pada `largePrimaryButton`:

```ts
const largePrimaryButton =
  "landing-cta-sweep inline-flex min-h-11 items-center justify-center rounded-[40px] bg-primary px-[50px] py-[17px] text-base font-medium leading-[27px] text-primary-foreground shadow-sm hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:bg-primary/85";
```

- [ ] **Step 4: Run the focused test to verify GREEN**

Run: `npm test -- tests/landing-page.test.ts`

Expected: PASS.

- [ ] **Step 5: Inspect the focused diff**

Run: `git diff --check -- app/page.tsx components/ui/pocket-mint-hero.tsx tests/landing-page.test.ts`

Expected: exit 0. Do not stage or commit because these files contain pre-existing user changes.

---

### Task 2: Animated Privacy Commitments

**Files:**
- Create: `components/ui/privacy-commitments.tsx`
- Modify: `app/page.tsx`
- Modify: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: `Card`, `CardContent`, `motion`, dan `useReducedMotion`.
- Produces: `PrivacyCommitments(): JSX.Element`, client component tanpa props yang merender tiga privacy points sebagai semantic list.

- [ ] **Step 1: Write the failing source contract**

Di setup `tests/landing-page.test.ts`, baca file baru:

```ts
const privacyCommitmentsPath = root + "components/ui/privacy-commitments.tsx";
const privacyCommitments = existsSync(privacyCommitmentsPath)
  ? readFileSync(privacyCommitmentsPath, "utf8")
  : "";
```

Tambahkan test:

```ts
it("animates and highlights each privacy card without making it clickable", () => {
  expect(existsSync(privacyCommitmentsPath)).toBe(true);
  expect(page).toContain(
    'import { PrivacyCommitments } from "@/components/ui/privacy-commitments"'
  );
  expect(page).toContain("<PrivacyCommitments />");
  expect(privacyCommitments).toContain('"use client"');
  expect(privacyCommitments).toContain("useReducedMotion");
  expect(privacyCommitments).toContain("whileInView");
  expect(privacyCommitments).toContain("viewport={{ once: true, amount: 0.35 }}");
  expect(privacyCommitments).toContain("index * 0.08");
  expect(privacyCommitments).toContain("motion-safe:hover:-translate-y-1");
  expect(privacyCommitments).toContain("hover:bg-muted/40");
  expect(privacyCommitments).not.toContain("onClick");
  expect(privacyCommitments).not.toContain("cursor-pointer");
});
```

Ganti isi test `presents each privacy promise as a numbered card` agar kontrak lama mengikuti file baru:

```ts
it("presents each privacy promise as a numbered card", () => {
  expect(privacyCommitments).toContain(
    'import { Card, CardContent } from "@/components/ui/card"'
  );
  expect(privacyCommitments).toContain("const privacyPoints = [");
  expect(privacyCommitments).toContain('<ul className="grid gap-3"');
  expect(privacyCommitments).toContain("privacyPoints.map((point, index)");
  expect(privacyCommitments).toContain("<motion.li");
  expect(privacyCommitments).toContain("<Card");
  expect(privacyCommitments).toContain('size="sm"');
  expect(privacyCommitments).toContain("<CardContent");
  expect(privacyCommitments).toContain('aria-hidden="true"');
  expect(privacyCommitments).toContain('String(index + 1).padStart(2, "0")');
  expect(page).not.toContain('className="space-y-4 text-sm');
  expect(page).not.toContain('className="border-t border-border pt-4"');
});
```

- [ ] **Step 2: Run the focused test to verify RED**

Run: `npm test -- tests/landing-page.test.ts`

Expected: FAIL karena `components/ui/privacy-commitments.tsx` belum ada.

- [ ] **Step 3: Create the minimal client component**

Buat `components/ui/privacy-commitments.tsx`:

```tsx
"use client";

import { motion, useReducedMotion } from "framer-motion";

import { Card, CardContent } from "@/components/ui/card";

const privacyPoints = [
  "Tanpa iklan.",
  "Tanpa pelacakan marketing.",
  "Hanya data yang diperlukan untuk workspace Anda.",
] as const;

export function PrivacyCommitments() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <ul className="grid gap-3" aria-label="Komitmen privasi Pocket Mint">
      {privacyPoints.map((point, index) => (
        <motion.li
          key={point}
          initial={reducedMotion ? false : { opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{
            delay: reducedMotion ? 0 : index * 0.08,
            duration: reducedMotion ? 0 : 0.4,
          }}
        >
          <Card
            size="sm"
            className="py-0 shadow-sm shadow-primary/5 transition-[transform,background-color,box-shadow] duration-300 motion-safe:hover:-translate-y-1 hover:bg-muted/40 hover:shadow-md hover:ring-primary/30 focus-within:bg-muted/40 focus-within:ring-primary/30"
          >
            <CardContent className="flex min-h-20 items-center gap-4 px-4 py-4">
              <span
                aria-hidden="true"
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-xs font-semibold tracking-[0.08em] text-primary"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-sm font-medium leading-6 text-foreground">
                {point}
              </p>
            </CardContent>
          </Card>
        </motion.li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 4: Keep the page server-rendered and use the client island**

Di `app/page.tsx`, hapus import `Card`, `CardContent`, dan constant `privacyPoints`, lalu tambahkan:

```ts
import { PrivacyCommitments } from "@/components/ui/privacy-commitments";
```

Ganti seluruh `<ul>...</ul>` privacy stack dengan:

```tsx
<PrivacyCommitments />
```

- [ ] **Step 5: Run the focused test to verify GREEN**

Run: `npm test -- tests/landing-page.test.ts`

Expected: PASS.

- [ ] **Step 6: Inspect the focused diff**

Run: `git diff --check -- app/page.tsx components/ui/privacy-commitments.tsx tests/landing-page.test.ts`

Expected: exit 0. Do not stage or commit.

---

### Task 3: CTA-Directed Hero Pulse Beams

**Files:**
- Modify: `components/ui/pulse-beams.tsx`
- Modify: `tests/pulse-beams.test.ts`

**Interfaces:**
- Consumes: existing `Beam` data model and `motion.linearGradient` renderer.
- Produces: optional `reverse?: boolean` per beam; right-origin paths reverse the gradient travel while left-origin paths retain forward travel.

- [ ] **Step 1: Write the failing beam-direction contract**

Tambahkan ke `tests/pulse-beams.test.ts`:

```ts
it("converges the upper hero beams toward the CTA from both sides", () => {
  expect(source).toContain("reverse?: boolean");
  expect(source).toContain("M-28 136H128");
  expect(source).toContain("H366");
  expect(source).toContain("M886 164H730");
  expect(source).toContain("H492");
  expect(source.match(/reverse: true/g)).toHaveLength(3);
  expect(source).toMatch(
    /x1:\s*beam\.reverse\s*\?\s*\["135%", "55%", "-20%"\]/
  );
  expect(source).toMatch(
    /x2:\s*beam\.reverse\s*\?\s*\["105%", "25%", "-50%"\]/
  );
});
```

- [ ] **Step 2: Run the focused beam test to verify RED**

Run: `npm test -- tests/pulse-beams.test.ts`

Expected: FAIL karena data beam belum menyimpan arah dan dua jalur atas belum berkumpul di area CTA.

- [ ] **Step 3: Add deterministic converging geometry**

Tambahkan field opsional pada `Beam`:

```ts
type Beam = {
  path: string;
  delay: number;
  reverse?: boolean;
  points: ReadonlyArray<{ cx: number; cy: number }>;
};
```

Ganti dua item pertama `heroBeams` dengan jalur yang berakhir di kedua sisi CTA:

```ts
{
  path: "M-28 136H128C149 136 166 153 166 174V292C166 313 183 330 204 330H366",
  delay: 0,
  points: [{ cx: 366, cy: 330 }],
},
{
  path: "M886 164H730C709 164 692 181 692 202V292C692 313 675 330 654 330H492",
  delay: 1.15,
  reverse: true,
  points: [{ cx: 492, cy: 330 }],
},
```

Tambahkan `reverse: true` pada hero beams lain yang path-nya dimulai dari sisi kanan. Jangan ubah `panelBeams`.

- [ ] **Step 4: Reverse gradient travel for right-origin paths**

Di `motion.linearGradient`, ganti nilai animate non-reduced-motion untuk `x1` dan `x2`:

```tsx
x1: beam.reverse
  ? ["135%", "55%", "-20%"]
  : ["-35%", "45%", "120%"],
x2: beam.reverse
  ? ["105%", "25%", "-50%"]
  : ["-5%", "75%", "150%"],
```

Pertahankan nilai `y1`, `y2`, duration, repeat, delay, dan branch reduced-motion yang sudah ada.

- [ ] **Step 5: Run beam and landing tests to verify GREEN**

Run: `npm test -- tests/pulse-beams.test.ts tests/landing-page.test.ts`

Expected: PASS.

- [ ] **Step 6: Inspect the focused diff**

Run: `git diff --check -- components/ui/pulse-beams.tsx tests/pulse-beams.test.ts`

Expected: exit 0. Do not stage or commit.

---

### Task 4: Privacy-Style Number Badges in Vertical Tabs

**Files:**
- Modify: `components/ui/vertical-tabs.tsx`
- Modify: `tests/landing-page.test.ts`

**Interfaces:**
- Consumes: `screen.number` values `01` through `05`.
- Produces: decorative fixed-size badge dengan class recipe yang sama seperti privacy cards.

- [ ] **Step 1: Write the failing badge contract**

Tambahkan ke `tests/landing-page.test.ts`:

```ts
it("uses the privacy-card number badge in vertical tabs", () => {
  expect(verticalTabs).toContain(
    'className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-xs font-semibold tracking-[0.08em] text-primary"'
  );
  expect(verticalTabs).toContain("{screen.number}");
  expect(verticalTabs).not.toContain("/{screen.number}");
  expect(verticalTabs).not.toContain('className="mt-1 text-[10px]');
});
```

- [ ] **Step 2: Run the focused landing test to verify RED**

Run: `npm test -- tests/landing-page.test.ts`

Expected: FAIL karena vertical tabs masih menampilkan `/01` sebagai teks kecil.

- [ ] **Step 3: Replace the number markup**

Di `components/ui/vertical-tabs.tsx`, ganti span nomor lama dengan:

```tsx
<span
  aria-hidden="true"
  className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-mint/15 text-xs font-semibold tracking-[0.08em] text-primary"
>
  {screen.number}
</span>
```

- [ ] **Step 4: Run the focused landing test to verify GREEN**

Run: `npm test -- tests/landing-page.test.ts`

Expected: PASS.

- [ ] **Step 5: Inspect the focused diff**

Run: `git diff --check -- components/ui/vertical-tabs.tsx tests/landing-page.test.ts`

Expected: exit 0. Do not stage or commit.

---

### Task 5: Static and Rendered Verification

**Files:**
- Verify: `app/page.tsx`
- Verify: `components/ui/pocket-mint-hero.tsx`
- Verify: `components/ui/privacy-commitments.tsx`
- Verify: `components/ui/pulse-beams.tsx`
- Verify: `components/ui/vertical-tabs.tsx`
- Verify: `tests/landing-page.test.ts`
- Verify: `tests/pulse-beams.test.ts`

**Interfaces:**
- Consumes: semua deliverable Task 1 sampai Task 4.
- Produces: bukti test, lint, build, dan QA interaksi landing page.

- [ ] **Step 1: Run focused tests**

Run: `npm test -- tests/landing-page.test.ts tests/pulse-beams.test.ts`

Expected: semua test pada dua file PASS.

- [ ] **Step 2: Run the complete test suite**

Run: `npm test`

Expected: exit 0, tidak ada failed test.

- [ ] **Step 3: Run lint**

Run: `npm run lint`

Expected: exit 0 tanpa error.

- [ ] **Step 4: Run the production build**

Run: `npm run build`

Expected: exit 0 dan Next.js menyelesaikan production build.

- [ ] **Step 5: Verify the final diff**

Run: `git diff --check`

Expected: exit 0. Jalankan `git status -sb` dan pastikan tidak ada file di luar scope yang baru disentuh oleh implementasi ini.

- [ ] **Step 6: Verify rendered behavior**

Flow: `http://localhost:4000/` -> hover `Daftar` dan `Mulai Sekarang` -> scroll ke card privasi -> hover setiap card -> pilih vertical tab -> hasil sesuai tanpa error.

Periksa viewport desktop `1440 x 900` dan mobile `390 x 844`. In-app Browser digunakan bila tersedia. Karena Browser saat perencanaan mengembalikan `No browser is available`, minta persetujuan sebelum fallback ke Playwright; bila disetujui, jalankan existing Playwright 1.61.1 tanpa menambah dependency.
