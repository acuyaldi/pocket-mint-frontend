"use client";

import { useMemo, useState } from "react";
import {
  Banknote,
  ChevronDown,
  CreditCard,
  Landmark,
  MoreVertical,
  Pencil,
  Plus,
  Search,
  Smartphone,
  Trash2,
  Wallet as WalletIcon,
} from "lucide-react";
import CreateWalletModal, {
  type CreateWalletFormData,
} from "./components/CreateWalletModal";
import DeleteWalletModal from "./components/DeleteWalletModal";
import EditWalletModal from "./components/EditWalletModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PageHeader } from "@/components/layout/page-header";
import { toast } from "@/components/ui/toaster";
import {
  useCreateWallet,
  useDeleteWallet,
  useWallets,
} from "@/src/features/wallets/hooks/useWallets";
import {
  isCreditWallet,
  isLiabilityWallet,
  type Wallet,
} from "@/src/types/wallet";
import { formatCurrency } from "@/lib/utils";

type FilterKey = "all" | "bank" | "ewallet" | "credit" | "paylater" | "loan";

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "bank", label: "Kas & Bank" },
  { key: "ewallet", label: "E-Wallet" },
  { key: "credit", label: "Kartu Kredit" },
  { key: "paylater", label: "Paylater" },
  { key: "loan", label: "Pinjaman" },
];

function walletMatchesFilter(wallet: Wallet, filter: FilterKey) {
  if (filter === "bank") return wallet.type === "BANK" || wallet.type === "CASH";
  if (filter === "ewallet") return wallet.type === "E_WALLET";
  if (filter === "credit") return wallet.type === "CREDIT_CARD";
  if (filter === "paylater") return wallet.type === "PAYLATER";
  if (filter === "loan") return wallet.type === "LOAN";
  return true;
}

function SectionIcon({ type }: { type: FilterKey }) {
  if (type === "bank") return <Landmark className="size-5 text-primary" />;
  if (type === "ewallet") return <Smartphone className="size-5 text-primary" />;
  if (type === "credit" || type === "paylater") return <CreditCard className="size-5 text-coral" />;
  return <Banknote className="size-5 text-primary" />;
}

