import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = readFileSync(root + "app/(app)/wallets/page.tsx", "utf8");

describe("wallet page source contract", () => {
  it("groups cash and bank wallets under Kas & Bank", () => {
    expect(source).toContain("t(`filters.${key}`)");
    expect(source).toContain("t(`sections.${kind}`)");
    expect(source).toContain('wallet.type === "BANK" || wallet.type === "CASH"');
    expect(source).not.toContain('title="Rekening"');
    expect(idMessages.wallets.filters.bank).toBe("Kas & Bank");
    expect(idMessages.wallets.sections.bank).toBe("Kas & Bank");
  });

  it("keeps credit card, paylater, and loan as distinct products", () => {
    expect(source).toContain('wallet.type === "CREDIT_CARD"');
    expect(source).toContain('wallet.type === "PAYLATER"');
    expect(source).toContain('wallet.type === "LOAN"');
    expect(source).not.toContain("LOAN_PAYLATER");
    expect(source).not.toContain("TYPE_FROM_SUBTYPE");
  });
});
