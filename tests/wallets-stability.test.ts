import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const readNormalized = (path: string) => readFileSync(path, "utf8").replace(/\r\n/g, "\n");
const root = fileURLToPath(new URL("../", import.meta.url));
const pageSource = readNormalized(root + "app/(app)/wallets/page.tsx");
const hookSource = readNormalized(root + "src/features/wallets/hooks/useWallets.ts");

describe("wallets page — loading/error/empty gating (Phase 13B)", () => {
  it("reads isLoading, isError, isFetching, and refetch from useWallets", () => {
    expect(pageSource).toContain(
      'const { data: wallets, isLoading, isError, isFetching, refetch } = useWallets();'
    );
  });

  it("renders a loading state before the wallet sections, distinct from the empty state", () => {
    expect(pageSource).toContain("isLoading ? (");
    expect(pageSource).toContain('t("loading")');
  });

  it("renders a localized error state with retry when isError, not the empty state", () => {
    expect(pageSource).toContain(") : isError ? (");
    expect(pageSource).toContain('t("error")');
    expect(pageSource).toContain("onClick={() => refetch()}");
    expect(pageSource).toContain('t("retry")');
  });

  it("disables the retry button while a refetch is already in flight", () => {
    expect(pageSource).toContain("disabled={isFetching}");
  });

  it("gates the wallet sections and empty CTA behind the successful (non-loading, non-error) branch", () => {
    const loadingIndex = pageSource.indexOf('t("loading")');
    const errorIndex = pageSource.indexOf('t("error")');
    const successBranchStart = pageSource.indexOf(") : (", errorIndex);
    const emptyCtaIndex = pageSource.indexOf('t("addFirstAccount")');
    expect(successBranchStart).toBeGreaterThan(-1);
    expect(emptyCtaIndex).toBeGreaterThan(successBranchStart);
    expect(loadingIndex).toBeLessThan(successBranchStart);
    expect(errorIndex).toBeLessThan(successBranchStart);
  });

  it("keeps the empty CTA gated on the filtered/visible wallet count once loading and error are ruled out", () => {
    expect(pageSource).toContain("visibleWallets.length === 0 ? (");
  });
});

describe("wallet mutation cache invalidation (Phase 13B)", () => {
  it("exposes a narrow wallet-dependent invalidation helper (not the transaction one)", () => {
    expect(hookSource).toContain("export const invalidateWalletDependents = (queryClient: QueryClient) => {");
    expect(hookSource).toContain("for (const queryKey of [['wallets'], ['dashboard'], ['transactions']])");
  });

  it("invalidates wallet-dependent queries (wallets + dashboard + transactions) on create", () => {
    const createIdx = hookSource.indexOf("useCreateWallet");
    const nextHelperCall = hookSource.indexOf("invalidateWalletDependents(queryClient)", createIdx);
    expect(nextHelperCall).toBeGreaterThan(createIdx);
  });

  it("invalidates wallet-dependent queries on update", () => {
    const updateIdx = hookSource.indexOf("useUpdateWallet");
    const nextHelperCall = hookSource.indexOf("invalidateWalletDependents(queryClient)", updateIdx);
    expect(nextHelperCall).toBeGreaterThan(updateIdx);
  });

  it("invalidates wallet-dependent queries on delete", () => {
    const deleteIdx = hookSource.indexOf("useDeleteWallet");
    const nextHelperCall = hookSource.indexOf("invalidateWalletDependents(queryClient)", deleteIdx);
    expect(nextHelperCall).toBeGreaterThan(deleteIdx);
  });

  it("keeps delete's force=true confirmation behavior untouched", () => {
    expect(hookSource).toContain("`/wallets/${walletId}?force=true`");
  });
});

describe("wallets translations (Phase 13B)", () => {
  it("expose loading/error/retry keys in both locales", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.wallets.loading).toBeTruthy();
      expect(messages.wallets.error).toBeTruthy();
      expect(messages.wallets.retry).toBeTruthy();
    }
  });

  it("keep exact key parity between id and en for the wallets namespace", () => {
    expect(Object.keys(idMessages.wallets).sort()).toEqual(Object.keys(enMessages.wallets).sort());
  });
});
