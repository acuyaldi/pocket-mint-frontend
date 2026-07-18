import type { Metadata } from "next";
import Link from "next/link";
import { FileClock } from "lucide-react";

import { PocketMintLogo } from "@/components/Logo";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReleases } from "@/src/lib/changelog";
import type { Release, ReleaseChanges, ReleaseStatus } from "@/src/types/changelog";

export const metadata: Metadata = {
  title: "Changelog - Pocket Mint",
  description:
    "Riwayat rilis dan perkembangan Pocket Mint, ruang kerja finansial privat, dari fitur baru hingga perbaikan.",
};

const STATUS_LABEL: Record<ReleaseStatus, string> = {
  internal: "Internal",
  beta: "Beta",
  stable: "Stabil",
};

const STATUS_TONE: Record<ReleaseStatus, string> = {
  internal: "bg-surface-high text-muted-foreground",
  beta: "bg-amber/10 text-amber",
  stable: "bg-mint/10 text-mint",
};

const CHANGE_LABEL: Record<keyof ReleaseChanges, string> = {
  added: "Fitur baru",
  improved: "Peningkatan",
  fixed: "Perbaikan",
  security: "Keamanan",
};

const CHANGE_ORDER: (keyof ReleaseChanges)[] = ["added", "improved", "fixed", "security"];

function formatPublishedDate(isoDate: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
    new Date(`${isoDate}T00:00:00`)
  );
}

function StatusBadge({ status }: { status: ReleaseStatus }) {
  return (
    <span
      className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest ${STATUS_TONE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function ChangeGroup({ category, items }: { category: keyof ReleaseChanges; items: string[] }) {
  return (
    <div>
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {CHANGE_LABEL[category]}
      </p>
      <ul className="mt-2 space-y-1.5">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm leading-6 text-foreground">
            <span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-border" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReleaseCard({ release }: { release: Release }) {
  const categories = CHANGE_ORDER.filter((key) => (release.changes[key]?.length ?? 0) > 0);

  return (
    <Card className="shadow-sm shadow-primary/5 transition-[transform,background-color,box-shadow] duration-300 motion-safe:hover:-translate-y-1 hover:bg-muted/40 hover:shadow-md hover:ring-primary/30 focus-within:bg-muted/40 focus-within:ring-primary/30">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-muted-foreground">v{release.version}</span>
            <StatusBadge status={release.status} />
          </div>
          <time dateTime={release.publishedAt} className="text-xs text-muted-foreground">
            {formatPublishedDate(release.publishedAt)}
          </time>
        </div>
        <CardTitle className="text-lg">{release.title}</CardTitle>
        <CardDescription>{release.summary}</CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {categories.map((key) => (
          <ChangeGroup key={key} category={key} items={release.changes[key] ?? []} />
        ))}

        {release.knownIssues && release.knownIssues.length > 0 ? (
          <div className="rounded-lg border border-amber/30 bg-amber/10 p-4">
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-amber">
              Masalah yang diketahui
            </p>
            <ul className="mt-2 space-y-1.5">
              {release.knownIssues.map((issue) => (
                <li key={issue} className="text-sm leading-6 text-foreground">
                  {issue}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function EmptyChangelog() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card py-12 text-center">
      <FileClock className="mx-auto size-8 text-muted-foreground" aria-hidden="true" />
      <p className="mt-3 text-sm font-medium text-foreground">Belum ada catatan rilis.</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Pembaruan akan muncul di sini setelah dipublikasikan.
      </p>
    </div>
  );
}

export default function ChangelogPage() {
  const releases = getReleases();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-5 py-5 md:px-8">
          <Link href="/" className="inline-flex text-primary">
            <PocketMintLogo markSize={22} />
          </Link>
          <Link
            href="/"
            className="text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            Kembali ke beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-5 py-10 md:px-8 md:py-14">
        <PageHeader
          title="Changelog"
          description="Riwayat rilis dan perkembangan Pocket Mint, disusun dari yang terbaru."
        />

        <div className="mt-8">
          {releases.length === 0 ? (
            <EmptyChangelog />
          ) : (
            <ul className="space-y-6">
              {releases.map((release) => (
                <li key={release.version}>
                  <ReleaseCard release={release} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
