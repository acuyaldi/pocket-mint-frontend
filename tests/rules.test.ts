import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * NOTE (Phase 20): source-text contract testing only — see
 * tests/merchant-mappings.test.ts's header for the repo-wide rationale.
 * Proves the code contains the expected calls/props/strings; does not
 * render components or simulate user interaction.
 */

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const pageSource = readFileSync(root + "app/(app)/profile/rules/page.tsx", "utf8");
const rowSource = readFileSync(root + "app/(app)/profile/rules/components/RuleRow.tsx", "utf8");
const conditionFieldsSource = readFileSync(root + "app/(app)/profile/rules/components/RuleConditionFields.tsx", "utf8");
const createModalSource = readFileSync(root + "app/(app)/profile/rules/components/CreateRuleModal.tsx", "utf8");
const editModalSource = readFileSync(root + "app/(app)/profile/rules/components/EditRuleModal.tsx", "utf8");
const deleteModalSource = readFileSync(root + "app/(app)/profile/rules/components/DeleteRuleModal.tsx", "utf8");
const errorMessagesSource = readFileSync(root + "app/(app)/profile/rules/lib/error-messages.ts", "utf8");
const describeConditionSource = readFileSync(root + "app/(app)/profile/rules/lib/describe-condition.ts", "utf8");
const hookSource = readFileSync(root + "src/features/rules/hooks/useRules.ts", "utf8");
const typesSource = readFileSync(root + "src/types/rule.ts", "utf8");
const profileSource = readFileSync(root + "app/(app)/profile/page.tsx", "utf8");
const switchSource = readFileSync(root + "components/ui/switch.tsx", "utf8");

describe("rule domain types", () => {
  it("carries every field the API returns", () => {
    expect(typesSource).toContain("enabled: boolean");
    expect(typesSource).toContain("priority: number");
    expect(typesSource).toContain("matchType: RuleMatchType");
    expect(typesSource).toContain("operator: RuleOperator");
    expect(typesSource).toContain("categoryId: string");
  });
});

describe("rule API contract", () => {
  it("hits the exact backend endpoints and methods", () => {
    expect(hookSource).toContain('"/rules"');
    expect(hookSource).toContain("api.patch");
    expect(hookSource).toContain("api.post");
    expect(hookSource).toContain("api.delete");
    expect(hookSource).toContain('"/rules/reorder"');
  });

  it("invalidates the rules query key on every mutation", () => {
    expect(hookSource).toContain('queryKey: ["rules"]');
  });

  it("optimistically reorders the cached list before the request resolves", () => {
    expect(hookSource).toContain("onMutate");
    expect(hookSource).toContain("queryClient.setQueryData");
  });

  it("rolls back the optimistic reorder on failure", () => {
    expect(hookSource).toContain("onError");
    expect(hookSource).toContain("ctx?.previous");
  });
});

describe("rule list screen", () => {
  it("shows an explicit empty state with a create CTA, not a fabricated row", () => {
    expect(pageSource).toContain("rules.length === 0");
    expect(pageSource).toContain('t("empty")');
    expect(pageSource).toContain('t("emptyDescription")');
  });

  it("shows distinct loading and error states", () => {
    expect(pageSource).toContain("isLoading ?");
    expect(pageSource).toContain("isError ?");
    expect(pageSource).toContain('t("loading")');
    expect(pageSource).toContain('t("loadError")');
  });

  it("supports enable/disable via a Switch, and reorder via move up/down handlers", () => {
    expect(pageSource).toContain("onToggleEnabled={handleToggleEnabled}");
    expect(pageSource).toContain("onMoveUp={(r) => move(r, -1)}");
    expect(pageSource).toContain("onMoveDown={(r) => move(r, 1)}");
  });

  it("edit and delete actions are keyboard-operable buttons with accessible names", () => {
    expect(rowSource).toContain("<button");
    expect(rowSource).toContain("aria-label={labels.editAria}");
    expect(rowSource).toContain("aria-label={labels.deleteAria}");
  });

  it("a disabled rule is conveyed with a text badge, not color alone", () => {
    expect(rowSource).toContain("labels.disabledBadge");
    expect(rowSource).toContain("!rule.enabled");
  });
});

