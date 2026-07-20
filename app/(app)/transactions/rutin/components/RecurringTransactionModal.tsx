"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FormField, FormErrorMessage } from "@/components/ui/form-field";
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
  // Hidden field — preserved for existing records but no longer exposed in the primary form.
  const endDate = template?.endDate?.slice(0, 10) ?? "";
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
    <AppModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={isSaving}
      size="lg"
      title={t("title")}
      description={t("description")}
      footer={
        <>
          <ModalCancelButton isPending={isSaving} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton
            form="recurring-transaction-form"
            isPending={isSaving}
            pendingLabel={tCommon("actions.saving")}
            disabled={wallets.length === 0}
          >
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="recurring-transaction-form" onSubmit={handleSubmit} className="space-y-6">
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

        <FormField label={t("name")} htmlFor="recurring-tx-name">
          <Input
            type="text"
            placeholder={t("namePlaceholder")}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            className="h-12 border-border/70 bg-card px-3 text-sm"
          />
        </FormField>

        <FormField label={t("amountMode")}>
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
        </FormField>

        {amountMode === "FIXED" ? (
          <FormField label={t("amount")} htmlFor="recurring-tx-amount">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
                Rp
              </span>
              <input
                id="recurring-tx-amount"
                value={amount}
                onChange={(event) => setAmount(formatRupiahVisual(event.target.value))}
                className="h-14 w-full rounded-lg border border-border/70 bg-card pl-12 pr-4 text-right text-2xl font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
                inputMode="numeric"
                placeholder="0"
                required
                type="text"
              />
            </div>
          </FormField>
        ) : (
          <p className="rounded-lg border border-dashed border-border bg-surface-high px-3 py-2 text-xs text-muted-foreground">
            {t("flexibleAmountHint")}
          </p>
        )}

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label={t("wallet")} htmlFor="recurring-tx-wallet">
            <Select value={walletId} onValueChange={(value) => setWalletId(value ?? "")} items={Object.fromEntries(wallets.map((w) => [w.id, w.name]))} required>
              <SelectTrigger id="recurring-tx-wallet">
                <SelectValue placeholder={t("chooseWallet")} />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id}>{wallet.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>

          {cats.length > 0 ? (
            <FormField label={t("category")} htmlFor="recurring-tx-category">
              <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? "")} items={Object.fromEntries(cats.map((c) => [c.id, c.name]))}>
                <SelectTrigger id="recurring-tx-category">
                  <SelectValue placeholder={t("noCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t("noCategory")}</SelectItem>
                  {cats.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}
        </section>

        <FormField label={t("frequency")}>
          <p className="flex h-10 items-center rounded-lg border border-border bg-surface-high px-3 text-xs font-semibold text-muted-foreground">
            {startDate
              ? t("frequencyMonthlyDay", { day: new Date(`${startDate}T00:00:00`).getDate() })
              : t("frequencyMonthlyOnly")}
          </p>
        </FormField>

        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <FormField label={t("startDate")} htmlFor="recurring-tx-start-date" description={t("startDateHelp")}>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
              required
              className="h-12 border-border/70 bg-card px-3 text-sm"
            />
          </FormField>
        </section>

        <FormField label={t("reminder")} description={t("reminderHelp")}>
          <div role="radiogroup" aria-label={t("reminder")} className="space-y-2">
            {[
              { key: "none", enabled: false, offset: null, label: t("reminderNone") },
              { key: "0", enabled: true, offset: 0, label: t("reminderOnDueDate") },
              { key: "1", enabled: true, offset: 1, label: t("reminder1Day") },
              { key: "3", enabled: true, offset: 3, label: t("reminder3Days") },
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
          <p className="mt-2 text-xs text-muted-foreground">{t("reminderSingleHint")}</p>
        </FormField>

        {mode === "edit" ? (
          <FormField label={t("status")}>
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
          </FormField>
        ) : null}

        <FormField label={t("optionalDescription")} htmlFor="recurring-tx-description">
          <Input
            type="text"
            placeholder={t("descriptionPlaceholder")}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            className="h-12 border-border/70 bg-card px-3 text-sm"
          />
        </FormField>

        <FormErrorMessage message={error} />
      </form>
    </AppModal>
  );
}
