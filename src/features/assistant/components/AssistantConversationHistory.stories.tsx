import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { NextIntlClientProvider } from "next-intl";
import { vi } from "vitest";
import { expect, fn, userEvent, waitFor, within } from "storybook/test";
import enMessages from "@/messages/en.json";
import { AssistantConversationHistory } from "./AssistantConversationHistory";
import type { AssistantConversationSummary } from "@/src/types/assistant";

// Swaps every consumer of the real API module (via useAssistantSession's hooks)
// for the sibling `./api/__mocks__/assistantApi.ts` — the only component in this
// feature that talks to TanStack Query hooks directly, so it's the only one that
// needs this. `AssistantConversationHistory.stories.tsx` never uses `sb.mock`
// (the `storybook/test` export is an unimplemented no-op in this Storybook
// version) — plain Vitest module mocking, which the "storybook" Vitest project
// genuinely runs under, is what actually works here.
vi.mock("@/src/features/assistant/api/assistantApi");

import * as assistantApi from "@/src/features/assistant/api/assistantApi";

const mocked = vi.mocked;
// `vi.mock` swaps this same "@/.../assistantApi" specifier for every importer (including
// useAssistantSession.ts), so reaching the mock's test-only reset hook through this module
// object — instead of importing the `__mocks__` file by its own path, a *different* module
// record with its own separate `conversations` state — is what keeps them in sync.
const { __setConversations } = assistantApi as unknown as {
  __setConversations: (items: AssistantConversationSummary[]) => void;
};

const ITEMS: AssistantConversationSummary[] = [
  {
    id: "conv-active-1",
    status: "ACTIVE",
    locale: "id",
    createdAt: "2026-07-20T08:00:00.000Z",
    updatedAt: "2026-07-25T09:12:00.000Z",
    lastActivityAt: "2026-07-25T09:12:00.000Z",
    title: "Catat pengeluaran 350 ribu untuk internet dari BCA.",
    lastMessage: "Konfirmasi draft transaksi berhasil dibuat.",
  },
  {
    id: "conv-active-2",
    status: "ACTIVE",
    locale: "id",
    createdAt: "2026-07-18T08:00:00.000Z",
    updatedAt: "2026-07-19T10:00:00.000Z",
    lastActivityAt: "2026-07-19T10:00:00.000Z",
    title: "Gaji bulan ini masuk ke BCA delapan juta rupiah.",
    lastMessage: "Terima kasih sudah dicatat dengan rapi.",
  },
  {
    id: "conv-archived-1",
    status: "ARCHIVED",
    locale: "id",
    createdAt: "2026-07-01T08:00:00.000Z",
    updatedAt: "2026-07-02T08:00:00.000Z",
    lastActivityAt: "2026-07-02T08:00:00.000Z",
    title: "Bayar cicilan kartu kredit dua ratus ribu.",
    lastMessage: "Cicilan berhasil dibayar.",
  },
];

function resetHistoryApi(items: AssistantConversationSummary[]) {
  __setConversations(items);
  mocked(assistantApi.listAssistantConversations).mockClear();
  mocked(assistantApi.archiveAssistantSession).mockClear();
  mocked(assistantApi.restoreAssistantSession).mockClear();
  mocked(assistantApi.deleteAssistantSession).mockClear();
}

const meta: Meta<typeof AssistantConversationHistory> = {
  title: "Features/Assistant/AssistantConversationHistory",
  component: AssistantConversationHistory,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <NextIntlClientProvider locale="en" messages={{ assistant: { history: enMessages.assistant.history } }}>
        <div className="max-w-3xl p-4">
          <Story />
        </div>
      </NextIntlClientProvider>
    ),
  ],
  args: {
    conversationId: null,
    canStartNewConversation: true,
    onSwitchConversation: fn(() => true),
    onStartNewConversation: fn(),
    intlLocale: "id-ID",
  },
};

export default meta;
type Story = StoryObj<typeof AssistantConversationHistory>;

async function openHistory(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await userEvent.click(canvas.getByRole("button", { name: "Open conversation history" }));
  return within(document.body);
}

async function openRowMenu(body: ReturnType<typeof within>, rowIndex: number) {
  await userEvent.click(body.getAllByRole("button", { name: /Actions for/ })[rowIndex]);
  return within(document.body);
}

export const OpensAndListsConversations: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await expect(body.getByRole("heading", { name: "Conversation history" })).toBeVisible();
    await waitFor(() => expect(body.getByText(/Catat pengeluaran/)).toBeInTheDocument());
    expect(body.getByText(/Gaji bulan ini/)).toBeInTheDocument();
    expect(body.getByText(/Bayar cicilan/)).toBeInTheDocument();
  },
};

export const SearchFiltersConversations: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText(/Catat pengeluaran/)).toBeInTheDocument());

    await userEvent.type(body.getByLabelText("Search loaded conversations"), "gaji");

    await waitFor(() => expect(body.queryByText(/Catat pengeluaran/)).not.toBeInTheDocument());
    expect(body.getByText(/Gaji bulan ini/)).toBeInTheDocument();
  },
};

