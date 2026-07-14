import type { User } from "@supabase/supabase-js";

/**
 * Sync a Supabase Auth user into the backend Prisma `users` table.
 *
 * Auth model: the backend derives the user id from the verified JWT `sub` and
 * prefers the verified-claim email. We therefore send ONLY the Bearer token plus
 * profile metadata the token cannot carry (display name) — no client-asserted
 * user id, no identity headers, no API key. The client cannot claim who it is.
 *
 * Idempotent — the backend upserts, so retries are safe.
 * Non-throwing: a failed sync must never block auth. Errors are logged (without
 * the token) and swallowed so signup/OAuth still completes.
 *
 * Server-only: call only once a valid Supabase session (access token) exists.
 */
export async function syncUserToBackend(params: {
  accessToken: string;
  name: string;
}): Promise<void> {
  const { accessToken, name } = params;

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1"}/users/sync`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ name }),
      }
    );

    if (!res.ok) {
      // Log status only — never the token or response body.
      console.error("User sync failed:", res.status);
    }
  } catch (syncError) {
    console.error("Failed to sync user to backend:", syncError);
  }
}

/**
 * Derive a display name for a Supabase user. Prefers OAuth/profile metadata,
 * falls back to the email local-part so `/users/sync` (which requires a name)
 * never receives an empty value.
 */
export function resolveUserName(user: User): string {
  const meta = user.user_metadata ?? {};
  const fromMeta = meta.full_name || meta.name;
  if (typeof fromMeta === "string" && fromMeta.trim()) {
    return fromMeta.trim();
  }
  const email = user.email ?? "";
  const localPart = email.split("@")[0];
  return localPart || "User";
}
