# Wallet and Billing Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan.

**Goal:** Replace the ambiguous wallet and installment model with explicit asset, credit, paylater, and loan flows; make every credit purchase produce a payable bill; and show a three-day due alert in navigation.

**Architecture:** Keep wallet balances as the ledger source of truth. Extend the existing Prisma wallet and installment storage with explicit wallet taxonomy, billing-cycle metadata, and generalized bill fields. Expose new category and bill APIs while retaining compatibility aliases for existing installment URLs. Update the React UI around the new contracts, with all mutation rules enforced again in the backend.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, shadcn/Base UI, TanStack Query, Express 5, Prisma 7, PostgreSQL, Vitest, Playwright.

## Global Constraints

- Work in the existing `dev` branch and preserve unrelated dirty changes.
- Run each test first and confirm it fails for the intended reason before implementation.
- Use `Asia/Jakarta` calendar semantics for due-date calculations; store instants in UTC.
- Do not introduce partial payments, minimum payments, penalties, provider synchronization, or automatic personal-loan schedules.
- Keep `/v1/installments` and `/cicilan` as compatibility aliases during this change.
- Use integer rupiah values at API boundaries and Prisma `Decimal` internally where the schema already uses it.
- Commit only files named in the current task; never stage the whole dirty worktree.

---

## Task 1: Migrate Wallet Taxonomy and Billing Storage

**Files:**

- Modify: `../pocket-mint-be/prisma/schema.prisma`
- Create: `../pocket-mint-be/prisma/migrations/20260717000000_generalize_wallets_and_bills/migration.sql`
- Modify: `../pocket-mint-be/src/services/transaction.service.ts`
- Test: `../pocket-mint-be/test/prismaBillingMigration.test.ts`

**Step 1: Write the failing schema-contract test**

Create a test that reads `prisma/schema.prisma` and the new migration SQL and asserts:

```ts
expect(schema).toContain("PAYLATER")
expect(schema).toContain("LOAN")
expect(schema).not.toContain("LOAN_PAYLATER")
expect(schema).toContain("cutoffDay")
expect(schema).toContain("paymentDueDay")
expect(schema).toContain("enum BillKind")
expect(schema).toContain("nextDueDate")
expect(migration).toContain("LOAN_PAYLATER")
expect(migration).toContain("PAYLATER")
```

Run:

```powershell
rtk npm test -- prismaBillingMigration.test.ts
```

Expected: FAIL because the taxonomy and bill fields do not exist.

**Step 2: Extend the Prisma model**

Make the wallet type and bill concepts explicit:

```prisma
enum WalletType {
  CASH
  BANK
  E_WALLET
  CREDIT_CARD
  PAYLATER
  LOAN
}

enum BillKind {
  FULL
  INSTALLMENT
}

model Wallet {
  // existing fields stay unchanged
  cutoffDay      Int?
  paymentDueDay  Int?
}

model Installment {
  // Keep the physical model/table name for compatibility in this release.
  kind            BillKind @default(INSTALLMENT)
  paidTerms       Int      @default(0)
  nextDueDate     DateTime
}
```

Keep `creditLimit` in the database. It is required by service validation only for `CREDIT_CARD` and `PAYLATER`, and must remain `0` for non-credit wallets.

**Step 3: Write a data-preserving SQL migration**

The migration must:

1. Add `PAYLATER` and `LOAN` to the PostgreSQL enum.
2. Convert every existing `LOAN_PAYLATER` row to `PAYLATER`.
3. Rebuild/rename the enum so `LOAN_PAYLATER` is no longer accepted.
4. Add nullable `cutoffDay` and `paymentDueDay` to wallets.
5. Add `kind`, `paidTerms`, and `nextDueDate` to the existing installments table.
6. Backfill `paidTerms = GREATEST(currentTerm - 1, 0)`.
7. Backfill `nextDueDate` from the existing start date plus the paid-term month offset, clamping to the last day of the target month.
8. Make `nextDueDate` non-null after the backfill.
9. Add checks for cutoff/due days between 1 and 31, positive term counts, and `paidTerms` between 0 and total terms.

Do not drop `currentTerm` in this migration. The new service stops exposing it, but retaining it makes rollback and compatibility safer.

As an incremental compatibility bridge, update the existing installment create call to persist its current `startDate` as `nextDueDate`. Task 4 replaces that temporary value with the real billing-cycle result. This keeps TypeScript green immediately after Prisma Client regeneration.

**Step 4: Generate and validate the client**

Run:

