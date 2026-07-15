import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = readFileSync(
  root + "app/(app)/transactions/components/AccountPicker.tsx",
  "utf8",
);

describe("transfer account picker source contract", () => {
  it("uses existing dropdown primitives and an input-like trigger", () => {
    for (const marker of [
      "DropdownMenuTrigger",
      "DropdownMenuContent",
      "DropdownMenuItem",
      "min-h-14",
      'aria-haspopup="menu"',
      "data-open:animate-none",
    ]) {
      expect(source).toContain(marker);
    }
  });

  it("makes selected and disabled states more than color-only", () => {
    for (const marker of [
      'role="menuitemradio"',
      "aria-checked={selected}",
      "disabled={disabled}",
      "<Check",
      "disabledReason",
      "border-border/60",
      "bg-surface-low",
    ]) {
      expect(source).toContain(marker);
    }
  });

  it("keeps balances complete and readable", () => {
    expect(source).toContain("formatWalletAmount");
    expect(source).toContain("tabular-nums");
    expect(source).not.toContain("line-clamp");
    expect(source).not.toContain("truncate");
  });
});
