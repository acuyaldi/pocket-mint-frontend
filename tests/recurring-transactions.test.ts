import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const pageSource = readFileSync(root + "app/(app)/transactions/rutin/page.tsx", "utf8");
const modalSource = readFileSync(
  root + "app/(app)/transactions/rutin/components/RecurringTransactionModal.tsx",
  "utf8",
);
const hookSource = readFileSync(
  root + "src/features/recurring/hooks/useRecurringTransactions.ts",
  "utf8",
);
const transactionsPageSource = readFileSync(root + "app/(app)/transactions/page.tsx", "utf8");
const sidebarSource = readFileSync(root + "components/layout/app-sidebar.tsx", "utf8");
const bottomNavSource = readFileSync(root + "components/layout/bottom-nav.tsx", "utf8");

describe("recurring transaction modal (create/edit reuse one component)", () => {
  it("derives create/edit copy from the mode prop via one shared translation namespace", () => {
    expect(modalSource).toContain("useTranslations(`recurringTransactionModals.${mode}`)");
    expect(idMessages.recurringTransactionModals.create.title).toBe("Tagihan Rutin Baru");
    expect(idMessages.recurringTransactionModals.edit.title).toBe("Ubah Tagihan Rutin");
    expect(idMessages.recurringTransactionModals.create.submit).toBe("Buat Tagihan");
    expect(idMessages.recurringTransactionModals.edit.submit).toBe("Simpan Perubahan");
  });

  it("only shows the active/paused status toggle in edit mode", () => {
    expect(modalSource).toContain('mode === "edit" ?');
    expect(modalSource).toContain("statusActive");
    expect(modalSource).toContain("statusPaused");
  });

  it("does not duplicate the field-rendering JSX between create and edit — one component, mode-driven", () => {
    // A single component file backs both modals; the page wires it up twice with mode="create"/"edit".
    expect(pageSource).toContain('mode="create"');
    expect(pageSource).toContain('mode="edit"');
    const matches = modalSource.match(/export function RecurringTransactionModal/g) ?? [];
    expect(matches.length).toBe(1);
  });
});

describe("recurring transaction modal — amount mode logic", () => {
  it("prefills every field from the template on mount (remounted fresh per open via a page-level key)", () => {
    for (const field of [
      "useState(() => template?.name ?? \"\")",
      "useState<\"EXPENSE\" | \"INCOME\">(() => template?.type ?? \"EXPENSE\")",
      "useState(() => template?.walletId ?? \"\")",
      "useState<\"FIXED\" | \"FLEXIBLE\">(() => template?.amountMode ?? \"FIXED\")",
      "useState(() => template?.isActive ?? true)",
    ]) {
      expect(modalSource).toContain(field);
    }
    // The page keys each modal so a fresh open always starts from the right prefill.
    expect(pageSource).toContain('key={editTarget?.id ?? "edit-closed"}');
    expect(pageSource).toContain('key={isAddModalOpen ? "create-open" : "create-closed"}');
  });

  it("sends amount only in FIXED mode; FLEXIBLE always omits it", () => {
    expect(modalSource).toContain('amount: amountMode === "FIXED" ? parsedAmount : undefined');
  });

  it("blocks submit when FIXED mode has no positive amount", () => {
    expect(modalSource).toContain('if (amountMode === "FIXED" && parsedAmount <= 0) return;');
  });

  it("shows a flexible-amount hint instead of the amount input when FLEXIBLE is selected", () => {
    expect(modalSource).toContain('amountMode === "FIXED" ?');
    expect(modalSource).toContain("flexibleAmountHint");
  });

  it("falls back to a localized error message when the save request fails", () => {
    expect(modalSource).toContain('setError(message ?? t("errors.genericSaveFailed"))');
  });
});