```powershell
rtk npx prisma format
rtk npx prisma validate
rtk npx prisma generate
rtk npm test -- prismaBillingMigration.test.ts
```

Expected: all commands pass.

**Step 5: Commit**

```powershell
rtk git add prisma/schema.prisma prisma/migrations/20260717000000_generalize_wallets_and_bills/migration.sql src/services/transaction.service.ts test/prismaBillingMigration.test.ts
rtk git commit -m "feat: generalize wallet and bill schema"
```

---

## Task 2: Add Deterministic Billing-Cycle Calculation

**Files:**

- Create: `../pocket-mint-be/src/domain/billingCycle.ts`
- Create: `../pocket-mint-be/test/billingCycle.test.ts`

**Step 1: Write failing edge-case tests**

Cover transactions before, on, and after cutoff; months shorter than day 31; December-to-January rollover; and the manual first-due-date fallback.

```ts
expect(calculateFirstDueDate({
  transactionDate: "2026-07-10",
  cutoffDay: 20,
  paymentDueDay: 5,
  timeZone: "Asia/Jakarta",
})).toBe("2026-08-05")

expect(calculateFirstDueDate({
  transactionDate: "2026-07-21",
  cutoffDay: 20,
  paymentDueDay: 5,
  timeZone: "Asia/Jakarta",
})).toBe("2026-09-05")

expect(addBillingMonth("2026-01-31", 1)).toBe("2026-02-28")
```

Run:

```powershell
rtk npm test -- billingCycle.test.ts
```

Expected: FAIL because the module does not exist.

**Step 2: Implement pure calendar helpers**

Expose these exact interfaces:

```ts
export interface BillingCycleInput {
  transactionDate: string
  cutoffDay: number
  paymentDueDay: number
  timeZone: "Asia/Jakarta"
}

export function clampDay(year: number, monthIndex: number, day: number): string
export function addBillingMonth(date: string, months: number): string
export function calculateFirstDueDate(input: BillingCycleInput): string
```

Rules:

- Transaction day `<= cutoffDay`: due in the immediately following billing month.
- Transaction day `> cutoffDay`: due one additional month later.
- Clamp both cutoff and due days to the actual last day of their month.
- Parse and return `YYYY-MM-DD`; convert to a UTC `Date` only at the repository boundary.

**Step 3: Run tests**

```powershell
rtk npm test -- billingCycle.test.ts
```

Expected: PASS.

**Step 4: Commit**

```powershell
rtk git add src/domain/billingCycle.ts test/billingCycle.test.ts
rtk git commit -m "feat: calculate credit billing due dates"
```

---

## Task 3: Enforce Wallet Creation and Credit-Limit Rules

**Files:**

- Modify: `../pocket-mint-be/src/services/wallet.service.ts`
- Modify: `../pocket-mint-be/src/controllers/account.controller.ts`
- Modify: `../pocket-mint-be/src/services/wallet.types.ts`
- Test: `../pocket-mint-be/test/walletService.test.ts`
- Test: `../pocket-mint-be/test/walletControllerBoundary.test.ts`

**Step 1: Add failing wallet-rule tests**

Add cases proving:

- Cash, Bank, and E-Wallet accept non-negative opening balances and store `creditLimit = 0`.
- Credit Card and Paylater start with balance `0`, reject a limit `<= 0`, and accept optional cutoff/due days.
- Loan requires one positive `principal` input and stores it as a negative opening balance.
- Loan rejects credit limit, cutoff, and due fields.
- Credit metadata updates never mutate ledger balance.

Run:

```powershell
rtk npm test -- walletService.test.ts walletControllerBoundary.test.ts
```

Expected: FAIL against the current shared debt-wallet behavior.

**Step 2: Replace the generic debt branch with explicit policies**

Use these type sets:

```ts
const ASSET_TYPES = new Set(["CASH", "BANK", "E_WALLET"])
const CREDIT_TYPES = new Set(["CREDIT_CARD", "PAYLATER"])
const LIABILITY_TYPES = new Set(["CREDIT_CARD", "PAYLATER", "LOAN"])
```

Normalize create inputs into this persisted shape:

```ts
type WalletCreateInput = {
  name: string
  type: WalletType
  initialBalance?: number
  principal?: number
  creditLimit?: number
  cutoffDay?: number | null
  paymentDueDay?: number | null
  institutionId?: string | null
}
```

For credit products, force both `balance` and `initialBalance` to zero regardless of omitted client fields. For loans, set both to `-Math.abs(principal)`.

**Step 3: Return explicit computed fields**

