import Image from "next/image";
import Link from "next/link";
import { PocketMintLogo } from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProductScreenProps = {
  src: string;
  alt: string;
  crop: string;
  frameClassName: string;
  imageClassName: string;
  sizes: string;
  preload?: boolean;
};

function ProductScreen({
  src,
  alt,
  crop,
  frameClassName,
  imageClassName,
  sizes,
  preload = false,
}: ProductScreenProps) {
  return (
    <div
      data-crop={crop}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_24px_60px_rgba(15,23,42,0.08)]",
        frameClassName
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        preload={preload}
        className={cn("max-w-none", imageClassName)}
      />
    </div>
  );
}

const primaryAction = cn(
  buttonVariants({ size: "lg" }),
  "h-11 rounded-xl bg-slate px-5 text-white shadow-none hover:bg-slate/92"
);

const secondaryAction = cn(
  buttonVariants({ size: "lg", variant: "outline" }),
  "h-11 rounded-xl border-border bg-card px-5 shadow-none"
);

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/95 backdrop-blur-sm">
        <nav
          aria-label="Navigasi utama"
          className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 md:px-8 lg:px-10"
        >
          <Link
            href="/"
            aria-label="Pocket Mint"
            className="rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
          >
            <PocketMintLogo className="size-7" />
          </Link>

          <div className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <Link
              href="#wallet"
              className="rounded-md transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Fitur
            </Link>
            <Link
              href="#privacy"
              className="rounded-md transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Privasi
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "ghost" }),
                "h-11 px-3 text-muted-foreground shadow-none"
              )}
            >
              Login
            </Link>
            <Link href="/login" className={primaryAction}>
              Daftar
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section
          aria-labelledby="hero-title"
          className="mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-7xl flex-col justify-center px-5 py-14 md:px-8 lg:px-10 lg:py-20"
        >
          <div className="grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Private Financial Workspace
              </p>
              <h1
                id="hero-title"
                className="mt-5 max-w-lg text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-foreground sm:text-6xl"
              >
                Clarity Over Complexity
              </h1>
            </div>
            <div className="max-w-lg lg:justify-self-end">
              <p className="max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
                Pahami apa yang Anda miliki, kewajiban Anda, dan hal yang perlu
                perhatian, tanpa distraksi.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/login" className={primaryAction}>
                  Mulai Sekarang
                </Link>
                <Link href="#wallet" className={secondaryAction}>
                  Lihat Demo
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 lg:mt-14">
            <ProductScreen
              src="/landing/dashboard.png"
              alt="Dashboard Pocket Mint dengan posisi keuangan, dompet, dan aktivitas terbaru"
              crop="dashboard-overview"
              frameClassName="aspect-[4/3] w-full sm:aspect-[16/10]"
              imageClassName="origin-center -translate-x-[8%] object-cover object-[84%_32%] scale-[1.34]"
              sizes="(max-width: 1279px) 100vw, 1200px"
              preload
            />
            <div className="mt-5 flex items-baseline justify-between gap-5 border-b border-border pb-5">
              <p className="text-sm font-semibold">Dashboard</p>
              <p className="text-right text-sm text-muted-foreground">
                Lihat posisi keuangan Anda dalam satu ringkasan.
              </p>
            </div>
          </div>
        </section>

        <section
          id="privacy"
          aria-labelledby="privacy-title"
          className="scroll-mt-20 border-y border-border/70 bg-card"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-14 md:px-8 lg:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-10 lg:py-16">
            <h2
              id="privacy-title"
              className="max-w-md text-3xl font-semibold leading-tight tracking-[-0.03em]"
            >
              Data finansial Anda tetap milik Anda.
            </h2>
            <div className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <h3 className="font-semibold">Tanpa iklan</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Tidak ada ruang yang dijual kepada pengiklan.
              </p>
            </div>
            <div className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <h3 className="font-semibold">Tanpa pelacakan</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Tidak ada perilaku finansial yang dipakai untuk targeting.
              </p>
            </div>
            <div className="border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
              <h3 className="font-semibold">Data seperlunya</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Hanya informasi yang dibutuhkan oleh workspace Anda.
              </p>
            </div>
          </div>
        </section>

        <section
          id="wallet"
          aria-labelledby="wallet-title"
          className="mx-auto grid w-full max-w-7xl scroll-mt-20 items-center gap-10 px-5 py-20 md:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16 lg:px-10 lg:py-28"
        >
          <ProductScreen
            src="/landing/wallet.png"
            alt="Ringkasan Wallet Pocket Mint dan beberapa kartu dompet pertama"
            crop="wallet-summary-cards"
            frameClassName="aspect-[4/3] w-full sm:aspect-[3/2]"
            imageClassName="origin-center -translate-x-[8%] object-cover object-[88%_24%] scale-[1.32]"
            sizes="(max-width: 1023px) 100vw, 65vw"
          />
          <div className="max-w-sm lg:justify-self-end">
            <p className="text-sm font-medium text-muted-foreground">01</p>
            <h2
              id="wallet-title"
              className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
            >
              Wallet
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Semua aset dan kewajiban dalam satu ledger.
            </p>
          </div>
        </section>

        <section
          id="transactions"
          aria-labelledby="transaction-title"
          className="border-y border-border/70 bg-card"
        >
          <div className="mx-auto grid w-full max-w-7xl scroll-mt-20 items-center gap-10 px-5 py-20 md:px-8 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16 lg:px-10 lg:py-28">
            <div className="max-w-sm">
              <p className="text-sm font-medium text-muted-foreground">02</p>
              <h2
                id="transaction-title"
                className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
              >
                Transaction
              </h2>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Riwayat yang cepat dicari dan mudah diperbaiki.
              </p>
            </div>
            <ProductScreen
              src="/landing/transaction.png"
              alt="Pencarian Transaction Pocket Mint dan beberapa baris transaksi pertama"
              crop="transaction-search-rows"
              frameClassName="aspect-[4/3] w-full sm:aspect-[3/2]"
              imageClassName="origin-center -translate-x-[8%] object-cover object-[89%_23%] scale-[1.3]"
              sizes="(max-width: 1023px) 100vw, 65vw"
            />
          </div>
        </section>

        <section
          id="installment"
          aria-labelledby="installment-title"
          className="mx-auto grid w-full max-w-7xl scroll-mt-20 items-center gap-10 px-5 py-20 md:px-8 lg:grid-cols-[1.35fr_0.65fr] lg:gap-16 lg:px-10 lg:py-28"
        >
          <ProductScreen
            src="/landing/installment.png"
            alt="Ringkasan Installment Pocket Mint dan baris pertama kartu cicilan"
            crop="installment-summary-cards"
            frameClassName="aspect-[4/3] w-full sm:aspect-[3/2]"
            imageClassName="origin-center -translate-x-[8%] object-cover object-[88%_25%] scale-[1.32]"
            sizes="(max-width: 1023px) 100vw, 65vw"
          />
          <div className="max-w-sm lg:justify-self-end">
            <p className="text-sm font-medium text-muted-foreground">03</p>
            <h2
              id="installment-title"
              className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
            >
              Installment
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Pantau kewajiban tanpa kehilangan tanggal jatuh tempo.
            </p>
          </div>
        </section>

        <section id="cta" className="border-y border-border/70 bg-card">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-5 py-20 text-center md:px-8 lg:py-24">
            <h2 className="text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
              Mulai bangun ruang kerja finansial privat Anda.
            </h2>
            <Link href="/login" className={cn(primaryAction, "mt-8")}>
              Mulai Sekarang
            </Link>
          </div>
        </section>
      </main>

      <footer>
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-10 md:flex-row md:items-end md:justify-between md:px-8 lg:px-10">
          <div>
            <p className="font-semibold">Pocket Mint</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Private Financial Workspace
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
            <Link href="#privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <span>Terms</span>
            <span>GitHub</span>
            <span>Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
