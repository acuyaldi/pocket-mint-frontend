# Transfer Account Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace transfer wallet cards in `AddTransactionModal` with a vertical, accessible account-picker flow that supports manual and automatic swapping while removing the debt-payment tab.

**Architecture:** Add a small pure helper module for transfer eligibility and endpoint state transitions, then add one focused `AccountPicker` client component built on the existing Base UI dropdown wrapper. Keep transaction state and submission inside `AddTransactionModal`; cover pure behavior with Vitest, protect the approved markup contract with the repository's existing source-contract test pattern, and finish with browser verification.

**Tech Stack:** Next.js 16.2 App Router, React 19.2, TypeScript, Tailwind CSS 4, Base UI menu through the existing shadcn wrapper, Lucide React, Vitest 4.

## Global Constraints

- Preserve existing Pocket Mint typography, spacing tokens, color tokens, elevation, border radius, component language, modal header/footer, amount input, date input, description field, and button styles.
- The segmented control contains only `Pengeluaran`, `Pemasukan`, and `Transfer`, distributed evenly.
- Transfer field order is `Jumlah`, `Tanggal`, `Dompet sumber`, swap button, `Dompet tujuan`, `Deskripsi` at every breakpoint.
- Source and destination are never placed side-by-side.
- Debt wallets are hidden from both transfer menus.
- A non-debt source row is disabled only when the entered amount exceeds its available balance; its visible explanation is `Saldo tidak cukup`.
- Every non-debt wallet remains eligible as a destination regardless of balance.
- Selecting the wallet assigned to the opposite picker swaps both endpoints without an error.
- Source and destination must never end with identical IDs.
- Do not add dependencies, search, filters, animations, new endpoints, new queries, or new business rules.
- Use Indonesian copy and complete tabular Indonesian-formatted balances.

---

## File Map

- Create `app/(app)/transactions/components/transfer-account-picker.ts`: pure transfer wallet filtering, endpoint selection, swapping, and pair validation.
- Create `app/(app)/transactions/components/AccountPicker.tsx`: compact collapsed account control and single-column Base UI wallet menu.
- Modify `app/(app)/transactions/components/AddTransactionModal.tsx`: remove debt-payment branches and wallet grids, wire the vertical pickers and swap behavior, retain defensive transfer validation.
- Create `tests/transfer-account-picker.test.ts`: unit coverage for transfer filtering and endpoint state transitions.
- Create `tests/transfer-account-picker-contract.test.ts`: source-contract coverage for the approved account-picker and modal structure, following the repository's existing contract-test style.

---

### Task 1: Transfer Eligibility and Endpoint State

**Files:**

- Create: `app/(app)/transactions/components/transfer-account-picker.ts`
- Test: `tests/transfer-account-picker.test.ts`

**Interfaces:**

- Consumes: `Wallet` and `isDebtWallet` from `@/src/types/wallet`.
- Produces: `getTransferWallets(wallets: Wallet[]): Wallet[]`.
- Produces: `selectTransferEndpoint(selectedId: string, oppositeId: string, nextId: string): TransferEndpoints`.
- Produces: `swapTransferEndpoints(sourceId: string, destinationId: string): TransferEndpoints`.
- Produces: `isValidTransferPair(sourceId: string, destinationId: string): boolean`.

- [ ] **Step 1: Write the failing unit tests**

