import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import enMessages from "@/messages/en.json";
import idMessages from "@/messages/id.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (relativePath: string) => readFileSync(root + relativePath, "utf8");

const selectSource = read("components/ui/select.tsx");
const recurringSource = read("app/(app)/transactions/rutin/components/RecurringTransactionModal.tsx");
const createWalletSource = read("app/(app)/wallets/components/CreateWalletModal.tsx");
const addTransactionSource = read("app/(app)/transactions/components/AddTransactionModal.tsx");

describe("shared Select primitive", () => {
  it("wraps @base-ui/react/select instead of a native <select> element", () => {
    expect(selectSource).toContain('from "@base-ui/react/select"');
    // Matches an actual JSX tag (`<select ` / `<select\n`), not the doc comment's `<select>` mention.
    expect(selectSource).not.toMatch(/<select[\s]/);
  });

  it("exports the composable Trigger/Content/Item/Value parts", () => {
    expect(selectSource).toContain("export {");
    expect(selectSource).toContain("SelectTrigger");
    expect(selectSource).toContain("SelectContent");
    expect(selectSource).toContain("SelectItem");
    expect(selectSource).toContain("SelectValue");
  });

  it("portals and layers dropdown content above modal overlays (z-120, matching components/ui/dropdown-menu.tsx)", () => {
    expect(selectSource).toContain("SelectPrimitive.Portal");
    expect(selectSource).toContain("z-120");
  });

  it("matches the trigger width/height contract used by Input (h-12) so fields align", () => {
    expect(selectSource).toContain("h-12 w-full");
  });
});

describe("Select migration coverage", () => {
  for (const [name, source] of [
    ["RecurringTransactionModal", recurringSource],
    ["CreateWalletModal", createWalletSource],
    ["AddTransactionModal", addTransactionSource],
  ] as const) {
    it(`${name} uses the shared Select parts, not a native <select>`, () => {
      expect(source).toContain('from "@/components/ui/select"');
      expect(source).toContain("SelectTrigger");
      expect(source).toContain("SelectContent");
      expect(source).toContain("SelectItem");
      expect(source).not.toContain("<select");
      expect(source).not.toContain("<option");
    });
  }

  it("AddTransactionModal no longer uses the menu-based DropdownMenu for its category field", () => {
    expect(addTransactionSource).not.toContain("DropdownMenu");
  });

  it("RecurringTransactionModal maps the optional category to an explicit empty-string item, not a native placeholder option", () => {
    expect(recurringSource).toContain('<SelectItem value="">{t("noCategory")}</SelectItem>');
  });
});

