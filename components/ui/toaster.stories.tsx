import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";

import { Toaster, toast, type ToastVariant } from "./toaster";

const CLOSE_LABEL = "Close notification";
const REGION_LABEL = "Notifications";

interface TriggerButton {
  label: string;
  message: string;
  variant: ToastVariant;
}

/**
 * Test/story harness: a small page with trigger buttons plus the singleton
 * <Toaster/>. Interaction tests push snackbars through the real `toast()` API,
 * exactly as application code does — the viewport is never rendered in
 * isolation with fabricated internal state.
 */
function ToasterHarness({ buttons }: { buttons: TriggerButton[] }) {
  return (
    <main className="min-h-64 space-y-4">
      <div>
        <h2 className="text-base font-semibold text-foreground">Snackbar demo</h2>
        <p className="text-sm text-muted-foreground">
          The snackbar overlays this content and never shifts it — it is fixed to the top of the viewport.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {buttons.map((button) => (
          <button
            key={button.label}
            type="button"
            onClick={() => toast(button.message, button.variant)}
            className="inline-flex h-9 items-center rounded-lg border border-border bg-card px-3 text-sm text-foreground"
          >
            {button.label}
          </button>
        ))}
      </div>
      <Toaster closeLabel={CLOSE_LABEL} regionLabel={REGION_LABEL} />
    </main>
  );
}

const meta: Meta<typeof ToasterHarness> = {
  title: "UI/Toaster",
  component: ToasterHarness,
  parameters: { layout: "fullscreen" },
};

export default meta;
type Story = StoryObj<typeof ToasterHarness>;

const push = (canvas: ReturnType<typeof within>, label: string) =>
  userEvent.click(canvas.getByRole("button", { name: label }));

/**
 * Wait for the snackbar's fade-in to settle at full opacity before finishing a
 * play. The a11y addon runs after `play`; asserting on a mid-animation (partly
 * transparent) toast would blend the text color and trip the contrast check.
 */
const waitSettled = (element: HTMLElement) =>
  waitFor(() => expect(getComputedStyle(element).opacity).toBe("1"));

export const SuccessVariant: Story = {
  args: { buttons: [{ label: "Show success", message: "Wallet saved.", variant: "success" }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "Show success");
    // Non-critical success announces politely via role="status".
    const toastEl = await waitFor(() => canvas.getByRole("status"));
    expect(toastEl).toHaveTextContent("Wallet saved.");
    expect(canvas.queryByRole("alert")).toBeNull();
    await waitSettled(toastEl);
  },
};

export const ErrorVariant: Story = {
  args: { buttons: [{ label: "Show error", message: "Something went wrong. Please try again.", variant: "error" }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "Show error");
    // Errors demand attention → assertive role="alert".
    const toastEl = await waitFor(() => canvas.getByRole("alert"));
    expect(toastEl).toHaveTextContent("Something went wrong. Please try again.");
    // The dismiss control is reachable by its accessible name.
    expect(canvas.getByRole("button", { name: CLOSE_LABEL })).toBeInTheDocument();
    await waitSettled(toastEl);
  },
};

export const WarningVariant: Story = {
  args: { buttons: [{ label: "Show warning", message: "Your session is about to expire.", variant: "warning" }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "Show warning");
    const toastEl = await waitFor(() => canvas.getByRole("alert"));
    expect(toastEl).toHaveTextContent("Your session is about to expire.");
    await waitSettled(toastEl);
  },
};

export const InfoVariant: Story = {
  args: { buttons: [{ label: "Show info", message: "Your report is being prepared.", variant: "info" }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "Show info");
    const toastEl = await waitFor(() => canvas.getByRole("status"));
    expect(toastEl).toHaveTextContent("Your report is being prepared.");
    await waitSettled(toastEl);
  },
};