Create `tests/transfer-account-picker.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Wallet, WalletType } from "@/src/types/wallet";
import {
  getTransferWallets,
  isValidTransferPair,
  selectTransferEndpoint,
  swapTransferEndpoints,
} from "@/app/(app)/transactions/components/transfer-account-picker";

function wallet(id: string, type: WalletType): Wallet {
  return {
    id,
    userId: "user-1",
    name: `Wallet ${id}`,
    type,
    balance: 1_000_000,
    creditLimit: 0,
    interestRate: 0,
    currency: "IDR",
    isArchived: false,
    createdAt: "2026-07-16T00:00:00.000Z",
    updatedAt: "2026-07-16T00:00:00.000Z",
  };
}

describe("transfer account picker state", () => {
  it("keeps only non-debt wallets in their original order", () => {
    const wallets = [
      wallet("bank", "BANK"),
      wallet("credit", "CREDIT_CARD"),
      wallet("cash", "CASH"),
      wallet("paylater", "LOAN_PAYLATER"),
      wallet("ewallet", "E_WALLET"),
    ];

    expect(getTransferWallets(wallets).map(({ id }) => id)).toEqual([
      "bank",
      "cash",
      "ewallet",
    ]);
  });

  it("selects an unused wallet without changing the opposite endpoint", () => {
    expect(selectTransferEndpoint("bank", "cash", "ewallet")).toEqual({
      selectedId: "ewallet",
      oppositeId: "cash",
    });
  });

  it("swaps endpoints when the opposite wallet is selected", () => {
    expect(selectTransferEndpoint("bank", "cash", "cash")).toEqual({
      selectedId: "cash",
      oppositeId: "bank",
    });
  });

  it("swaps selected and empty endpoints without inventing a wallet", () => {
    expect(swapTransferEndpoints("bank", "")).toEqual({
      selectedId: "",
      oppositeId: "bank",
    });
  });

  it("accepts only complete, distinct transfer pairs", () => {
    expect(isValidTransferPair("bank", "cash")).toBe(true);
    expect(isValidTransferPair("bank", "bank")).toBe(false);
    expect(isValidTransferPair("bank", "")).toBe(false);
    expect(isValidTransferPair("", "cash")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests and confirm the missing-module failure**

Run:

```bash
npm test -- tests/transfer-account-picker.test.ts
```

Expected: FAIL because `transfer-account-picker.ts` does not exist.

- [ ] **Step 3: Implement the pure transfer helpers**

Create `app/(app)/transactions/components/transfer-account-picker.ts`:

```ts
import { isDebtWallet, type Wallet } from "@/src/types/wallet";

export interface TransferEndpoints {
  selectedId: string;
  oppositeId: string;
}

export function getTransferWallets(wallets: Wallet[]): Wallet[] {
  return wallets.filter((wallet) => !isDebtWallet(wallet.type));
}

export function selectTransferEndpoint(
  selectedId: string,
  oppositeId: string,
  nextId: string,
): TransferEndpoints {
  if (nextId === oppositeId) {
    return { selectedId: oppositeId, oppositeId: selectedId };
  }

  return { selectedId: nextId, oppositeId };
}

export function swapTransferEndpoints(
  sourceId: string,
  destinationId: string,
): TransferEndpoints {
  return { selectedId: destinationId, oppositeId: sourceId };
}

export function isValidTransferPair(
  sourceId: string,
  destinationId: string,
): boolean {
  return Boolean(sourceId && destinationId && sourceId !== destinationId);
}
```

- [ ] **Step 4: Run the focused tests and confirm they pass**

Run:

```bash
npm test -- tests/transfer-account-picker.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit the behavior boundary**

```bash
git add "app/(app)/transactions/components/transfer-account-picker.ts" tests/transfer-account-picker.test.ts
git commit -m "test: define transfer account picker behavior"
```

---

### Task 2: Compact Account Picker Component

**Files:**

- Create: `app/(app)/transactions/components/AccountPicker.tsx`
- Create: `tests/transfer-account-picker-contract.test.ts`

**Interfaces:**

- Consumes: `Wallet[]`, a selected ID, a disabled predicate, and `onSelect(id: string)`.
- Produces: `AccountPicker(props: AccountPickerProps): React.ReactNode`.
- Does not own source/destination relationship state and does not perform transfer mutations.

- [ ] **Step 1: Write the failing component contract test**

