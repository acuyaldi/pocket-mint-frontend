import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import idMessages from "@/messages/id.json";
import enMessages from "@/messages/en.json";

const root = fileURLToPath(new URL("../", import.meta.url));
const pageSource = readFileSync(root + "app/(app)/target-tabungan/page.tsx", "utf8");
const modalSource = readFileSync(
  root + "app/(app)/target-tabungan/components/SavingGoalModal.tsx",
  "utf8",
);
const progressModalSource = readFileSync(
  root + "app/(app)/target-tabungan/components/UpdateProgressModal.tsx",
  "utf8",
);
const archiveModalSource = readFileSync(
  root + "app/(app)/target-tabungan/components/ArchiveSavingGoalModal.tsx",
  "utf8",
);
const hookSource = readFileSync(
  root + "src/features/savingGoals/hooks/useSavingGoals.ts",
  "utf8",
);
const sidebarSource = readFileSync(root + "components/layout/app-sidebar.tsx", "utf8");
const bottomNavSource = readFileSync(root + "components/layout/bottom-nav.tsx", "utf8");

describe("saving goal navigation", () => {
  it("adds a first-class nav entry on both desktop and mobile", () => {
    for (const source of [sidebarSource, bottomNavSource]) {
      expect(source).toContain('href: "/target-tabungan"');
      expect(source).toContain('label: t("savingGoals")');
    }
    expect(idMessages.nav.savingGoals).toBe("Target Tabungan");
    expect(enMessages.nav.savingGoals).toBeTruthy();
  });
});

describe("saving goal modal (create/edit reuse one component)", () => {
  it("derives create/edit copy from the mode prop via one shared translation namespace", () => {
    expect(modalSource).toContain("useTranslations(`savingGoalModals.${mode}`)");
    expect(idMessages.savingGoalModals.create.title).toBe("Target Tabungan Baru");
    expect(idMessages.savingGoalModals.edit.title).toBe("Ubah Target Tabungan");
  });

  it("only shows the initial current-amount field in create mode", () => {
    expect(modalSource).toContain('mode === "create" ?');
    expect(modalSource).toContain("currentAmount");
  });

  it("does not let the client set status — the form never collects it", () => {
    expect(modalSource).not.toContain("status");
  });

  it("prefills every field from the goal on mount (remounted fresh per open via a page-level key)", () => {
    for (const field of [
      "useState(() => goal?.name ?? \"\")",
      "useState(() => goal?.notes ?? \"\")",
    ]) {
      expect(modalSource).toContain(field);
    }
    expect(pageSource).toContain('key={editTarget?.id ?? "edit-closed"}');
    expect(pageSource).toContain('key={isAddModalOpen ? "create-open" : "create-closed"}');
  });

  it("blocks submit when name is blank or targetAmount is not positive", () => {
    expect(modalSource).toContain("if (!name.trim() || parsedTargetAmount <= 0) return;");
  });

  it("falls back to a localized error message when the save request fails", () => {
    expect(modalSource).toContain('setError(message ?? t("errors.genericSaveFailed"))');
  });
});

describe("saving goal progress update", () => {
  it("uses a dedicated modal separate from the metadata edit modal", () => {
    expect(progressModalSource).toContain("useTranslations(\"savingGoalModals.progress\")");
    expect(pageSource).toContain("<UpdateProgressModal");
    expect(pageSource).toContain("useUpdateSavingGoalProgress");
  });

  it("shows the wallet-neutral helper copy", () => {
    expect(progressModalSource).toContain('{t("helper")}');
    expect(idMessages.savingGoalModals.progress.helper).toContain("tidak mengubah saldo dompet");
    expect(enMessages.savingGoalModals.progress.helper).toContain("does not change your wallet balance");
  });

  it("sends only currentAmount to the progress endpoint", () => {
    expect(hookSource).toContain("/saving-goals/${id}/progress");
    expect(hookSource).toContain("{ currentAmount }");
  });
});

describe("saving goal archive flow", () => {
  it("requires confirmation before archiving and names the goal", () => {
    expect(archiveModalSource).toContain('role="alertdialog"');
    expect(archiveModalSource).toContain('t("description", { name: goal.name })');
  });

  it("posts to the archive endpoint, not a delete endpoint", () => {
    expect(hookSource).toContain("/saving-goals/${id}/archive");
    expect(hookSource).not.toContain("api.delete");
  });

  it("hides mutation actions once a goal is archived", () => {
    expect(pageSource).toContain("!isArchived ?");
  });
});

