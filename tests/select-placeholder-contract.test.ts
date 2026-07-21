import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const walletSource = readFileSync(
  root + "app/(app)/wallets/components/CreateWalletModal.tsx",
  "utf8",
);

describe("select placeholder contract", () => {
  it("uses an explicit value for the optional institution choice", () => {
    expect(walletSource).toContain('value: "none", label: t("institutions.none")');
    expect(walletSource).not.toContain('value: "", label: "Pilih Bank / Penyedia"');
    expect(idMessages.walletModals.create.institutions.none).toBe("Tanpa institusi");
  });
});