describe("recurring transaction translation keys", () => {
  // Every literal t("...") key referenced directly on the modal's own
  // (mode-scoped) translator — excludes tCommon(...) and the dynamic
  // `recurringTransactionModals.${mode}` namespace template.
  const referencedKeys = Array.from(
    recurringSource.matchAll(/(?<!tCommon)\bt\(\s*["']([\w.]+)["']/g),
  ).map((match) => match[1]);

  // Rendered only when mode === "edit"; create's translation namespace has no
  // status toggle and legitimately omits these keys.
  const EDIT_ONLY_KEYS = new Set(["status", "statusActive", "statusPaused"]);

  function resolve(messages: typeof enMessages, mode: "create" | "edit", key: string): unknown {
    return key
      .split(".")
      .reduce<unknown>(
        (acc, part) => (acc && typeof acc === "object" ? (acc as Record<string, unknown>)[part] : undefined),
        messages.recurringTransactionModals[mode],
      );
  }

  it("found at least the known set of keys (regression guard against a no-op extraction)", () => {
    expect(referencedKeys).toContain("noCategory");
    expect(referencedKeys).toContain("title");
    expect(referencedKeys).toContain("submit");
    expect(referencedKeys.length).toBeGreaterThan(15);
  });

  for (const [locale, messages] of [
    ["en", enMessages],
    ["id", idMessages],
  ] as const) {
    it(`every key referenced by RecurringTransactionModal resolves in ${locale}.json for both create and edit`, () => {
      const missing: string[] = [];
      for (const key of referencedKeys) {
        for (const mode of ["create", "edit"] as const) {
          if (mode === "create" && EDIT_ONLY_KEYS.has(key)) continue;
          const value = resolve(messages, mode, key);
          if (typeof value !== "string" || value.length === 0) {
            missing.push(`${mode}.${key}`);
          }
        }
      }
      expect(missing).toEqual([]);
    });
  }

  it("noCategory resolves to a real localized label, not the raw key path", () => {
    expect(enMessages.recurringTransactionModals.create.noCategory).toBe("No category");
    expect(idMessages.recurringTransactionModals.create.noCategory).toBe("Tanpa kategori");
    expect(enMessages.recurringTransactionModals.edit.noCategory).toBeTruthy();
    expect(idMessages.recurringTransactionModals.edit.noCategory).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// Label-display contract — every <Select> backed by entity IDs MUST pass an
// `items` record so that <SelectValue> resolves labels instead of rendering
// raw `String(value)`.
// ---------------------------------------------------------------------------

describe("Select label-display contract (items prop on <Select>)", () => {
  it("RecurringTransactionModal wallet Select passes items mapping wallet IDs to names", () => {
    // The source should contain `items={Object.fromEntries(wallets.map(...))}`
    // on the same <Select> that carries value={walletId}.
    expect(recurringSource).toMatch(/items=\{[^}]*wallets\.map\s*\(\s*\(\s*w\s*\)\s*=>\s*\[\s*w\.id\s*,\s*w\.name\s*\]\s*\)/);
  });

  it("RecurringTransactionModal category Select passes items mapping category IDs to names", () => {
    expect(recurringSource).toMatch(/items=\{[^}]*cats\.map\s*\(\s*\(\s*c\s*\)\s*=>\s*\[\s*c\.id\s*,\s*c\.name\s*\]\s*\)/);
  });

  it("AddTransactionModal category Select passes items mapping category IDs to names", () => {
    expect(addTransactionSource).toMatch(/items=\{[^}]*cats\.map\s*\(\s*\(\s*c\s*\)\s*=>\s*\[\s*c\.id\s*,\s*c\.name\s*\]\s*\)/);
  });

  it("CreateWalletModal institution Select passes items mapping institution values to labels", () => {
    expect(createWalletSource).toMatch(/items=\{[^}]*INSTITUTIONS\.map\s*\(\s*\(\s*i\s*\)\s*=>\s*\[\s*i\.value\s*,\s*i\.label\s*\]\s*\)/);
  });

  it("every <Select> backed by entity IDs carries an items prop so SelectValue never falls back to raw String(value)", () => {
    // RecurringTransactionModal: wallet Select with value={walletId} → must have items=
    expect(recurringSource).toMatch(/value=\{walletId\}[\s\S]*items=/);
    // RecurringTransactionModal: category Select with value={categoryId} → must have items=
    expect(recurringSource).toMatch(/value=\{categoryId\}[\s\S]*items=/);
    // AddTransactionModal: category Select with value={categoryId} → must have items=
    expect(addTransactionSource).toMatch(/value=\{categoryId\}[\s\S]*items=/);
    // CreateWalletModal: institution Select with value={institution} → must have items=
    expect(createWalletSource).toMatch(/value=\{institution\}[\s\S]*items=/);
  });

  it("no <Select> renders a raw database-like ID as its trigger label because items prevents the String(value) fallback", () => {
    // A raw CUID would match /^c[a-z0-9]{23}$/. The `items` contract prevents
    // SelectValue from ever calling String(value) on such IDs.
    // Assert the shared Select wrapper documents this contract.
    expect(selectSource).toContain("items={Object.fromEntries");
    expect(selectSource).toContain("String(value)");
  });

  it("shared Select component documents the items contract in its JSDoc", () => {
    expect(selectSource).toContain("Label display contract");
    expect(selectSource).toContain("items={Object.fromEntries");
  });

  it("SelectValue placeholder text resolves in both English and Indonesian", () => {
    // Wallet placeholder
    expect(enMessages.recurringTransactionModals.create.chooseWallet).toBeTruthy();
    expect(idMessages.recurringTransactionModals.create.chooseWallet).toBeTruthy();
    // Category placeholder
    expect(enMessages.transactionModals.add.chooseCategory).toBeTruthy();
    expect(idMessages.transactionModals.add.chooseCategory).toBeTruthy();
    // No-category option label
    expect(enMessages.recurringTransactionModals.create.noCategory).toBe("No category");
    expect(idMessages.recurringTransactionModals.create.noCategory).toBe("Tanpa kategori");
    // Institution "none" label
    expect(enMessages.walletModals.create.institutions.none).toBeTruthy();
    expect(idMessages.walletModals.create.institutions.none).toBe("Tanpa institusi");
  });
});