describe("saving goal list", () => {
  it("shows an explicit empty state with a create CTA, not a fabricated row", () => {
    expect(pageSource).toContain("goals.length === 0");
    expect(pageSource).toContain('t("empty")');
    expect(pageSource).toContain('t("emptyDescription")');
  });

  it("shows a distinct loading state and error state", () => {
    expect(pageSource).toContain("isLoading ?");
    expect(pageSource).toContain("isError ?");
    expect(pageSource).toContain('t("loading")');
    expect(pageSource).toContain('t("loadError")');
  });

  it("splits goals into active/completed/archived sections presentationally", () => {
    expect(pageSource).toContain('g.status === "ACTIVE"');
    expect(pageSource).toContain('g.status === "COMPLETED"');
    expect(pageSource).toContain('g.status === "ARCHIVED"');
    expect(pageSource).toContain('t("sectionActive")');
    expect(pageSource).toContain('t("sectionCompleted")');
    expect(pageSource).toContain('t("sectionArchived")');
  });

  it("caps the progress bar width at the backend-provided progressPercentage without recomputing it", () => {
    expect(pageSource).toContain("width: `${goal.progressPercentage}%`");
    expect(pageSource).not.toContain("Math.min");
  });

  it("displays remainingAmount and progressPercentage from the API, not derived client-side", () => {
    expect(pageSource).toContain("goal.remainingAmount");
    expect(pageSource).toContain("goal.progressPercentage");
  });

  it("never frames the goal as a wallet balance or account", () => {
    expect(pageSource).not.toMatch(/wallet/i);
    expect(pageSource).not.toMatch(/balance/i);
  });
});

describe("saving goal create/update contract", () => {
  it("hook DTOs match the backend contract", () => {
    expect(hookSource).toContain("targetAmount: number");
    expect(hookSource).toContain("currentAmount?: number");
    expect(hookSource).toContain("targetDate?: string");
    expect(hookSource).toContain("notes?: string");
  });

  it("refreshes the list after every successful mutation", () => {
    const matches = hookSource.match(/invalidateQueries\(\{ queryKey: \["savingGoals"\] \}\)/g) ?? [];
    expect(matches.length).toBe(4); // create, update, progress, archive
  });
});

describe("saving goal archive failure feedback (Phase 13A)", () => {
  it("imports the shared toast helper", () => {
    expect(pageSource).toContain('import { toast } from "@/components/ui/toaster";');
  });

  it("catches a failed archive mutation and shows a localized error toast", () => {
    expect(pageSource).toContain(
      'toast(message ?? t("toastArchiveFailed"), "error");',
    );
  });

  it("does not clear the archive target (close the modal) when the mutation fails", () => {
    // setArchiveTarget(null) only runs as the last line of the try block, right
    // before catch — it never runs from the catch branch.
    const normalized = pageSource.replace(/\r\n/g, "\n");
    expect(normalized).toContain("setArchiveTarget(null);\n    } catch (caught) {");
  });

  it("still resets the pending state after a failed archive, allowing retry", () => {
    const normalized = pageSource.replace(/\r\n/g, "\n");
    expect(normalized).toContain("} finally {\n      setIsArchiving(false);\n    }\n  }, [archiveTarget, archiveGoal, t]);");
  });

  it("defines the archive failure toast key in both locales", () => {
    expect(idMessages.savingGoals.toastArchiveFailed).toBeTruthy();
    expect(enMessages.savingGoals.toastArchiveFailed).toBeTruthy();
  });
});

describe("saving goal i18n catalog parity", () => {
  it("defines matching keys in both catalogs", () => {
    for (const messages of [idMessages, enMessages]) {
      expect(messages.savingGoals.pageTitle).toBeTruthy();
      expect(messages.savingGoals.sectionActive).toBeTruthy();
      expect(messages.savingGoals.sectionCompleted).toBeTruthy();
      expect(messages.savingGoals.sectionArchived).toBeTruthy();
      expect(messages.savingGoalModals.create.submit).toBeTruthy();
      expect(messages.savingGoalModals.edit.submit).toBeTruthy();
      expect(messages.savingGoalModals.progress.submit).toBeTruthy();
      expect(messages.savingGoalModals.archive.confirm).toBeTruthy();
      expect(messages.common.actions.archiving).toBeTruthy();
    }
  });
});
