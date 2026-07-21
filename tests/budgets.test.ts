import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

/**
 * NOTE (Phase B4 audit): this file is source-text contract testing only — it
 * asserts exact substrings in the compiled source of each component/hook, run
 * under `environment: "node"` with no jsdom/testing-library installed. It
 * proves the code contains the expected calls/props/strings; it does NOT
 * render components, simulate user interaction, or verify runtime behavior.
 * Do not read a passing test here as browser-level behavioral coverage.
 */

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const pageSource = readFileSync(root + "app/(app)/anggaran/page.tsx", "utf8");
const detailSource = readFileSync(root + "app/(app)/anggaran/[id]/page.tsx", "utf8");
const createModalSource = readFileSync(root + "app/(app)/anggaran/components/CreateBudgetModal.tsx", "utf8");
const editModalSource = readFileSync(root + "app/(app)/anggaran/components/EditBudgetModal.tsx", "utf8");
const archiveModalSource = readFileSync(root + "app/(app)/anggaran/components/ArchiveBudgetModal.tsx", "utf8");
const restoreModalSource = readFileSync(root + "app/(app)/anggaran/components/RestoreBudgetModal.tsx", "utf8");
const statusPillSource = readFileSync(root + "app/(app)/anggaran/components/BudgetStatusPill.tsx", "utf8");
const progressBarSource = readFileSync(root + "app/(app)/anggaran/components/BudgetProgressBar.tsx", "utf8");
const hookSource = readFileSync(root + "src/features/budgets/hooks/useBudgets.ts", "utf8");
const transactionsHookSource = readFileSync(root + "src/features/transactions/hooks/useTransactions.ts", "utf8");
const typesSource = readFileSync(root + "src/types/budget.ts", "utf8");
const sidebarSource = readFileSync(root + "components/layout/app-sidebar.tsx", "utf8");
const bottomNavSource = readFileSync(root + "components/layout/bottom-nav.tsx", "utf8");

describe("budget navigation", () => {
  it("adds a first-class nav entry on both desktop and mobile, matching each other", () => {
    for (const source of [sidebarSource, bottomNavSource]) {
      expect(source).toContain('href: "/anggaran"');
      expect(source).toContain('label: t("budgets")');
    }
    expect(idMessages.nav.budgets).toBe("Anggaran");
    expect(enMessages.nav.budgets).toBeTruthy();
  });
});

describe("budget domain types", () => {
  it("uses the exact backend status union, never re-derived", () => {
    expect(typesSource).toContain('"HEALTHY" | "APPROACHING" | "REACHED" | "EXCEEDED" | "ARCHIVED"');
  });

  it("carries isArchived as the authoritative archive flag", () => {
    expect(typesSource).toContain("isArchived: boolean");
  });
});

describe("budget API contract", () => {
  it("hits the exact backend endpoints and methods", () => {
    expect(hookSource).toContain('"/budgets"');
    expect(hookSource).toContain("`/budgets/${id}`");
    expect(hookSource).toContain("`/budgets/${id}/archive`");
    expect(hookSource).toContain("`/budgets/${id}/restore`");
    expect(hookSource).toContain("api.patch");
    expect(hookSource).toContain("api.post");
  });

  it("serializes the status filter as a query param, not a path segment", () => {
    expect(hookSource).toContain("params: { status }");
  });

  it("sends only categoryId + amount on create", () => {
    expect(hookSource).toContain("interface CreateBudgetDto {\n  categoryId: string;\n  amount: number;\n}");
  });

  it("sends only amount on update — never categoryId", () => {
    expect(hookSource).toContain("interface UpdateBudgetAmountDto {\n  amount: number;\n}");
    expect(hookSource).toContain("mutationFn: ({ id, amount }) =>");
    expect(hookSource).not.toContain("categoryId: string;\n  amount: number;\n}\n\nexport const useUpdateBudget");
  });

  it("never issues a delete request", () => {
    expect(hookSource).not.toContain("api.delete");
  });
});

describe("budget React Query invalidation", () => {
  it("invalidates only budgets after every mutation — Dashboard doesn't consume budget data yet", () => {
    expect(hookSource).toContain('queryClient.invalidateQueries({ queryKey: ["budgets"] })');
    const matches = hookSource.match(/onSuccess: \(\) => invalidateBudgetDependents\(queryClient\)/g) ?? [];
    expect(matches.length).toBe(4); // create, update, archive, restore
  });

  it("does not invalidate the dashboard query (no speculative coupling to a deferred feature)", () => {
    expect(hookSource).not.toContain('"dashboard"');
  });

  it("a transaction mutation also invalidates budgets (usage can change without touching the Budget table)", () => {
    expect(transactionsHookSource).toContain("['budgets']");
  });
});