Create `tests/transfer-account-picker-contract.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const pickerPath =
  root + "app/(app)/transactions/components/AccountPicker.tsx";

describe("transfer account picker component contract", () => {
  it("uses the existing dropdown primitives and input-like trigger", () => {
    const source = readFileSync(pickerPath, "utf8");

    expect(source).toContain("DropdownMenuTrigger");
    expect(source).toContain("DropdownMenuContent");
    expect(source).toContain("DropdownMenuItem");
    expect(source).toContain("min-h-14");
    expect(source).toContain('aria-haspopup="menu"');
    expect(source).toContain("data-open:animate-none");
  });

  it("exposes selected and disabled states without relying on color", () => {
    const source = readFileSync(pickerPath, "utf8");

    expect(source).toContain('role="menuitemradio"');
    expect(source).toContain("aria-checked={selected}");
    expect(source).toContain("disabled={disabled}");
    expect(source).toContain("<Check");
    expect(source).toContain("disabledReason");
  });

  it("keeps balances complete and tabular", () => {
    const source = readFileSync(pickerPath, "utf8");

    expect(source).toContain("formatWalletAmount");
    expect(source).toContain("tabular-nums");
    expect(source).not.toContain("line-clamp");
  });
});
```

- [ ] **Step 2: Run the contract test and confirm the missing-file failure**

Run:

```bash
npm test -- tests/transfer-account-picker-contract.test.ts
```

Expected: FAIL with `ENOENT` for `AccountPicker.tsx`.

- [ ] **Step 3: Implement the account picker**

Create `app/(app)/transactions/components/AccountPicker.tsx`:

```tsx
"use client";

import {
  Banknote,
  Check,
  ChevronDown,
  CreditCard,
  Smartphone,
  Wallet as WalletIcon,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { isDebtWallet, type Wallet } from "@/src/types/wallet";
import { formatRupiah } from "./constants";

interface AccountPickerProps {
  id: string;
  label: string;
  wallets: Wallet[];
  selectedId: string;
  emptyLabel: string;
  disabledReason?: string;
  isDisabled?: (wallet: Wallet) => boolean;
  onSelect: (id: string) => void;
}

function getWalletKind(wallet: Wallet) {
  if (wallet.type === "BANK") return "Rekening";
  if (wallet.type === "E_WALLET") return "E-Wallet";
  if (wallet.type === "CASH") return "Kas";
  if (wallet.type === "CREDIT_CARD") return "Kredit";
  return "Pinjaman";
}

function getWalletIcon(wallet: Wallet) {
  if (wallet.type === "BANK") return Banknote;
  if (wallet.type === "E_WALLET") return Smartphone;
  if (isDebtWallet(wallet.type)) return CreditCard;
  return WalletIcon;
}

function formatWalletAmount(wallet: Wallet) {
  return `Rp ${formatRupiah(String(Math.abs(wallet.balance)))}`;
}

export function AccountPicker({
  id,
  label,
  wallets,
  selectedId,
  emptyLabel,
  disabledReason = "Saldo tidak cukup",
  isDisabled,
  onSelect,
}: AccountPickerProps) {
  const selectedWallet = wallets.find((wallet) => wallet.id === selectedId);
  const SelectedIcon = selectedWallet ? getWalletIcon(selectedWallet) : WalletIcon;

  return (
    <div className="space-y-2">
      <label
        id={`${id}-label`}
        className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
      >
        {label}
      </label>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              id={id}
              type="button"
              aria-labelledby={`${id}-label`}
              aria-haspopup="menu"
              className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-border/70 bg-card px-3 text-left outline-none transition-colors hover:bg-surface-low focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
            />
          }
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-high text-primary">
            <SelectedIcon className="size-4" />
          </span>
          {selectedWallet ? (
            <>
              <span className="min-w-0 flex-1 py-2">
                <span className="block text-sm font-semibold leading-5 text-foreground">
                  {selectedWallet.name}
                </span>
                <span className="block text-xs leading-4 text-muted-foreground">
                  {getWalletKind(selectedWallet)}
                </span>
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatWalletAmount(selectedWallet)}
              </span>
            </>
          ) : (
            <span className="min-w-0 flex-1 text-sm text-muted-foreground">
              {emptyLabel}
            </span>
          )}
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="start"
          sideOffset={6}
          className="w-[var(--anchor-width)] min-w-[18rem] max-w-[calc(100vw-2rem)] p-1 data-open:animate-none data-closed:animate-none"
        >
          {wallets.length === 0 ? (
            <p className="px-3 py-3 text-sm text-muted-foreground">
              Tidak ada dompet transfer yang tersedia.
            </p>
          ) : (
            wallets.map((wallet) => {
              const Icon = getWalletIcon(wallet);
              const selected = wallet.id === selectedId;
              const disabled = isDisabled?.(wallet) ?? false;

              return (
                <DropdownMenuItem
                  key={wallet.id}
                  role="menuitemradio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onSelect(wallet.id)}
                  className={`min-h-14 border px-2.5 py-2 data-highlighted:border-border/60 data-highlighted:bg-surface-low data-disabled:opacity-55 ${
                    selected
                      ? "border-border/60 bg-surface-low"
                      : "border-transparent"
                  }`}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-high text-primary">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold leading-5 text-foreground">
                      {wallet.name}
                    </span>
                    <span className="block text-xs leading-4 text-muted-foreground">
                      {getWalletKind(wallet)}
                      {disabled ? ` · ${disabledReason}` : ""}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {formatWalletAmount(wallet)}
                    </span>
                    <span className="flex size-4 items-center justify-center" aria-hidden="true">
                      {selected ? <Check className="size-4 text-primary" /> : null}
                    </span>
                  </span>
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
```

