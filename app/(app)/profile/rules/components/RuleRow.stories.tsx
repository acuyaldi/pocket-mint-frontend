import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { RuleRow, type RuleRowLabels } from "./RuleRow";
import type { RuleDto } from "@/src/types/rule";

const RULE: RuleDto = {
  id: "rule-1",
  name: "Gopay → Transport",
  enabled: true,
  priority: 0,
  matchType: "DESCRIPTION",
  operator: "CONTAINS",
  value: "GOPAY",
  categoryId: "cat-transportasi",
  createdAt: "2026-07-01T00:00:00.000Z",
  updatedAt: "2026-07-01T00:00:00.000Z",
};

const LABELS: RuleRowLabels = {
  edit: "Edit",
  delete: "Delete",
  editAria: "Edit rule Gopay → Transport",
  deleteAria: "Delete rule Gopay → Transport",
  enableAria: "Enable or disable rule Gopay → Transport",
  moveUpAria: "Move rule up",
  moveDownAria: "Move rule down",
  disabledBadge: "Disabled",
  conditionSummary: 'Description contains "GOPAY"',
};

const meta: Meta<typeof RuleRow> = {
  title: "Features/RuleRow",
  component: RuleRow,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <ul className="max-w-md space-y-3 p-4">
        <Story />
      </ul>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof RuleRow>;

const baseArgs = {
  rule: RULE,
  categoryName: "Transportasi",
  labels: LABELS,
  isFirst: false,
  isLast: false,
  onEdit: () => {},
  onDelete: () => {},
  onToggleEnabled: () => {},
  onMoveUp: () => {},
  onMoveDown: () => {},
};

export const Populated: Story = {
  args: baseArgs,
};

export const DisabledRule: Story = {
  args: {
    ...baseArgs,
    rule: { ...RULE, enabled: false },
  },
};

export const FirstInList: Story = {
  args: {
    ...baseArgs,
    isFirst: true,
  },
};

export const LastInList: Story = {
  args: {
    ...baseArgs,
    isLast: true,
  },
};

export const TransactionTypeRule: Story = {
  args: {
    ...baseArgs,
    rule: { ...RULE, matchType: "TRANSACTION_TYPE", operator: "EQUALS", value: "TRANSFER" },
    labels: { ...LABELS, conditionSummary: "Transaction type is Transfer" },
  },
};

export const DarkMode: Story = {
  parameters: {
    themes: {
      default: "dark",
    },
  },
  args: baseArgs,
};

export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile1",
    },
  },
  args: baseArgs,
};