In the account serializer, return:

```ts
{
  ...wallet,
  outstanding: Math.abs(Math.min(Number(wallet.balance), 0)),
  remainingCredit: CREDIT_TYPES.has(wallet.type)
    ? Math.max(Number(wallet.creditLimit) - Math.abs(Math.min(Number(wallet.balance), 0)), 0)
    : null,
}
```

Do not return misleading `sisa_limit` for Loan.

**Step 4: Run tests**

```powershell
rtk npm test -- walletService.test.ts walletControllerBoundary.test.ts
```

Expected: PASS.

**Step 5: Commit**

```powershell
rtk git add src/services/wallet.service.ts src/controllers/account.controller.ts src/services/wallet.types.ts test/walletService.test.ts test/walletControllerBoundary.test.ts
rtk git commit -m "feat: enforce wallet type policies"
```

---

## Task 4: Generalize Credit Purchases into Bills

**Files:**

- Modify: `../pocket-mint-be/src/models/transaction.model.ts`
- Modify: `../pocket-mint-be/src/services/transaction.service.ts`
- Modify: `../pocket-mint-be/src/domain/transactionBalance.ts`
- Modify: `../pocket-mint-be/src/domain/installment.ts`
- Modify: `../pocket-mint-be/src/services/installment-query.types.ts`
- Modify: `../pocket-mint-be/src/services/installment-query.service.ts`
- Modify: `../pocket-mint-be/src/controllers/installment.controller.ts`
- Modify: `../pocket-mint-be/src/routes/installmentRoutes.ts`
- Modify: `../pocket-mint-be/src/routes/index.ts`
- Test: `../pocket-mint-be/test/transactionService.test.ts`
- Test: `../pocket-mint-be/test/transactionBalance.test.ts`
- Modify: `../pocket-mint-be/test/installment.test.ts`
- Modify: `../pocket-mint-be/test/installmentQueryService.test.ts`
- Modify: `../pocket-mint-be/test/installmentControllerBoundary.test.ts`

**Step 1: Write failing purchase and bill tests**

Cover:

- A normal Credit Card/Paylater expense creates a `FULL` bill with one unpaid term.
- An installment purchase creates an `INSTALLMENT` bill for any positive nominal amount.
- The full installment grand total is locked against available credit.
- A purchase above remaining credit is rejected in the backend.
- Loan cannot be selected for a purchase.
- Missing cutoff or due day requires `firstDueDate`.
- Existing `/v1/installments` and new `/v1/bills` return the same generalized resource.

Run:

```powershell
rtk npm test -- transactionService.test.ts transactionBalance.test.ts installment.test.ts installmentQueryService.test.ts installmentControllerBoundary.test.ts
```

Expected: FAIL because normal credit purchases do not create bills and the bill API does not exist.

**Step 2: Extend the transaction request contract**

```ts
type CreateTransactionInput = {
  // existing transaction fields
  categoryId?: string
  billingMode?: "FULL" | "INSTALLMENT"
  installmentMonths?: number
  firstDueDate?: string
}
```

Reject `billingMode` for non-credit wallets. Default credit expenses to `FULL`. Require at least two months for `INSTALLMENT`; do not enforce a nominal threshold.

**Step 3: Implement one atomic credit-purchase transaction**

Inside one Prisma transaction:

1. Lock/read the owned wallet.
2. Verify type is Credit Card or Paylater.
3. Calculate purchase grand total using the existing interest/admin-fee rules only for installment mode.
4. Reject when `grandTotal > creditLimit - abs(balance)`.
5. Create the expense transaction.
6. Decrease the credit wallet balance by the locked total.
7. Create the generalized bill linked to the transaction and wallet.

Use this public shape:

```ts
export interface BillDto {
  id: string
  walletId: string
  transactionId: string
  kind: "FULL" | "INSTALLMENT"
  totalAmount: number
  amountPerTerm: number
  totalTerms: number
  paidTerms: number
  nextDueDate: string
  status: "ACTIVE" | "SETTLED" | "OVERDUE"
}
```

Derive `OVERDUE` at serialization time when an active bill's local due date is before today. Do not persist a daily status mutation.

**Step 4: Add API compatibility routing**

Mount the same router at both paths:

```ts
router.use("/v1/bills", billRouter)
router.use("/v1/installments", billRouter)
```

Keep controller filenames temporarily, but make their response vocabulary bill-based. This prevents an unnecessary all-at-once backend rename.

**Step 5: Run focused tests**

