import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (relativePath: string) => readFileSync(root + relativePath, "utf8");

const MIGRATED_MODALS = [
  "app/(app)/transactions/components/AddTransactionModal.tsx",
  "app/(app)/transactions/components/EditTransactionModal.tsx",
  "app/(app)/transactions/components/DeleteTransactionModal.tsx",
  "app/(app)/wallets/components/CreateWalletModal.tsx",
  "app/(app)/wallets/components/EditWalletModal.tsx",
  "app/(app)/wallets/components/DeleteWalletModal.tsx",
  "app/(app)/transactions/rutin/components/RecurringTransactionModal.tsx",
  "app/(app)/transactions/rutin/components/DeleteRecurringModal.tsx",
  "app/(app)/tagihan/components/PayBillModal.tsx",
  "app/(app)/target-tabungan/components/ArchiveSavingGoalModal.tsx",
  "app/(app)/target-tabungan/components/SavingGoalModal.tsx",
  "app/(app)/target-tabungan/components/UpdateProgressModal.tsx",
];

describe("Modal migration coverage", () => {
  it.each(MIGRATED_MODALS)("%s uses the shared AppModal shell", (path) => {
    const source = read(path);
    expect(source).toContain('from "@/components/ui/app-modal"');
    expect(source).toContain("<AppModal");
  });

  it.each(MIGRATED_MODALS)("%s does not define its own backdrop/overlay markup", (path) => {
    const source = read(path);
    expect(source).not.toContain("fixed inset-0");
    expect(source).not.toMatch(/from ["']framer-motion["']/);
  });

  it.each([
    "app/(app)/transactions/components/DeleteTransactionModal.tsx",
    "app/(app)/wallets/components/DeleteWalletModal.tsx",
    "app/(app)/transactions/rutin/components/DeleteRecurringModal.tsx",
  ])("%s uses the destructive ModalSubmitButton variant", (path) => {
    const source = read(path);
    expect(source).toContain('variant="destructive"');
  });

  it("ArchiveSavingGoalModal does not use the destructive variant (archive is not deletion)", () => {
    const source = read("app/(app)/target-tabungan/components/ArchiveSavingGoalModal.tsx");
    expect(source).not.toContain('variant="destructive"');
  });

  // DeleteWalletModal / DeleteRecurringModal / ArchiveSavingGoalModal delegate the
  // confirm mutation (and its error handling) to the caller, so they have no local
  // error state to render.
  const MODALS_WITH_OWN_MUTATION_ERROR = MIGRATED_MODALS.filter(
    (path) =>
      !path.endsWith("DeleteWalletModal.tsx") &&
      !path.endsWith("DeleteRecurringModal.tsx") &&
      !path.endsWith("ArchiveSavingGoalModal.tsx"),
  );

  it.each(MODALS_WITH_OWN_MUTATION_ERROR)(
    "%s renders mutation errors via the shared FormErrorMessage, not ad hoc markup",
    (path) => {
      const source = read(path);
      expect(source).toContain("FormErrorMessage");
    },
  );
});

describe("Edit Transaction regression coverage", () => {
  const source = read("app/(app)/transactions/components/EditTransactionModal.tsx");

  it("re-hydrates description/amount/type/date whenever the tx prop changes", () => {
    expect(source).toContain("useEffect(() => {");
    expect(source).toContain("if (!tx) return;");
    expect(source).toContain("setDescription(tx.description");
    expect(source).toContain("setAmount(formatRupiah(String(tx.amount)))");
    expect(source).toContain("setType(tx.type ===");
    expect(source).toContain("setDate(tx.date");
  });

  it("resets the stale error on re-hydration", () => {
    expect(source).toContain('setError("");');
  });

  it("keeps the modal open and surfaces the message on mutation failure", () => {
    expect(source).toMatch(/catch \(err\) \{[\s\S]*setError\(message \?\? t\("genericSaveFailed"\)\)/);
  });

  it("blocks dismissal while saving via the shared AppModal pending guard", () => {
    expect(source).toContain("isPending={isSaving}");
  });
});

describe("Create Wallet regression coverage", () => {
  const source = read("app/(app)/wallets/components/CreateWalletModal.tsx");

  it("keeps entered values on the form after a failed submission (no reset before success)", () => {
    // resetForm() must only run after the awaited onSubmit succeeds, not in the catch branch.
    const catchBlock = source.match(/catch \(caught\) \{[\s\S]*?\n {4}\}/)?.[0] ?? "";
    expect(catchBlock).not.toContain("resetForm()");
  });

  it("blocks dismissal and disables submit while creating", () => {
    expect(source).toContain("isPending={isCreating}");
  });
});

describe("Location map removal", () => {
  const source = read("app/(app)/transactions/components/TransactionDetailPanel.tsx");

  it("no longer imports or renders a map/location UI", () => {
    expect(source).not.toContain("MapPin");
    expect(source).not.toContain("mapLocation");
    expect(source).not.toMatch(/map/i);
  });

  it("still renders the other transaction detail fields (status, date, wallet, category)", () => {
    expect(source).toContain('t("status")');
    expect(source).toContain('t("date")');
    expect(source).toContain('t("wallet")');
    expect(source).toContain('t("category")');
  });

  it("does not touch the Transaction domain type that may still carry location data", () => {
    expect(source).toContain('from "@/src/types/transaction"');
  });
});