- [ ] **Step 4: Run the focused contract and behavior tests**

Run:

```bash
npm test -- tests/transfer-account-picker-contract.test.ts tests/transfer-account-picker.test.ts
```

Expected: 8 tests PASS.

- [ ] **Step 5: Run lint on the new component boundary**

Run:

```bash
npx eslint "app/(app)/transactions/components/AccountPicker.tsx" "app/(app)/transactions/components/transfer-account-picker.ts" tests/transfer-account-picker-contract.test.ts tests/transfer-account-picker.test.ts
```

Expected: exit code 0 with no lint errors.

- [ ] **Step 6: Commit the compact picker**

```bash
git add "app/(app)/transactions/components/AccountPicker.tsx" tests/transfer-account-picker-contract.test.ts
git commit -m "feat: add compact transfer account picker"
```

---

### Task 3: Integrate the Vertical Transfer Flow

**Files:**

- Modify: `app/(app)/transactions/components/AddTransactionModal.tsx`
- Modify: `tests/transfer-account-picker-contract.test.ts`

**Interfaces:**

- Consumes: `AccountPicker` from `./AccountPicker`.
- Consumes: `getTransferWallets`, `selectTransferEndpoint`, `swapTransferEndpoints`, and `isValidTransferPair` from `./transfer-account-picker`.
- Preserves: `AddTransactionData`, `AddTransactionModalProps`, and the existing `onSubmit` payload contract.

- [ ] **Step 1: Add failing modal integration assertions**

Append this block to `tests/transfer-account-picker-contract.test.ts` after the picker source constant:

```ts
const modalPath =
  root + "app/(app)/transactions/components/AddTransactionModal.tsx";
```

Append this suite at the end of the test file:

```ts
describe("transfer modal integration contract", () => {
  it("keeps only the three approved transaction types", () => {
    const source = readFileSync(modalPath, "utf8");

    expect(source).not.toContain("PAY_DEBT");
    expect(source).not.toContain("Bayar hutang");
    expect(source).toContain("grid-cols-3");
  });

  it("uses the sequential picker flow instead of wallet cards", () => {
    const source = readFileSync(modalPath, "utf8");
    const amount = source.indexOf("<FieldLabel>Jumlah</FieldLabel>");
    const date = source.indexOf("<FieldLabel>Tanggal</FieldLabel>");
    const sourcePicker = source.indexOf('id="transfer-source"');
    const swap = source.indexOf('aria-label="Tukar dompet sumber dan tujuan"');
    const destinationPicker = source.indexOf('id="transfer-destination"');
    const description = source.indexOf("<FieldLabel>Deskripsi</FieldLabel>");
    const order = [
      amount,
      date,
      sourcePicker,
      swap,
      destinationPicker,
      description,
    ];

    expect(source).not.toContain("WalletGrid");
    expect(source).toContain("<AccountPicker");
    expect(source).toContain('aria-label="Tukar dompet sumber dan tujuan"');
    expect(order.every((index) => index >= 0)).toBe(true);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });

  it("wires automatic swap, manual swap, and pair validation", () => {
    const source = readFileSync(modalPath, "utf8");

    expect(source).toContain("selectTransferEndpoint(");
    expect(source).toContain("swapTransferEndpoints(");
    expect(source).toContain("isValidTransferPair(");
    expect(source).toContain("Saldo tidak cukup");
  });
});
```

- [ ] **Step 2: Run the integration contract and confirm it fails**

Run:

```bash
npm test -- tests/transfer-account-picker-contract.test.ts
```

Expected: the picker component assertions PASS and the modal integration assertions FAIL because `PAY_DEBT`, `WalletGrid`, and the four-column tabs still exist.

- [ ] **Step 3: Remove debt-payment state and obsolete wallet-card code**

In `AddTransactionModal.tsx`:

1. Replace the transaction type declarations with:

```ts
type TxType = "EXPENSE" | "INCOME" | "TRANSFER";
type Tab = TxType;
```

2. Remove `HandCoins` and `ArrowRight` from the Lucide import.
3. Remove the `PAY_DEBT` object from `TYPE_OPTIONS`.
4. Keep `getWalletKind`, `getWalletIcon`, and `formatWalletAmount` for the unchanged expense/income wallet list. Rename `WalletGrid` to `WalletSelectionList`, remove its `exclude` prop and filtering, and retain its existing single/two-column card markup only for expense and income.
5. Remove every `type === "PAY_DEBT"` branch from wallet derivation, validation, description fallback, payload mapping, placeholder copy, and rendering.
6. Keep installment behavior for expense transactions unchanged.

The simplified wallet derivation must be:

```ts
const sourceWallets = useMemo(() => {
  if (type === "INCOME") {
    return wallets.filter((wallet) => !isDebtWallet(wallet.type));
  }
  if (type === "TRANSFER") {
    return getTransferWallets(wallets);
  }
  return wallets;
}, [type, wallets]);

const transferWallets = useMemo(() => getTransferWallets(wallets), [wallets]);
```

In `handleSubmit`, replace transfer-like branching with direct transfer validation:

```ts
const isTransfer = type === "TRANSFER";
const asInstallment =
  isInstallment && !!srcWallet && isDebtWallet(srcWallet.type);

if (isTransfer && !isValidTransferPair(walletId, toWalletId)) {
  setError("Pilih dompet sumber dan tujuan yang berbeda.");
  return;
}

if (isTransfer && srcWallet && isDebtWallet(srcWallet.type)) {
  setError("Transfer tidak bisa dilakukan dari kartu kredit atau paylater.");
  return;
}
```

Use the existing description without a debt fallback:

```ts
description: description.trim(),
```

Use the existing transfer payload field directly:

```ts
toWalletId: isTransfer ? toWalletId || undefined : undefined,
```

- [ ] **Step 4: Add automatic and manual swap handlers**

Add these callbacks after `handleTypeChange`:

```ts
const handleSourceSelect = useCallback(
  (nextId: string) => {
    const next = selectTransferEndpoint(walletId, toWalletId, nextId);
    setWalletId(next.selectedId);
    setToWalletId(next.oppositeId);
    setError("");
  },
  [walletId, toWalletId],
);

const handleDestinationSelect = useCallback(
  (nextId: string) => {
    const next = selectTransferEndpoint(toWalletId, walletId, nextId);
    setToWalletId(next.selectedId);
    setWalletId(next.oppositeId);
    setError("");
  },
  [toWalletId, walletId],
);

const handleSwapWallets = useCallback(() => {
  const next = swapTransferEndpoints(walletId, toWalletId);
  setWalletId(next.selectedId);
  setToWalletId(next.oppositeId);
  setError("");
}, [walletId, toWalletId]);
```

- [ ] **Step 5: Replace the transfer grid with the approved vertical flow**

Change the segmented control class to:

```tsx
className="grid grid-cols-3 rounded-lg bg-surface-high p-1"
```

Replace the transfer `WalletGrid` branch with:

```tsx
{hasNoWallets ? (
  <section className="rounded-xl border border-dashed border-border bg-surface-low p-6 text-center">
    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
      <WalletIcon className="size-6" />
    </div>
    <h3 className="text-base font-semibold text-foreground">
      Belum ada dompet
    </h3>
    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
      Buat dompet dulu supaya transaksi bisa dicatat ke sumber dana yang benar.
    </p>
    <Button
      type="button"
      onClick={handleAddWallet}
      className="mt-4 h-10 gap-2 px-4"
    >
      <Plus className="size-4" />
      Tambah dompet
    </Button>
  </section>
) : type === "TRANSFER" ? (
  <section className="space-y-2">
    <AccountPicker
      id="transfer-source"
      label="Dompet sumber"
      wallets={transferWallets}
      selectedId={walletId}
      emptyLabel="Pilih dompet sumber"
      disabledReason="Saldo tidak cukup"
      isDisabled={lacksFunds}
      onSelect={handleSourceSelect}
    />
    <div className="flex justify-center py-1">
      <button
        type="button"
        aria-label="Tukar dompet sumber dan tujuan"
        onClick={handleSwapWallets}
        className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-sm outline-none transition-colors hover:bg-surface-low hover:text-foreground focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/15"
      >
        <ArrowLeftRight className="size-4" />
      </button>
    </div>
    <AccountPicker
      id="transfer-destination"
      label="Dompet tujuan"
      wallets={transferWallets}
      selectedId={toWalletId}
      emptyLabel="Pilih dompet tujuan"
      onSelect={handleDestinationSelect}
    />
  </section>
) : (
  <section className="space-y-2">
    <FieldLabel>Pilih dompet</FieldLabel>
    <WalletSelectionList
      wallets={sourceWallets}
      selected={walletId}
      emptyLabel="Tidak ada dompet yang tersedia."
      isDisabled={lacksFunds}
      onSelect={(id) => {
        setWalletId(id);
        setInterestRateOverride(null);
        setAdminFeeOverride(null);
      }}
    />
  </section>
)}
```

Because expense and income still need their existing wallet-card behavior, rename the retained non-transfer list implementation to `WalletSelectionList`; remove its `exclude` prop and its two-column transfer usage only. Its visual code remains unchanged so the task does not redesign unrelated paths.

- [ ] **Step 6: Run focused tests and resolve only integration errors**

Run:

```bash
npm test -- tests/transfer-account-picker.test.ts tests/transfer-account-picker-contract.test.ts
```

Expected: 11 tests PASS.

- [ ] **Step 7: Run TypeScript-aware lint on the changed files**

Run:

```bash
npx eslint "app/(app)/transactions/components/AddTransactionModal.tsx" "app/(app)/transactions/components/AccountPicker.tsx" "app/(app)/transactions/components/transfer-account-picker.ts" tests/transfer-account-picker.test.ts tests/transfer-account-picker-contract.test.ts
```