```powershell
rtk npm test -- transactionService.test.ts transactionBalance.test.ts installment.test.ts installmentQueryService.test.ts installmentControllerBoundary.test.ts
```

Expected: PASS.

**Step 6: Commit**

```powershell
rtk git add src/models/transaction.model.ts src/services/transaction.service.ts src/domain/transactionBalance.ts src/domain/installment.ts src/services/installment-query.types.ts src/services/installment-query.service.ts src/controllers/installment.controller.ts src/routes/installmentRoutes.ts src/routes/index.ts test/transactionService.test.ts test/transactionBalance.test.ts test/installment.test.ts test/installmentQueryService.test.ts test/installmentControllerBoundary.test.ts
rtk git commit -m "feat: create bills for credit purchases"
```

---

## Task 5: Make Bill Payment a Valid Liability Transfer

**Files:**

- Modify: `../pocket-mint-be/src/services/installment-payment.service.ts`
- Modify: `../pocket-mint-be/src/services/installment-payment.types.ts`
- Modify: `../pocket-mint-be/src/services/transaction.service.ts`
- Test: `../pocket-mint-be/test/installmentPaymentService.test.ts`
- Test: `../pocket-mint-be/test/transactionService.test.ts`

**Step 1: Write failing payment and transfer tests**

Verify:

- Bill payment source may be Cash, Bank, or E-Wallet.
- Credit Card, Paylater, and Loan cannot be transfer sources.
- A liability may be a transfer destination.
- Source and destination cannot match.
- Insufficient asset balance is rejected server-side.
- Paying a bill debits the asset, credits the credit wallet, increments `paidTerms`, advances due date one billing month, and settles the final term atomically.
- A normal transfer to Loan reduces its negative balance without creating or changing a bill.

Run:

```powershell
rtk npm test -- installmentPaymentService.test.ts transactionService.test.ts
```

Expected: FAIL because E-Wallet is excluded and generic source/destination roles are not enforced.

**Step 2: Implement shared transfer-role validation**

```ts
export function assertTransferRoles(source: Wallet, destination: Wallet, amount: number) {
  if (!ASSET_TYPES.has(source.type)) throw new ValidationError("Sumber harus Kas, Bank, atau E-Wallet")
  if (source.id === destination.id) throw new ValidationError("Dompet tujuan harus berbeda")
  if (Number(source.balance) < amount) throw new ValidationError("Saldo tidak mencukupi")
}
```

The destination may be any owned wallet other than the source. When it is a liability, a positive transfer reduces its outstanding negative balance.

**Step 3: Generalize the payment service without duplicating ledger logic**

Rename exported functions to bill vocabulary but retain old re-exports for callers during migration:

```ts
export async function payBill(input: PayBillInput): Promise<BillDto>
export const payInstallment = payBill
```

Require exactly `amountPerTerm` in this release. After a successful non-final payment, set `nextDueDate = addBillingMonth(nextDueDate, 1)`.

**Step 4: Run focused tests**

```powershell
rtk npm test -- installmentPaymentService.test.ts transactionService.test.ts
```

Expected: PASS.

**Step 5: Commit**

```powershell
rtk git add src/services/installment-payment.service.ts src/services/installment-payment.types.ts src/services/transaction.service.ts test/installmentPaymentService.test.ts test/transactionService.test.ts
rtk git commit -m "feat: pay bills from asset wallets"
```

---

## Task 6: Seed and Validate Transaction Categories

**Files:**

- Create: `../pocket-mint-be/src/services/category.service.ts`
- Create: `../pocket-mint-be/src/controllers/category.controller.ts`
- Create: `../pocket-mint-be/src/routes/categoryRoutes.ts`
- Modify: `../pocket-mint-be/src/routes/index.ts`
- Modify: `../pocket-mint-be/src/controllers/user.controller.ts`
- Modify: `../pocket-mint-be/src/services/transaction.service.ts`
- Create: `../pocket-mint-be/test/categoryService.test.ts`
- Create: `../pocket-mint-be/test/categoryController.test.ts`
- Modify: `../pocket-mint-be/test/userSync.test.ts`
- Modify: `../pocket-mint-be/test/transactionService.test.ts`

**Step 1: Write failing category tests**

Test that:

- Default income and expense categories are created idempotently for each user.
- `GET /v1/categories` is authenticated and returns only the current user's categories.
- Income and expense transactions require an owned category with the matching type.
- Transfers reject/ignore category IDs and persist no category.

Run:

```powershell
rtk npm test -- categoryService.test.ts categoryController.test.ts transactionService.test.ts
```

