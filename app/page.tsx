import Link from "next/link";
import { Sparkles } from "lucide-react";

import { PocketMintLogo } from "@/components/Logo";
import { PocketMintHero } from "@/components/ui/pocket-mint-hero";
import { PrivacyCommitments } from "@/components/ui/privacy-commitments";
import { VerticalTabs } from "@/components/ui/vertical-tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReleases } from "@/src/lib/changelog";
import type { Release, ReleaseChanges } from "@/src/types/changelog";

const largePrimaryButton =
  "landing-cta-sweep inline-flex min-h-11 items-center justify-center rounded-[40px] bg-primary px-[50px] py-[17px] text-base font-medium leading-[27px] text-primary-foreground shadow-sm hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:bg-primary/85";

const CHANGE_ORDER: (keyof ReleaseChanges)[] = ["added", "improved", "fixed", "security"];

function topChanges(release: Release, max = 3): string[] {
  return CHANGE_ORDER.flatMap((key) => release.changes[key] ?? []).slice(0, max);
}

function formatReleaseDate(isoDate: string): string {
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
    new Date(`${isoDate}T00:00:00`)
  );
}

function WhatsNewSection() {
  const releases = getReleases().slice(0, 3);

  return (
    <section
      id="whats-new"
      className="scroll-mt-20 border-t border-border py-16 md:py-24"
    >
      <div className="flex flex-col items-center text-center gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-secondary">
          <Sparkles aria-hidden="true" className="size-4" strokeWidth={1.75} />
          <span className="text-xs font-medium tracking-[0.02em]">Perkembangan Produk</span>
        </span>
          <h2 className="max-w text-5xl font-semibold tracking-tight text-primary md:text-5xl lg:text-6xl">
          Yang Baru di Pocket Mint
        </h2>
        <p className="max-w text-base leading-7 text-muted-foreground sm:text-xl sm:leading-8">
          Pocket Mint terus dikembangkan. Berikut ringkasan rilis terbaru kami.
        </p>
      </div>

      {releases.length > 0 ? (
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {releases.map((release) => (
            <Card
              key={release.version}
              className="text-left shadow-sm shadow-primary/5 transition-[transform,background-color,box-shadow] duration-300 motion-safe:hover:-translate-y-1 hover:bg-muted/40 hover:shadow-md hover:ring-primary/30 focus-within:bg-muted/40 focus-within:ring-primary/30"
            >
              <CardHeader className="gap-1.5">
                <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="font-semibold">v{release.version}</span>
                  <time dateTime={release.publishedAt}>{formatReleaseDate(release.publishedAt)}</time>
                </div>
                <CardTitle className="text-base">{release.title}</CardTitle>
                <CardDescription>{release.summary}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {topChanges(release).map((item) => (
                    <li key={item} className="flex gap-2 text-sm leading-6 text-foreground">
                      <span aria-hidden="true" className="mt-2.5 size-1 shrink-0 rounded-full bg-border" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}

      <div className="mt-10 flex justify-center">
        <Link href="/changelog" className={largePrimaryButton}>
          <span>Lihat semua perubahan</span>
        </Link>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PocketMintHero />

      <main className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">
        <section
          id="privacy"
          className="scroll-mt-20 border-b border-border py-14 md:py-20"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)] lg:items-stretch">
            <div className="flex flex-col lg:justify-center lg:py-2">
              <h2 className="max-w-2xl text-4xl font-semibold tracking-tight text-primary md:text-5xl lg:text-6xl">
                Data finansial Anda tetap milik Anda.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
                Pocket Mint membantu Anda membaca kondisi finansial tanpa
                iklan, pelacakan marketing, atau pengumpulan data yang tidak
                diperlukan.
              </p>
            </div>
            <PrivacyCommitments />
          </div>
        </section>

        <section
          id="features"
          className="scroll-mt-20 py-16 md:py-24"
        >
          <VerticalTabs />
        </section>

        <WhatsNewSection />

      
      </main>

      <footer id="about" className="scroll-mt-20 w-full border-t border-border bg-muted">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between px-5 py-8 md:flex-row md:px-8 lg:px-10">
          <div className="mb-8 text-center md:mb-0 md:text-left">
            <Link href="/" className="inline-flex text-primary">
              <PocketMintLogo />
            </Link>
            <p className="mt-2 text-xs text-muted-foreground">
              © 2024 Pocket Mint. Seluruh hak cipta dilindungi.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {["Kebijakan Privasi", "Syarat & Ketentuan", "Bantuan", "Kontak"].map(
              (label) => (
                <Link
                  key={label}
                  href="#"
                  className="text-xs text-muted-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  {label}
                </Link>
              )
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
