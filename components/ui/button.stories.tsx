import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Trash2 } from "lucide-react";

import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          "Primary action control used across Pocket Mint forms, modals, and confirmation flows. `variant=\"default\"` (solid Slate) is the dominant action in a view; `destructive` is reserved for irreversible actions like deleting a wallet or transaction.",
      },
    },
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline", "secondary", "ghost", "destructive", "link"],
    },
    size: {
      control: "select",
      options: ["default", "xs", "sm", "lg", "icon", "icon-xs", "icon-sm", "icon-lg"],
    },
  },
  args: {
    children: "Simpan Perubahan",
    disabled: false,
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Variants: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} variant="default">
        Default
      </Button>
      <Button {...args} variant="outline">
        Outline
      </Button>
      <Button {...args} variant="secondary">
        Secondary
      </Button>
      <Button {...args} variant="ghost">
        Ghost
      </Button>
      <Button {...args} variant="destructive">
        Destructive
      </Button>
      <Button {...args} variant="link">
        Link
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button {...args} size="xs">
        Extra small
      </Button>
      <Button {...args} size="sm">
        Small
      </Button>
      <Button {...args} size="default">
        Default
      </Button>
      <Button {...args} size="lg">
        Large
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  args: {
    variant: "destructive",
    children: (
      <>
        <Trash2 />
        Hapus Dompet
      </>
    ),
  },
};

export const IconOnly: Story = {
  name: "Icon-only (aria-label required)",
  args: {
    size: "icon",
    variant: "ghost",
    "aria-label": "Hapus",
    children: <Trash2 />,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Hapus Transaksi",
  },
};
