const KNOWN_CODES = [
  "BAD_REQUEST",
  "INVALID_RULE_VALUE",
  "CATEGORY_NOT_FOUND",
  "NOT_FOUND",
  "INVALID_PRIORITY_ORDER",
] as const;

type KnownCode = (typeof KNOWN_CODES)[number];

function isKnownCode(code: unknown): code is KnownCode {
  return typeof code === "string" && (KNOWN_CODES as readonly string[]).includes(code);
}

/**
 * Maps a rule mutation failure to a localized message via the shared
 * `rules.errors` translation namespace — keyed on the backend's stable
 * error `code`, never on its English message string.
 */
export function mapRuleErrorMessage(caught: unknown, tErrors: (key: string) => string): string {
  const code = (caught as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code;
  return tErrors(isKnownCode(code) ? code : "GENERIC");
}
