/**
 * Typed errors for the frontend API boundary.
 *
 * These deliberately carry NO token, header, or JWT-verification detail — they
 * are surfaced to hooks/UI and must never leak the access token.
 */

/** Base class for errors raised by the API client. */
class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * A protected request was attempted but no Supabase session / access token is
 * available (signed out, or session not yet hydrated).
 */
export class AuthenticationRequiredError extends ApiError {
  constructor(message = "Authentication required. Please sign in again.") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

/** `supabase.auth.getSession()` itself failed while reading the session. */
export class AuthSessionError extends ApiError {
  constructor(message = "Could not read the authentication session.") {
    super(message);
    this.name = "AuthSessionError";
  }
}
