import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { FormField } from "@/components/ui/form-field";

/**
 * Behavioral DOM test via `react-dom/server` (already a transitive dependency
 * of Next.js — no new package added). No jsdom/testing-library is installed
 * in this repo (see NOTE in tests/budgets.test.ts), so this renders real
 * markup and parses the resulting HTML string rather than simulating a live
 * browser DOM; it still proves actual React reconciliation output, unlike the
 * source-contract tests elsewhere in this suite.
 */
function countIdOccurrences(html: string, id: string): number {
  const matches = html.match(new RegExp(`id="${id}"`, "g"));
  return matches ? matches.length : 0;
}

// `children` is passed positionally below (not as a prop key, per
// react/no-children-prop), so the props object here is intentionally missing
// FormField's required `children` field — TS's createElement overloads don't
// account for children satisfied positionally, hence the `unknown` cast.
type FormFieldProps = Parameters<typeof FormField>[0];
type FormFieldOwnProps = Omit<FormFieldProps, "children">;
function withoutChildren(props: FormFieldOwnProps): FormFieldProps {
  return props as unknown as FormFieldProps;
}

describe("FormField id wiring", () => {
  it("does not clone the field id onto a plain layout div (currency-prefixed amount pattern)", () => {
    // Mirrors CreateBudgetModal's amount field: FormField > <div className="relative"> > <input id="...">
    const html = renderToStaticMarkup(
      createElement(
        FormField,
        withoutChildren({
          label: "Amount",
          htmlFor: "create-budget-amount",
          required: true,
        }),
        createElement(
          "div",
          { className: "relative" },
          createElement("input", { id: "create-budget-amount", readOnly: true })
        )
      )
    );

    expect(countIdOccurrences(html, "create-budget-amount")).toBe(1);
    expect(html).toContain('for="create-budget-amount"');
    expect(html).toMatch(/<div class="relative"><input id="create-budget-amount"/);
  });

  it("clones id and aria props onto a direct-child native input", () => {
    // Mirrors CreateWalletModal's plain <input> direct-child fields.
    const html = renderToStaticMarkup(
      createElement(
        FormField,
        withoutChildren({
          label: "Account name",
          htmlFor: "create-wallet-name",
          error: "Required",
        }),
        createElement("input", { readOnly: true })
      )
    );

    expect(countIdOccurrences(html, "create-wallet-name")).toBe(1);
    expect(html).toContain('for="create-wallet-name"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="create-wallet-name-error"');
    expect(html).toContain('id="create-wallet-name-error"');
  });
});
