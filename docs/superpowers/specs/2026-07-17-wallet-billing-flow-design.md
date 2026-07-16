# Wallet and Billing Flow Design

## Goal

Correct the wallet taxonomy and transaction controls, then generalize the existing installment flow into a single billing system for credit cards and paylater. Users must be able to record ordinary credit purchases, optional installment purchases, pay upcoming bills, and see urgent obligations in navigation.

## Current Problems

- The `Rekening` group combines `BANK` and `CASH`, so its label is inaccurate.
- Native select placeholders are enabled options and can be selected as values.
- The transaction category selector stores local display text but never submits a category to the backend.
- Debt-wallet creation uses the same `Outstanding Awal` and limit fields for credit cards, paylater, and loans even though the products behave differently.
- Credit purchases are disabled when `creditLimit` is zero because spendable credit is calculated as limit minus outstanding.
- The transfer picker removes debt wallets from both endpoints, preventing ordinary credit-card or paylater bill payments.
- The installment system represents only multi-term purchases and cannot represent a normal one-payment credit bill.

## Wallet Taxonomy

The supported wallet types become:

- `CASH`: physical cash with an opening balance.
- `BANK`: a bank account with an opening balance.
- `E_WALLET`: an electronic wallet with an opening balance.
- `CREDIT_CARD`: revolving credit with a required credit limit and zero opening debt.
- `PAYLATER`: provider credit with a required credit limit and zero opening debt.
- `LOAN`: a fixed liability created with one principal amount and no credit limit.

Existing `LOAN_PAYLATER` records are migrated to `PAYLATER`, matching the current UI behavior and provider presets. New personal-loan accounts use `LOAN`.

The wallet creation UI presents Cash, Bank, E-Wallet, Credit Card, Paylater, and Loan separately. The wallet list and filter combine Cash and Bank under the user-facing label `Kas & Bank`.

Credit Card and Paylater collect:

- Account name and optional institution.
- Required credit limit greater than zero.
- Optional billing cutoff day, from 1 through 31.
- Optional payment due day, from 1 through 31.

They do not accept opening outstanding debt. Their balance and opening balance start at zero. Current outstanding is always derived from ledger transactions.

Loan collects only account name, optional institution, and principal. Its opening balance is the negative principal. It has no limit, cutoff, or due-day fields.

## Credit Limit Rules

For Credit Card and Paylater:

`remaining credit = credit limit - absolute current balance`

An expense is allowed when its total locked amount does not exceed remaining credit. A normal purchase locks its amount. An installment purchase locks principal, interest, and applicable fees according to the existing backend calculation. Income cannot be posted directly to a credit product, and a credit product cannot be a transfer source.

Cash, Bank, and E-Wallet expenses remain limited by their current positive balance. Loan is not selectable as a purchase source.

## Generalized Billing Domain

The product concept `Cicilan` is renamed to `Tagihan`. The existing installment persistence and payment flow are evolved into one obligation model instead of creating a parallel debt ledger.

Every expense from Credit Card or Paylater creates one bill record:

- `FULL`: one payment term for an ordinary purchase.
- `INSTALLMENT`: multiple monthly terms using the selected tenor.

Pocket Mint applies no minimum transaction amount for installment eligibility. Provider-specific restrictions remain the user's responsibility.

A bill stores:

- Linked credit wallet and originating transaction.
- Principal, interest, fees, and grand total.
- Bill kind (`FULL` or `INSTALLMENT`).
- Total terms and paid terms.
- Monthly or single-payment amount.
- Next due date.
- Status (`ACTIVE`, `SETTLED`, or `OVERDUE`).

Existing installment records are migrated without losing their transaction or wallet relationships. Their paid-term count is derived from the current term semantics during migration and verified with migration tests.

## Due-Date Calculation

Credit Card and Paylater may define both a cutoff day and payment due day.

When both values exist:

- A purchase on or before the monthly cutoff enters the current billing cycle.
- A purchase after the cutoff enters the next billing cycle.
- The due date is the configured payment day in the appropriate following month.
- Calendar days that do not exist in a month clamp to that month's final day.

