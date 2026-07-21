"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect, RedirectType } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveUserName, syncUserToBackend } from "@/lib/auth/sync-user";

// ─── Helpers ─────────────────────────────────────────────────────
/** Resolve the request origin (protocol + host) for OAuth redirect URLs. */
async function getOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("host") ?? "localhost:4000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

// ─── Login ───────────────────────────────────────────────────────
export async function login(formData: FormData) {
  const supabase = await createClient();

  const data = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const { data: authData, error } = await supabase.auth.signInWithPassword(data);

  if (error) {
    return { error: error.message };
  }

  // Self-heal: ensure the backend user row exists (idempotent). Covers accounts
  // that deferred sync at signup (email confirmation) or missed it during an
  // outage. Runs only with a valid session token — never blocks login on failure.
  if (authData.session && authData.user) {
    await syncUserToBackend({
      accessToken: authData.session.access_token,
      name: resolveUserName(authData.user),
    });
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// ─── Sign Up ─────────────────────────────────────────────────────
export async function signup(
  formData: FormData
): Promise<{ error: string } | { success: true; requiresVerification: true; email: string }> {
  const supabase = await createClient();

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // When email confirmation is required, signUp returns no session — there is
  // no access token to sync with yet, and nothing to redirect into. Report
  // back so the UI can tell the user to check their inbox, instead of
  // redirecting to /dashboard where the auth middleware would just bounce
  // them back to /login with no explanation. Sync defers to the first
  // authenticated login (handled by login()'s self-heal above).
  if (!authData.session || !authData.user) {
    return { success: true, requiresVerification: true, email };
  }

  await syncUserToBackend({
    accessToken: authData.session.access_token,
    name: resolveUserName(authData.user),
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// ─── Google OAuth ────────────────────────────────────────────────
export async function signInWithGoogle() {
  const supabase = await createClient();
  const origin = await getOrigin();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Supabase returns the provider consent URL — send the browser there.
  if (data.url) {
    redirect(data.url);
  }

  return { error: "Failed to start Google sign-in." };
}

// ─── Logout ──────────────────────────────────────────────────────
export async function logout() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  // replace (not the Server Action default of push) so Back can't return to
  // the authenticated route from browser history after sign-out.
  redirect("/", RedirectType.replace);
}
