import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const middleware = readFileSync(root + "lib/supabase/middleware.ts", "utf8");
const transactionsPage = readFileSync(root + "app/(app)/transactions/page.tsx", "utf8");

describe("private route auth contract", () => {
  it("protects every route by default via a public allow-list, not a hardcoded protected list", () => {
    // A hardcoded protected-route list has to be updated every time a new
    // (app) route ships, and silently stops protecting anything the author
    // forgets to add (this previously left /anggaran, /cicilan,
    // /target-tabungan, and /notifications unprotected). Asserting the
    // inverted allow-list shape, rather than an enumerated protected list,
    // is what actually prevents that regression from recurring.
    expect(middleware).toContain("isProtectedRoute");
    expect(middleware).toMatch(/isProtectedRoute\s*=\s*!isPublicRoute/);
    expect(middleware).toContain('publicPaths = ["/", "/login", "/changelog"]');
    expect(middleware).toContain('pathname.startsWith("/auth/")');
  });

  it("does not reintroduce a stale hardcoded protected-route allow-list", () => {
    expect(middleware).not.toContain('"/dashboard",');
    expect(middleware).not.toContain('protectedRoutes = [');
  });

  it("does not run a second client-side auth redirect on Transactions", () => {
    expect(transactionsPage).not.toContain("createClient");
    expect(transactionsPage).not.toContain("supabase.auth.getUser()");
    expect(transactionsPage).not.toContain('router.replace("/login")');
  });
});