When either account-level value is missing, the transaction form requires an explicit first due date. Installment terms after the first advance monthly using the same end-of-month clamping rule.

All date classification uses the configured application timezone, Asia/Jakarta, and date-only business semantics.

## Bill Payment

The Tagihan page lists both full-payment and installment bills. Each card shows the source purchase, creditor account, next due date, amount due, progress, and status.

Payment sources are Cash, Bank, and E-Wallet accounts with sufficient balance. A payment is one backend transaction that atomically:

- Debits the selected asset wallet.
- Credits the linked credit wallet, reducing its negative outstanding balance.
- Increments paid terms.
- Advances the next due date or marks the bill settled.

Payments cannot exceed or differ from the currently due term in this version. Loan repayments use a normal transfer from an asset wallet to the Loan wallet and do not create installment schedules automatically.

## Transfer Flow

Transfer sources include only Cash, Bank, and E-Wallet. Transfer destinations include every wallet except the selected source, including Credit Card, Paylater, and Loan.

An asset destination is a normal transfer. A liability destination is presented as a bill or debt payment while using the same atomic two-wallet transfer primitive. Credit products and loans never appear as transfer sources.

Eligible source accounts remain visible when their balance is insufficient but are disabled with an explanation. The empty state appears only when no eligible source account exists. Selecting the opposite endpoint swaps endpoints only when both selected wallets are valid in their respective roles.

## Navigation Alert

The sidebar item is renamed from `Cicilan` to `Tagihan`. It displays a numeric alert badge for active bills that are:

- Due today through three calendar days from today, inclusive.
- Past due and not settled.

Overdue bills are counted until paid. The badge is omitted when the count is zero. The Tagihan page prioritizes overdue bills, then due-soon bills, then later bills.

## Select and Category Behavior

Required native selects use a disabled, hidden placeholder option and HTML required validation. Optional selects use a disabled prompt plus an explicit selectable value such as `Tanpa institusi`, allowing the user to return to no selection.

Transaction categories become real backend data:

- Default income and expense categories are created idempotently for each user.
- A protected categories endpoint returns the authenticated user's categories.
- The transaction form submits `categoryId`, not display text.
- The backend verifies category ownership and type compatibility.
- Category is required for income and expense, and absent for transfer.

Filter values such as `Semua`, `Semua kategori`, or `Semua tipe` remain selectable because they are real filter states, not placeholders.

## Compatibility and Migration

The backend schema migration:

- Replaces `LOAN_PAYLATER` with `PAYLATER` and adds `LOAN`.
- Adds optional cutoff and due-day fields to wallets.
- Generalizes installment records with bill kind, paid terms, and next due date.
- Preserves existing wallet, transaction, and installment relationships.
- Keeps credit-limit storage because it is a real spending constraint.

API compatibility is maintained during the frontend transition by keeping existing installment endpoints as aliases where practical. New product-facing code uses Bill/Tagihan terminology.

No opening debt is fabricated during migration. Existing negative balances and historical transactions remain unchanged.

## Error Handling

The backend returns typed validation errors for invalid limits, invalid cutoff/due days, insufficient cash balance, exceeded remaining credit, invalid transfer roles, missing due dates, category mismatch, and invalid bill payments. Frontend controls prevent known-invalid submissions and display the backend message without silently changing values.

## Verification

- Unit-test due-date calculation across cutoff boundaries and short months.
- Unit-test remaining-credit checks for normal and installment purchases.
- Unit-test transfer source/destination filtering and liability payments.
- Unit-test full-payment and installment bill creation and payment transitions.
- Migration-test legacy `LOAN_PAYLATER` and installment records.
- Contract-test disabled placeholders and persisted category IDs.
- Render and interact with Wallet, Add Transaction, Transfer, and Tagihan flows on desktop and mobile.
- Verify the sidebar alert for no bills, due within three days, overdue, and settled states.
- Run frontend and backend test, lint, and build commands.

## Out of Scope

- Automatic provider API synchronization.
- Provider-specific minimum installment amounts.
- Partial bill payments, overpayments, and revolving minimum payments.
- Interest accrual after a missed payment.
- Automatic repayment schedules for personal loans.
