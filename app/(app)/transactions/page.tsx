"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Shuffle,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { PageHeader } from "@/components/layout/page-header";
import {
  useCreateTransaction,
  useDeleteTransaction,
  useTransactions,
  useUpdateTransaction,
} from "@/src/features/transactions/hooks/useTransactions";
import { useWallets } from "@/src/features/wallets/hooks/useWallets";
import { Transaction } from "@/src/types/transaction";
import { AddTransactionModal, type AddTransactionData } from "./components/AddTransactionModal";
import { DeleteTransactionModal } from "./components/DeleteTransactionModal";
import { EditTransactionModal } from "./components/EditTransactionModal";
import { TransactionDetailPanel } from "./components/TransactionDetailPanel";

type TypeFilter = "all" | "INCOME" | "EXPENSE" | "TRANSFER";

const TYPE_FILTERS: { key: TypeFilter; label: string }[] = [
  { key: "all", label: "Semua" },
  { key: "INCOME", label: "Pemasukan" },
  { key: "EXPENSE", label: "Pengeluaran" },
  { key: "TRANSFER", label: "Transfer" },
];

function txDateKey(transaction: Transaction) {
  return new Date(transaction.date).toISOString().slice(0, 10);
}

function formatGroupTitle(dateKey: string) {
  const date = new Date(`${dateKey}T00:00:00`);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Hari Ini";
  if (date.toDateString() === yesterday.toDateString()) return "Kemarin";

  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function TransactionIcon({ type }: { type: Transaction["type"] }) {
  if (type === "INCOME") {
    return <ArrowUpRight className="size-5 text-mint" />;
  }
  if (type === "TRANSFER") {
    return <Shuffle className="size-5 text-primary" />;
  }
  return <ArrowDownLeft className="size-5 text-coral" />;
}

export default function TransactionsPage() {
  const { data, isLoading } = useTransactions();
  const { data: walletsData } = useWallets();
  const updateTransaction = useUpdateTransaction();
  const createTransaction = useCreateTransaction();
  const deleteTransaction = useDeleteTransaction();
  const transactions = useMemo(() => data ?? [], [data]);
  const wallets = useMemo(() => walletsData ?? [], [walletsData]);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const filteredTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();
    return transactions
      .filter((transaction) => typeFilter === "all" || transaction.type === typeFilter)
      .filter((transaction) => {
        if (!query) return true;
        return (
          (transaction.description ?? "").toLowerCase().includes(query) ||
          (transaction.category?.name ?? "").toLowerCase().includes(query) ||
          (transaction.wallet?.name ?? "").toLowerCase().includes(query)
        );
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, search, typeFilter]);

  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    filteredTransactions.forEach((transaction) => {
      const key = txDateKey(transaction);
      groups.set(key, [...(groups.get(key) ?? []), transaction]);
    });
    return Array.from(groups.entries());
  }, [filteredTransactions]);

  const handleEditSubmit = useCallback(
    async (data: {
      id: string;
      description: string;
      amount: number;
      type: "EXPENSE" | "INCOME";
      date?: string;
    }) => {
      setIsSaving(true);
      try {
        await updateTransaction.mutateAsync({
          id: data.id,
          description: data.description,
          amount: data.amount,
          type: data.type,
          date: data.date,
        });
        setEditingTx(null);
      } catch (error) {
        console.error(error);
      } finally {
        setIsSaving(false);
      }
    },
    [updateTransaction],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteConfirmId) return;
    setIsDeleting(true);
    try {
      await deleteTransaction.mutateAsync(deleteConfirmId);
      setDeleteConfirmId(null);
      setSelectedTx(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteConfirmId, deleteTransaction]);

  const handleAddSubmit = useCallback(
    async (data: AddTransactionData) => {
      setIsCreating(true);
      try {
        await createTransaction.mutateAsync(data);
        setIsAddModalOpen(false);
      } catch (error) {
        console.error(error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [createTransaction],
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Transaksi" description="Jurnal keuangan Anda" />

      <div className="space-y-3">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-card py-2 pl-10 pr-4 text-sm outline-none transition-all focus:ring-1 focus:ring-primary"
              placeholder="Cari transaksi..."
              type="text"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="size-4" />
            Tambah Transaksi
          </button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {TYPE_FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setTypeFilter(item.key)}
              className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                typeFilter === item.key
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-surface-high text-muted-foreground hover:bg-border/40"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-10">
        {groupedTransactions.map(([dateKey, group]) => {
          const total = group.reduce((sum, transaction) => {
            if (transaction.type === "INCOME") return sum + transaction.amount;
            if (transaction.type === "EXPENSE") return sum - transaction.amount;
            return sum;
          }, 0);

          return (
            <section key={dateKey}>
              <div className="mb-4 flex items-center justify-between border-b border-border pb-2">
                <h2 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                  {formatGroupTitle(dateKey)}
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  Total: {formatCurrency(total)}
                </span>
              </div>
              <div className="space-y-2">
                {group.map((transaction) => (
                  <button
                    key={transaction.id}
                    type="button"
                    onClick={() => setSelectedTx(transaction)}
                    className="group flex w-full items-center justify-between rounded-xl border border-border/60 bg-card p-6 text-left transition-all duration-300 hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${
                          transaction.type === "INCOME"
                            ? "bg-mint/10"
                            : transaction.type === "EXPENSE"
                            ? "bg-coral/10"
                            : "bg-surface-high"
                        }`}
                      >
                        <TransactionIcon type={transaction.type} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {transaction.description || "Transaksi"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {transaction.type === "TRANSFER"
                            ? "Transfer"
                            : transaction.category?.name ?? "Tanpa kategori"}
                        </p>
                      </div>
                    </div>
                    <div className="hidden text-sm text-muted-foreground md:block">
                      {transaction.wallet?.name ??
                        wallets.find((wallet) => wallet.id === transaction.walletId)?.name ??
                        "-"}
                    </div>
                    <p
                      className={`shrink-0 text-sm font-bold tabular-nums ${
                        transaction.type === "INCOME"
                          ? "text-mint"
                          : transaction.type === "TRANSFER"
                          ? "text-foreground"
                          : "text-coral"
                      }`}
                    >
                      {transaction.type === "INCOME" ? "+" : transaction.type === "EXPENSE" ? "-" : ""}
                      {formatCurrency(transaction.amount)}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      {filteredTransactions.length === 0 && !isLoading ? (
        <p className="rounded-xl border border-dashed border-border bg-card py-10 text-center text-sm text-muted-foreground">
          Tidak ada transaksi yang cocok.
        </p>
      ) : null}
      {isLoading ? (
        <p className="rounded-xl border border-border bg-card py-10 text-center text-sm text-muted-foreground">
          Memuat transaksi...
        </p>
      ) : null}

      <TransactionDetailPanel
        tx={selectedTx}
        onClose={() => setSelectedTx(null)}
        onEdit={setEditingTx}
        onDelete={setDeleteConfirmId}
      />
      <EditTransactionModal
        tx={editingTx}
        isSaving={isSaving}
        onClose={() => setEditingTx(null)}
        onSubmit={handleEditSubmit}
      />
      <DeleteTransactionModal
        isOpen={!!deleteConfirmId}
        isDeleting={isDeleting}
        onClose={() => setDeleteConfirmId(null)}
        onConfirm={handleDeleteConfirm}
      />
      <AddTransactionModal
        isOpen={isAddModalOpen}
        isCreating={isCreating}
        wallets={wallets}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddSubmit}
      />
    </div>
  );
}
