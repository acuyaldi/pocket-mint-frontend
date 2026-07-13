import { describe, it, expect, vi, beforeEach } from "vitest";
import { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

vi.mock("@/lib/supabase/client", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/client";
import {
  authRequestInterceptor,
  shouldRetryWithFreshToken,
  unauthorizedResponseInterceptor,
} from "@/lib/api";
import { AuthenticationRequiredError } from "@/lib/api-errors";

const mockedCreateClient = vi.mocked(createClient);

function cfg(overrides: Partial<InternalAxiosRequestConfig> = {}): InternalAxiosRequestConfig {
  return { headers: new AxiosHeaders(), ...overrides } as InternalAxiosRequestConfig;
}

function stubSupabase(opts: { token: string | null; signOut?: () => Promise<unknown> }) {
  mockedCreateClient.mockReturnValue({
    auth: {
      getSession: async () => ({
        data: { session: opts.token ? { access_token: opts.token } : null },
        error: null,
      }),
      signOut: opts.signOut ?? (async () => ({})),
    },
  } as unknown as ReturnType<typeof createClient>);
}

describe("authRequestInterceptor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("attaches Authorization: Bearer <current token> for protected requests", async () => {
    stubSupabase({ token: "abc" });
    const out = await authRequestInterceptor(cfg());
    expect(out.headers.get("Authorization")).toBe("Bearer abc");
    // no legacy identity headers
    expect(out.headers.get("x-user-id")).toBeFalsy();
    expect(out.headers.get("x-user-email")).toBeFalsy();
    expect(out.headers.get("x-api-key")).toBeFalsy();
  });

  it("uses the current token, not a stale captured one", async () => {
    stubSupabase({ token: "first" });
    const a = await authRequestInterceptor(cfg());
    expect(a.headers.get("Authorization")).toBe("Bearer first");

    stubSupabase({ token: "second" }); // Supabase refreshed the session
    const b = await authRequestInterceptor(cfg());
    expect(b.headers.get("Authorization")).toBe("Bearer second");
  });

  it("overrides any caller-supplied Authorization header", async () => {
    stubSupabase({ token: "real" });
    const c = cfg();
    c.headers.set("Authorization", "Bearer spoofed");
    const out = await authRequestInterceptor(c);
    expect(out.headers.get("Authorization")).toBe("Bearer real");
  });

  it("does not attach a token for public (authMode 'none') requests", async () => {
    const c = cfg({ authMode: "none" } as Partial<InternalAxiosRequestConfig>);
    const out = await authRequestInterceptor(c);
    expect(out.headers.get("Authorization")).toBeFalsy();
    expect(mockedCreateClient).not.toHaveBeenCalled();
  });

  it("throws AuthenticationRequiredError when there is no session (request not sent)", async () => {
    stubSupabase({ token: null });
    await expect(authRequestInterceptor(cfg())).rejects.toBeInstanceOf(
      AuthenticationRequiredError
    );
  });
});

describe("shouldRetryWithFreshToken", () => {
  it("retries once when a newer token is available", () => {
    expect(
      shouldRetryWithFreshToken({ freshToken: "new", sentToken: "old", alreadyRetried: false })
    ).toBe(true);
  });

  it("does not retry with the same token (no loop)", () => {
    expect(
      shouldRetryWithFreshToken({ freshToken: "same", sentToken: "same", alreadyRetried: false })
    ).toBe(false);
  });

  it("does not retry when already retried once", () => {
    expect(
      shouldRetryWithFreshToken({ freshToken: "new", sentToken: "old", alreadyRetried: true })
    ).toBe(false);
  });

  it("does not retry when no session remains", () => {
    expect(
      shouldRetryWithFreshToken({ freshToken: null, sentToken: "old", alreadyRetried: false })
    ).toBe(false);
  });
});

describe("unauthorizedResponseInterceptor", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rethrows non-401 errors unchanged (preserves backend error envelope)", async () => {
    const err = new AxiosError("server error");
    err.response = { status: 500, data: { success: false } } as AxiosError["response"];
    err.config = cfg();
    await expect(unauthorizedResponseInterceptor(err)).rejects.toBe(err);
  });

  it("on 401 with no newer token: signs out and throws AuthenticationRequiredError", async () => {
    const signOut = vi.fn().mockResolvedValue({});
    stubSupabase({ token: null, signOut });

    const err = new AxiosError("unauthorized");
    err.response = {
      status: 401,
      data: { error: { code: "UNAUTHORIZED" } },
    } as AxiosError["response"];
    const c = cfg();
    c.headers.set("Authorization", "Bearer stale");
    err.config = c;

    await expect(unauthorizedResponseInterceptor(err)).rejects.toBeInstanceOf(
      AuthenticationRequiredError
    );
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