export const NoSearchResults: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText(/Catat pengeluaran/)).toBeInTheDocument());

    await userEvent.type(body.getByLabelText("Search loaded conversations"), "tidak ada hasil sama sekali");

    await waitFor(() => expect(body.getByText("No conversations match this search.")).toBeInTheDocument());
  },
};

export const FiltersToArchivedOnly: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText(/Catat pengeluaran/)).toBeInTheDocument());

    await userEvent.click(body.getByRole("button", { name: "Archived" }));

    await waitFor(() => expect(body.queryByText(/Catat pengeluaran/)).not.toBeInTheDocument());
    expect(body.queryByText(/Gaji bulan ini/)).not.toBeInTheDocument();
    expect(body.getByText(/Bayar cicilan/)).toBeInTheDocument();
  },
};

export const EmptyArchivedFilter: Story = {
  beforeEach: () => resetHistoryApi(ITEMS.filter((item) => item.status === "ACTIVE")),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText(/Catat pengeluaran/)).toBeInTheDocument());

    await userEvent.click(body.getByRole("button", { name: "Archived" }));

    await waitFor(() => expect(body.getByText("No archived conversations yet.")).toBeInTheDocument());
  },
};

export const EmptyHistoryAllConversations: Story = {
  beforeEach: () => resetHistoryApi([]),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText("No previous conversations yet.")).toBeInTheDocument());
  },
};

export const ArchiveSingleConversation: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText(/Catat pengeluaran/)).toBeInTheDocument());

    // Row 0 is the ACTIVE "Catat pengeluaran..." conversation.
    let menu = await openRowMenu(body, 0);
    await userEvent.click(await menu.findByText("Archive"));

    const confirmDialog = await within(document.body).findByRole("alertdialog");
    expect(within(confirmDialog).getByText("Archive this conversation?")).toBeInTheDocument();

    // Cancel first: the mutation must not fire and the row must stay Active.
    await userEvent.click(within(confirmDialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(within(document.body).queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(assistantApi.archiveAssistantSession).not.toHaveBeenCalled();

    // Redo and confirm this time.
    menu = await openRowMenu(body, 0);
    await userEvent.click(await menu.findByText("Archive"));
    const confirmDialog2 = await within(document.body).findByRole("alertdialog");
    await userEvent.click(within(confirmDialog2).getByRole("button", { name: "Archive" }));

    await waitFor(() => expect(within(document.body).queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(assistantApi.archiveAssistantSession).toHaveBeenCalledWith("conv-active-1");
    // List actually refetches and re-renders the row as Archived — not just "mutation was called".
    await waitFor(() => expect(body.getAllByText("Archived").length).toBeGreaterThan(1));
  },
};

export const RestoreSingleConversation: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText(/Bayar cicilan/)).toBeInTheDocument());

    // Row 2 is the ARCHIVED "Bayar cicilan..." conversation — restore has no confirmation step.
    const menu = await openRowMenu(body, 2);
    await userEvent.click(await menu.findByText("Restore"));

    await waitFor(() => expect(assistantApi.restoreAssistantSession).toHaveBeenCalledWith("conv-archived-1"));
    // The row's own status text flips from Archived to Active once the list refetches.
    const row = body.getByText(/Bayar cicilan/).closest("li");
    await waitFor(() => expect(within(row as HTMLElement).getByText("Active")).toBeInTheDocument());
  },
};

export const DeleteSingleConversation: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText(/Gaji bulan ini/)).toBeInTheDocument());

    let menu = await openRowMenu(body, 1);
    await userEvent.click(await menu.findByText("Delete"));

    const confirmDialog = await within(document.body).findByRole("alertdialog");
    expect(within(confirmDialog).getByText("Delete this conversation?")).toBeInTheDocument();

    // Cancel: the conversation must still be listed and nothing deleted.
    await userEvent.click(within(confirmDialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(within(document.body).queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(assistantApi.deleteAssistantSession).not.toHaveBeenCalled();
    expect(body.getByText(/Gaji bulan ini/)).toBeInTheDocument();

    // Redo and confirm — the row must actually disappear from the rendered list.
    menu = await openRowMenu(body, 1);
    await userEvent.click(await menu.findByText("Delete"));
    const confirmDialog2 = await within(document.body).findByRole("alertdialog");
    await userEvent.click(within(confirmDialog2).getByRole("button", { name: /^Delete$/ }));

    await waitFor(() => expect(within(document.body).queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(assistantApi.deleteAssistantSession).toHaveBeenCalledWith("conv-active-2");
    await waitFor(() => expect(body.queryByText(/Gaji bulan ini/)).not.toBeInTheDocument());
  },
};

export const BulkSelectionCountAndClear: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText(/Catat pengeluaran/)).toBeInTheDocument());

    const checkboxes = body.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[1]);
    await waitFor(() => expect(body.getByText("2 conversations selected")).toBeInTheDocument());

    await userEvent.click(checkboxes[1]);
    await waitFor(() => expect(body.getByText("1 conversation selected")).toBeInTheDocument());

    // Two "Clear selection" buttons render at once (the selection banner's and the list
    // header's) — both call the same handler, so either serves this assertion.
    await userEvent.click(body.getAllByRole("button", { name: "Clear selection" })[0]);
    await waitFor(() => expect(body.queryByText(/conversation.* selected/)).not.toBeInTheDocument());
    expect(checkboxes[0]).not.toBeChecked();
  },
};

