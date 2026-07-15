# Transfer Account Picker Refinement

Date: 2026-07-16

Status: Approved for implementation planning

## Objective

Refine the transfer path in `AddTransactionModal` so it feels like moving money between accounts. Preserve every unrelated part of the production-ready modal and the established Pocket Mint design language.

## Scope

This change applies only to transaction-type navigation and the transfer wallet-selection flow.

The implementation will:

- remove the `Bayar hutang` transaction tab and all modal-only debt-payment branches;
- keep `Pengeluaran`, `Pemasukan`, and `Transfer` at equal widths;
- replace transfer wallet cards with compact account pickers;
- arrange transfer fields vertically in this order: `Jumlah`, `Tanggal`, `Dompet sumber`, swap control, `Dompet tujuan`, `Deskripsi`;
- support manual and automatic source/destination swapping;
- preserve existing transfer eligibility and insufficient-balance rules.

The implementation will not change typography, spacing tokens, color tokens, elevation, radius, component language, header, footer, amount input, date input, description input, or button styling. It will not introduce search, filters, animations, new business rules, or unrelated refactoring.

## Interaction Design

### Transaction Type Control

`PAY_DEBT` will be removed from the modal's tab state, option list, validation, descriptions, and submission transformation. The segmented control will contain only the three supported `TxType` values and distribute them evenly at every breakpoint.

Debt and installment payment remains outside this modal.

### Transfer Field Order

The transfer path keeps the modal's existing single scrolling form and presents:

1. Amount
2. Date
3. Source wallet picker
4. Swap button
5. Destination wallet picker
6. Description

Source and destination remain vertically stacked on desktop, tablet, and mobile. The layout never changes into multiple account columns.

### Collapsed Account Picker

Each picker is a native button trigger styled like an existing Pocket Mint input. Its visual height is approximately 56px while retaining at least a 44px interactive target.

The trigger displays:

- a wallet-type icon;
- wallet name as the strongest text;
- wallet type as supporting metadata;
- the complete Indonesian-formatted balance as supporting, right-aligned, tabular figures.

An unselected picker displays a concise selection prompt instead of fabricated wallet information. Long wallet names retain readable space and may wrap without collapsing the balance or changing the information hierarchy.

### Account Menu

The picker uses the project's existing Base UI dropdown primitives. This provides keyboard navigation, focus management, menu positioning, and dismissal behavior without a new dependency.

The menu opens below the trigger, matches its width, and renders one wallet per row. Each row contains an icon, wallet name, wallet type, and right-aligned balance. The selected row adds a checkmark, subtle muted surface, and soft structural border. Rows are list items, not cards or tiles.

Disabled source rows remain legible, cannot activate, and display the short explanation `Saldo tidak cukup`. The explanation is visible in the row rather than relying only on a tooltip.

### Swap Behavior

A centered, outlined circular button sits between the two pickers. It uses the existing horizontal swap icon, restrained border, and light modal-appropriate elevation. Its accessible name is `Tukar dompet sumber dan tujuan`.

Activating it exchanges the selected IDs. If either side is unselected, the values still exchange, allowing a selected wallet to move to the opposite side without inventing a default.

When a user selects a wallet currently assigned to the opposite picker, the component automatically swaps the two selected IDs. No error is displayed. Source and destination therefore never end in an identical state.

## Wallet Eligibility and Business Rules

Transfer pickers include only wallets for which `isDebtWallet(wallet.type)` is false. Debt wallets are hidden from both source and destination menus.

All non-debt wallets are valid transfer destinations. A non-debt source wallet is disabled only when the entered amount is greater than its available balance under the modal's existing `spendable` calculation. No additional transfer restrictions are introduced.

The submit handler retains defensive validation so a transfer cannot be submitted with a debt source or identical endpoints, even if state is manipulated outside the picker interaction.

If there are no transfer-capable wallets, the existing wallet-empty treatment remains truthful and compact. If only one transfer-capable wallet exists, it may be selected on either side but cannot produce a valid pair; the other picker reports that no other destination or source is available.

## Component Boundaries

A focused `AccountPicker` component will live alongside `AddTransactionModal` initially because its data shape and behavior are specific to this transfer flow. It receives:

- label and accessible-name text;
- eligible wallets;
- selected wallet ID;
- disabled-wallet predicate and explanation;
- selection callback.

`AddTransactionModal` remains responsible for transaction state, cross-picker swap logic, amount-dependent balance eligibility, and submission. The picker remains presentational and reports only a selected wallet ID.

This boundary keeps the menu independently testable without prematurely creating a global wallet-picker abstraction.

## State and Data Flow

The existing `walletId` and `toWalletId` state remain the source of truth.

- Selecting an unused wallet updates the selected side.
- Selecting the wallet used by the other side atomically exchanges both IDs.
- The swap button atomically exchanges both IDs.
- Changing transaction type clears both IDs using the existing reset behavior.
- Submission maps `walletId` and `toWalletId` directly to the existing transfer payload.

The account list is derived from `wallets` with `useMemo`. No new server request, query hook, mutation, or backend contract is required.

## Accessibility

- Picker triggers and the swap action use native buttons.
- Each trigger has an explicit accessible label tied to its visible field label.
- The selected menu item exposes its selected state programmatically and visually with a checkmark.
- Disabled rows expose their disabled state and visible explanation.
- Keyboard order follows the visual order: source, swap, destination.
- Focus-visible treatment reuses the modal input/button language and remains distinct from selected state.
- Financial balances use tabular figures and are never abbreviated.

## Responsive Behavior

Desktop remains the master composition. The source, swap, and destination controls remain in a vertical sequence at all breakpoints. Mobile changes only available width and text wrapping. Picker hierarchy, menu rows, spacing scale, radius, colors, elevation, and interaction behavior remain identical.

## Testing Strategy

Focused component and behavior tests will verify:

- only three transaction tabs render and `Bayar hutang` is absent;
- debt wallets do not appear in transfer source or destination menus;
- non-debt wallets appear in both menus;
- insufficient-balance source rows are disabled with a visible explanation;
- destination rows are not disabled by their balance;
- the utility button swaps source and destination;
- selecting the opposite wallet automatically swaps the IDs;
- source and destination cannot end identical;
- transfer submission retains the existing payload shape;
- empty and single-eligible-wallet states remain truthful;
- keyboard-accessible names and selected/disabled states are present.

After unit verification, the modal will be checked in the browser at desktop and mobile widths for vertical order, dropdown positioning, long-name readability, scroll containment, and focus behavior.

## Acceptance Criteria

The refinement is complete when the modal contains no debt-payment tab or debt-payment-specific path, transfer selection uses the approved vertical account-picker flow, swap behavior is immediate and prevents identical endpoints, only non-debt wallets participate, insufficient sources explain why they are disabled, and all untouched modal fields and actions retain their existing Pocket Mint visual definition.