describe("rule condition fields", () => {
  it("hides the operator picker and swaps value for a closed picker when matching transaction type", () => {
    expect(conditionFieldsSource).toContain('matchType === "TRANSACTION_TYPE"');
    expect(conditionFieldsSource).toContain("!isTransactionType &&");
  });

  it("only offers the deterministic operators required by the spec — no regex, no fuzzy", () => {
    expect(conditionFieldsSource).toContain('"CONTAINS", "EQUALS", "STARTS_WITH", "ENDS_WITH"');
  });
});

describe("rule create flow", () => {
  it("maps known backend error codes to localized copy, never the raw English message", () => {
    expect(createModalSource).toContain("mapRuleErrorMessage(err, tErrors)");
  });

  it("blocks submit until name, value, and category are all present", () => {
    expect(createModalSource).toContain("if (!trimmedName || !trimmedValue || !categoryId) return;");
  });

  it("forces the operator to EQUALS and clears value when switching to TRANSACTION_TYPE", () => {
    expect(createModalSource).toContain('setOperator("EQUALS")');
  });
});

describe("rule edit flow", () => {
  it("maps known backend error codes to localized copy", () => {
    expect(editModalSource).toContain("mapRuleErrorMessage(err, tErrors)");
  });
});

describe("rule delete flow", () => {
  it("requires confirmation and names the rule, not a silent delete", () => {
    expect(deleteModalSource).toContain('role="alertdialog"');
    expect(deleteModalSource).toContain('t("description", { name: rule.name })');
  });

  it("uses the destructive button variant, not color alone, to signal danger", () => {
    expect(deleteModalSource).toContain('variant="destructive"');
  });
});

describe("rule error code mapping", () => {
  it("keys off the stable backend error code, not the English message", () => {
    expect(errorMessagesSource).toContain("INVALID_RULE_VALUE");
    expect(errorMessagesSource).toContain("CATEGORY_NOT_FOUND");
    expect(errorMessagesSource).toContain("INVALID_PRIORITY_ORDER");
    expect(errorMessagesSource).toContain("isKnownCode(code)");
  });
});

describe("rule condition summary", () => {
  it("special-cases TRANSACTION_TYPE instead of rendering a raw operator", () => {
    expect(describeConditionSource).toContain('rule.matchType === "TRANSACTION_TYPE"');
    expect(describeConditionSource).toContain("transactionType");
  });
});

describe("rule settings entry point", () => {
  it("is reachable from Akun (profile), per the audited information architecture", () => {
    expect(profileSource).toContain('href="/profile/rules"');
    expect(profileSource).toContain('t("rules.title")');
  });
});

describe("Switch component", () => {
  it("is a controlled component announced as a switch to assistive tech", () => {
    expect(switchSource).toContain('role="switch"');
    expect(switchSource).toContain("checked: boolean");
    expect(switchSource).toContain("onCheckedChange");
  });

  it("is keyboard-operable via a real input, not a div with a click handler", () => {
    expect(switchSource).toContain('type="checkbox"');
  });
});

describe("rule i18n catalog parity", () => {
  it("defines matching keys in both catalogs", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.rules.pageTitle).toBeTruthy();
      expect(messages.rules.empty).toBeTruthy();
      expect(messages.rules.errors.INVALID_RULE_VALUE).toBeTruthy();
      expect(messages.rules.errors.INVALID_PRIORITY_ORDER).toBeTruthy();
      expect(messages.ruleModals.create.submit).toBeTruthy();
      expect(messages.ruleModals.edit.submit).toBeTruthy();
      expect(messages.ruleModals.delete.confirm).toBeTruthy();
      expect(messages.ruleModals.fields.matchTypeOptions.TRANSACTION_TYPE).toBeTruthy();
      expect(messages.ruleConditionSummary.template).toBeTruthy();
      expect(messages.profile.rules.title).toBeTruthy();
    }
  });
});