describe("recurring transaction list", () => {
  it("shows an explicit empty state, not a fabricated row", () => {
    expect(pageSource).toContain("templates.length === 0 && !isLoading");
    expect(pageSource).toContain('t("empty")');
  });

  it("renders a fixed amount and a flexible-amount label distinctly", () => {
    expect(pageSource).toContain('template.amountMode === "FIXED" && template.amount !== null');
    expect(pageSource).toContain('t("flexibleAmount")');
  });

  it("renders active/inactive status", () => {
    expect(pageSource).toContain('template.isActive ? t("active") : t("paused")');
  });

  it("shows wallet, category, and status", () => {
    expect(pageSource).toContain("template.wallet?.name");
    expect(pageSource).toContain("template.category?.name");
    expect(pageSource).toContain('template.isActive ? t("active") : t("paused")');
  });

  it("shows the next due date for active templates, derived from the backend's nextDueDate", () => {
    expect(pageSource).toContain("template.isActive && template.nextDueDate");
    expect(pageSource).toContain('t("dueDate", { date: formatDueDate(template.nextDueDate, intlLocale) })');
  });

  it("exposes an edit action alongside delete", () => {
    expect(pageSource).toContain("setEditTarget(template)");
    expect(pageSource).toContain("setDeleteTarget(template)");
  });

  it("wires the delete confirmation modal before deleting", () => {
    expect(pageSource).toContain("<DeleteRecurringModal");
    expect(pageSource).toContain("deleteRecurring.mutateAsync(deleteTarget.id)");
  });

  it("refreshes the list after every successful mutation", () => {
    const matches = hookSource.match(/invalidateQueries\(\{ queryKey: \['recurringTransactions'\] \}\)/g) ?? [];
    expect(matches.length).toBe(3); // create, update, delete
  });
});

describe("recurring transaction create/update contract", () => {
  it("only ever sends the MONTHLY frequency", () => {
    expect(modalSource).toContain('frequency: "MONTHLY"');
    expect(modalSource).not.toContain('"DAILY"');
    expect(modalSource).not.toContain('"WEEKLY"');
    expect(modalSource).not.toContain('"YEARLY"');
  });

  it("supports optional end date and optional notes on create", () => {
    expect(modalSource).toContain("endDate: endDate || undefined");
    expect(modalSource).toContain("description: description.trim() || undefined");
  });

  it("hook DTO matches the backend amountMode contract", () => {
    expect(hookSource).toContain("amountMode: RecurringTransaction['amountMode']");
    expect(hookSource).toContain("amount?: number");
  });
});

describe("recurring transaction entry point", () => {
  it("links from Transactions without adding a primary navigation item", () => {
    expect(transactionsPageSource).toContain('href="/transactions/rutin"');
    expect(sidebarSource).not.toContain("rutin");
    expect(bottomNavSource).not.toContain("rutin");
  });
});

describe("recurring transaction modal — reminder settings", () => {
  it("prefills reminder state from the template", () => {
    expect(modalSource).toContain("useState(() => template?.reminderEnabled ?? false)");
    expect(modalSource).toContain("useState<number | null>(() => template?.reminderOffsetDays ?? null)");
  });

  it("renders a radio group with 4 reminder options (H-7 removed), not a dropdown/slider/free input", () => {
    expect(modalSource).toContain('role="radiogroup"');
    expect(modalSource).toContain('type="radio"');
    expect(modalSource).toContain('{ key: "none", enabled: false, offset: null, label: t("reminderNone") }');
    expect(modalSource).toContain('{ key: "0", enabled: true, offset: 0, label: t("reminderOnDueDate") }');
    expect(modalSource).toContain('{ key: "1", enabled: true, offset: 1, label: t("reminder1Day") }');
    expect(modalSource).toContain('{ key: "3", enabled: true, offset: 3, label: t("reminder3Days") }');
    // H-7 option removed; legacy records fall through to reminderLegacy label.
    expect(modalSource).not.toContain('{ key: "7"');
  });

  it("submits reminderEnabled and reminderOffsetDays together", () => {
    expect(modalSource).toMatch(/reminderEnabled,\s+reminderOffsetDays,/);
  });
});

