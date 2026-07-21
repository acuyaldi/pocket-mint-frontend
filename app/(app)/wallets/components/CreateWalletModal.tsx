"use client";

import { FormEvent, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import {
  Banknote,
  Coins,
  CreditCard,
  HandCoins,
  Landmark,
  Smartphone,
} from "lucide-react";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FieldLabel, FormField, FormErrorMessage } from "@/components/ui/form-field";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { WalletType } from "@/src/types/wallet";

interface CreateWalletModalProps {
  isOpen: boolean;
  isCreating: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWalletFormData) => Promise<void>;
}

export interface CreateWalletFormData {
  name: string;
  type: WalletType;
  icon: string;
  balance?: number;
  principal?: number;
  creditLimit?: number;
  cutoffDay?: number;
  paymentDueDay?: number;
  interestRate?: number;
  adminFee?: number;
}

const PAYLATER_PRESETS: Record<string, { interestRate: number; adminFee: number }> = {
  SPaylater: { interestRate: 2.95, adminFee: 1 },
  Kredivo: { interestRate: 2.6, adminFee: 1 },
  Akulaku: { interestRate: 1.5, adminFee: 1 },
  GoPayLater: { interestRate: 2, adminFee: 0 },
  "BCA PayLater": { interestRate: 1.25, adminFee: 0 },
  "Mandiri Paylater": { interestRate: 1.5, adminFee: 0 },
};

const parseRupiahToNumber = (value: string): number => {
  const cleaned = value.replace(/[^0-9]/g, "");
  return cleaned ? Number(cleaned) : 0;
};

const formatRupiahVisual = (value: string): string => {
  const rawNumber = value.replace(/\D/g, "");
  return rawNumber ? new Intl.NumberFormat("id-ID").format(Number(rawNumber)) : "";
};

function MoneyInput({
  id,
  value,
  onChange,
  required = false,
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <div className="relative">
      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-semibold text-muted-foreground">
        Rp
      </span>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(formatRupiahVisual(event.target.value))}
        className="h-16 w-full rounded-lg border border-border/70 bg-card pl-12 pr-4 text-right text-3xl font-semibold tabular-nums text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/15"
        inputMode="numeric"
        placeholder="0"
        required={required}
        type="text"
      />
    </div>
  );
}

