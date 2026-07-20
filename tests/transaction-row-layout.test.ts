import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path: string) => readFileSync(root + path, "utf8");

const pageSource = read("app/(app)/transactions/page.tsx");

describe("transaction row layout contract", () => {
  describe("desktop grid", () => {
    it("uses a single shared grid structure for all transaction rows", () => {
      // One grid declaration that applies to all rows — no per-type
      // flex variant, no justify-between, no independent width rules.
      expect(pageSource).toContain("grid-cols-[auto_minmax(0,1fr)_auto]");
      expect(pageSource).toContain(
        "md:grid-cols-[auto_minmax(0,1fr)_minmax(8rem,14rem)_minmax(6rem,auto)]",
      );
      // flex justify-between must not remain in the row button
      expect(pageSource).not.toMatch(/justify-between.*rounded-xl/);
    });

    it("protects the description column with min-width zero", () => {
      // The description cell must use min-w-0 so long titles
      // truncate instead of pushing wallet/amount out of alignment.
      // Count occurrences: icon cell does NOT need min-w-0, but the
      // description cell must have it.  We expect at least 1 min-w-0
      // on a div inside the grid row that is NOT the wallet cell.
      const descMinW0 = (pageSource.match(/min-w-0/g) ?? []).length;
      expect(descMinW0).toBeGreaterThanOrEqual(2); // description cell + wallet cell
    });

    it("right-aligns amounts with tabular-nums and whitespace-nowrap", () => {
      // Every amount cell must end at the same right edge.
      expect(pageSource).toContain("text-right");
      expect(pageSource).toContain("tabular-nums");
      expect(pageSource).toContain("whitespace-nowrap");
    });
  });

  describe("shared row component", () => {
    it("renders Income, Expense, and Transfer through the same grid button", () => {
      // Only one <button per transaction row — no separate card
      // markup for transfers or specific types.
      const buttonMatches = pageSource.match(/className="group grid/g);
      expect(buttonMatches).not.toBeNull();
      // All rows share the same grid class, so one match for the
      // grid definition is enough — confirming there is only one
      // button definition path:
      expect(buttonMatches!.length).toBe(1);
    });

    it("uses the same outer button for all transaction types", () => {
      // No per-type branching in the button itself — only in
      // conditional className expressions within it.
      expect(pageSource).toContain("transaction.type === \"TRANSFER\"");
      // The wallet display or category text may differ, but the
      // outer card structure is shared.
    });
  });

  describe("transfer wallet representation", () => {
    it("shows source → destination when toWallet is present", () => {
      expect(pageSource).toContain("transaction.toWallet");
      expect(pageSource).toContain("→");
    });

    it("does not use a separate card structure for transfers", () => {
      // Transfers share the same grid button — no separate markup
      // branch rendering a different card shape.
      const transferCards = (
        pageSource.match(/transaction\.type === "TRANSFER"/g) ?? []
      ).length;
      // The transfer check appears for: category label, walletText
      // construction, icon background, amount color.  It should NOT
      // appear as a completely separate card/row branch.
      expect(transferCards).toBeLessThanOrEqual(6);
    });
  });

  describe("group header alignment", () => {
    it("uses horizontal padding matching card content padding", () => {
      // Card padding is p-6 (24px).  Group header must use the
      // same horizontal padding so the total right-aligns with the
      // amount column.
      expect(pageSource).toContain("px-6 pb-2");
    });

    it("keeps the same header structure for every group", () => {
      // All date-group headers share one definition — no per-group
      // variation.
      const headerMatches = (
        pageSource.match(/flex items-center justify-between/g) ?? []
      );
      expect(headerMatches.length).toBe(1);
    });
  });

  describe("responsive structure", () => {
    it("hides the desktop wallet cell on mobile", () => {
      // The grid wallet column must be hidden on mobile so the
      // 3-column layout renders cleanly.
      expect(pageSource).toContain("hidden min-w-0 md:block");
    });

    it("renders a dedicated mobile wallet row below the grid", () => {
      // Mobile gets a full-width second row for wallet info.
      expect(pageSource).toContain("col-span-full");
      expect(pageSource).toContain("md:hidden");
    });

    it("does not rely on arbitrary per-type margins for alignment", () => {
      // No margin-left/margin-right values hardcoded per wallet or
      // per transaction type.
      expect(pageSource).not.toMatch(/ml-\[\d+px\]/);
      expect(pageSource).not.toMatch(/mr-\[\d+px\]/);
    });
  });

  describe("click behavior preserved", () => {
    it("keeps the onClick handler that opens transaction detail", () => {
      expect(pageSource).toContain("onClick={() => setSelectedTx(transaction)}");
    });

    it("remains a semantic button with accessible type", () => {
      expect(pageSource).toContain('type="button"');
    });
  });

  describe("amount semantics unchanged", () => {
    it("preserves income + prefix", () => {
      expect(pageSource).toContain(
        'transaction.type === "INCOME" ? "+"',
      );
    });

    it("preserves expense - prefix", () => {
      expect(pageSource).toContain(
        ': transaction.type === "EXPENSE" ? "-"',
      );
    });

    it("preserves transfer neutral display", () => {
      expect(pageSource).toContain('"text-foreground"');
    });

    it("uses formatCurrency for all amounts", () => {
      // Both the per-row amount and the group total must use
      // formatCurrency.
      const currencyCalls = (
        pageSource.match(/formatCurrency\(/g) ?? []
      ).length;
      expect(currencyCalls).toBeGreaterThanOrEqual(2);
    });
  });
});
