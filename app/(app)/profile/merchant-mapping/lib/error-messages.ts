const KNOWN_CODES = [
  "BAD_REQUEST",
  "INVALID_MERCHANT_NAME",
  "CATEGORY_NOT_FOUND",
  "DUPLICATE_MERCHANT",
  "NOT_FOUND",
] as const;

type KnownCode = (typeof KNOWN_CODES)[number];

function isKnownCode(code: unknown): code is KnownCode {
  return typeof code === "string" && (KNOWN_CODES as readonly string[]).includes(code);
}

/**
 * Maps a merchant mapping mutation failure to a localized message via the
 * shared `merchantMappings.errors` translation namespace — keyed on the
 * backend's stable error `code`, never on its English message string.
 */
export function mapMerchantMappingErrorMessage(caught: unknown, tErrors: (key: string) => string): string {
  const code = (caught as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code;
  return tErrors(isKnownCode(code) ? code : "GENERIC");
}
