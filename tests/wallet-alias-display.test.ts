import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const pageSource = readFileSync(root + "app/(app)/wallets/page.tsx", "utf8");

describe("wallet list alias display (Phase 37)", () => {
  it("shows aliases compactly under the wallet name, only when present", () => {
    const nameIndex = pageSource.indexOf("{wallet.name}</p>");
    const aliasGateIndex = pageSource.indexOf("wallet.aliases && wallet.aliases.length > 0");
    expect(nameIndex).toBeGreaterThan(-1);
    expect(aliasGateIndex).toBeGreaterThan(nameIndex);
  });

  it("joins alias display text without exposing internal alias ids", () => {
    expect(pageSource).toContain("wallet.aliases.map((alias) => alias.aliasDisplay).join");
  });

  it('uses a muted, non-distracting style, never the same emphasis as the balance', () => {
    const aliasLineMatch = pageSource.match(/\{wallet\.aliases[^}]*\?\s*\(\s*<p className="([^"]*)"/);
    expect(aliasLineMatch, "expected the alias <p> className to be found").toBeTruthy();
    expect(aliasLineMatch![1]).toContain("text-muted-foreground");
  });

  it('has an "also known as" style prefix translated in both locales, without promising fuzzy matching', () => {
    expect(idMessages.wallets.akaPrefix).toBeTruthy();
    expect(enMessages.wallets.akaPrefix).toBeTruthy();
    expect(idMessages.wallets.akaPrefix.toLowerCase()).not.toContain("fuzzy");
    expect(enMessages.wallets.akaPrefix.toLowerCase()).not.toContain("fuzzy");
  });
});
