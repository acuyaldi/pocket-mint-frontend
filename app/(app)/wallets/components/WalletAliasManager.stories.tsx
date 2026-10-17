import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import enMessages from "@/messages/en.json";
import { WalletAliasManager } from "./WalletAliasManager";
import type { WalletAlias } from "@/src/types/wallet";

const ALIASES: WalletAlias[] = [
  { id: "alias-1", aliasDisplay: "Rekening Utama" },
  { id: "alias-2", aliasDisplay: "BCA Gajian" },
];

const meta: Meta<typeof WalletAliasManager> = {
  title: "Wallets/WalletAliasManager",
  component: WalletAliasManager,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      // Overrides the global preview.tsx provider (which mounts with empty
      // messages) with the real `walletModals.edit.aliases` copy so this
      // story's interaction assertions can target actual rendered text.
      <NextIntlClientProvider locale="en" messages={enMessages}>
        <div className="max-w-md rounded-xl border border-border/60 bg-card p-4">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof WalletAliasManager>;

export const Default: Story = {
  args: {
    aliases: ALIASES,
    isAdding: false,
    removingId: null,
    onAdd: fn(async () => {}),
    onRemove: fn(async () => {}),
  },
};

export const Empty: Story = {
  args: { ...Default.args, aliases: [] },
};

export const AddPending: Story = {
  args: { ...Default.args, isAdding: true },
};

export const RemovingOne: Story = {
  args: { ...Default.args, removingId: "alias-1" },
};

export const AddInteraction: Story = {
  args: { ...Default.args, aliases: [], onAdd: fn(async () => {}) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByLabelText("Also known as");
    await userEvent.type(input, "  Rekening Utama  ");
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    // Trimmed before being handed to the caller — never the raw padded draft.
    expect(args.onAdd).toHaveBeenCalledWith("Rekening Utama");
    await waitFor(() => expect(input).toHaveValue(""));
  },
};

export const AddEmptyDraftIsIgnored: Story = {
  args: { ...Default.args, aliases: [], onAdd: fn(async () => {}) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const addButton = canvas.getByRole("button", { name: "Add" });
    // Nothing typed — the add action stays disabled, never fires on whitespace.
    expect(addButton).toBeDisabled();
    expect(args.onAdd).not.toHaveBeenCalled();
  },
};

export const RemoveInteraction: Story = {
  args: { ...Default.args, onRemove: fn(async () => {}) },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: 'Remove alias "Rekening Utama"' }));
    expect(args.onRemove).toHaveBeenCalledWith("alias-1");
  },
};

/** A rejected add (e.g. a 409 namespace conflict) renders the server's message inline, never a silent failure. */
export const AddConflictInteraction: Story = {
  args: {
    ...Default.args,
    aliases: [],
    onAdd: fn(async () => {
      throw { response: { data: { error: { message: "This name is already used as a wallet alias" } } } };
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Also known as"), "Rekening Utama");
    await userEvent.click(canvas.getByRole("button", { name: "Add" }));
    await expect(canvas.findByRole("alert")).resolves.toHaveTextContent(
      "This name is already used as a wallet alias",
    );
  },
};
