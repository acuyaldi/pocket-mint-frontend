import { createClient } from "@/lib/supabase/client";
import { AuthSessionError, AuthenticationRequiredError } from "@/lib/api-errors";

/**
 * Read the current Supabase access token (browser).
 *
 * Fetched fresh on every call so a token refreshed by Supabase is picked up —
 * never cache the returned value at module scope. Throws instead of returning
 * an empty token so callers cannot accidentally send an unauthenticated request.
 *
 * The token is never logged and never placed on a thrown error.
 */
export async function getAccessToken(): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw new AuthSessionError();
  }

  const token = data.session?.access_token;
  if (!token) {
    throw new AuthenticationRequiredError();
  }

  return token;
}

/**
 * Best-effort current access token, or `null` when there is no valid session.
 * Used by 401 recovery to decide whether a *newer* token became available.
 */
export async function currentAccessTokenOrNull(): Promise<string | null> {
  try {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}