Expected: FAIL because no category endpoint exists and the transaction service does not validate category ownership/type.

**Step 2: Add an idempotent default catalog**

Use stable names and the existing category type enum:

```ts
const DEFAULT_CATEGORIES = {
  EXPENSE: ["Makanan", "Transportasi", "Belanja", "Tagihan", "Kesehatan", "Hiburan", "Lainnya"],
  INCOME: ["Gaji", "Bonus", "Investasi", "Hadiah", "Lainnya"],
} as const
```

Create them with a transaction/upsert keyed by the schema's user/name/type uniqueness. Call the same `ensureDefaultCategories(userId)` from user synchronization and from the list endpoint so existing users are backfilled lazily and safely.

**Step 3: Add the protected endpoint and transaction validation**

Mount:

```ts
router.use("/v1/categories", categoryRouter)
```

For `INCOME` and `EXPENSE`, require `categoryId`, load it with `userId`, and require matching type. For `TRANSFER`, require `categoryId` to be absent and store `null`.

**Step 4: Run focused tests**

```powershell
rtk npm test -- categoryService.test.ts categoryController.test.ts transactionService.test.ts
```

Expected: PASS.

**Step 5: Commit**

```powershell
rtk git add src/services/category.service.ts src/controllers/category.controller.ts src/routes/categoryRoutes.ts src/routes/index.ts src/controllers/user.controller.ts src/services/transaction.service.ts test/categoryService.test.ts test/categoryController.test.ts test/userSync.test.ts test/transactionService.test.ts
rtk git commit -m "feat: add owned transaction categories"
```

---

## Task 7: Update Frontend Wallet Types and Forms

**Files:**

- Modify: `src/types/wallet.ts`
- Modify: `app/(app)/wallets/page.tsx`
- Modify: `app/(app)/wallets/components/CreateWalletModal.tsx`
- Modify: `app/(app)/wallets/components/EditWalletModal.tsx`
- Modify: `src/features/wallets/hooks/useWallets.ts`
- Create: `tests/wallet-form.test.tsx`
- Create: `tests/wallet-page.test.tsx`
- Create: `tests/select-placeholder-contract.test.tsx`

**Step 1: Write failing UI contract tests**

Assert:

- The type picker contains Cash, Bank, E-Wallet, Credit Card, Paylater, and Loan.
- The list/filter label is `Kas & Bank`, not `Rekening`.
- Cash and Bank render in the `Kas & Bank` section.
- Credit Card and Paylater show limit, optional cutoff, and optional due day, but no opening outstanding.
- Loan shows only a principal field.
- Required selects use a disabled hidden empty option.
- Optional institution selection exposes `Tanpa institusi` as the explicit empty choice.
- Edit form never exposes direct balance editing.

Run:

```powershell
rtk npm test -- wallet-form.test.tsx wallet-page.test.tsx select-placeholder-contract.test.tsx
```

Expected: FAIL against the current generic credit/loan form and selectable empty options.

**Step 2: Update wallet contracts and mappings**

```ts
export type WalletType = "CASH" | "BANK" | "E_WALLET" | "CREDIT_CARD" | "PAYLATER" | "LOAN"

export const ASSET_WALLET_TYPES = ["CASH", "BANK", "E_WALLET"] as const
export const CREDIT_WALLET_TYPES = ["CREDIT_CARD", "PAYLATER"] as const
export const LIABILITY_WALLET_TYPES = ["CREDIT_CARD", "PAYLATER", "LOAN"] as const
```

Remove every `LOAN_PAYLATER` mapping. Map UI cards directly to backend types rather than through `bank | wallet | credit | loan` aliases.

**Step 3: Split create-form fields by policy**

- Cash/Bank/E-Wallet: name, optional institution, opening balance.
- Credit Card/Paylater: name, institution, credit limit, optional cutoff day, optional payment due day; send opening balance `0`.
- Loan: name and positive principal only.

For a required native select:

```tsx
<option value="" disabled hidden>Pilih jenis dompet</option>
```

For an optional institution:

```tsx
<option value="none">Tanpa institusi</option>
```

Normalize `none` to `null` before submission.

**Step 4: Restrict edit form to metadata**

Allow name/institution for all types; limit/cutoff/due for credit products. Do not submit `balance`, `initialBalance`, or loan principal from edit.

**Step 5: Run focused tests**

```powershell
rtk npm test -- wallet-form.test.tsx wallet-page.test.tsx select-placeholder-contract.test.tsx
rtk npm run lint
```

