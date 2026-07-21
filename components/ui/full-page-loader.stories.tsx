import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FullPageLoader } from "./full-page-loader";

const meta = {
  title: "UI/FullPageLoader",
  component: FullPageLoader,
  parameters: {
    docs: {
      description: {
        component:
          "Blocking full-viewport transition state shown while the app boots or a full-screen mutation is in flight. Not a dialog — it disappears only when the caller stops rendering it.",
      },
    },
    layout: "fullscreen",
  },
  args: {
    label: "Memuat data keuangan Anda...",
  },
} satisfies Meta<typeof FullPageLoader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomLabel: Story = {
  args: {
    label: "Menyimpan perubahan...",
  },
};
