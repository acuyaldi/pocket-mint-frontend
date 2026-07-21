const KNOWN_CODES = [
  "BAD_REQUEST",
  "INVALID_AMOUNT",
  "CATEGORY_NOT_FOUND",
  "CATEGORY_NOT_EXPENSE",
  "CATEGORY_NOT_EDITABLE",
  "BUDGET_ALREADY_EXISTS",
  "NOT_FOUND",
  "ALREADY_ARCHIVED",
  "ALREADY_ACTIVE",
] as const;

type KnownCode = (typeof KNOWN_CODES)[number];

function isKnownCode(code: unknown): code is KnownCode {
  return typeof code === "string" && (KNOWN_CODES as readonly string[]).includes(code);
}

/**
 * Maps a Budget mutation failure to a localized message via the shared
 * `budgets.errors` translation namespace — keyed on the backend's stable
 * error `code`, never on its English message string. Pass a translator
 * already scoped to `budgets.errors` (`useTranslations("budgets.errors")`).
 */
export function mapBudgetErrorMessage(caught: unknown, tErrors: (key: string) => string): string {
  const code = (caught as { response?: { data?: { error?: { code?: string } } } })?.response?.data?.error?.code;
  return tErrors(isKnownCode(code) ? code : "GENERIC");
}
