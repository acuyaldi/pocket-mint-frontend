"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Search, ArrowUpRight, ArrowDownLeft, RefreshCcw } from "lucide-react";
import { useState, useMemo, useCallback } from "react";

export interface Transaction {
  id: string;
  date: string;
  description?: string | null;
  category?: string | { id: string; name: string; type: string } | null;
  type: "income" | "expense" | "transfer" | "INCOME" | "EXPENSE" | "TRANSFER";
  amount: number;
  status?: "completed" | "pending" | "failed";
}

const typeConfig = {
  income: {
    icon: ArrowUpRight,
    label: "Pemasukan",
    iconClass: "",
    iconStyle: { color: "#4ade80" },
    amountClass: "",
    amountStyle: { color: "#4ade80" },
    badgeStyle: { backgroundColor: "rgba(74,222,128,0.12)", border: "1px solid #4ade80", color: "#4ade80" },
    prefix: "+",
    iconBg: "rgba(74,222,128,0.12)",
  },
  expense: {
    icon: ArrowDownLeft,
    label: "Pengeluaran",
    iconClass: "",
    iconStyle: { color: "#ffb4ab" },
    amountClass: "",
    amountStyle: { color: "#ffb4ab" },
    badgeStyle: { backgroundColor: "rgba(255,180,171,0.12)", border: "1px solid #ffb4ab", color: "#ffb4ab" },
    prefix: "-",
    iconBg: "rgba(255,180,171,0.12)",
  },
  transfer: {
    icon: RefreshCcw,
    label: "Transfer",
    iconClass: "",
    iconStyle: { color: "#4ade80" },
    amountClass: "",
    amountStyle: { color: "#4ade80" },
    badgeStyle: { backgroundColor: "rgba(74,222,128,0.12)", border: "1px solid #4ade80", color: "#4ade80" },
    prefix: "",
    iconBg: "rgba(74,222,128,0.12)",
  },
};

const statusConfig = {
  completed: { label: "Selesai", style: { backgroundColor: "rgba(74,222,128,0.12)", border: "1px solid #4ade80", color: "#4ade80" } },
  pending: { label: "Tertunda", style: { backgroundColor: "rgba(245, 158, 11, 0.15)", border: "1px solid #F59E0B", color: "#F59E0B" } },
  failed: { label: "Gagal", style: { backgroundColor: "rgba(255,180,171,0.12)", border: "1px solid #ffb4ab", color: "#ffb4ab" } },
};


function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateStr));
}

const TABLE_PAGE_SIZE = 10;

const FILTER_BUTTONS: { label: string; value: "all" | "income" | "expense" | "transfer" }[] = [
  { label: "Semua", value: "all" },
  { label: "Pemasukan", value: "income" },
  { label: "Pengeluaran", value: "expense" },
  { label: "Transfer", value: "transfer" },
];