Expected: tests and lint pass.

**Step 6: Commit**

```powershell
rtk git add src/types/wallet.ts 'app/(app)/wallets/page.tsx' 'app/(app)/wallets/components/CreateWalletModal.tsx' 'app/(app)/wallets/components/EditWalletModal.tsx' src/features/wallets/hooks/useWallets.ts tests/wallet-form.test.tsx tests/wallet-page.test.tsx tests/select-placeholder-contract.test.tsx
rtk git commit -m "feat: clarify wallet creation flows"
```

---

## Task 8: Fix Transaction Category, Credit, and Transfer UX

**Files:**

- Modify: `app/(app)/transactions/components/AddTransactionModal.tsx`
- Modify: `app/(app)/transactions/components/transfer-account-picker.ts`
- Modify: `app/(app)/transactions/components/AccountPicker.tsx`
- Modify: `src/features/transactions/hooks/useTransactions.ts`
- Create: `src/features/categories/hooks/useCategories.ts`
- Modify: `tests/transfer-account-picker.test.ts`
- Modify: `tests/transfer-account-picker-contract.test.ts`
- Modify: `tests/account-picker-render.test.ts`
- Create: `tests/add-transaction-modal.test.tsx`

**Step 1: Write failing interaction tests**

Cover:

- Categories load from `/v1/categories` and selected `categoryId` is submitted.
- Income/expense cannot submit while the category placeholder is selected.
- Credit Card/Paylater remain selectable when the nominal is within remaining credit.
- Both full-payment and installment modes are offered for any positive credit purchase.
- First due date appears and becomes required when cutoff or due day is missing.
- Transfer source contains Cash, Bank, and E-Wallet.
- Transfer destination contains all other wallets, including Credit Card, Paylater, and Loan.
- Insufficient-balance sources remain visible but disabled with a reason.

Run:

```powershell
rtk npm test -- transfer-account-picker.test.ts transfer-account-picker-contract.test.ts account-picker-render.test.ts add-transaction-modal.test.tsx
```

Expected: FAIL because category is local-only, debt wallets are filtered out, and credit wallets are disabled by the old spendable calculation.

**Step 2: Implement category data flow**

Create:

```ts
export interface Category {
  id: string
  name: string
  type: "INCOME" | "EXPENSE"
}

export function useCategories(): UseQueryResult<Category[]>
```

Remove static category arrays. Send `categoryId` for income/expense and omit it for transfer.

**Step 3: Separate source eligibility from destination eligibility**

```ts
export function getTransferSources(wallets: Wallet[]) {
  return wallets.filter(wallet => ASSET_WALLET_TYPES.includes(wallet.type))
}

export function getTransferDestinations(wallets: Wallet[], sourceId: string) {
  return wallets.filter(wallet => wallet.id !== sourceId)
}
```

Do not filter an insufficient asset out. Add `disabled: wallet.balance < amount` to its picker item and render `Saldo tidak mencukupi`.

**Step 4: Correct credit availability and billing payloads**

Calculate:

```ts
const remainingCredit = Math.max(wallet.creditLimit - Math.abs(Math.min(wallet.balance, 0)), 0)
```

For `FULL`, compare nominal amount against remaining credit and send `billingMode: "FULL"`. For `INSTALLMENT`, compare computed grand total and send months plus `billingMode: "INSTALLMENT"`. Send `firstDueDate` only when the selected wallet lacks a complete cycle.

**Step 5: Run focused tests**

```powershell
rtk npm test -- transfer-account-picker.test.ts transfer-account-picker-contract.test.ts account-picker-render.test.ts add-transaction-modal.test.tsx
rtk npm run lint
```

Expected: tests and lint pass.

**Step 6: Commit**

```powershell
rtk git add 'app/(app)/transactions/components/AddTransactionModal.tsx' 'app/(app)/transactions/components/transfer-account-picker.ts' 'app/(app)/transactions/components/AccountPicker.tsx' src/features/transactions/hooks/useTransactions.ts src/features/categories/hooks/useCategories.ts tests/transfer-account-picker.test.ts tests/transfer-account-picker-contract.test.ts tests/account-picker-render.test.ts tests/add-transaction-modal.test.tsx
rtk git commit -m "feat: fix transaction wallet and category flows"
```

---

## Task 9: Rename Cicilan UI to Tagihan and Add Due Alerts

**Files:**