function WalletTile({
  wallet,
  onEdit,
  onDelete,
}: {
  wallet: Wallet;
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
}) {
  const isDebt = isLiabilityWallet(wallet.type);
  const isCredit = isCreditWallet(wallet.type);
  const balance = isDebt ? wallet.outstanding ?? Math.abs(wallet.balance) : wallet.balance;
  const limit = wallet.creditLimit ?? 0;
  const remaining = wallet.remainingCredit ?? Math.max(limit - balance, 0);
  const utilization = isCredit && limit > 0 ? Math.min(100, Math.round((balance / limit) * 100)) : 0;

  return (
    <article
      className={`relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 shadow-sm transition-all duration-300 hover:scale-[1.01] hover:shadow-md ${
        isDebt ? "hover:border-coral/40" : "hover:border-mint/40"
      }`}
    >
      <div className={`absolute left-0 top-0 h-1 w-full ${isDebt ? "bg-coral/40" : "bg-mint/40"}`} />
      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <WalletIcon className={`size-5 ${isDebt ? "text-coral" : "text-mint"}`} />
          <span className="text-xs text-muted-foreground">{wallet.currency}</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Menu akun ${wallet.name}`}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-surface-high hover:text-foreground"
          >
            <MoreVertical className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onEdit(wallet)}>
              <Pencil />
              Edit Akun
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(wallet)}
              className="text-coral data-highlighted:bg-coral/10"
            >
              <Trash2 />
              Hapus Akun
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <p className="mb-1 text-sm text-muted-foreground">{wallet.name}</p>
      {isCredit ? (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Tagihan
          </p>
          <p
            className={`text-xl font-bold tabular-nums ${
              balance > 0 ? "text-coral" : "text-foreground"
            }`}
          >
            {formatCurrency(balance)}
          </p>
          <div className="mt-4 space-y-2">
            <div className="h-2 overflow-hidden rounded-full bg-surface-high">
              <div className="h-full rounded-full bg-coral" style={{ width: `${utilization}%` }} />
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Sisa limit</span>
              <span className="font-semibold tabular-nums text-foreground">
                {formatCurrency(remaining)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Utilisasi dari limit {formatCurrency(limit)}</span>
              <span className="font-semibold tabular-nums">{utilization}%</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <p className={`text-xl font-bold tabular-nums ${isDebt ? "text-coral" : "text-foreground"}`}>
            {formatCurrency(balance)}
          </p>
          {isDebt ? (
            <p className="mt-1 text-xs text-coral">Sisa kewajiban</p>
          ) : (
            <p className="mt-1 text-xs text-mint">Aset aktif</p>
          )}
        </>
      )}
    </article>
  );
}

function WalletSection({
  title,
  kind,
  wallets,
  badge,
  onEdit,
  onDelete,
}: {
  title: string;
  kind: FilterKey;
  wallets: Wallet[];
  badge: "Aset" | "Liabilitas";
  onEdit: (wallet: Wallet) => void;
  onDelete: (wallet: Wallet) => void;
}) {
  if (wallets.length === 0) return null;

  return (
    <section>
      <details className="group" open>
        <summary className="mb-6 flex cursor-pointer list-none items-center justify-between border-b border-border/40 pb-3 transition-opacity hover:opacity-80">
          <div className="flex items-center gap-3">
            <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
              <SectionIcon type={kind} />
              {title} ({wallets.length})
            </h2>
            <span
              className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${
                badge === "Aset" ? "bg-mint/10 text-mint" : "bg-coral/10 text-coral"
              }`}
            >
              {badge}
            </span>
          </div>
          <ChevronDown className="size-5 text-muted-foreground transition-transform group-open:rotate-180" />
        </summary>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {wallets.map((wallet) => (
            <WalletTile key={wallet.id} wallet={wallet} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      </details>
    </section>
  );
}

export default function WalletsPage() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [search, setSearch] = useState("");
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);
  const { data: wallets } = useWallets();
  const createWallet = useCreateWallet();
  const deleteWallet = useDeleteWallet();

  const visibleWallets = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (wallets ?? [])
      .filter((wallet) => !wallet.isArchived)
      .filter((wallet) => walletMatchesFilter(wallet, filter))
      .filter((wallet) => !query || wallet.name.toLowerCase().includes(query));
  }, [wallets, filter, search]);

  const bankWallets = visibleWallets.filter((wallet) => wallet.type === "BANK" || wallet.type === "CASH");
  const ewallets = visibleWallets.filter((wallet) => wallet.type === "E_WALLET");
  const creditWallets = visibleWallets.filter((wallet) => wallet.type === "CREDIT_CARD");
  const paylaterWallets = visibleWallets.filter((wallet) => wallet.type === "PAYLATER");
  const loanWallets = visibleWallets.filter((wallet) => wallet.type === "LOAN");

  const handleWalletCreateSuccess = async (data: CreateWalletFormData) => {
    try {
      await createWallet.mutateAsync({
        name: data.name,
        type: data.type,
        balance: data.balance,
        principal: data.principal,
        creditLimit: data.creditLimit,
        cutoffDay: data.cutoffDay,
        paymentDueDay: data.paymentDueDay,
        interestRate: data.interestRate,
        adminFee: data.adminFee,
        ...(data.adminFee !== undefined && { adminFeeType: "PERCENT" as const }),
        icon: data.icon,
      });
      toast(`Akun "${data.name}" ditambahkan`);
    } catch (error) {
      console.error("Failed to create wallet:", error);
      toast("Akun gagal ditambahkan. Coba lagi.", "error");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingWallet) return;
    try {
      await deleteWallet.mutateAsync(deletingWallet.id);
      toast(`Akun "${deletingWallet.name}" dihapus`);
      setDeletingWallet(null);
    } catch (caught) {
      const message = (caught as { response?: { data?: { error?: { message?: string } } } })
        ?.response?.data?.error?.message;
      toast(message ?? "Akun gagal dihapus. Coba lagi.", "error");
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader title="Dompet" description="Kelola seluruh akun finansial Anda" />

      <div className="sticky top-16 z-10 -mx-1 bg-background/95 px-1 py-3 backdrop-blur-md">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-4 text-sm outline-none transition-all placeholder:text-muted-foreground/55 focus:ring-1 focus:ring-primary/40"
                placeholder="Cari dompet atau akun..."
                type="text"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsCustomModalOpen(true)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95"
            >
              <Plus className="size-4" />
              Tambah Akun
            </button>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  filter === item.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-high text-muted-foreground hover:bg-border/40"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-8">
        <WalletSection title="Kas & Bank" kind="bank" wallets={bankWallets} badge="Aset" onEdit={setEditingWallet} onDelete={setDeletingWallet} />
        <WalletSection title="E-Wallet" kind="ewallet" wallets={ewallets} badge="Aset" onEdit={setEditingWallet} onDelete={setDeletingWallet} />
        <WalletSection title="Kartu Kredit" kind="credit" wallets={creditWallets} badge="Liabilitas" onEdit={setEditingWallet} onDelete={setDeletingWallet} />
        <WalletSection title="Paylater" kind="paylater" wallets={paylaterWallets} badge="Liabilitas" onEdit={setEditingWallet} onDelete={setDeletingWallet} />
        <WalletSection title="Pinjaman" kind="loan" wallets={loanWallets} badge="Liabilitas" onEdit={setEditingWallet} onDelete={setDeletingWallet} />
        {visibleWallets.length === 0 ? (
          <button
            type="button"
            onClick={() => setIsCustomModalOpen(true)}
            className="flex min-h-40 w-full items-center justify-center rounded-xl border-2 border-dashed border-border bg-card text-sm font-semibold text-primary"
          >
            <Plus className="mr-2 size-4" />
            Tambah akun pertama
          </button>
        ) : null}
      </div>

      <CreateWalletModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSuccess={handleWalletCreateSuccess}
      />
      <EditWalletModal wallet={editingWallet} onClose={() => setEditingWallet(null)} />
      <DeleteWalletModal
        wallet={deletingWallet}
        isDeleting={deleteWallet.isPending}
        onClose={() => setDeletingWallet(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