export const AssistantProviderUnavailable: Story = {
  args: {
    buttons: [
      {
        label: "Trigger provider error",
        message: "Assistant is temporarily unavailable. Please try again shortly.",
        variant: "error",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "Trigger provider error");
    // A global Assistant failure surfaces as a friendly top snackbar, never raw
    // backend text.
    const toastEl = await waitFor(() => canvas.getByRole("alert"));
    expect(toastEl).toHaveTextContent("Assistant is temporarily unavailable. Please try again shortly.");
    await waitSettled(toastEl);
  },
};

export const LongMessage: Story = {
  args: {
    buttons: [
      {
        label: "Show long (EN)",
        message:
          "We couldn't complete that request because the Assistant service is taking longer than expected to respond. Your instruction has been kept — please try again in a few moments.",
        variant: "error",
      },
      {
        label: "Show long (ID)",
        message:
          "Kami tidak dapat menyelesaikan permintaan tersebut karena layanan Asisten membutuhkan waktu lebih lama dari perkiraan untuk merespons. Instruksi Anda tetap tersimpan — silakan coba lagi beberapa saat.",
        variant: "error",
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "Show long (ID)");
    const toastEl = await waitFor(() => canvas.getByRole("alert"));
    await waitSettled(toastEl);
  },
};

export const Mobile: Story = {
  parameters: { viewport: { defaultViewport: "mobile1" } },
  args: {
    buttons: [{ label: "Show error", message: "You appear to be offline. Check your connection.", variant: "error" }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "Show error");
    const toastEl = await waitFor(() => canvas.getByRole("alert"));
    await waitSettled(toastEl);
  },
};

export const DarkMode: Story = {
  parameters: { themes: { default: "dark" } },
  args: { buttons: [{ label: "Show success", message: "Wallet saved.", variant: "success" }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "Show success");
    const toastEl = await waitFor(() => canvas.getByRole("status"));
    await waitSettled(toastEl);
  },
};

export const QueuedOneAtATime: Story = {
  args: {
    buttons: [
      { label: "First", message: "First notification.", variant: "info" },
      { label: "Second", message: "Second notification.", variant: "info" },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "First");
    await push(canvas, "Second");
    // Only one snackbar is visible at a time; the second is queued.
    await waitFor(() => expect(canvas.getByText("First notification.")).toBeInTheDocument());
    expect(canvas.queryByText("Second notification.")).toBeNull();
    // Dismissing the first reveals the queued one.
    await userEvent.click(canvas.getByRole("button", { name: CLOSE_LABEL }));
    const second = await waitFor(() => canvas.getByRole("status"));
    expect(second).toHaveTextContent("Second notification.");
    await waitSettled(second);
  },
};

export const Deduplicated: Story = {
  args: { buttons: [{ label: "Repeat", message: "Assistant is temporarily unavailable.", variant: "error" }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "Repeat");
    await push(canvas, "Repeat");
    await push(canvas, "Repeat");
    // Identical messages within the dedupe window collapse to a single snackbar.
    const toastEl = await waitFor(() => canvas.getByRole("alert"));
    expect(canvas.getAllByText("Assistant is temporarily unavailable.")).toHaveLength(1);
    await waitSettled(toastEl);
  },
};

export const FixedPositionNoLayoutShift: Story = {
  args: { buttons: [{ label: "Show error", message: "A fixed, overlaying snackbar.", variant: "error" }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "Show error");
    const toastEl = await waitFor(() => canvas.getByRole("alert"));
    // The viewport overlays content instead of taking document-flow space.
    const region = canvas.getByRole("region", { name: REGION_LABEL });
    expect(getComputedStyle(region).position).toBe("fixed");
    await waitSettled(toastEl);
  },
};

export const CloseDismisses: Story = {
  args: { buttons: [{ label: "Show error", message: "Dismiss me.", variant: "error" }] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await push(canvas, "Show error");
    await waitFor(() => expect(canvas.getByRole("alert")).toBeInTheDocument());
    await userEvent.click(canvas.getByRole("button", { name: CLOSE_LABEL }));
    await waitFor(() => expect(canvas.queryByText("Dismiss me.")).toBeNull());
  },
};