- Create: `src/features/bills/hooks/useBills.ts`
- Create: `app/(app)/tagihan/page.tsx`
- Create: `app/(app)/tagihan/components/BillCard.tsx`
- Create: `app/(app)/tagihan/components/PayBillModal.tsx`
- Modify: `app/(app)/cicilan/page.tsx`
- Delete: `app/(app)/cicilan/components/ActiveInstallmentsWidget.tsx`
- Delete: `app/(app)/cicilan/components/HeroCard.tsx`
- Delete: `app/(app)/cicilan/components/InstallmentCard.tsx`
- Delete: `app/(app)/cicilan/components/InstallmentList.tsx`
- Delete: `app/(app)/cicilan/components/JatuhTempoCard.tsx`
- Delete: `app/(app)/cicilan/components/OutstandingLiabilityCard.tsx`
- Delete: `app/(app)/cicilan/components/RightSidebar.tsx`
- Delete: `app/(app)/cicilan/components/Sparkline.tsx`
- Delete: `app/(app)/cicilan/components/StatCard.tsx`
- Modify: `src/features/installments/hooks/useInstallments.ts`
- Modify: `components/layout/app-sidebar.tsx`
- Modify: `components/layout/bottom-nav.tsx`
- Modify: `app/(app)/dashboard/page.tsx`
- Modify: `app/(app)/analytics/page.tsx`
- Modify: `tests/navigation.test.tsx`
- Create: `tests/bill-due-alert.test.ts`
- Create: `tests/tagihan-page.test.tsx`

**Step 1: Write failing route, rendering, and due-count tests**

Test:

- Sidebar and bottom navigation label and link are `Tagihan` and `/tagihan`.
- `/cicilan` redirects to `/tagihan`.
- Full and installment bills render using the same card.
- Due count includes active bills overdue or due from today through three local calendar days.
- Due count excludes settled bills and bills four or more days away.
- Sidebar and bottom navigation show the same numeric badge and omit it at zero.
- Payment picker accepts Cash, Bank, and E-Wallet.

Use a pure helper contract:

```ts
expect(countDueSoon(bills, "2026-07-17", 3)).toBe(3)
```

Run:

```powershell
rtk npm test -- navigation.test.tsx bill-due-alert.test.ts tagihan-page.test.tsx
```

Expected: FAIL because the product is still named Cicilan and has no due badge.

**Step 2: Add the generalized bill hook**

```ts
export function useBills() {
  return useQuery<BillDto[]>({
    queryKey: ["bills"],
    queryFn: async () => {
      const response = await api.get<{ data: BillDto[] }>("/bills")
      return response.data.data
    },
  })
}

export function usePayBill() {
  return useMutation({
    mutationFn: ({ billId, sourceWalletId }: PayBillInput) =>
      api.post<{ data: BillDto }>(`/bills/${billId}/pay`, { sourceWalletId })
        .then(response => response.data.data),
  })
}
```

On success, invalidate `bills`, `wallets`, `transactions`, dashboard, and analytics queries.

**Step 3: Implement due-soon calculation**

```ts
export function countDueSoon(bills: BillDto[], today: string, windowDays = 3) {
  const end = addCalendarDays(today, windowDays)
  return bills.filter(bill =>
    (bill.status === "ACTIVE" || bill.status === "OVERDUE") &&
    bill.nextDueDate.slice(0, 10) <= end
  ).length
}
```

Because overdue dates are earlier than today, they are included. Compare normalized `YYYY-MM-DD` strings generated in `Asia/Jakarta`, not browser timestamps.

**Step 4: Build `/tagihan` and retain the old URL**

Use one `BillCard` for `FULL` and `INSTALLMENT`, showing kind, next due date, amount due, paid/total terms, and status. The pay action opens `PayBillModal` with eligible asset wallets.

Replace `app/(app)/cicilan/page.tsx` with:

```tsx
import { redirect } from "next/navigation"

export default function CicilanRedirect() {
  redirect("/tagihan")
}
```

**Step 5: Add one shared badge source to both navigation surfaces**

Extract a small `useDueBillCount()` hook from the bill feature. Render a compact numeric badge on the `Tagihan` icon/label in desktop sidebar and mobile bottom navigation. Use `9+` for counts above nine and an accessible label such as `3 tagihan perlu diperhatikan`.

Update dashboard and analytics wording from Cicilan to Tagihan without changing unrelated calculations.

Replace `useInstallments.ts` with compatibility re-exports from `useBills.ts`, then delete the now-unreferenced Cicilan-only components after the new page tests pass.

**Step 6: Run focused tests**

