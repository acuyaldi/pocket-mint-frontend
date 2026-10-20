import { describe, expect, it, vi } from "vitest";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Behavioral (not source-text) check of useConfirmAssistantDraft: the hook is
// rendered once for real and its mutation is driven the way the Confirm button
// drives it. Only the network call is mocked.
const { confirmAssistantDraft } = vi.hoisted(() => ({ confirmAssistantDraft: vi.fn() }));
vi.mock("@/src/features/assistant/api/assistantApi", () => ({ confirmAssistantDraft, cancelAssistantDraft: vi.fn() }));

import { useConfirmAssistantDraft } from "@/src/features/assistant/hooks/useAssistantDraft";

function renderConfirmHook(): ReturnType<typeof useConfirmAssistantDraft> {
  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  let hook: ReturnType<typeof useConfirmAssistantDraft> | undefined;
  const Probe = () => {
    hook = useConfirmAssistantDraft();
    return null;
  };
  renderToString(createElement(QueryClientProvider, { client: queryClient }, createElement(Probe)));
  return hook!;
}

const timeout503 = Object.assign(new Error("Request failed with status code 503"), {
  response: { status: 503, data: { success: false, error: { code: "ASSISTANT_TRANSACTION_TIMEOUT", message: "The operation timed out before it was saved." } } },
});

describe("draft confirm after a 503 ASSISTANT_TRANSACTION_TIMEOUT (Phase 38.2)", () => {
  it("retries with the same Idempotency-Key, and only mints a new one after the draft is resolved", async () => {
    confirmAssistantDraft
      .mockRejectedValueOnce(timeout503)
      .mockResolvedValueOnce({ draftId: "d1", status: "COMMITTED", transactionId: "t1", conversationId: "c1" })
      .mockResolvedValue({ draftId: "d2", status: "COMMITTED", transactionId: "t2", conversationId: "c1" });
    const confirm = renderConfirmHook();

    await expect(confirm.mutateAsync({ draftId: "d1" })).rejects.toBe(timeout503);
    await confirm.mutateAsync({ draftId: "d1" });
    await confirm.mutateAsync({ draftId: "d2" });

    const [first, retry, other] = confirmAssistantDraft.mock.calls.map((call) => call[1] as string);
    expect(confirmAssistantDraft.mock.calls.map((call) => call[0])).toEqual(["d1", "d1", "d2"]);
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(retry).toBe(first);
    expect(other).not.toBe(first);
  });
});
