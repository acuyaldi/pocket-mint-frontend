import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fireEvent, fn, within } from "storybook/test";
import { DraftSummaryCard, type DraftSummaryCardLabels } from "./DraftSummaryCard";
import { buildDraftEditOverrides } from "@/src/features/assistant/utils/draftEdit";
import type { AssistantDraft } from "@/src/types/assistant";

const noop = () => {};

const LABELS: DraftSummaryCardLabels = {
  income: "Income",
  expense: "Expense",
  transfer: "Transfer",
  from: "From",
  to: "To",
  wallet: "Wallet",
  category: "Category",
  merchant: "Merchant",
  date: "Date",
  notes: "Notes",
  expiresAt: "Expires",
  statusValues: {
    PENDING_CONFIRMATION: "Awaiting confirmation",
    COMMITTED: "Confirmed",
    CANCELLED: "Cancelled",
    EXPIRED: "Expired",
    FAILED: "Failed",
  },
  edit: "Edit",
  saveChanges: "Save Changes",
  cancelEdit: "Cancel",
};

const EXPENSE_DRAFT: AssistantDraft = {
  draftId: "draft-1",
  status: "PENDING_CONFIRMATION",
  expiresAt: "2026-07-25T15:30:00.000Z",
  confirmationRequired: true,
  renderedText: "Rp50.000 expense at Indomaret from BCA, categorized as Makanan.",
  preview: {
    type: "EXPENSE",
    amount: 50000,
    wallet: "BCA",
    walletId: "wallet-1",
    categoryId: "category-makanan",
    category: "Makanan",
    merchant: "Indomaret",
    date: "2026-07-25",
    transactionDate: "2026-07-25",
    description: "Belanja mingguan",
  },
};

const INCOME_DRAFT: AssistantDraft = {
  ...EXPENSE_DRAFT,
  draftId: "draft-2",
  renderedText: "Rp5.000.000 income to BCA, categorized as Gaji.",
  preview: {
    type: "INCOME",
    amount: 5000000,
    wallet: "BCA",
    walletId: "wallet-1",
    categoryId: "category-gaji",
    category: "Gaji",
    date: "2026-07-25",
    transactionDate: "2026-07-25",
  },
};

const TRANSFER_DRAFT: AssistantDraft = {
  draftId: "draft-3",
  status: "PENDING_CONFIRMATION",
  expiresAt: "2026-07-25T15:30:00.000Z",
  confirmationRequired: true,
  renderedText: "Rp500.000 transfer from Cash to BCA.",
  preview: {
    type: "TRANSFER",
    amount: 500000,
    wallet: "Cash",
    walletId: "wallet-1",
    toWallet: "BCA",
    toWalletId: "wallet-2",
    date: "2026-07-25",
    transactionDate: "2026-07-25",
    description: "Isi saldo rekening",
  },
};

const BASE_ARGS = {
  labels: LABELS,
  intlLocale: "id-ID" as const,
  isEditing: false,
  overrides: {},
  onOverrideChange: noop,
  onStartEdit: noop,
  onSaveEdit: noop,
  onCancelEdit: noop,
};

const meta: Meta<typeof DraftSummaryCard> = {
  title: "Features/Assistant/DraftSummaryCard",
  component: DraftSummaryCard,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-xl p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof DraftSummaryCard>;

export const Expense: Story = {
  args: { draft: EXPENSE_DRAFT, ...BASE_ARGS },
};

export const EditMode: Story = {
  args: { draft: EXPENSE_DRAFT, ...BASE_ARGS, isEditing: true, overrides: { description: "Belanja bulanan" } },
};

/**
 * Regression coverage (Phase 34): entering edit mode must preselect the
 * draft's own category/date from the raw `categoryId`/`transactionDate`
 * preview fields — not leave them blank — and editing an unrelated field
 * (amount) must never clear that preselection. Seeds `overrides` exactly the
 * way `app/(app)/assistant/page.tsx`'s `handleStartEditDraft` does via the
 * shared `buildDraftEditOverrides` helper, so this exercises the real
 * edit-initialization contract rather than a story-only approximation.
 */
export const EditModePreselected: Story = {
  args: {
    draft: EXPENSE_DRAFT,
    ...BASE_ARGS,
    isEditing: true,
    overrides: buildDraftEditOverrides(EXPENSE_DRAFT),
    onOverrideChange: fn(),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // The date control is plain DOM (no network-backed options), so its
    // preselected value is directly verifiable: it must reflect the draft's
    // raw ISO `transactionDate`, not the display-only `date` string.
    const dateInput = canvas.getByLabelText(LABELS.date) as HTMLInputElement;
    expect(dateInput.value).toBe(EXPENSE_DRAFT.preview.transactionDate);

    // Editing amount must merge onto the already-seeded overrides — category
    // and date must survive untouched, proving the fix doesn't just seed
    // correctly once but preserves the seed across unrelated edits.
    const amountInput = canvas.getByLabelText(LABELS.expense) as HTMLInputElement;
    fireEvent.change(amountInput, { target: { value: "75000" } });

    expect(args.onOverrideChange).toHaveBeenLastCalledWith({
      ...buildDraftEditOverrides(EXPENSE_DRAFT),
      amount: 75000,
    });
  },
};

export const Income: Story = {
  args: { draft: INCOME_DRAFT, ...BASE_ARGS },
};

/** TRANSFER preview: "Dari"/"Ke" wallet rows, never a category or merchant row. */
export const Transfer: Story = {
  args: { draft: TRANSFER_DRAFT, ...BASE_ARGS },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByText(LABELS.from)).toBeInTheDocument();
    expect(canvas.getByText(LABELS.to)).toBeInTheDocument();
    expect(canvas.getByText("Cash")).toBeInTheDocument();
    expect(canvas.getByText("BCA")).toBeInTheDocument();
    expect(canvas.queryByText(LABELS.category)).not.toBeInTheDocument();
    expect(canvas.queryByText(LABELS.merchant)).not.toBeInTheDocument();
  },
};

/**
 * TRANSFER edit mode: entering edit must pre-seed both source and destination
 * wallet ids (never a categoryId) via the shared `buildDraftEditOverrides`
 * helper, and must never render a category control for a transfer draft.
 */
export const TransferEditMode: Story = {
  args: {
    draft: TRANSFER_DRAFT,
    ...BASE_ARGS,
    isEditing: true,
    overrides: buildDraftEditOverrides(TRANSFER_DRAFT),
    onOverrideChange: fn(),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByLabelText(LABELS.from)).toBeInTheDocument();
    expect(canvas.getByLabelText(LABELS.to)).toBeInTheDocument();
    expect(canvas.queryByLabelText(LABELS.category)).not.toBeInTheDocument();
    const seeded = buildDraftEditOverrides(TRANSFER_DRAFT);
    expect(seeded).toMatchObject({ walletId: "wallet-1", toWalletId: "wallet-2" });
    expect(seeded).not.toHaveProperty("categoryId");
  },
};

export const Committed: Story = {
  args: { draft: { ...EXPENSE_DRAFT, status: "COMMITTED" }, ...BASE_ARGS },
};

export const Expired: Story = {
  args: { draft: { ...EXPENSE_DRAFT, status: "EXPIRED" }, ...BASE_ARGS },
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Expense.args,
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: Expense.args,
};