interface TransactionTableProps {
  transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "income" | "expense" | "transfer">("all");
  const [visibleCount, setVisibleCount] = useState(TABLE_PAGE_SIZE);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        (typeof t.category === "string" ? t.category?.toLowerCase() : t.category?.name?.toLowerCase() ?? "").includes(search.toLowerCase());
      const matchesType = typeFilter === "all" || t.type.toLowerCase() === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [transactions, search, typeFilter]);

  // Reset visible count when filters change
  const [prevFilterKey, setPrevFilterKey] = useState(`${search}-${typeFilter}`);
  const filterKey = `${search}-${typeFilter}`;
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setVisibleCount(TABLE_PAGE_SIZE);
  }

  const visibleRows = useMemo(
    () => filtered.slice(0, visibleCount),
    [filtered, visibleCount]
  );
  const hasMore = visibleCount < filtered.length;

  const loadMore = useCallback(() => {
    setVisibleCount((prev) => prev + TABLE_PAGE_SIZE);
  }, []);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: "#3d4a3e" }} />
          <Input
            id="transaction-search"
            placeholder="Cari transaksi\u2026"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
            style={{ backgroundColor: "#0e0e0e", border: "1px solid #262626", color: "#e5e2e1" }}
          />
        </div>
      
        {/* Filter Buttons */}
        <div className="flex items-center gap-1" style={{ backgroundColor: "#0e0e0e", border: "1px solid #262626", borderRadius: "8px", padding: "4px" }}>
          {FILTER_BUTTONS.map((btn) => (
            <Button
              key={btn.value}
              id={`filter-${btn.value}`}
              variant={typeFilter === btn.value ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs font-medium rounded-md transition-all"
              style={typeFilter === btn.value ? {
                backgroundColor: "#4ade80",
                color: "#131313",
              } : {
                backgroundColor: "transparent",
                color: "#bccabb",
              }}
              onClick={() => setTypeFilter(btn.value)}
            >
              {btn.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ borderRadius: "8px", border: "1px solid #262626", overflow: "hidden" }}>
        <Table>
          <TableHeader>
            <TableRow style={{ backgroundColor: "#0e0e0e" }}>
              <TableHead style={{ fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 600, color: "#3d4a3e" }} className="w-32">Tanggal</TableHead>
              <TableHead style={{ fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 600, color: "#3d4a3e" }}>Deskripsi</TableHead>
              <TableHead style={{ fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 600, color: "#3d4a3e" }} className="hidden md:table-cell">Kategori</TableHead>
              <TableHead style={{ fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 600, color: "#3d4a3e" }} className="hidden sm:table-cell">Tipe</TableHead>
              <TableHead style={{ fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 600, color: "#3d4a3e" }} className="hidden lg:table-cell">Status</TableHead>
              <TableHead style={{ fontFamily: "var(--font-inter)", fontSize: "11px", fontWeight: 600, color: "#3d4a3e" }} className="text-right">Jumlah</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-sm" style={{ color: "#bccabb" }}>
                  Tidak ada transaksi yang ditemukan.
                </TableCell>
              </TableRow>
            ) : (
              visibleRows.map((tx, idx) => {
                const normalizedType = tx.type.toLowerCase() as "income" | "expense" | "transfer";
                const tConfig = typeConfig[normalizedType];
                const sConfig = statusConfig[tx.status ?? "completed"];
                const Icon = tConfig.icon;

                return (
                  <TableRow
                    key={tx.id}
                    className="transition-colors cursor-pointer"
                    style={{
                      backgroundColor: idx % 2 === 0 ? "#131313" : "#0e0e0e",
                    }}
                  >
                    <TableCell style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#bccabb" }} className="whitespace-nowrap">
                      {formatDate(tx.date)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex items-center justify-center"
                          style={{
                            width: "24px",
                            height: "24px",
                            borderRadius: "8px",
                            backgroundColor: tConfig.iconBg,
                          }}
                        >
                          <Icon className="size-3.5" style={tConfig.iconStyle} />
                        </div>
                        <span style={{ fontFamily: "var(--font-inter)", fontSize: "14px", fontWeight: 400, color: "#e5e2e1" }} className="truncate max-w-[180px]">{tx.description}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span style={{ fontFamily: "var(--font-inter)", fontSize: "14px", color: "#bccabb" }}>{typeof tx.category === "string" ? tx.category : tx.category?.name ?? "-"}</span>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span
                        className="inline-flex items-center"
                        style={{
                          borderRadius: "9999px",
                          padding: "3px 10px",
                          fontFamily: "var(--font-inter)",
                          fontSize: "11px",
                          fontWeight: 600,
                          ...tConfig.badgeStyle,
                        }}
                      >
                        {tConfig.label}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <span
                        className="inline-flex items-center"
                        style={{
                          borderRadius: "9999px",
                          padding: "3px 10px",
                          fontFamily: "var(--font-inter)",
                          fontSize: "11px",
                          fontWeight: 600,
                          ...sConfig.style,
                        }}
                      >
                        {sConfig.label}
                      </span>
                    </TableCell>
                    <TableCell
                      className="text-right tabular-nums"
                      style={{
                        fontFamily: "var(--font-inter)",
                        fontSize: "14px",
                        fontWeight: 600,
                        ...tConfig.amountStyle,
                      }}
                    >
                      {tConfig.prefix}{formatCurrency(tx.amount)}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            onClick={loadMore}
            variant="outline"
            size="sm"
            style={{ border: "1px solid #262626", backgroundColor: "#0e0e0e", color: "#bccabb" }}
          >
            Muat Lebih Banyak ({filtered.length - visibleCount} tersisa)
          </Button>
        </div>
      )}

      <p style={{ fontFamily: "var(--font-inter)", fontSize: "12px", color: "#bccabb" }} className="text-right">
        Menampilkan {Math.min(visibleCount, filtered.length)} dari {transactions.length} transaksi
      </p>
    </div>
  );
}