export default function CreateWalletModal({
  isOpen,
  isCreating,
  onClose,
  onSubmit,
}: CreateWalletModalProps) {
  const t = useTranslations("walletModals.create");
  const tCommon = useTranslations("common");
  const ACCOUNT_TYPES: Array<{
    value: WalletType;
    label: string;
    Icon: typeof Landmark;
    tone: string;
    icon: string;
  }> = [
    { value: "CASH", label: t("types.cash"), Icon: Banknote, tone: "text-mint", icon: "banknote" },
    { value: "BANK", label: t("types.bank"), Icon: Landmark, tone: "text-mint", icon: "landmark" },
    { value: "E_WALLET", label: t("types.eWallet"), Icon: Smartphone, tone: "text-primary", icon: "smartphone" },
    { value: "CREDIT_CARD", label: t("types.creditCard"), Icon: CreditCard, tone: "text-coral", icon: "creditcard" },
    { value: "PAYLATER", label: t("types.paylater"), Icon: Coins, tone: "text-coral", icon: "coins" },
    { value: "LOAN", label: t("types.loan"), Icon: HandCoins, tone: "text-amber", icon: "handcoins" },
  ];

  const INSTITUTIONS = [
    { value: "none", label: t("institutions.none") },
    { value: "Bank Central Asia (BCA)", label: "Bank Central Asia (BCA)" },
    { value: "Bank Mandiri", label: "Bank Mandiri" },
    { value: "Bank Negara Indonesia (BNI)", label: "Bank Negara Indonesia (BNI)" },
    { value: "GoPay", label: "GoPay" },
    { value: "OVO", label: "OVO" },
    { value: "SPaylater", label: "SPaylater" },
    { value: "Kredivo", label: "Kredivo" },
    { value: "Akulaku", label: "Akulaku" },
    { value: "Lainnya", label: t("institutions.other") },
  ];

  const [accountType, setAccountType] = useState<WalletType>("CASH");
  const [walletName, setWalletName] = useState("");
  const [amount, setAmount] = useState("");
  const [creditLimit, setCreditLimit] = useState("");
  const [cutoffDay, setCutoffDay] = useState("");
  const [paymentDueDay, setPaymentDueDay] = useState("");
  const [institution, setInstitution] = useState("none");
  const [error, setError] = useState("");

  const selectedType = ACCOUNT_TYPES.find((item) => item.value === accountType)!;
  const isAsset = ["CASH", "BANK", "E_WALLET"].includes(accountType);
  const isCredit = ["CREDIT_CARD", "PAYLATER"].includes(accountType);
  const isLoan = accountType === "LOAN";

  const resetForm = useCallback(() => {
    setAccountType("CASH");
    setWalletName("");
    setAmount("");
    setCreditLimit("");
    setCutoffDay("");
    setPaymentDueDay("");
    setInstitution("none");
    setError("");
  }, []);

  const handleClose = useCallback(() => {
    if (isCreating) return;
    resetForm();
    onClose();
  }, [isCreating, onClose, resetForm]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const fallbackName = !["none", "Lainnya"].includes(institution) ? institution : "";
    const resolvedName = walletName.trim() || fallbackName;
    if (!resolvedName) return;

    const limit = parseRupiahToNumber(creditLimit);
    const principal = parseRupiahToNumber(amount);
    if ((isCredit && limit <= 0) || (isLoan && principal <= 0)) return;

    const preset = accountType === "PAYLATER" ? PAYLATER_PRESETS[resolvedName] : undefined;
    try {
      await onSubmit({
        name: resolvedName,
        type: accountType,
        icon: selectedType.icon,
        ...(isAsset && { balance: principal }),
        ...(isCredit && {
          creditLimit: limit,
          ...(cutoffDay && { cutoffDay: Number(cutoffDay) }),
          ...(paymentDueDay && { paymentDueDay: Number(paymentDueDay) }),
          ...(preset ?? {}),
        }),
        ...(isLoan && { principal }),
      });
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? t("genericError"));
      return;
    }
    resetForm();
    onClose();
  };

  return (
    <AppModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={isCreating}
      size="lg"
      title={t("title")}
      description={t("description")}
      footer={
        <>
          <ModalCancelButton isPending={isCreating} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton form="create-wallet-form" isPending={isCreating} pendingLabel={tCommon("actions.saving")}>
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="create-wallet-form" onSubmit={handleSubmit} className="space-y-6">
        <section>
          <FieldLabel className="mb-4 block">{t("chooseType")}</FieldLabel>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {ACCOUNT_TYPES.map((item) => {
              const Icon = item.Icon;
              return (
                <label key={item.value} className="group relative cursor-pointer">
                  <input
                    type="radio"
                    name="account_type"
                    value={item.value}
                    checked={accountType === item.value}
                    onChange={() => {
                      setAccountType(item.value);
                      setAmount("");
                      setCreditLimit("");
                      setCutoffDay("");
                      setPaymentDueDay("");
                    }}
                    className="peer sr-only"
                  />
                  <span className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-lg border border-border/70 bg-card p-3 text-center transition-all peer-checked:border-mint peer-checked:bg-mint/10 hover:bg-surface-low ${item.tone}`}>
                    <Icon className="size-6" />
                    <span className="text-xs font-semibold leading-tight text-foreground">{item.label}</span>
                  </span>
                </label>
              );
            })}
          </div>
        </section>

        <section className="space-y-4">
          <FieldLabel className="block">{t("accountDetails")}</FieldLabel>

          <FormField label={t("accountName")} htmlFor="create-wallet-name">
            <input
              id="create-wallet-name"
              value={walletName}
              onChange={(event) => setWalletName(event.target.value)}
              required={["none", "Lainnya"].includes(institution)}
              className="h-12 w-full rounded-lg border border-border/70 bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
              placeholder={t("accountNamePlaceholder")}
              type="text"
            />
          </FormField>

          {isAsset ? (
            <FormField label={t("initialBalance")} htmlFor="create-wallet-balance">
              <MoneyInput id="create-wallet-balance" value={amount} onChange={setAmount} />
            </FormField>
          ) : null}

          {isLoan ? (
            <FormField label={t("loanAmount")} htmlFor="create-wallet-balance" description={t("loanNote")}>
              <MoneyInput id="create-wallet-balance" value={amount} onChange={setAmount} required />
            </FormField>
          ) : null}

          {isCredit ? (
            <>
              <FormField
                label={t("creditLimit")}
                htmlFor="create-wallet-credit-limit"
                description={accountType === "PAYLATER" ? t("creditNotePaylater") : t("creditNoteDefault")}
              >
                <MoneyInput id="create-wallet-credit-limit" value={creditLimit} onChange={setCreditLimit} required />
              </FormField>
              {accountType === "CREDIT_CARD" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField label={t("cutoffDate")} htmlFor="create-wallet-cutoff-day">
                    <input
                      id="create-wallet-cutoff-day"
                      type="number"
                      min="1"
                      max="31"
                      value={cutoffDay}
                      onChange={(event) => setCutoffDay(event.target.value)}
                      className="h-12 w-full rounded-lg border border-border/70 bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder="1–31"
                    />
                  </FormField>
                  <FormField label={t("dueDate")} htmlFor="create-wallet-due-day">
                    <input
                      id="create-wallet-due-day"
                      type="number"
                      min="1"
                      max="31"
                      value={paymentDueDay}
                      onChange={(event) => setPaymentDueDay(event.target.value)}
                      className="h-12 w-full rounded-lg border border-border/70 bg-card px-4 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                      placeholder="1–31"
                    />
                  </FormField>
                </div>
              ) : null}
            </>
          ) : null}

          <FormField label={t("institution")} htmlFor="create-wallet-institution">
            <Select value={institution} onValueChange={(value) => setInstitution(value ?? "none")} items={Object.fromEntries(INSTITUTIONS.map((i) => [i.value, i.label]))}>
              <SelectTrigger id="create-wallet-institution">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INSTITUTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        </section>

        <FormErrorMessage message={error} />
      </form>
    </AppModal>
  );
}