```powershell
rtk npm test -- navigation.test.tsx bill-due-alert.test.ts tagihan-page.test.tsx
rtk npm run lint
```

Expected: tests and lint pass.

**Step 7: Commit**

```powershell
rtk git add src/features/bills/hooks/useBills.ts src/features/installments/hooks/useInstallments.ts 'app/(app)/tagihan' 'app/(app)/cicilan' components/layout/app-sidebar.tsx components/layout/bottom-nav.tsx 'app/(app)/dashboard/page.tsx' 'app/(app)/analytics/page.tsx tests/navigation.test.tsx tests/bill-due-alert.test.ts tests/tagihan-page.test.tsx
rtk git commit -m "feat: replace cicilan with due-aware bills"
```

---

## Task 10: End-to-End Verification and Visual QA

**Files:**

- Modify: `scripts/capture-authenticated-pages.mjs`
- Create: `tests/authenticated-page-capture.test.ts`
- Create: `docs/qa/wallet-billing-flow.md`

**Step 1: Add the Tagihan route to authenticated capture coverage**

Add `/wallets`, `/transactions`, `/tagihan`, `/dashboard`, and `/analytics` to the capture script's route table. Hide only development overlays through Playwright setup; do not alter production UI for screenshots.

Update login selectors to target the actual input unambiguously:

```js
await page.locator('input[name="password"]').fill(password)
```

Run:

```powershell
rtk npm test -- authenticated-page-capture.test.ts
```

Expected: PASS after the route table and selector update.

**Step 2: Run the full backend verification**

From `pocket-mint-be`:

```powershell
rtk npm test
rtk npm run build
```

Expected: all tests pass and TypeScript/Prisma build succeeds.

**Step 3: Run the full frontend verification**

From `pocket-mint-fe`:

```powershell
rtk npm test
rtk npm run lint
rtk npm run build
```

Expected: all tests, lint, and production build pass.

**Step 4: Apply the migration in the local development database**

From `pocket-mint-be`, with the existing development `DATABASE_URL`:

```powershell
rtk npx prisma migrate dev
```

Expected: migration applies without data loss and Prisma reports the schema is in sync.

**Step 5: Exercise the critical flow in the browser**

Use the in-app browser first. Verify at desktop and mobile widths:

1. Create Cash, Bank, E-Wallet, Credit Card, Paylater, and Loan wallets.
2. Confirm only explicit valid fields appear for each type.
3. Create a full credit purchase and a multi-month credit purchase below Rp500.000.
4. Confirm both appear in Tagihan and reduce remaining credit.
5. Pay a due term from E-Wallet and confirm all affected balances and term counts update once.
6. Transfer from Bank to Loan and confirm the loan outstanding decreases.
7. Confirm no liability appears as a transfer source.
8. Confirm due and overdue bills produce matching badges in desktop and mobile navigation.
9. Confirm every required select prevents choosing its instructional label.

Record the observed result for each item in `docs/qa/wallet-billing-flow.md`, including viewport and any known limitation.

**Step 6: Capture authenticated screenshots**

With frontend running on port 4000 and backend running on its configured port:

```powershell
rtk npm run screenshot:authenticated
```

Expected: clean screenshots for dashboard, wallets, transactions, Tagihan, and analytics, with no Turbopack icon or development overlay.

**Step 7: Review the final diff**

In both repositories:

```powershell
rtk git status --short
rtk git diff --check
rtk git diff --stat
```

Expected: no whitespace errors; unrelated pre-existing frontend changes remain unstaged and untouched.

**Step 8: Commit QA-only changes**

```powershell
rtk git add scripts/capture-authenticated-pages.mjs tests/authenticated-page-capture.test.ts docs/qa/wallet-billing-flow.md
rtk git commit -m "test: verify wallet billing workflow"
```

---

## Completion Criteria

- All six wallet types have correct, explicit creation and edit behavior.
- Credit Card and Paylater limits are enforced in both UI and backend.
- Loan creation accepts only principal and loan repayment works as an asset-to-liability transfer.
- Every credit purchase produces either a full or installment bill, regardless of purchase amount.
- Bill due dates follow cutoff/due configuration or a required first-due-date fallback.
- Tagihan replaces Cicilan in product UI while old URLs and API paths remain compatible.
- Desktop and mobile navigation show the same overdue/next-three-days numeric alert.
- Categories are persisted, owned, type-checked, and submitted by the transaction form.
- Required select labels cannot be selected; optional empty selections are explicit.
- Backend tests/build, frontend tests/lint/build, migration, browser flow, and screenshots all pass.