describe("recurring transaction list — reminder display", () => {
  it("shows a compact reminder line per template", () => {
    expect(pageSource).toContain("template.reminderEnabled && template.reminderOffsetDays !== null");
    expect(pageSource).toContain('t("reminderLine", { value: t(reminderValueKey(template.reminderOffsetDays)) })');
    expect(pageSource).toContain('t("reminderNone")');
  });
});

describe("recurring transaction create/update contract — reminder", () => {
  it("hook DTO includes optional reminder fields", () => {
    expect(hookSource).toContain("reminderEnabled?: boolean");
    expect(hookSource).toContain("reminderOffsetDays?: number | null");
  });
});

describe("recurring transaction delete failure feedback (Phase 13A)", () => {
  it("imports the shared toast helper", () => {
    expect(pageSource).toContain('import { toast } from "@/components/ui/toaster";');
  });

  it("catches a failed delete mutation and shows a localized error toast", () => {
    expect(pageSource).toContain(
      'toast(message ?? t("toastDeleteFailed"), "error");',
    );
  });

  it("does not clear the delete target (close the modal) when the mutation fails", () => {
    // setDeleteTarget(null) only runs as the last line of the try block, right
    // before catch — it never runs from the catch branch.
    const normalized = pageSource.replace(/\r\n/g, "\n");
    expect(normalized).toContain("setDeleteTarget(null);\n    } catch (caught) {");
  });

  it("still resets the pending state after a failed delete, allowing retry", () => {
    const normalized = pageSource.replace(/\r\n/g, "\n");
    expect(normalized).toContain("} finally {\n      setIsDeleting(false);\n    }\n  }, [deleteTarget, deleteRecurring, t]);");
  });

  it("defines the delete failure toast key in both locales", () => {
    expect(idMessages.recurringTransactions.toastDeleteFailed).toBeTruthy();
    expect(enMessages.recurringTransactions.toastDeleteFailed).toBeTruthy();
  });
});

describe("recurring transaction i18n catalog parity", () => {
  it("defines the new amountMode/edit keys in both catalogs", () => {
    // Full id/en key-set parity across the whole app is covered by tests/i18n.test.ts;
    // this just pins the specific keys this feature introduced.
    for (const messages of [idMessages, enMessages]) {
      for (const key of ["amountMode", "amountModeFixed", "amountModeFlexible", "flexibleAmountHint"] as const) {
        expect(messages.recurringTransactionModals.create[key]).toBeTruthy();
        expect(messages.recurringTransactionModals.edit[key]).toBeTruthy();
      }
      expect(messages.recurringTransactionModals.edit.status).toBeTruthy();
      expect(messages.recurringTransactions.flexibleAmount).toBeTruthy();
      expect(messages.recurringTransactions.monthlyDay).toContain("{day}");
      expect(messages.recurringTransactions.dueDate).toContain("{date}");
    }
  });

  it("defines the new reminder keys in both catalogs and modes", () => {
    for (const messages of [idMessages, enMessages]) {
      for (const key of [
        "reminder",
        "reminderHelp",
        "reminderNone",
        "reminderOnDueDate",
        "reminder1Day",
        "reminder3Days",
      ] as const) {
        expect(messages.recurringTransactionModals.create[key]).toBeTruthy();
        expect(messages.recurringTransactionModals.edit[key]).toBeTruthy();
      }
      // H-7 removed from modal options; legacy label exists for list display.
      expect(messages.recurringTransactions.reminderLine).toContain("{value}");
      expect(messages.recurringTransactions.reminderNone).toBeTruthy();
      expect(messages.recurringTransactions.reminderOnDueDate).toBeTruthy();
      expect(messages.recurringTransactions.reminder1Day).toBeTruthy();
      expect(messages.recurringTransactions.reminder3Days).toBeTruthy();
      expect(messages.recurringTransactions.reminderLegacy).toBeTruthy();
    }
  });
});
