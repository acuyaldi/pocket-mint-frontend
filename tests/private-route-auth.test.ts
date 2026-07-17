import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const middleware = readFileSync(root + "lib/supabase/middleware.ts", "utf8");
const transactionsPage = readFileSync(root + "app/(app)/transactions/page.tsx", "utf8");

describe("private route auth contract", () => {
  it("protects every private product route at the middleware boundary", () => {
    for (const route of [
      '"/dashboard"',
      '"/wallets"',
      '"/transactions"',
      '"/tagihan"',
      '"/analytics"',
      '"/profile"',
    ]) {
      expect(middleware).toContain(route);
    }
    expect(middleware).toContain("isProtectedRoute");
  });

  it("does not run a second client-side auth redirect on Transactions", () => {
    expect(transactionsPage).not.toContain("createClient");
    expect(transactionsPage).not.toContain("supabase.auth.getUser()");
    expect(transactionsPage).not.toContain('router.replace("/login")');
  });
});
