import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { syncUserToBackend } from "@/lib/auth/sync-user";

describe("syncUserToBackend", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it("sends Bearer JWT and only { name } — no legacy headers or body identity", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);

    await syncUserToBackend({ accessToken: "jwt_abc", name: "Alice" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];

    expect(String(url)).toMatch(/\/users\/sync$/);
    expect(init.method).toBe("POST");

    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer jwt_abc");
    expect(headers["x-api-key"]).toBeUndefined();
    expect(headers["x-user-id"]).toBeUndefined();
    expect(headers["x-user-email"]).toBeUndefined();

    const body = JSON.parse(init.body as string);
    expect(body).toEqual({ name: "Alice" });
    expect(body.supabaseId).toBeUndefined();
    expect(body.email).toBeUndefined();
  });

  it("never throws when the backend request fails (non-blocking auth)", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      syncUserToBackend({ accessToken: "t", name: "Bob" })
    ).resolves.toBeUndefined();

    errSpy.mockRestore();
  });

  it("does not log the access token on failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await syncUserToBackend({ accessToken: "super_secret_jwt", name: "Bob" });

    const logged = errSpy.mock.calls.flat().map(String).join(" ");
    expect(logged).not.toContain("super_secret_jwt");
    errSpy.mockRestore();
  });
});