export const BulkArchiveAppliesOnlyToActiveSelection: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText(/Catat pengeluaran/)).toBeInTheDocument());

    // Select one ACTIVE row and the one ARCHIVED row.
    const checkboxes = body.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]); // conv-active-1
    await userEvent.click(checkboxes[2]); // conv-archived-1
    await waitFor(() => expect(body.getByText("2 conversations selected")).toBeInTheDocument());

    await userEvent.click(body.getByRole("button", { name: "Archive" }));
    const confirmDialog = await within(document.body).findByRole("alertdialog");
    // Only the one already-active selected conversation is subject to archiving.
    expect(within(confirmDialog).getByText("Archive this conversation?")).toBeInTheDocument();
    await userEvent.click(within(confirmDialog).getByRole("button", { name: "Archive" }));

    await waitFor(() => expect(within(document.body).queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(assistantApi.archiveAssistantSession).toHaveBeenCalledTimes(1);
    expect(assistantApi.archiveAssistantSession).toHaveBeenCalledWith("conv-active-1");
  },
};

export const BulkDeleteConfirmsCountThenRemovesSelected: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  play: async ({ canvasElement }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText(/Catat pengeluaran/)).toBeInTheDocument());

    const checkboxes = body.getAllByRole("checkbox");
    await userEvent.click(checkboxes[0]);
    await userEvent.click(checkboxes[2]);
    await waitFor(() => expect(body.getByText("2 conversations selected")).toBeInTheDocument());

    await userEvent.click(body.getByRole("button", { name: "Delete" }));
    const confirmDialog = await within(document.body).findByRole("alertdialog");
    expect(within(confirmDialog).getByText("Delete 2 conversations?")).toBeInTheDocument();

    // Cancel: both conversations remain.
    await userEvent.click(within(confirmDialog).getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(within(document.body).queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(body.getByText(/Catat pengeluaran/)).toBeInTheDocument();
    expect(body.getByText(/Bayar cicilan/)).toBeInTheDocument();

    // Redo and confirm: both are removed and the selection bar clears.
    await userEvent.click(body.getByRole("button", { name: "Delete" }));
    const confirmDialog2 = await within(document.body).findByRole("alertdialog");
    await userEvent.click(within(confirmDialog2).getByRole("button", { name: /Delete 2 conversations/ }));

    await waitFor(() => expect(within(document.body).queryByRole("alertdialog")).not.toBeInTheDocument());
    expect(assistantApi.deleteAssistantSession).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(body.queryByText(/Catat pengeluaran/)).not.toBeInTheDocument());
    expect(body.queryByText(/Bayar cicilan/)).not.toBeInTheDocument();
    expect(body.queryByText(/conversation.* selected/)).not.toBeInTheDocument();
  },
};

export const DeletingActiveConversationForcesNewConversation: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  args: { conversationId: "conv-active-1" },
  play: async ({ canvasElement, args }) => {
    const body = await openHistory(canvasElement);
    await waitFor(() => expect(body.getByText(/Catat pengeluaran/)).toBeInTheDocument());

    // conv-active-1 is the conversation currently open in the composer (`conversationId` prop).
    const menu = await openRowMenu(body, 0);
    await userEvent.click(await menu.findByText("Delete"));
    const confirmDialog = await within(document.body).findByRole("alertdialog");
    await userEvent.click(within(confirmDialog).getByRole("button", { name: /^Delete$/ }));

    await waitFor(() => expect(assistantApi.deleteAssistantSession).toHaveBeenCalledWith("conv-active-1"));
    // Deleting the active conversation force-resets it even though it could otherwise be
    // blocked by an unresolved draft/clarification — the conversation no longer exists server-side.
    await waitFor(() => expect(args.onStartNewConversation).toHaveBeenCalledWith({ force: true }));
  },
};

export const Mobile: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  parameters: { viewport: { defaultViewport: "mobile1" } },
  play: async ({ canvasElement }) => {
    await openHistory(canvasElement);
  },
};

export const DarkMode: Story = {
  beforeEach: () => resetHistoryApi(ITEMS),
  parameters: { themes: { default: "dark" } },
  play: async ({ canvasElement }) => {
    await openHistory(canvasElement);
  },
};
