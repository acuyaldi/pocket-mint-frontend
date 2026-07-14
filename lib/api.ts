import axios, {
  AxiosError,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import { createClient } from "@/lib/supabase/client";
import { getAccessToken, currentAccessTokenOrNull } from "@/lib/auth/session-token";
import { AuthenticationRequiredError } from "@/lib/api-errors";

/**
 * Whether a request requires the Supabase access token.
 * Defaults to "required": every current backend endpoint is user-scoped.
 * Use "none" only for genuinely public endpoints (there are none today).
 */
export type ApiAuthMode = "required" | "none";

declare module "axios" {
  interface AxiosRequestConfig {
    /** Auth mode for this request. Omit for the default "required". */
    authMode?: ApiAuthMode;
    /** Internal: guards the single 401 recovery retry. */
    _retry?: boolean;
  }
}

// Base URL points to the JWT-only backend. Every protected request carries the
// current Supabase access token as `Authorization: Bearer <token>` — no API key,
// no client-supplied identity headers.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request: attach current Bearer token ────────────────────────────────────
export async function authRequestInterceptor(
  config: InternalAxiosRequestConfig
): Promise<InternalAxiosRequestConfig> {
  const mode: ApiAuthMode = config.authMode ?? "required";
  if (mode === "none") {
    return config;
  }

  // Throws AuthenticationRequiredError / AuthSessionError when unavailable, so a
  // protected request never leaves the browser without a token. Fetched fresh
  // (not module-cached) to honour Supabase token refresh. Our header always wins
  // over any caller-supplied Authorization.
  const token = await getAccessToken();
  config.headers.set("Authorization", `Bearer ${token}`);
  return config;
}

api.interceptors.request.use(authRequestInterceptor);

// ─── Response: centralized 401 handling ──────────────────────────────────────
function readBearer(config: InternalAxiosRequestConfig): string | null {
  const raw = config.headers?.get?.("Authorization");
  if (typeof raw !== "string") return null;
  return raw.startsWith("Bearer ") ? raw.slice(7) : null;
}

/**
 * Retry a 401'd request at most once, and only when Supabase has produced a
 * *newer* token than the one that was rejected. Same-token 401 = genuinely
 * unauthenticated, so we don't retry (no loop). A 401 means the backend rejected
 * the request before acting on it, so retrying is safe even for mutations.
 */
export function shouldRetryWithFreshToken(input: {
  freshToken: string | null;
  sentToken: string | null;
  alreadyRetried: boolean;
}): boolean {
  const { freshToken, sentToken, alreadyRetried } = input;
  if (alreadyRetried) return false;
  if (!freshToken) return false;
  return freshToken !== sentToken;
}

let redirectingToLogin = false;

/** Clear invalid local auth state and route to login. Idempotent per navigation. */
async function handleUnauthenticated(): Promise<void> {
  try {
    await createClient().auth.signOut();
  } catch {
    // best-effort; nothing to recover if sign-out itself fails
  }

  if (
    typeof window !== "undefined" &&
    !window.location.pathname.startsWith("/login") &&
    !redirectingToLogin
  ) {
    redirectingToLogin = true;
    window.location.assign("/login");
  }
}

export async function unauthorizedResponseInterceptor(
  error: AxiosError
): Promise<AxiosResponse> {
  const config = error.config as InternalAxiosRequestConfig | undefined;
  const mode: ApiAuthMode = config?.authMode ?? "required";

  if (error.response?.status !== 401 || mode === "none" || !config) {
    // Preserve the backend error envelope for normal application errors.
    throw error;
  }

  const freshToken = await currentAccessTokenOrNull();
  if (
    shouldRetryWithFreshToken({
      freshToken,
      sentToken: readBearer(config),
      alreadyRetried: config._retry === true,
    })
  ) {
    config._retry = true;
    // The request interceptor re-attaches the current (refreshed) token.
    return api.request(config);
  }

  await handleUnauthenticated();
  // Do not surface JWT/token detail to the UI.
  throw new AuthenticationRequiredError();
}

api.interceptors.response.use(
  (response) => response,
  unauthorizedResponseInterceptor
);

export default api;
