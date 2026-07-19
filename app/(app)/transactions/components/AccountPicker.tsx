"use client";

import {
  Banknote,
  Check,
  ChevronDown,
  CreditCard,
  Smartphone,
  Wallet as WalletIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isDebtWallet, type Wallet } from "@/src/types/wallet";

import { formatRupiah } from "./constants";

export interface AccountPickerProps {
  id: string;
  label: string;
  wallets: Wallet[];
  selectedId: string;
  emptyLabel: string;
  disabledReason?: string;
  isDisabled?: (wallet: Wallet) => boolean;
  onSelect: (id: string) => void;
}

function getWalletKind(wallet: Wallet, tKind: (key: string) => string) {
  if (wallet.type === "BANK") return tKind("bank");
  if (wallet.type === "E_WALLET") return tKind("eWallet");
  if (wallet.type === "CASH") return tKind("cash");
  if (wallet.type === "CREDIT_CARD") return tKind("creditCard");
  if (wallet.type === "PAYLATER") return tKind("paylater");
  return tKind("loan");
}

function formatWalletAmount(wallet: Wallet) {
  const amount = isDebtWallet(wallet.type)
    ? wallet.outstanding ?? Math.abs(wallet.balance)
    : wallet.balance;
  return `Rp ${formatRupiah(String(amount))}`;
}

function WalletTypeIcon({ wallet }: { wallet: Wallet }) {
  if (wallet.type === "BANK") {
    return <Banknote className="size-4" aria-hidden="true" />;
  }

  if (wallet.type === "E_WALLET") {
    return <Smartphone className="size-4" aria-hidden="true" />;
  }

  if (isDebtWallet(wallet.type)) {
    return <CreditCard className="size-4" aria-hidden="true" />;
  }

  return <WalletIcon className="size-4" aria-hidden="true" />;
}

export function AccountPicker({
  id,
  label,
  wallets,
  selectedId,
  emptyLabel,
  disabledReason,
  isDisabled,
  onSelect,
}: AccountPickerProps) {
  const t = useTranslations("transactionModals.accountPicker");
  const tKind = useTranslations("walletKind");
  const resolvedDisabledReason = disabledReason ?? t("insufficientBalance");
  const selectedWallet = wallets.find((wallet) => wallet.id === selectedId);
  const labelId = `${id}-label`;
  const valueId = `${id}-value`;

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <label
        id={labelId}
        htmlFor={id}
        className="text-[12px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"
      >
        {label}
      </label>

      <DropdownMenu>
        <DropdownMenuTrigger
          id={id}
          type="button"
          aria-labelledby={`${labelId} ${valueId}`}
          aria-haspopup="menu"
          className="grid min-h-14 w-full grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl border border-border/70 bg-card px-3 py-2 text-left outline-none hover:bg-surface-low focus:border-primary focus:ring-2 focus:ring-primary/15"
        >
          {selectedWallet ? (
            <>
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-surface-high text-primary">
                <WalletTypeIcon wallet={selectedWallet} />
              </span>
              <span id={valueId} className="min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {selectedWallet.name}
                </span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {getWalletKind(selectedWallet, tKind)}
                </span>
              </span>
              <span className="text-right text-sm font-medium tabular-nums text-foreground">
                {formatWalletAmount(selectedWallet)}
              </span>
            </>
          ) : (
            <span
              id={valueId}
              className="col-span-3 text-sm text-muted-foreground"
            >
              {emptyLabel}
            </span>
          )}
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="start"
          side="bottom"
          sideOffset={6}
          className="flex max-h-[var(--available-height)] w-[var(--anchor-width)] max-w-[calc(100vw-2rem)] flex-col overflow-y-auto data-closed:animate-none data-open:animate-none"
        >
          {wallets.length === 0 ? (
            <div className="flex min-h-11 items-center px-3 py-2 text-sm text-muted-foreground">
              {t("noWalletsAvailable")}
            </div>
          ) : (
            wallets.map((wallet) => {
              const selected = wallet.id === selectedId;
              const disabled = isDisabled?.(wallet) ?? false;

              return (
                <DropdownMenuItem
                  key={wallet.id}
                  role="menuitemradio"
                  aria-checked={selected}
                  disabled={disabled}
                  onClick={() => onSelect(wallet.id)}
                  className={cn(
                    "grid min-h-11 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-3 border border-transparent px-3 py-2 data-disabled:opacity-70",
                    selected && "border-border/60 bg-surface-low",
                  )}
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-high text-muted-foreground">
                    <WalletTypeIcon wallet={wallet} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-foreground">
                      {wallet.name}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {getWalletKind(wallet, tKind)}
                      {disabled ? ` · ${resolvedDisabledReason}` : ""}
                    </span>
                  </span>
                  <span className="text-right text-sm font-medium tabular-nums text-foreground">
                    {formatWalletAmount(wallet)}
                  </span>
                  <span className="flex size-4 shrink-0 items-center justify-center text-primary">
                    {selected ? <Check aria-hidden="true" /> : null}
                  </span>
                </DropdownMenuItem>
              );
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
