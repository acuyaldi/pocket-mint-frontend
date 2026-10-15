import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
  parameters: {
    docs: {
      description: {
        component:
          "Base surface container (white background, 12px radius, ring border) used for wallet cards, summary cards, and other grouped content.",
      },
    },
  },
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>BCA Tabungan</CardTitle>
        <CardDescription>Bank &middot; Rp 12.500.000</CardDescription>
      </CardHeader>
    </Card>
  ),
};

export const WithContent: Story = {
  render: () => (
    <Card className="w-80">
      <CardHeader>
        <CardTitle>Ringkasan Periode Ini</CardTitle>
        <CardDescription>1 – 31 Juli 2026</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Pemasukan Rp 8.200.000, pengeluaran Rp 5.750.000.
        </p>
      </CardContent>
    </Card>
  ),
};

export const CompactSize: Story = {
  name: "Compact (size=sm)",
  render: () => (
    <Card size="sm" className="w-80">
      <CardHeader>
        <CardTitle>Dompet Digital</CardTitle>
        <CardDescription>E-Wallet &middot; Rp 320.000</CardDescription>
      </CardHeader>
    </Card>
  ),
};
