# Financial Logic — Pocket Mint (Frontend)
> Read this before touching any wallet, transaction, installment, or calculation logic.

**Synced with backend financial-logic.skill.md on 2026-07-18.**
Source of truth for financial rules is the backend implementation and
approved product decisions (PD-001 ff.). This document summarizes the
rules the frontend must follow.

## Wallet Types

### ASSET
- Types: `CASH`, `BANK`, `E_WALLET`
- Balance stored as positive. Displayed in Mint.
- Contribute to `totalAset` at face value.
- `isAssetWallet` / `ASSET_WALLET_TYPES` in `src/types/wallet.ts`.

### DEBT
- Types: `CREDIT_CARD`, `PAYLATER`, `LOAN`
- **Outstanding is stored as a NEGATIVE balance** — display `Math.abs(balance)` in Coral.
- `isDebtWallet` in `src/types/wallet.ts`.
- `spendable = creditLimit - |balance|` (for asset wallets: `spendable = balance`).

## Net Worth Calculation (PD-001 — Approved)

```
totalAset  = Σ(balance) for ASSET wallets
totalUtang = Σ(|balance|) for DEBT wallets
netWorth   = totalAset − totalUtang
```

- Debt IS subtracted from net worth. This is PD-001 (Approved 2026-07-14).
- Net worth may be negative — never clamp to zero.
- Compute from live wallet balances; never store.
- **Important:** Call `GET /v1/dashboard/summary` from the backend for the
  canonical calculation. Do NOT recompute independently in frontend.

### Deprecated
A previous formula (`netWorth = Σ(ASSET balances)`, assets only) was
superseded by PD-001. If you find code using this old formula, flag it.

## Transaction Rules

- Backend types: `INCOME`, `EXPENSE`, `TRANSFER`.
- Transfer = ONE transaction record with `walletId` (source) + `toWalletId` (destination).
- Debt repayment = TRANSFER from asset wallet into debt wallet — **NOT EXPENSE**.
- Payment sources for bills: `BANK`, `CASH`, `E_WALLET` (all asset types allowed).
- Category is metadata — not used in core calculations.

### Net Worth impact by transaction type

| Transaction | Net Worth |
|---|---|
| INCOME to ASSET | +amount (assets ↑) |
| EXPENSE from ASSET | −amount (assets ↓) |
| Credit expense (installment) | −grandTotal (debt ↑) |
| Transfer asset→asset | 0 (relocation) |
| Transfer asset→debt (payment) | 0 (assets ↓, debt ↓) |

### INCOME to DEBT wallet
Backend rejects INCOME targeting CREDIT_CARD, PAYLATER, or LOAN wallets.
Frontend must also block this in the UI (`AddTransactionModal`).

## Installment Rules

- Created from EXPENSE on CREDIT_CARD/PAYLATER wallet.
- Grand total (principal + interest) locked at creation by backend.
- `monthlyAmount = round(grandTotal / months)`, stored in Transaction.
- Final term uses a slightly different amount to absorb rounding remainder.
- Payment is TRANSFER from asset wallet → debt wallet (NOT a new expense).
- Progress: `paidTerms / installmentMonths * 100`.
- Completed when `paidTerms >= installmentMonths`, status = `SETTLED`.

## Debt Ratio

```
debtRatio = totalUtang / totalCreditLimit * 100
```

Thresholds:
- Normal: < 30%
- Warning: 30% to < 80%
- Danger: ≥ 80%

## Currency & Precision

- Primary: IDR (Indonesian Rupiah).
- Display: `formatCurrency` from `@/lib/utils` — never write a new formatter.
- Frontend parses Decimal values via the API response boundary.
- For display-only aggregates, `Number()` is tolerated for IDR (no sub-rupiah
  display), but prefer the backend's canonical values for key metrics.

## Business Rules

- DEBT wallet cannot owe more than credit limit: `|balance| ≤ creditLimit`.
- Wallet deletion requires confirmation if it has transaction history.
- Backend validation always takes priority over frontend.
- Never display fabricated financial values — distinguish loading, empty,
  error, and zero states.
