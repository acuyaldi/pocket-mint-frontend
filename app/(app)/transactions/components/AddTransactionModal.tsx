"use client";

import { useCallback, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  Banknote,
  CalendarDays,
  CreditCard,
  Plus,
  RefreshCw,
  Smartphone,
  Wallet as WalletIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AppModal, ModalCancelButton, ModalSubmitButton } from "@/components/ui/app-modal";
import { FieldLabel, FormField, FormErrorMessage } from "@/components/ui/form-field";
import { toast } from "@/components/ui/toaster";
import { formatCurrency } from "@/lib/utils";
import { INTL_LOCALE } from "@/i18n/config";
import { useCategories } from "@/src/features/categories/hooks/useCategories";
import { useCategorySuggestions } from "@/src/features/categories/hooks/useCategorySuggestions";
import { CategorySuggestionList } from "@/src/features/categories/components/CategorySuggestionList";
import { useCreateMerchantMapping } from "@/src/features/merchantMapping/hooks/useMerchantMappings";
import { usePaylaterRates } from "@/src/features/installments/hooks/useInstallments";
import {
  ASSET_WALLET_TYPES,
  isCreditWallet,
  isDebtWallet,
  type Wallet,
} from "@/src/types/wallet";
import { AccountPicker } from "./AccountPicker";
import { formatRupiah } from "./constants";
import {
  getTransferDestinations,
  getTransferEndpointWallets,
  getTransferSources,
  getTransferWallets,
  isValidTransferPair,
  selectTransferEndpoint,
  swapTransferEndpoints,
} from "./transfer-account-picker";

type TxType = "EXPENSE" | "INCOME" | "TRANSFER";
type Tab = TxType;

const TENORS = [3, 6, 12];

const remainingCredit = (wallet: Wallet) =>
  wallet.remainingCredit ??
  Math.max(wallet.creditLimit - Math.abs(Math.min(wallet.balance, 0)), 0);

const spendable = (wallet: Wallet) =>
  isCreditWallet(wallet.type) ? remainingCredit(wallet) : wallet.balance;

function todayStr() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const PAYLATER_DUE_DAYS = 30;

function addDays(dateStr: string, days: number) {
  const [year, month, day] = dateStr.split("-").map(Number);
  const next = new Date(year, month - 1, day + days);
  const m = String(next.getMonth() + 1).padStart(2, "0");
  const d = String(next.getDate()).padStart(2, "0");
  return `${next.getFullYear()}-${m}-${d}`;
}