Expected: exit code 0 with no lint errors.

- [ ] **Step 8: Commit the integrated flow**

```bash
git add "app/(app)/transactions/components/AddTransactionModal.tsx" tests/transfer-account-picker-contract.test.ts
git commit -m "feat: refine transfer account selection flow"
```

---

### Task 4: Full Verification and Responsive Browser QA

**Files:**

- Modify only if verification exposes a defect: `app/(app)/transactions/components/AddTransactionModal.tsx`
- Modify only if verification exposes a defect: `app/(app)/transactions/components/AccountPicker.tsx`
- Modify only if behavior coverage exposes a gap: `tests/transfer-account-picker.test.ts`
- Modify only if contract coverage exposes a gap: `tests/transfer-account-picker-contract.test.ts`

**Interfaces:**

- Verifies the integrated public behavior; produces no new API.

- [ ] **Step 1: Run the complete automated test suite**

Run:

```bash
npm test
```

Expected: all repository tests PASS with no unhandled errors.

- [ ] **Step 2: Run the complete lint suite**

Run:

```bash
npm run lint
```

Expected: exit code 0 with no lint errors.

- [ ] **Step 3: Run the production build**

Run:

```bash
npm run build
```

Expected: Next.js production build completes successfully with no type or compilation errors.

- [ ] **Step 4: Start the local application for browser verification**

Run:

```bash
npm run dev
```

Expected: Next.js reports the application ready at `http://localhost:4000`.

- [ ] **Step 5: Verify the desktop flow at 1280px width**

Use the in-app browser at `http://localhost:4000/transactions` and verify:

1. Open `Tambah Transaksi` and confirm the header, amount, date, description, footer, and buttons retain their prior visual definitions.
2. Confirm only `Pengeluaran`, `Pemasukan`, and `Transfer` appear and have equal widths.
3. Select `Transfer` and confirm source, swap, and destination form one vertical sequence.
4. Open each picker and confirm a single-column menu aligned to the trigger, with wallet icon, name, type, complete balance, and selected checkmark.
5. Enter an amount above one source balance and confirm that row is disabled with visible `Saldo tidak cukup` copy.
6. Confirm the same wallet remains enabled as a destination.
7. Select A as source and B as destination, then select B from the source picker; confirm the endpoints become B and A with no error.
8. Activate the swap button and confirm the values exchange immediately.
9. Confirm debt wallets do not appear in either transfer menu.
10. Use Tab, Enter, arrow keys, and Escape to confirm trigger, menu, rows, swap action, and modal retain logical keyboard behavior and visible focus.

- [ ] **Step 6: Verify the mobile flow at 390px width**

Using the same modal and route, verify:

1. The interaction remains source, swap, destination vertically.
2. The dialog stays inside the viewport and scrolls internally.
3. Long wallet names wrap readably without hiding or abbreviating the balance.
4. Menus remain inside the viewport without horizontal page overflow.
5. Each picker and swap control retains at least a 44px touch target.

- [ ] **Step 7: Inspect the browser console**

Expected: no React key warnings, accessibility warnings, hydration errors, Base UI positioning errors, or uncaught exceptions while opening menus and swapping wallets.

- [ ] **Step 8: Commit verification fixes only if files changed**

If QA required a correction, stage only the files changed for that correction and commit:

```bash
git add "app/(app)/transactions/components/AddTransactionModal.tsx" "app/(app)/transactions/components/AccountPicker.tsx" tests/transfer-account-picker.test.ts tests/transfer-account-picker-contract.test.ts
git commit -m "fix: polish transfer account picker behavior"
```

If QA required no correction, do not create an empty commit.

- [ ] **Step 9: Record final repository state**

Run:

```bash
git status --short
```

Expected: no output. If unrelated pre-existing user changes exist, they remain untouched and are reported explicitly.