describe("budget status is always backend-computed", () => {
  it("the status pill renders the backend status text, never a client-derived label", () => {
    expect(statusPillSource).toContain('t(status)');
    expect(statusPillSource).not.toContain("percentUsed");
  });

  it("the progress bar caps visual width but exposes the true percentUsed in accessible text", () => {
    expect(progressBarSource).toContain("Math.min(Math.max(value, 0), 100)");
    expect(progressBarSource).toContain('role="progressbar"');
  });

  it("caps aria-valuenow at aria-valuemax (a value above 100 is an invalid ARIA range) and surfaces the true value via aria-valuetext", () => {
    expect(progressBarSource).toContain("aria-valuemax={100}");
    expect(progressBarSource).toContain("aria-valuenow={Math.min(trueValue, 100)}");
    expect(progressBarSource).toContain('aria-valuetext={t("progressAria", { percent: trueValue })}');
    expect(progressBarSource).not.toContain("aria-valuenow={Math.round(value * 100) / 100}");
  });

  it("the list page never recomputes status from percentUsed", () => {
    expect(pageSource).not.toContain("percentUsed >=");
    expect(pageSource).not.toContain("percentUsed >");
  });
});

describe("budget list screen", () => {
  it("shows an explicit empty state with a create CTA, not a fabricated row", () => {
    expect(pageSource).toContain("visibleBudgets.length === 0");
    expect(pageSource).toContain('t("empty")');
    expect(pageSource).toContain('t("emptyDescription")');
  });

  it("shows distinct loading and error states", () => {
    expect(pageSource).toContain("isLoading ?");
    expect(pageSource).toContain("isError ?");
    expect(pageSource).toContain('t("loading")');
    expect(pageSource).toContain('t("loadError")');
  });

  it("offers an explicit Active/Archived toggle on the same screen — not a separate route", () => {
    expect(pageSource).toContain('role="tab"');
    expect(pageSource).toContain('t("filterActive")');
    expect(pageSource).toContain('t("filterArchived")');
    expect(pageSource).toContain('useState<BudgetListStatus>("active")');
  });

  it("excludes categories that already have a budget (active or archived) from Create eligibility", () => {
    expect(pageSource).toContain("takenIds.has(c.id)");
    expect(pageSource).toContain('c.type === "EXPENSE"');
  });

  it("never shows a Delete action", () => {
    for (const source of [pageSource, detailSource]) {
      expect(source).not.toMatch(/Delete\s*Budget/i);
    }
  });
});

describe("budget amount input precision", () => {
  // Neither modal exports its parse/format helpers, so these assert the
  // pattern in source rather than calling the functions directly (no
  // component-rendering infra is installed in this repo — see file header).
  it("strips to digits only (no premature Number() on partial input, no decimal point accepted)", () => {
    for (const source of [createModalSource, editModalSource]) {
      expect(source).toContain('value.replace(/\\D/g, "")');
      expect(source).toContain('value.replace(/[^0-9]/g, "")');
    }
  });

  it("blocks zero and negative amounts before submit", () => {
    expect(createModalSource).toContain("parsedAmount <= 0");
    expect(editModalSource).toContain("parsedAmount <= 0");
  });

  it("keeps the amount as a digit string in component state — only converts to Number at submit time", () => {
    expect(createModalSource).toContain('const [amount, setAmount] = useState("")');
    for (const source of [createModalSource, editModalSource]) {
      expect(source).toContain("const parsedAmount = parseRupiahToNumber(amount);");
    }
  });
});

describe("budget create flow", () => {
  it("maps known backend error codes to localized copy, never the raw English message", () => {
    expect(createModalSource).toContain("mapBudgetErrorMessage(err, tErrors)");
  });

  it("handles the no-eligible-categories state without a broken selector", () => {
    expect(createModalSource).toContain("eligibleCategories.length === 0");
    expect(createModalSource).toContain('t("noEligibleCategories")');
  });

  it("blocks submit until a category and a positive amount are chosen", () => {
    expect(createModalSource).toContain("if (!categoryId || parsedAmount <= 0) return;");
  });
});