function formatDateId(dateStr: string, intlLocale: string) {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(intlLocale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getInstallmentDefaults(
  wallet: Wallet | undefined,
  paylaterRates:
    | Array<{ match: string; rate: number; adminFee: number }>
    | undefined,
) {
  if (!wallet || !isCreditWallet(wallet.type)) {
    return { interestRate: "", adminFee: "" };
  }

  if (wallet.interestRate > 0 || (wallet.adminFee ?? 0) > 0) {
    return {
      interestRate: String(wallet.interestRate),
      adminFee:
        wallet.adminFeeType === "PERCENT" ? String(wallet.adminFee ?? 0) : "",
    };
  }

  const preset = paylaterRates?.find((item) =>
    wallet.name.toLowerCase().includes(item.match),
  );

  return {
    interestRate: preset ? String(preset.rate) : "",
    adminFee: preset ? String(preset.adminFee) : "",
  };
}

function getWalletKind(wallet: Wallet, tKind: (key: string) => string) {
  if (wallet.type === "BANK") return tKind("bank");
  if (wallet.type === "E_WALLET") return tKind("eWallet");
  if (wallet.type === "CASH") return tKind("cash");
  if (wallet.type === "CREDIT_CARD") return tKind("creditCard");
  if (wallet.type === "PAYLATER") return tKind("paylater");
  return tKind("loan");
}

function getWalletIcon(wallet: Wallet) {
  if (wallet.type === "BANK") return Banknote;
  if (wallet.type === "E_WALLET") return Smartphone;
  if (isDebtWallet(wallet.type)) return CreditCard;
  return WalletIcon;
}

function formatWalletAmount(
  wallet: Wallet,
  intlLocale: string,
  tAdd: (key: string, values?: Record<string, string | number>) => string,
) {
  // Kartu kredit/paylater dipakai sebagai sumber dana: yang relevan adalah sisa limit
  if (isCreditWallet(wallet.type)) {
    return tAdd("remainingLimit", {
      amount: formatCurrency(remainingCredit(wallet), intlLocale),
    });
  }
  const amount = isDebtWallet(wallet.type)
    ? wallet.outstanding ?? Math.abs(wallet.balance)
    : wallet.balance;
  return formatCurrency(amount, intlLocale);
}

export interface AddTransactionData {
  description: string;
  amount: number;
  type: TxType;
  date: string;
  walletId?: string;
  toWalletId?: string;
  categoryId?: string;
  billingMode?: "FULL" | "INSTALLMENT";
  firstDueDate?: string;
  isInstallment?: boolean;
  installmentMonths?: number;
  interestRate?: number;
}

interface AddTransactionModalProps {
  isOpen: boolean;
  isCreating: boolean;
  wallets: Wallet[];
  /** Tab awal saat modal dibuka (mis. aksi cepat "Transfer" di dashboard). */
  initialType?: TxType;
  onClose: () => void;
  onSubmit: (data: AddTransactionData) => Promise<void>;
}

function WalletSelectionList({
  wallets,
  selected,
  emptyLabel,
  isDisabled,
  disabledTitle,
  onSelect,
}: {
  wallets: Wallet[];
  selected: string;
  emptyLabel: string;
  isDisabled?: (wallet: Wallet) => boolean;
  disabledTitle?: string;
  onSelect: (id: string) => void;
}) {
  const t = useTranslations("transactionModals.add");
  const tKind = useTranslations("walletKind");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];
  const resolvedDisabledTitle = disabledTitle ?? t("insufficientBalance");

  if (wallets.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface-low p-4 text-sm text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {wallets.map((wallet) => {
        const active = selected === wallet.id;
        const disabled = isDisabled?.(wallet) ?? false;
        const Icon = getWalletIcon(wallet);
        const isDebt = isDebtWallet(wallet.type);

        return (
          <button
            key={wallet.id}
            type="button"
            disabled={disabled}
            title={disabled ? resolvedDisabledTitle : undefined}
            onClick={() => onSelect(active ? "" : wallet.id)}
            className={`group flex min-h-[76px] items-center gap-3 rounded-xl border p-3 text-left transition-all disabled:cursor-not-allowed disabled:opacity-45 ${
              active
                ? "border-mint bg-mint/10 shadow-sm"
                : "border-border/70 bg-card hover:border-primary/30 hover:bg-surface-low"
            }`}
          >
            <span
              className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                isDebt ? "bg-coral/10 text-coral" : "bg-surface-high text-primary"
              }`}
            >
              <Icon className="size-5 transition-transform group-hover:scale-105" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-foreground">
                {wallet.name}
              </span>
              <span className="mt-1 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>{getWalletKind(wallet, tKind)}</span>
                <span className="tabular-nums">{formatWalletAmount(wallet, intlLocale, t)}</span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function AddTransactionModal({
  isOpen,
  isCreating,
  wallets,
  initialType,
  onClose,
  onSubmit,
}: AddTransactionModalProps) {
  const t = useTranslations("transactionModals.add");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const intlLocale = INTL_LOCALE[locale as keyof typeof INTL_LOCALE];

  const TYPE_OPTIONS = [
    {
      type: "EXPENSE" as Tab,
      label: t("typeExpense"),
      Icon: ArrowDownLeft,
      activeClass: "bg-coral text-white shadow-sm",
      iconClass: "text-coral",
    },
    {
      type: "INCOME" as Tab,
      label: t("typeIncome"),
      Icon: ArrowUpRight,
      activeClass: "bg-mint text-primary shadow-sm",
      iconClass: "text-mint",
    },
    {
      type: "TRANSFER" as Tab,
      label: t("typeTransfer"),
      Icon: ArrowLeftRight,
      activeClass: "bg-primary text-primary-foreground shadow-sm",
      iconClass: "text-primary",
    },
  ];

  const [amount, setAmount] = useState("");
  const [type, setType] = useState<Tab>(initialType ?? "EXPENSE");
  const [walletId, setWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(todayStr);
  const [isInstallment, setIsInstallment] = useState(false);
  const [installmentMonths, setInstallmentMonths] = useState(3);
  const [interestRateOverride, setInterestRateOverride] = useState<
    string | null
  >(null);
  const [adminFeeOverride, setAdminFeeOverride] = useState<string | null>(null);
  const [firstDueDate, setFirstDueDate] = useState("");
  const [rememberMerchant, setRememberMerchant] = useState(false);
  const [error, setError] = useState("");

  const router = useRouter();
  const { data: categories = [] } = useCategories();
  const { data: paylaterRates } = usePaylaterRates();
  const createMerchantMapping = useCreateMerchantMapping();

  const isTransfer = type === "TRANSFER";

  // Category suggestions — fetched when description changes
  const [dismissedDesc, setDismissedDesc] = useState("");
  const suggestionDesc = dismissedDesc === description.trim() ? "" : description;
  const { data: suggestions = [], isLoading: suggestionsLoading } =
    useCategorySuggestions(suggestionDesc, isTransfer ? "EXPENSE" : type);

  const handleSelectSuggestion = useCallback(
    (suggestion: { categoryId: string }) => {
      setCategoryId(suggestion.categoryId);
      setDismissedDesc(description.trim());
    },
    [description],
  );

  const transferWallets = useMemo(() => getTransferWallets(wallets), [wallets]);
  const hasNoWallets =
    type === "TRANSFER" ? transferWallets.length === 0 : wallets.length === 0;
  const selectedWallet = wallets.find((wallet) => wallet.id === walletId);
  const installmentDefaults = getInstallmentDefaults(
    selectedWallet,
    paylaterRates,
  );
  const interestRate = interestRateOverride ?? installmentDefaults.interestRate;
  const adminFee = adminFeeOverride ?? installmentDefaults.adminFee;
  const parsedAmount = Number(amount.replace(/\./g, "")) || 0;
  const activeType = TYPE_OPTIONS.find((option) => option.type === type)!;
  const ActiveIcon = activeType.Icon;

  const handleAmountChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setAmount(formatRupiah(event.target.value.replace(/\D/g, "")));
    },
    [],
  );

  const handleTypeChange = useCallback((nextType: Tab) => {
    setType(nextType);
    setWalletId("");
    setToWalletId("");
    setCategoryId("");
    setDismissedDesc("");
    setIsInstallment(false);
    setInstallmentMonths(3);
    setInterestRateOverride(null);
    setAdminFeeOverride(null);
    setFirstDueDate("");
    setRememberMerchant(false);
    setError("");
  }, []);

  const handleSourceSelect = useCallback(
    (nextId: string) => {
      const next = selectTransferEndpoint(walletId, toWalletId, nextId);
      setWalletId(next.selectedId);
      setToWalletId(next.oppositeId);
      setError("");
    },
    [walletId, toWalletId],
  );

  const handleDestinationSelect = useCallback(
    (nextId: string) => {
      const next = selectTransferEndpoint(toWalletId, walletId, nextId);
      setToWalletId(next.selectedId);
      setWalletId(next.oppositeId);
      setError("");
    },
    [toWalletId, walletId],
  );

  const handleSwapWallets = useCallback(() => {
    const destination = wallets.find((wallet) => wallet.id === toWalletId);
    if (!destination || !ASSET_WALLET_TYPES.includes(destination.type)) return;
    const next = swapTransferEndpoints(walletId, toWalletId);
    setWalletId(next.selectedId);
    setToWalletId(next.oppositeId);
    setError("");
  }, [walletId, toWalletId, wallets]);

  const handleClose = useCallback(() => {
    if (!isCreating) onClose();
  }, [isCreating, onClose]);

  const handleAddWallet = useCallback(() => {
    onClose();
    router.push("/wallets");
  }, [onClose, router]);

  const cats = categories.filter((category) => category.type === type);

  const sourceWallets = useMemo(() => {
    if (type === "INCOME") {
      return wallets.filter((wallet) => ASSET_WALLET_TYPES.includes(wallet.type));
    }
    if (type === "TRANSFER") {
      return getTransferSources(wallets);
    }
    return wallets.filter((wallet) => wallet.type !== "LOAN");
  }, [type, wallets]);

  const sourcePickerWallets = getTransferEndpointWallets(
    transferWallets,
    toWalletId,
  );
  const destinationPickerWallets = getTransferEndpointWallets(
    getTransferDestinations(wallets, walletId),
    walletId,
  );

  const rateNum = Number(interestRate.replace(",", ".")) || 0;
  const adminFeeNum = Number(adminFee.replace(",", ".")) || 0;
  const totalInterest = Math.round(
    parsedAmount * (rateNum / 100) * installmentMonths,
  );
  const monthlyEst = Math.round(
    (parsedAmount + totalInterest) / installmentMonths,
  );
  const adminRp = Math.round(parsedAmount * (adminFeeNum / 100));
  const matchedPreset =
    isInstallment && selectedWallet
      ? paylaterRates?.find((preset) =>
          selectedWallet.name.toLowerCase().includes(preset.match),
        )
      : undefined;
  const isCreditPurchase =
    type === "EXPENSE" && !!selectedWallet && isCreditWallet(selectedWallet.type);
  const hasBillingCycle =
    !!selectedWallet?.cutoffDay && !!selectedWallet?.paymentDueDay;
  // Paylater tanpa cutoff: jatuh tempo otomatis 30 hari setelah tanggal transaksi
  const isPaylaterAutoDue =
    isCreditPurchase && selectedWallet?.type === "PAYLATER" && !hasBillingCycle;
  const paylaterDueDate = isPaylaterAutoDue
    ? addDays(date, PAYLATER_DUE_DAYS)
    : "";
  const needsManualDueDate =
    isCreditPurchase &&
    selectedWallet?.type === "CREDIT_CARD" &&
    !hasBillingCycle;

  const lacksFunds = (wallet: Wallet) =>
    type !== "INCOME" &&
    parsedAmount > 0 &&
    spendable(wallet) <
      (isInstallment && isCreditWallet(wallet.type)
        ? parsedAmount + totalInterest
        : parsedAmount);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    if (parsedAmount <= 0) return;

    const srcWallet = wallets.find((wallet) => wallet.id === walletId);
    const isTransfer = type === "TRANSFER";
    const asCreditExpense =
      type === "EXPENSE" && !!srcWallet && isCreditWallet(srcWallet.type);
    const asInstallment = isInstallment && asCreditExpense;

    if (!isTransfer && !categoryId) {
      setError(t("errors.chooseCategory"));
      return;
    }

    if (asCreditExpense && needsManualDueDate && !firstDueDate) {
      setError(t("errors.fillFirstDueDate"));
      return;
    }

    if (isTransfer && !isValidTransferPair(walletId, toWalletId)) {
      setError(t("errors.differentWallets"));
      return;
    }

    if (isTransfer && srcWallet && !ASSET_WALLET_TYPES.includes(srcWallet.type)) {
      setError(t("errors.transferFromCreditNotAllowed"));
      return;
    }

    if (type === "INCOME" && srcWallet && isDebtWallet(srcWallet.type)) {
      setError(t("errors.incomeToDebtNotAllowed"));
      return;
    }

    if (srcWallet && type !== "INCOME") {
      const requiredAmount = asInstallment
        ? parsedAmount + totalInterest
        : parsedAmount;

      if (spendable(srcWallet) < requiredAmount) {
        setError(t("errors.insufficientBalance", { name: srcWallet.name }));
        return;
      }
    }

    try {
      await onSubmit({
        description: description.trim(),
        amount: parsedAmount,
        type,
        date: new Date(date).toISOString(),
        walletId: walletId || undefined,
        toWalletId: isTransfer ? toWalletId || undefined : undefined,
        categoryId: isTransfer ? undefined : categoryId,
        billingMode: asCreditExpense
          ? asInstallment
            ? "INSTALLMENT"
            : "FULL"
          : undefined,
        firstDueDate: isPaylaterAutoDue
          ? paylaterDueDate
          : asCreditExpense && needsManualDueDate
          ? firstDueDate
          : undefined,
        isInstallment: asInstallment || undefined,
        installmentMonths: asInstallment ? installmentMonths : undefined,
        interestRate: asInstallment ? rateNum : undefined,
      });
    } catch (err) {
      const message = (err as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      setError(message ?? t("errors.genericSaveFailed"));
      return;
    }

    toast(
      type === "TRANSFER"
        ? t("toastTransferSuccess")
        : type === "INCOME"
        ? t("toastIncomeSuccess")
        : t("toastExpenseSuccess"),
    );

    // Explicit opt-in only (PD-010/Phase 19) — never saved automatically.
    if (rememberMerchant && !isTransfer && categoryId && description.trim()) {
      try {
        await createMerchantMapping.mutateAsync({
          merchantName: description.trim(),
          categoryId,
        });
      } catch (caught) {
        const message = (caught as { response?: { data?: { error?: { message?: string } } } })
          ?.response?.data?.error?.message;
        toast(message ?? t("errors.rememberMerchantFailed"), "error");
      }
    }

    setAmount("");
    setType(initialType ?? "EXPENSE");
    setWalletId("");
    setToWalletId("");
    setCategoryId("");
    setDescription("");
    setDate(todayStr());
    setIsInstallment(false);
    setInstallmentMonths(3);
    setInterestRateOverride(null);
    setAdminFeeOverride(null);
    setFirstDueDate("");
    setRememberMerchant(false);
  };

  return (
    <AppModal
      open={isOpen}
      onOpenChange={(open) => { if (!open) handleClose(); }}
      isPending={isCreating}
      size="lg"
      title={t("title")}
      description={t("subtitle")}
      footer={
        <>
          <ModalCancelButton isPending={isCreating} onClick={handleClose}>
            {tCommon("actions.cancel")}
          </ModalCancelButton>
          <ModalSubmitButton
            form="add-transaction-form"
            isPending={isCreating}
            pendingLabel={t("saving")}
            disabled={
              hasNoWallets ||
              (type === "TRANSFER" && destinationPickerWallets.length === 0)
            }
          >
            <ActiveIcon className="size-4" />
            {t("submit")}
          </ModalSubmitButton>
        </>
      }
    >
      <form id="add-transaction-form" onSubmit={handleSubmit} className="space-y-6">
        <nav
                  aria-label={t("typeNavAria")}
                  className="grid grid-cols-3 rounded-lg bg-surface-high p-1"
                >
                  {TYPE_OPTIONS.map(({ type: optionType, label, Icon, activeClass }) => {
                    const active = type === optionType;
                    return (
                      <button
                        key={optionType}
                        type="button"
                        aria-pressed={active}
                        onClick={() => handleTypeChange(optionType)}
                        className={`flex min-h-10 items-center justify-center gap-2 rounded-md px-3 text-xs font-bold uppercase tracking-[0.08em] transition-all ${
                          active
                            ? activeClass
                            : "text-muted-foreground hover:bg-card hover:text-foreground"
                        }`}
                      >
                        <Icon className="size-4" />
                        {label}
                      </button>
                    );
                  })}
                </nav>

                <section className="space-y-2">
                  <FieldLabel>{t("amount")}</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                      Rp
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="0"
                      value={amount}
                      onChange={handleAmountChange}
                      required
                      className={`w-full rounded-xl border border-border/70 bg-card py-4 pl-16 pr-4 text-[32px] font-semibold tabular-nums tracking-[-0.02em] outline-none transition-all placeholder:text-border focus:border-primary focus:ring-2 focus:ring-primary/15 md:text-[40px] ${activeType.iconClass}`}
                    />
                  </div>
                </section>

                <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className={`space-y-2 ${cats.length > 0 ? "" : "md:col-span-2"}`}>
                    <FieldLabel>{t("date")}</FieldLabel>
                    <div className="relative">
                      <CalendarDays className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        type="date"
                        value={date}
                        onChange={(event) => setDate(event.target.value)}
                        required
                        className="h-12 w-full rounded-xl border border-border/70 bg-card pl-10 pr-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                    </div>
                  </div>

                  {cats.length > 0 && (
                    <div className="space-y-2">
                      <FieldLabel htmlFor="add-transaction-category">{t("category")}</FieldLabel>
                      <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? "")} items={Object.fromEntries(cats.map((c) => [c.id, c.name]))}>
                        <SelectTrigger id="add-transaction-category" aria-label={t("chooseCategoryAria")}>
                          <SelectValue placeholder={t("chooseCategory")} />
                        </SelectTrigger>
                        <SelectContent>
                          {cats.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </section>

                {hasNoWallets && type === "TRANSFER" ? (
                  <section className="rounded-xl border border-dashed border-border bg-surface-low p-6 text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <WalletIcon className="size-6" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      {t("noWalletsForTransferTitle")}
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      {t("noWalletsForTransferBody")}
                    </p>
                    <Button
                      type="button"
                      onClick={handleAddWallet}
                      className="mt-4 h-10 gap-2 px-4"
                    >
                      <Plus className="size-4" />
                      {t("addWallet")}
                    </Button>
                  </section>
                ) : hasNoWallets ? (
                  <section className="rounded-xl border border-dashed border-border bg-surface-low p-6 text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <WalletIcon className="size-6" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground">
                      {t("noWalletsTitle")}
                    </h3>
                    <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
                      {t("noWalletsBody")}
                    </p>
                    <Button
                      type="button"
                      onClick={handleAddWallet}
                      className="mt-4 h-10 gap-2 px-4"
                    >
                      <Plus className="size-4" />
                      {t("addWallet")}
                    </Button>
                  </section>
                ) : type === "TRANSFER" ? (
                  <section className="grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-end md:gap-3">
                    <AccountPicker
                      id="transfer-source"
                      label={t("sourceWallet")}
                      wallets={sourcePickerWallets}
                      selectedId={walletId}
                      emptyLabel={
                        sourcePickerWallets.length === 0
                          ? t("noOtherSourceWallet")
                          : t("chooseSourceWallet")
                      }
                      disabledReason={t("insufficientBalance")}
                      isDisabled={lacksFunds}
                      onSelect={handleSourceSelect}
                    />
                    <div className="flex justify-center md:mb-2">
                      <button
                        type="button"
                        aria-label={t("swapWalletsAria")}
                        onClick={handleSwapWallets}
                        disabled={!ASSET_WALLET_TYPES.includes(
                          wallets.find((wallet) => wallet.id === toWalletId)?.type ?? "LOAN",
                        )}
                        className="flex size-10 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground shadow-sm transition-colors hover:bg-surface-low hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        <ArrowLeftRight className="size-4" />
                      </button>
                    </div>
                    <AccountPicker
                      id="transfer-destination"
                      label={t("destinationWallet")}
                      wallets={destinationPickerWallets}
                      selectedId={toWalletId}
                      emptyLabel={
                        destinationPickerWallets.length === 0
                          ? t("noOtherDestinationWallet")
                          : t("chooseDestinationWallet")
                      }
                      onSelect={handleDestinationSelect}
                    />
                  </section>
                ) : (
                  <section className="space-y-2">
                    <FieldLabel>{t("chooseWallet")}</FieldLabel>
                    <WalletSelectionList
                      wallets={sourceWallets}
                      selected={walletId}
                      emptyLabel={t("noWalletsAvailable")}
                      isDisabled={lacksFunds}
                      onSelect={(id) => {
                        setWalletId(id);
                        setInterestRateOverride(null);
                        setAdminFeeOverride(null);
                        setFirstDueDate("");
                      }}
                    />
                  </section>
                )}

                <FormField label={t("description")} htmlFor="add-tx-description">
                  <Input
                    type="text"
                    placeholder={t("descriptionPlaceholder")}
                    value={description}
                    onChange={(event) => setDescription(event.target.value)}
                    className="h-12 border-border/70 bg-card px-3 text-sm"
                  />
                  {!isTransfer && (
                    <CategorySuggestionList
                      suggestions={suggestions}
                      isLoading={suggestionsLoading}
                      hasDescription={description.trim().length >= 3}
                      onSelect={handleSelectSuggestion}
                    />
                  )}
                </FormField>

                {!isTransfer && description.trim().length > 0 && categoryId && (
                  <label
                    htmlFor="add-tx-remember-merchant"
                    className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border/60 bg-surface-low px-3 py-2.5 text-sm text-foreground"
                  >
                    <input
                      id="add-tx-remember-merchant"
                      type="checkbox"
                      checked={rememberMerchant}
                      onChange={(event) => setRememberMerchant(event.target.checked)}
                      className="mt-0.5 size-4 shrink-0 rounded border-border/70 text-primary focus-visible:ring-2 focus-visible:ring-primary/40"
                    />
                    <span>
                      {t("rememberMerchant")}
                      <span className="block text-xs text-muted-foreground">
                        {t("rememberMerchantDescription")}
                      </span>
                    </span>
                  </label>
                )}

                {type === "EXPENSE" &&
                  selectedWallet &&
                  isCreditWallet(selectedWallet.type) && (
                    <section className="rounded-xl border border-border/60 bg-surface-low p-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <RefreshCw className="size-5" />
                          </span>
                          <div>
                            <h3 className="text-sm font-semibold text-foreground">
                              {t("billingMethod")}
                            </h3>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {t("remainingLimit", {
                                amount: formatCurrency(
                                  remainingCredit(selectedWallet),
                                  intlLocale,
                                ),
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { value: false, label: t("payFull") },
                            { value: true, label: t("payInstallment") },
                          ].map((mode) => (
                            <button
                              key={mode.label}
                              type="button"
                              aria-pressed={isInstallment === mode.value}
                              onClick={() => {
                                setIsInstallment(mode.value);
                                setInterestRateOverride(null);
                                setAdminFeeOverride(null);
                              }}
                              className={`h-10 rounded-lg border text-sm font-semibold transition-colors ${
                                isInstallment === mode.value
                                  ? "border-mint bg-mint/10 text-primary"
                                  : "border-border bg-card text-muted-foreground hover:bg-surface-high"
                              }`}
                            >
                              {mode.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {isInstallment && (
                        <div className="mt-4 space-y-4 border-t border-border/60 pt-4">
                          <div className="space-y-2">
                            <FieldLabel>{t("tenor")}</FieldLabel>
                            <div className="grid grid-cols-3 gap-2">
                              {TENORS.map((months) => {
                                const active = installmentMonths === months;
                                return (
                                  <button
                                    key={months}
                                    type="button"
                                    onClick={() => setInstallmentMonths(months)}
                                    className={`h-10 rounded-lg border text-sm font-semibold transition-colors ${
                                      active
                                        ? "border-mint bg-mint/10 text-primary"
                                        : "border-border bg-card text-muted-foreground hover:bg-surface-high"
                                    }`}
                                  >
                                    {months} {t("months")}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            <FormField label={t("interestPerMonth")} htmlFor="add-tx-interest-rate">
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                value={interestRate}
                                onChange={(event) =>
                                  setInterestRateOverride(
                                    event.target.value.replace(/[^\d.,]/g, ""),
                                  )
                                }
                                className="h-12 border-border/70 bg-card"
                              />
                            </FormField>
                            <FormField label={t("adminFeePercent")} htmlFor="add-tx-admin-fee">
                              <Input
                                type="text"
                                inputMode="decimal"
                                placeholder="0"
                                value={adminFee}
                                onChange={(event) =>
                                  setAdminFeeOverride(
                                    event.target.value.replace(/[^\d.,]/g, ""),
                                  )
                                }
                                className="h-12 border-border/70 bg-card"
                              />
                            </FormField>
                          </div>

                          {matchedPreset && (
                            <p className="text-xs text-muted-foreground">
                              {t("presetNote", { name: selectedWallet.name })}
                            </p>
                          )}

                          {parsedAmount > 0 && (
                            <p className="rounded-lg bg-card px-3 py-2 text-xs text-muted-foreground">
                              {t("estimate")}{" "}
                              <strong className="tabular-nums text-primary">
                                {formatCurrency(monthlyEst, intlLocale)}
                                {t("perMonth")}
                              </strong>{" "}
                              × {installmentMonths} {t("months")}
                              {adminRp > 0 && (
                                <>
                                  {" "}
                                  + {formatCurrency(adminRp, intlLocale)}{" "}
                                  {t("adminOneTime")}
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      )}

                      {isPaylaterAutoDue ? (
                        <div className="mt-4 border-t border-border/60 pt-4">
                          <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <CalendarDays className="size-4 shrink-0" />
                            <span>
                              {t("autoDueDate")}{" "}
                              <strong className="font-semibold text-foreground">
                                {formatDateId(paylaterDueDate, intlLocale)}
                              </strong>{" "}
                              — {t("autoDueDateNote", { days: PAYLATER_DUE_DAYS })}
                            </span>
                          </p>
                        </div>
                      ) : needsManualDueDate ? (
                        <div className="mt-4 border-t border-border/60 pt-4">
                          <FormField
                            label={t("firstDueDate")}
                            htmlFor="add-tx-first-due-date"
                            description={t("firstDueDateRequired")}
                          >
                            <Input
                              type="date"
                              value={firstDueDate}
                              onChange={(event) => setFirstDueDate(event.target.value)}
                              min={date}
                              required
                              className="h-12 border-border/70 bg-card"
                            />
                          </FormField>
                        </div>
                      ) : null}
                    </section>
                  )}

        <FormErrorMessage message={error} />
      </form>
    </AppModal>
  );
}
