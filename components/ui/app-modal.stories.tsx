import * as React from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { AppModal, ModalCancelButton, ModalSubmitButton } from "./app-modal";
import { Button } from "./button";
import { FormField } from "./form-field";
import { Input } from "./input";

function ControlledModal({
  size,
  isPending,
  role,
}: {
  size?: "sm" | "md" | "lg";
  isPending?: boolean;
  role?: "dialog" | "alertdialog";
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Buka Modal</Button>
      <AppModal
        open={open}
        onOpenChange={setOpen}
        title="Tambah Dompet"
        description="Isi detail dompet baru Anda."
        size={size}
        isPending={isPending}
        role={role}
        footer={
          <>
            <ModalCancelButton onClick={() => setOpen(false)}>
              Batal
            </ModalCancelButton>
            <ModalSubmitButton isPending={isPending} pendingLabel="Menyimpan...">
              Simpan
            </ModalSubmitButton>
          </>
        }
      >
        <FormField label="Nama Dompet" htmlFor="modal-wallet-name" required>
          <Input id="modal-wallet-name" placeholder="cth. BCA Tabungan" />
        </FormField>
      </AppModal>
    </>
  );
}

const meta = {
  title: "UI/AppModal",
  component: ControlledModal,
  parameters: {
    docs: {
      description: {
        component:
          "Standard centered dialog shell used for every create/edit/confirmation flow in Pocket Mint (wallets, transactions, installments). Use `role=\"alertdialog\"` for destructive confirmations.",
      },
    },
  },
} satisfies Meta<typeof ControlledModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Large: Story = {
  args: { size: "lg" },
};

export const Pending: Story = {
  name: "Pending (blocks dismissal)",
  args: { isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Buka Modal" }));
  },
};

export const OpenAndClose: Story = {
  name: "Open and close (interaction)",
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Buka Modal" }));

    const dialog = await within(document.body).findByRole("dialog");
    await expect(dialog).toBeInTheDocument();
    await expect(
      within(dialog).getByText("Tambah Dompet"),
    ).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole("button", { name: "Batal" }));
    await waitFor(() =>
      expect(within(document.body).queryByRole("dialog")).not.toBeInTheDocument(),
    );
  },
};
