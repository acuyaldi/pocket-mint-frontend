import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * NOTE (Phase 19): source-text contract testing only — asserts exact
 * substrings in the compiled source of each component/hook, run under
 * `environment: "node"` with no jsdom/testing-library installed (see
 * tests/budgets.test.ts's header for the repo-wide rationale). It proves
 * the code contains the expected calls/props/strings; it does NOT render
 * components or simulate user interaction.
 */

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const pageSource = readFileSync(root + "app/(app)/profile/merchant-mapping/page.tsx", "utf8");
const rowSource = readFileSync(root + "app/(app)/profile/merchant-mapping/components/MerchantMappingRow.tsx", "utf8");
const createModalSource = readFileSync(root + "app/(app)/profile/merchant-mapping/components/CreateMerchantMappingModal.tsx", "utf8");
const editModalSource = readFileSync(root + "app/(app)/profile/merchant-mapping/components/EditMerchantMappingModal.tsx", "utf8");
const deleteModalSource = readFileSync(root + "app/(app)/profile/merchant-mapping/components/DeleteMerchantMappingModal.tsx", "utf8");
const errorMessagesSource = readFileSync(root + "app/(app)/profile/merchant-mapping/lib/error-messages.ts", "utf8");
const hookSource = readFileSync(root + "src/features/merchantMapping/hooks/useMerchantMappings.ts", "utf8");
const typesSource = readFileSync(root + "src/types/merchantMapping.ts", "utf8");
const profileSource = readFileSync(root + "app/(app)/profile/page.tsx", "utf8");
const addTransactionModalSource = readFileSync(root + "app/(app)/transactions/components/AddTransactionModal.tsx", "utf8");

describe("merchant mapping domain types", () => {
  it("carries normalizedMerchant alongside the display name", () => {
    expect(typesSource).toContain("merchantName: string");
    expect(typesSource).toContain("normalizedMerchant: string");
    expect(typesSource).toContain("categoryId: string");
  });
});

describe("merchant mapping API contract", () => {
  it("hits the exact backend endpoints and methods", () => {
    expect(hookSource).toContain('"/merchant-mappings"');
    expect(hookSource).toContain("api.patch");
    expect(hookSource).toContain("api.post");
    expect(hookSource).toContain("api.delete");
  });

  it("sends the search term as a query param", () => {
    expect(hookSource).toContain("params: search ? { search } : undefined");
  });

  it("invalidates the merchantMappings query key on every mutation", () => {
    expect(hookSource).toContain('queryKey: ["merchantMappings"]');
  });
});

describe("merchant mapping list screen", () => {
  it("shows an explicit empty state with a create CTA, not a fabricated row", () => {
    expect(pageSource).toContain("mappings.length === 0");
    expect(pageSource).toContain('t("empty")');
    expect(pageSource).toContain('t("emptyDescription")');
  });

  it("shows a distinct no-search-results state, separate from the empty state", () => {
    expect(pageSource).toContain('t("noSearchResults", { search })');
  });

  it("shows distinct loading and error states", () => {
    expect(pageSource).toContain("isLoading ?");
    expect(pageSource).toContain("isError ?");
    expect(pageSource).toContain('t("loading")');
    expect(pageSource).toContain('t("loadError")');
  });

  it("supports search via a labelled input, not color-only feedback", () => {
    expect(pageSource).toContain("useMerchantMappings(search)");
    expect(pageSource).toContain('aria-label={t("searchAria")}');
  });

  it("edit and delete actions are keyboard-operable buttons with accessible names", () => {
    expect(pageSource).toContain('editAriaLabel={t("editAria"');
    expect(pageSource).toContain('deleteAriaLabel={t("deleteAria"');
    expect(rowSource).toContain("<button");
    expect(rowSource).toContain("aria-label={editAriaLabel");
    expect(rowSource).toContain("aria-label={deleteAriaLabel");
  });
});

describe("merchant mapping create flow", () => {
  it("maps known backend error codes to localized copy, never the raw English message", () => {
    expect(createModalSource).toContain("mapMerchantMappingErrorMessage(err, tErrors)");
  });

  it("blocks submit until a merchant name and a category are chosen", () => {
    expect(createModalSource).toContain("if (!trimmedName || !categoryId) return;");
  });

  it("trims the merchant name before submitting", () => {
    expect(createModalSource).toContain("merchantName.trim()");
  });
});

describe("merchant mapping edit flow", () => {
  it("allows changing both the merchant name and the category", () => {
    expect(editModalSource).toContain("merchantName: trimmedName, categoryId");
  });

  it("maps known backend error codes to localized copy", () => {
    expect(editModalSource).toContain("mapMerchantMappingErrorMessage(err, tErrors)");
  });
});

describe("merchant mapping delete flow", () => {
  it("requires confirmation and names the merchant, not a silent delete", () => {
    expect(deleteModalSource).toContain('role="alertdialog"');
    expect(deleteModalSource).toContain('t("description", { name: mapping.merchantName })');
  });

  it("uses the destructive button variant, not color alone, to signal danger", () => {
    expect(deleteModalSource).toContain('variant="destructive"');
  });
});

describe("merchant mapping error code mapping", () => {
  it("keys off the stable backend error code, not the English message", () => {
    expect(errorMessagesSource).toContain("DUPLICATE_MERCHANT");
    expect(errorMessagesSource).toContain("CATEGORY_NOT_FOUND");
    expect(errorMessagesSource).toContain("INVALID_MERCHANT_NAME");
    expect(errorMessagesSource).toContain("isKnownCode(code)");
  });
});

describe("merchant mapping settings entry point", () => {
  it("is reachable from Akun (profile), per the audited information architecture", () => {
    expect(profileSource).toContain('href="/profile/merchant-mapping"');
    expect(profileSource).toContain('t("merchantMapping.title")');
  });
});

describe("remember-merchant opt-in flow (transaction creation)", () => {
  it("never saves a mapping automatically — requires an explicit checked checkbox", () => {
    expect(addTransactionModalSource).toContain('const [rememberMerchant, setRememberMerchant] = useState(false)');
    expect(addTransactionModalSource).toContain('type="checkbox"');
    expect(addTransactionModalSource).toContain("if (rememberMerchant && !isTransfer && categoryId && description.trim())");
  });

  it("only offers the opt-in once both a description and a category are present", () => {
    expect(addTransactionModalSource).toContain("!isTransfer && description.trim().length > 0 && categoryId &&");
  });

  it("is never offered for TRANSFER transactions (no category on a transfer)", () => {
    expect(addTransactionModalSource).toContain("!isTransfer && categoryId && description.trim()");
  });

  it("saves the mapping only after the transaction itself succeeds", () => {
    const submitIndex = addTransactionModalSource.indexOf("await onSubmit({");
    const rememberIndex = addTransactionModalSource.indexOf("createMerchantMapping.mutateAsync");
    expect(submitIndex).toBeGreaterThan(-1);
    expect(rememberIndex).toBeGreaterThan(submitIndex);
  });

  it("a mapping-save failure does not roll back or re-throw over the already-saved transaction", () => {
    const rememberBlock = addTransactionModalSource.slice(
      addTransactionModalSource.indexOf("if (rememberMerchant"),
      addTransactionModalSource.indexOf("setAmount(\"\");"),
    );
    expect(rememberBlock).toContain("try {");
    expect(rememberBlock).toContain("} catch (caught) {");
    expect(rememberBlock).not.toContain("throw");
  });

  it("resets the opt-in checkbox after submit and on type change", () => {
    expect(addTransactionModalSource).toContain("setRememberMerchant(false);");
  });
});

describe("merchant mapping i18n catalog parity", () => {
  it("defines matching keys in both catalogs", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.merchantMappings.pageTitle).toBeTruthy();
      expect(messages.merchantMappings.empty).toBeTruthy();
      expect(messages.merchantMappings.errors.DUPLICATE_MERCHANT).toBeTruthy();
      expect(messages.merchantMappingModals.create.submit).toBeTruthy();
      expect(messages.merchantMappingModals.edit.submit).toBeTruthy();
      expect(messages.merchantMappingModals.delete.confirm).toBeTruthy();
      expect(messages.profile.merchantMapping.title).toBeTruthy();
      expect(messages.transactionModals.add.rememberMerchant).toBeTruthy();
    }
  });
});
