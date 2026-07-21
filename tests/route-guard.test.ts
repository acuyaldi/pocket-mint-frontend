import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

// `@supabase/ssr`'s createServerClient talks to a real Supabase project.
// Mock it so this test exercises updateSession's actual route-protection
// branching (a real behavioral run, not a source-text assertion) without any
// network call or environment secret.
const getUser = vi.fn();
vi.mock("@supabase/ssr", () => ({
  createServerClient: () => ({
    auth: { getUser },
  }),
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

const { updateSession } = await import("@/lib/supabase/middleware");

function request(path: string) {
  return new NextRequest(new URL(path, "http://localhost:4000"));
}

afterEach(() => {
  getUser.mockReset();
});

describe("updateSession route protection (behavioral)", () => {
  const protectedPaths = [
    "/dashboard",
    "/wallets",
    "/transactions",
    "/tagihan",
    "/analytics",
    "/profile",
    // Previously unprotected: a hardcoded allow-list never grew to include
    // these when their routes shipped, so anonymous visitors reached the
    // authenticated shell and stalled on a perpetually-401ing fetch.
    "/anggaran",
    "/anggaran/some-id",
    "/cicilan",
    "/target-tabungan",
    "/notifications",
  ];

  it.each(protectedPaths)(
    "redirects an anonymous visitor away from %s to /login",
    async (path) => {
      getUser.mockResolvedValue({ data: { user: null } });
      const response = await updateSession(request(path));
      expect(response.status).toBe(307);
      expect(new URL(response.headers.get("location")!).pathname).toBe("/login");
    }
  );

  it.each(protectedPaths)(
    "lets an authenticated visitor through to %s",
    async (path) => {
      getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
      const response = await updateSession(request(path));
      expect(response.headers.get("location")).toBeNull();
    }
  );

  const publicPaths = ["/", "/login", "/changelog", "/auth/callback"];

  it.each(publicPaths)(
    "never redirects an anonymous visitor away from public route %s",
    async (path) => {
      getUser.mockResolvedValue({ data: { user: null } });
      const response = await updateSession(request(path));
      expect(response.headers.get("location")).toBeNull();
    }
  );

  it("redirects an authenticated visitor away from /login to /dashboard, and does not loop", async () => {
    getUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    const response = await updateSession(request("/login"));
    expect(response.status).toBe(307);
    const location = new URL(response.headers.get("location")!);
    expect(location.pathname).toBe("/dashboard");
    // /dashboard is protected but the same authenticated user reaches it
    // without bouncing back to /login — no redirect loop.
    const next = await updateSession(request(location.pathname));
    expect(next.headers.get("location")).toBeNull();
  });
});
