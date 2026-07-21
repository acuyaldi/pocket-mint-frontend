const KNOWN_MESSAGES: Record<string, string> = {
  "Invalid login credentials": "invalidCredentials",
  "Email not confirmed": "emailNotConfirmed",
  "User already registered": "userAlreadyRegistered",
  "Password should be at least 6 characters": "weakPassword",
  "New password should be different from the old password.": "samePassword",
};

/** Maps a raw Supabase Auth error message to an `authErrors.*` translation key, falling back to `generic`. */
export function mapAuthErrorKey(message: string): string {
  return KNOWN_MESSAGES[message] ?? "generic";
}
