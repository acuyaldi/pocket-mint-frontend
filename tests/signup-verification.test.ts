import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/auth/sync-user", () => ({
  syncUserToBackend: vi.fn().mockResolvedValue(undefined),
  resolveUserName: vi.fn().mockReturnValue("Alice"),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { syncUserToBackend } from "@/lib/auth/sync-user";
import { redirect } from "next/navigation";
import { signup } from "@/app/actions/auth";

const mockedCreateClient = vi.mocked(createClient);
const mockedSyncUser = vi.mocked(syncUserToBackend);
const mockedRedirect = vi.mocked(redirect);

function stubSignUp(impl: () => Promise<unknown>) {
  mockedCreateClient.mockResolvedValue({
    auth: { signUp: vi.fn().mockImplementation(impl) },
  } as unknown as Awaited<ReturnType<typeof createClient>>);
}

function formDataFor(email: string) {
  const fd = new FormData();
  fd.set("email", email);
  fd.set("password", "password123");
  fd.set("name", "Alice");
  return fd;
}

describe("signup() — email verification feedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("does not redirect and reports requiresVerification when signUp returns no session", async () => {
    stubSignUp(async () => ({
      data: { session: null, user: { id: "u1" } },
      error: null,
    }));

    const result = await signup(formDataFor("new@example.com"));

    expect(result).toEqual({
      success: true,
      requiresVerification: true,
      email: "new@example.com",
    });
    expect(mockedRedirect).not.toHaveBeenCalled();
    expect(mockedSyncUser).not.toHaveBeenCalled();
  });

  it("syncs to backend and redirects to /dashboard when a session is returned immediately", async () => {
    stubSignUp(async () => ({
      data: {
        session: { access_token: "tok_abc" },
        user: { id: "u1", email: "confirmed@example.com", user_metadata: {} },
      },
      error: null,
    }));

    await expect(signup(formDataFor("confirmed@example.com"))).rejects.toThrow(
      "NEXT_REDIRECT"
    );

    expect(mockedSyncUser).toHaveBeenCalledWith({
      accessToken: "tok_abc",
      name: "Alice",
    });
    expect(mockedRedirect).toHaveBeenCalledWith("/dashboard");
  });

  it("returns the mapped error and no verification state when Supabase signup fails", async () => {
    stubSignUp(async () => ({
      data: { session: null, user: null },
      error: { message: "User already registered" },
    }));

    const result = await signup(formDataFor("taken@example.com"));

    expect(result).toEqual({ error: "User already registered" });
    expect(mockedRedirect).not.toHaveBeenCalled();
    expect(mockedSyncUser).not.toHaveBeenCalled();
  });
});
