'use client';
import { useTransactions } from '../src/features/transactions/hooks/useTransactions';
import { StatCard } from '@/components/dashboard/stat-card';
import { TransactionTable } from '@/components/dashboard/transaction-table';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Wallet, TrendingUp, TrendingDown, MoreHorizontal, Download, ArrowRight } from 'lucide-react';

// Utility to format currency (short version)
function formatCurrencyShort(amount: number) {
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const { data, isLoading, isError } = useTransactions();
  const transactions = data ?? [];

  // Calculate totals only when data is available
  const income = transactions
    .filter((t) => t.type === 'INCOME')
    .reduce((sum, t) => sum + t.amount, 0);
  const expense = transactions
    .filter((t) => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expense;

  const savingsRate = income ? Math.round(((income - expense) / income) * 100) : 0;

  // Skeleton for stat cards (3 columns)
  const renderStatCardSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
      ))}
    </div>
  );

  // Skeleton for transaction table
  const renderTableSkeleton = () => (
    <div className="space-y-2">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-10 bg-muted rounded animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Ringkasan Keuangan
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Selamat datang kembali! Ini ringkasan keuangan Anda bulan ini.
            </p>
          </div>
          <Button
            id="export-report-btn"
            variant="outline"
            size="sm"
            className="gap-2 self-start sm:self-auto"
          >
            <Download className="size-4" />
            Ekspor Laporan
          </Button>
        </div>

        {/* Stat Cards */}
        <section aria-label="Ringkasan statistik keuangan">
          {isLoading ? (
            renderStatCardSkeleton()
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatCard
                title="Total Saldo"
                value={formatCurrencyShort(balance)}
                subtitle="Dari bulan lalu"
                trend={((balance - 0) / (balance || 1)) * 100}
                icon={Wallet}
                variant="balance"
              />
              <StatCard
                title="Total Pemasukan"
                value={formatCurrencyShort(income)}
                subtitle="Juni 2026"
                trend={income ? 0 : 0}
                icon={TrendingUp}
                variant="income"
              />
              <StatCard
                title="Total Pengeluaran"
                value={formatCurrencyShort(expense)}
                subtitle="Juni 2026"
                trend={expense ? -0 : 0}
                icon={TrendingDown}
                variant="expense"
              />
            </div>
          )}
        </section>

        {/* Savings Rate Banner */}
        <Card className="border-0 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent shadow-sm">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-semibold text-foreground">
                  Tingkat Tabungan Bulan Ini
                </span>
                <span className="text-xs text-muted-foreground">
                  (Pendapatan - Pengeluaran) / Pendapatan
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full transition-all duration-700"
                  style={{ width: `${savingsRate}%` }}
                />
              </div>
            </div>
            <div className="text-3xl font-bold text-primary tabular-nums">
              {savingsRate}%
            </div>
          </CardContent>
        </Card>

        {/* Transaction History */}
        <section aria-label="Riwayat transaksi">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">
                    Riwayat Transaksi
                  </CardTitle>
                  <CardDescription className="text-sm mt-0.5">
                    {isLoading ? 'Memuat transaksi...' : `${transactions.length} transaksi tercatat di bulan ini`}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    id="view-all-transactions-btn"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-xs text-primary hover:text-primary"
                  >
                    Lihat Semua
                    <ArrowRight className="size-3.5" />
                  </Button>
                  <Button
                    id="transaction-options-btn"
                    variant="ghost"
                    size="icon"
                    className="size-8"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="pt-5">
              {isLoading ? renderTableSkeleton() : <TransactionTable transactions={transactions} />}
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            © 2026 Pocket Mint — Kelola Keuangan Lebih Cerdas
          </p>
          <p className="text-xs text-muted-foreground">
            Dibangun dengan Next.js & Shadcn/ui
          </p>
        </div>
      </footer>
    </div>
  );
}