describe("budget edit flow", () => {
  it("shows the category as read-only context, with no editable category control", () => {
    expect(editModalSource).toContain("readOnly");
    expect(editModalSource).toContain("disabled");
    expect(editModalSource).not.toContain("SelectTrigger");
  });

  it("submits only { amount } — never categoryId", () => {
    expect(editModalSource).toContain("onSubmit({ amount: parsedAmount })");
  });

  it("prefills the current amount from the budget on mount", () => {
    expect(editModalSource).toContain("useState(() => (budget ? formatRupiahVisual(String(budget.amount)) : \"\"))");
  });
});

describe("budget archive/restore flow", () => {
  it("archive requires confirmation and names the budget's category", () => {
    expect(archiveModalSource).toContain('role="alertdialog"');
    expect(archiveModalSource).toContain('t("description", { name: budget.category.name })');
  });

  it("restore requires confirmation and names the budget's category", () => {
    expect(restoreModalSource).toContain('role="alertdialog"');
    expect(restoreModalSource).toContain('t("description", { name: budget.category.name })');
  });

  it("posts to the archive/restore endpoints, not a delete endpoint", () => {
    expect(hookSource).not.toContain("api.delete");
  });

  it("archive is only offered on an active budget; restore only on an archived one", () => {
    for (const source of [pageSource, detailSource]) {
      expect(source).toContain("budget.isArchived ?");
    }
  });
});

describe("budget detail screen", () => {
  it("derives the contributing-transaction list from the existing transaction hook, filtered by category — not a new endpoint", () => {
    expect(detailSource).toContain("useTransactions()");
    expect(detailSource).toContain('tx.type === "EXPENSE" && tx.categoryId === budget.category.id');
  });

  it("communicates the archived state as text, not color alone", () => {
    expect(detailSource).toContain('budget.isArchived ?');
    expect(detailSource).toContain('tDetail("archivedNotice")');
  });

  it("shows loading and error states distinct from a missing budget", () => {
    expect(detailSource).toContain("isLoading");
    expect(detailSource).toContain("isError || !budget");
  });

  it("labels the list honestly as this period's transactions, not an unqualified full history", () => {
    // useTransactions() (unlike useAllTransactions()) fetches only the current
    // reporting-month window with no `limit`/pagination param, the same
    // window the Budget's own periodStart/periodEnd is computed from — so the
    // client-side category filter yields the complete per-period set, not a
    // truncated batch. Copy must stay scoped to "this period", never imply
    // all-time completeness.
    expect(idMessages.budgetDetail.contributingTitle).toBe("Transaksi periode ini");
    expect(enMessages.budgetDetail.contributingTitle).toBe("Transactions this period");
    expect(detailSource).not.toContain("useAllTransactions");
  });
});

describe("budget i18n catalog parity", () => {
  it("defines matching keys in both catalogs", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.budgets.pageTitle).toBeTruthy();
      expect(messages.budgets.status.HEALTHY).toBeTruthy();
      expect(messages.budgets.status.APPROACHING).toBeTruthy();
      expect(messages.budgets.status.REACHED).toBeTruthy();
      expect(messages.budgets.status.EXCEEDED).toBeTruthy();
      expect(messages.budgets.status.ARCHIVED).toBeTruthy();
      expect(messages.budgets.errors.BUDGET_ALREADY_EXISTS).toBeTruthy();
      expect(messages.budgetModals.create.submit).toBeTruthy();
      expect(messages.budgetModals.edit.submit).toBeTruthy();
      expect(messages.budgetModals.archive.confirm).toBeTruthy();
      expect(messages.budgetModals.restore.confirm).toBeTruthy();
      expect(messages.budgetDetail.contributingTitle).toBeTruthy();
    }
  });

  it("Indonesian status labels match PD-009 Decision K exactly", () => {
    expect(idMessages.budgets.status.HEALTHY).toBe("Aman");
    expect(idMessages.budgets.status.APPROACHING).toBe("Mendekati batas");
    expect(idMessages.budgets.status.REACHED).toBe("Anggaran tercapai");
    expect(idMessages.budgets.status.EXCEEDED).toBe("Melebihi anggaran");
    expect(idMessages.budgets.status.ARCHIVED).toBe("Diarsipkan");
  });
});
