import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { ClarificationCard, type ClarificationCardLabels } from "./ClarificationCard";
import type { ClarificationRequest } from "@/src/types/assistant";
import en from "@/messages/en.json";

const LABELS: ClarificationCardLabels = {
  cancel: "Cancel",
  cancelling: "Cancelling",
  titleByEntity: {
    wallet: "Choose wallet",
    merchant: "Choose merchant",
    category: "Choose category",
  },
  descriptionByEntity: {
    wallet: "Select the wallet that should fund this transaction.",
    merchant: "Select the merchant Pocket Mint should use.",
    category: "Select one of your existing categories.",
  },
  transfer: en.assistant.clarification.transfer,
};

const CLARIFICATION: ClarificationRequest = {
  clarificationId: "clar-1",
  entityType: "wallet",
  prompt: "Which wallet did you mean by \"BCA\"?",
  options: [
    { token: "tok-1", label: "BCA Tabungan", discriminator: "BANK" },
    { token: "tok-2", label: "BCA Kartu Kredit", discriminator: "CREDIT_CARD" },
  ],
  expiresAt: "2026-07-25T15:30:00.000Z",
};

const meta: Meta<typeof ClarificationCard> = {
  title: "Features/Assistant/ClarificationCard",
  component: ClarificationCard,
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
type Story = StoryObj<typeof ClarificationCard>;

export const Default: Story = {
  args: {
    clarification: CLARIFICATION,
    pendingToken: null,
    isSelecting: false,
    isCancelling: false,
    onSelect: fn(),
    onCancel: fn(),
    labels: LABELS,
  },
};

export const Category: Story = {
  args: {
    ...Default.args,
    clarification: {
      ...CLARIFICATION,
      entityType: "category",
      prompt: "Which category did you mean?",
      options: [
        { token: "tok-cat-1", label: "Internet", discriminator: "EXPENSE" },
        { token: "tok-cat-2", label: "Tagihan", discriminator: "EXPENSE" },
        { token: "tok-cat-3", label: "Belanja", discriminator: "EXPENSE" },
      ],
    },
  },
};

export const Merchant: Story = {
  args: {
    ...Default.args,
    clarification: {
      ...CLARIFICATION,
      entityType: "merchant",
      prompt: "Which merchant did you mean?",
      options: [
        { token: "tok-merchant-1", label: "Indomaret Point" },
        { token: "tok-merchant-2", label: "Indomaret Fresh" },
      ],
    },
  },
};

export const Selecting: Story = {
  args: { ...Default.args, pendingToken: "tok-1", isSelecting: true },
};

export const Cancelling: Story = {
  args: { ...Default.args, isCancelling: true },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: Default.args,
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: Default.args,
};

export const CancelInteraction: Story = {
  args: Default.args,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: LABELS.cancel }));
    expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

const TRANSFER_OPTIONS = [
  { token: "tok-t-1", label: "BCA Debit", discriminator: "BANK" },
  { token: "tok-t-2", label: "BCA Payroll", discriminator: "BANK" },
];

/** Phase 38 — first TRANSFER question: which wallet the money leaves. */
export const TransferSource: Story = {
  args: {
    ...Default.args,
    clarification: {
      ...CLARIFICATION,
      prompt: "Dari wallet mana? Pilih salah satu: BCA Debit (BANK), BCA Payroll (BANK).",
      options: TRANSFER_OPTIONS,
      transfer: { field: "SOURCE_WALLET" },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    expect(canvas.getByRole("heading", { name: LABELS.transfer.question.SOURCE_WALLET })).toBeInTheDocument();
  },
};

/** Phase 38 — second TRANSFER question: the chosen source is shown before asking for the destination. */
export const TransferDestination: Story = {
  args: {
    ...Default.args,
    clarification: {
      ...CLARIFICATION,
      clarificationId: "clar-2",
      prompt: "Dari: GoPay. Ke wallet mana? Pilih salah satu: BCA Debit (BANK), BCA Payroll (BANK).",
      options: TRANSFER_OPTIONS,
      transfer: { field: "DESTINATION_WALLET", sourceWalletLabel: "GoPay" },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = canvas.getByRole("heading", { name: LABELS.transfer.question.DESTINATION_WALLET });
    expect(heading).toHaveAccessibleDescription(`${LABELS.transfer.from}: GoPay`);
  },
};

export const TransferDestinationMobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: TransferDestination.args,
};
