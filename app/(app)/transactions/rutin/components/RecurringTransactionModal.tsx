"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowUpRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Wallet } from "@/src/types/wallet";
import type { Category } from "@/src/features/categories/hooks/useCategories";
import type { RecurringTransaction } from "@/src/types/recurringTransaction";
import type { CreateRecurringTransactionDto } from "@/src/features/recurring/hooks/useRecurringTransactions";

function todayStr() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const formatRupiahVisual = (value: string): string => {
  const rawNumber = value.replace(/\D/g, "");
  return rawNumber ? new Intl.NumberFormat("id-ID").format(Number(rawNumber)) : "";
};

const parseRupiahToNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      {children}
    </label>
  );
}

export interface RecurringTransactionFormValues extends CreateRecurringTransactionDto {
  isActive: boolean;
}

interface RecurringTransactionModalProps {
  mode: "create" | "edit";
  isOpen: boolean;
  isSaving: boolean;
  wallets: Wallet[];
  categories: Category[];
  /** Prefill values in edit mode; ignored in create mode. */
  template?: RecurringTransaction | null;
  onClose: () => void;
  onSubmit: (data: RecurringTransactionFormValues) => Promise<void>;
}

export function RecurringTransactionModal({
  mode,
  isOpen,
  isSaving,
  wallets,
  categories,
  template,
  onClose,
  onSubmit,
}: RecurringTransactionModalProps) {
  const t = useTranslations(`recurringTransactionModals.${mode}`);
  const tCommon = useTranslations("common");

  // Lazy initializers read `template` only at mount. The parent remounts this
  // component (via a `key` tied to the open template/state) every time it opens,
  // so this always starts from the right prefill without an effect + setState.
  const [name, setName] = useState(() => template?.name ?? "");
  const [type, setType] = useState<"EXPENSE" | "INCOME">(() => template?.type ?? "EXPENSE");
  const [walletId, setWalletId] = useState(() => template?.walletId ?? "");
  const [categoryId, setCategoryId] = useState(() => template?.categoryId ?? "");
  const [amountMode, setAmountMode] = useState<"FIXED" | "FLEXIBLE">(() => template?.amountMode ?? "FIXED");
  const [amount, setAmount] = useState(() =>
    template?.amount !== null && template?.amount !== undefined ? formatRupiahVisual(String(template.amount)) : "",
  );
  const [startDate, setStartDate] = useState(() => template?.startDate.slice(0, 10) ?? todayStr());
  const [endDate, setEndDate] = useState(() => template?.endDate?.slice(0, 10) ?? "");
  const [description, setDescription] = useState(() => template?.description ?? "");
  const [isActive, setIsActive] = useState(() => template?.isActive ?? true);
  const [reminderEnabled, setReminderEnabled] = useState(() => template?.reminderEnabled ?? false);
  const [reminderOffsetDays, setReminderOffsetDays] = useState<number | null>(() => template?.reminderOffsetDays ?? null);
  const [error, setError] = useState("");

  const cats = categories.filter((category) => category.type === type);

  const handleClose = () => {
    if (isSaving) return;
    onClose();
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const parsedAmount = parseRupiahToNumber(amount);
    if (!name.trim() || !walletId) return;
    if (amountMode === "FIXED" && parsedAmount <= 0) return;

    try {
      await onSubmit({
        name: name.trim(),
        walletId,
        categoryId: categoryId || undefined,
        type,
        amountMode,
        amount: amountMode === "FIXED" ? parsedAmount : undefined,
        description: description.trim() || undefined,
        frequency: "MONTHLY",
        startDate,
        endDate: endDate || undefined,
        isActive,
        reminderEnabled,
        reminderOffsetDays,
      });
    } catch (err) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? t("errors.genericSaveFailed"));
      return;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-full max-w-xl flex-col gap-0 overflow-hidden rounded-xl border border-border/60 bg-card p-0 text-foreground shadow-xl"
      >
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-border/50 bg-surface-low px-6 py-4">
            <div>
              <DialogTitle className="text-xl font-semibold text-foreground">{t("title")}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-muted-foreground">
                {t("description")}
              </DialogDescription>
            </div>
            <button
              type="button"
              aria-label={t("closeAria")}
              onClick={handleClose}
              className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-6">
            <nav aria-label={t("typeNavAria")} className="grid grid-cols-2 rounded-lg bg-surface-high p-1">
              {[
                { value: "EXPENSE" as const, label: t("typeExpense"), Icon: ArrowDownLeft, activeClass: "bg-coral text-white shadow-sm" },
                { value: "INCOME" as const, label: t("typeIncome"), Icon: ArrowUpRight, activeClass: "bg-mint text-primary shadow-sm" },
              ].map(({ value, label, Icon, activeClass }) => {
                const active = type === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={active}
                    onClick={() => { setType(value); setCategoryId(""); }}
                    className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-bold uppercase tracking-[0.08em] transition-all ${
                      active ? activeClass : "text-muted-foreground hover:bg-card hover:text-foreground"
                    }`}
                  >
                    <Icon className="size-4" />
                    {label}
                  </button>
                );
              })}
            </nav>

            <section className="space-y-2">
              <FieldLabel>{t("name")}</FieldLabel>
              <Input
                type="text"
                placeholder={t("namePlaceholder")}
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
                className="h-12 border-border/70 bg-card px-3 text-sm"
              />
            </section>

            <section className="space-y-2">
              <FieldLabel>{t("amountMode")}</FieldLabel>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "FIXED" as const, label: t("amountModeFixed") },
                  { value: "FLEXIBLE" as const, label: t("amountModeFlexible") },
                ].map(({ value, label }) => {
                  const active = amountMode === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setAmountMode(value)}
                      className={`flex h-10 items-center justify-center rounded-md border text-xs font-bold uppercase tracking-[0.08em] transition-all ${
                        active
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </section>

            {amountMode === "FIXED" ? (
              <section className="space-y-2">
                <FieldLabel>{t("amount")}</FieldLabel>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                    Rp
                  </span>
                  <input
                    value={amount}
                    onChange={(event) => setAmount(formatRupiahVisual(event.target.value))}
                    className="h-14 w-full rounded-lg border border-border/70 bg-card pl-12 pr-4 text-right text-2xl font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                    inputMode="numeric"
                    placeholder="0"
                    required
                    type="text"
                  />
                </div>
              </section>
            ) : (
              <p className="rounded-lg border border-dashed border-border bg-surface-high px-3 py-2 text-xs text-muted-foreground">
                {t("flexibleAmountHint")}
              </p>
            )}

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel>{t("wallet")}</FieldLabel>
                <select
                  value={walletId}
                  onChange={(event) => setWalletId(event.target.value)}
                  required
                  className="h-12 w-full rounded-lg border border-border/70 bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                >
                  <option value="" disabled>{t("chooseWallet")}</option>
                  {wallets.map((wallet) => (
                    <option key={wallet.id} value={wallet.id}>{wallet.name}</option>
                  ))}
                </select>
              </div>

              {cats.length > 0 ? (
                <div className="space-y-2">
                  <FieldLabel>{t("category")}</FieldLabel>
                  <select
                    value={categoryId}
                    onChange={(event) => setCategoryId(event.target.value)}
                    className="h-12 w-full rounded-lg border border-border/70 bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                  >
                    <option value="">{t("noCategory")}</option>
                    {cats.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              ) : null}
            </section>

            <section className="space-y-2">
              <FieldLabel>{t("frequency")}</FieldLabel>
              <p className="flex h-10 items-center rounded-lg border border-border bg-surface-high px-3 text-xs font-semibold text-muted-foreground">
                {t("frequencyMonthlyOnly")}
              </p>
            </section>

            <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <FieldLabel>{t("startDate")}</FieldLabel>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                  className="h-12 w-full rounded-lg border border-border/70 bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
              <div className="space-y-2">
                <FieldLabel>{t("endDate")}</FieldLabel>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-12 w-full rounded-lg border border-border/70 bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>
            </section>

            <section className="space-y-2">
              <FieldLabel>{t("reminder")}</FieldLabel>
              <div role="radiogroup" aria-label={t("reminder")} className="space-y-2">
                {[
                  { key: "none", enabled: false, offset: null, label: t("reminderNone") },
                  { key: "0", enabled: true, offset: 0, label: t("reminderOnDueDate") },
                  { key: "1", enabled: true, offset: 1, label: t("reminder1Day") },
                  { key: "3", enabled: true, offset: 3, label: t("reminder3Days") },
                  { key: "7", enabled: true, offset: 7, label: t("reminder7Days") },
                ].map(({ key, enabled, offset, label }) => {
                  const checked = reminderEnabled === enabled && reminderOffsetDays === offset;
                  return (
                    <label
                      key={key}
                      className="flex h-10 items-center gap-2 rounded-md border border-border/70 bg-card px-3 text-sm text-foreground has-checked:border-primary has-checked:bg-primary/5"
                    >
                      <input
                        type="radio"
                        name="reminder"
                        checked={checked}
                        onChange={() => {
                          setReminderEnabled(enabled);
                          setReminderOffsetDays(offset);
                        }}
                        className="size-4 accent-primary"
                      />
                      {label}
                    </label>
                  );
                })}
              </div>
            </section>

            {mode === "edit" ? (
              <section className="space-y-2">
                <FieldLabel>{t("status")}</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: true, label: t("statusActive") },
                    { value: false, label: t("statusPaused") },
                  ].map(({ value, label }) => {
                    const active = isActive === value;
                    return (
                      <button
                        key={String(value)}
                        type="button"
                        aria-pressed={active}
                        onClick={() => setIsActive(value)}
                        className={`flex h-10 items-center justify-center rounded-md border text-xs font-bold uppercase tracking-[0.08em] transition-all ${
                          active
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border/70 bg-card text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="space-y-2">
              <FieldLabel>{t("optionalDescription")}</FieldLabel>
              <Input
                type="text"
                placeholder={t("descriptionPlaceholder")}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                className="h-12 border-border/70 bg-card px-3 text-sm"
              />
            </section>

            {error ? (
              <p className="rounded-lg border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">{error}</p>
            ) : null}
          </div>

          <footer className="flex flex-col-reverse gap-3 border-t border-border/50 bg-surface-low px-6 py-4 sm:flex-row">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSaving} className="h-11 flex-1 bg-card">
              {tCommon("actions.cancel")}
            </Button>
            <Button type="submit" disabled={isSaving || wallets.length === 0} className="h-11 flex-1">
              {isSaving ? tCommon("actions.saving") : t("submit")}
            </Button>
          </footer>
        </form>
      </DialogContent>
    </Dialog>
  );
}
