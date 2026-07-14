import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/client";
import { getAccessToken, currentAccessTokenOrNull } from "@/lib/auth/session-token";
import { AuthenticationRequiredError, AuthSessionError } from "@/lib/api-errors";

const mockedCreateClient = vi.mocked(createClient);

function stubGetSession(impl: () => Promise<unknown>) {
  mockedCreateClient.mockReturnValue({
    auth: { getSession: vi.fn().mockImplementation(impl) },
  } as unknown as ReturnType<typeof createClient>);
}

describe("getAccessToken", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the current access token from the Supabase session", async () => {
    stubGetSession(async () => ({
      data: { session: { access_token: "tok_current" } },
      error: null,
    }));
    await expect(getAccessToken()).resolves.toBe("tok_current");
  });

  it("throws AuthSessionError when getSession returns an error", async () => {
    stubGetSession(async () => ({ data: { session: null }, error: { message: "boom" } }));
    await expect(getAccessToken()).rejects.toBeInstanceOf(AuthSessionError);
  });

  it("throws AuthenticationRequiredError when there is no session", async () => {
    stubGetSession(async () => ({ data: { session: null }, error: null }));
    await expect(getAccessToken()).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });

  it("never places a token on the thrown error", async () => {
    stubGetSession(async () => ({
      data: { session: { access_token: "should_not_leak" } },
      error: { message: "fail" },
    }));
    try {
      await getAccessToken();
      throw new Error("expected to reject");
    } catch (e) {
      const dump = JSON.stringify({ name: (e as Error).name, message: (e as Error).message });
      expect(dump).not.toContain("should_not_leak");
    }
  });
});

describe("currentAccessTokenOrNull", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns the token when a session exists", async () => {
    stubGetSession(async () => ({ data: { session: { access_token: "fresh" } } }));
    await expect(currentAccessTokenOrNull()).resolves.toBe("fresh");
  });

  it("returns null when there is no session (no throw)", async () => {
    stubGetSession(async () => ({ data: { session: null } }));
    await expect(currentAccessTokenOrNull()).resolves.toBeNull();
  });
});
