import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { DraftSummaryCard, type DraftSummaryCardLabels } from "./DraftSummaryCard";
import type { AssistantDraft } from "@/src/types/assistant";

const noop = () => {};

const LABELS: DraftSummaryCardLabels = {
  income: "Income",
  expense: "Expense",
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
    category: "Makanan",
    merchant: "Indomaret",
    date: "2026-07-25",
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
    category: "Gaji",
    date: "2026-07-25",
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

export const Income: Story = {
  args: { draft: INCOME_DRAFT, ...BASE_ARGS },
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
