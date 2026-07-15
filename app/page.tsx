import Image from "next/image";
import Link from "next/link";
import { PocketMintLogo } from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProductScreenProps = {
  src: string;
  alt: string;
  frameClassName: string;
  imageClassName: string;
  sizes: string;
  preload?: boolean;
};

function ProductScreen({
  src,
  alt,
  frameClassName,
  imageClassName,
  sizes,
  preload = false,
}: ProductScreenProps) {
  return (
    <div
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
              href="#dashboard"
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
          className="mx-auto grid min-h-[calc(100dvh-4rem)] w-full max-w-7xl items-center gap-10 px-5 py-12 md:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14 lg:px-10 lg:py-14"
        >
          <div className="max-w-xl">
            <p className="text-sm font-medium text-muted-foreground">
              Private Financial Workspace
            </p>
            <h1
              id="hero-title"
              className="mt-5 max-w-lg text-5xl font-semibold leading-[1.02] tracking-[-0.045em] text-foreground sm:text-6xl"
            >
              Clarity Over Complexity
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground sm:text-lg">
              Pahami apa yang Anda miliki, kewajiban Anda, dan hal yang perlu
              perhatian, tanpa distraksi.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login" className={primaryAction}>
                Mulai Sekarang
              </Link>
              <Link href="#dashboard" className={secondaryAction}>
                Lihat Demo
              </Link>
            </div>
          </div>

          <ProductScreen
            src="/landing/dashboard.png"
            alt="Dashboard Pocket Mint yang menampilkan posisi keuangan, dompet, dan aktivitas terbaru"
            frameClassName="aspect-[893/925] w-full"
            imageClassName="object-contain"
            sizes="(max-width: 1023px) 100vw, 56vw"
            preload
          />
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
          id="dashboard"
          aria-labelledby="dashboard-title"
          className="mx-auto grid w-full max-w-7xl scroll-mt-20 items-center gap-10 px-5 py-20 md:px-8 lg:grid-cols-[0.42fr_0.58fr] lg:px-10 lg:py-24"
        >
          <div className="max-w-sm">
            <h2
              id="dashboard-title"
              className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
            >
              Dashboard
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Lihat posisi keuangan Anda dalam satu ringkasan.
            </p>
          </div>
          <ProductScreen
            src="/landing/dashboard.png"
            alt="Ringkasan Dashboard Pocket Mint dengan posisi keuangan, daftar dompet, dan aktivitas terbaru"
            frameClassName="aspect-[6/5] w-full"
            imageClassName="object-cover object-[78%_48%] scale-[1.18]"
            sizes="(max-width: 1023px) 100vw, 58vw"
          />
        </section>

        <section
          id="product-pair"
          aria-label="Wallet dan Transaction"
          className="border-y border-border/70 bg-card"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-20 md:px-8 lg:grid-cols-2 lg:gap-6 lg:px-10 lg:py-24">
            <article aria-labelledby="wallet-title">
              <h2
                id="wallet-title"
                className="text-3xl font-semibold tracking-[-0.035em]"
              >
                Wallet
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Semua aset dan kewajiban dalam satu ledger.
              </p>
              <ProductScreen
                src="/landing/wallet.png"
                alt="Wallet Pocket Mint yang menampilkan daftar aset dan kewajiban"
                frameClassName="mt-8 aspect-[4/5] w-full"
                imageClassName="object-cover object-[88%_42%] scale-[1.14]"
                sizes="(max-width: 1023px) 100vw, 50vw"
              />
            </article>

            <article aria-labelledby="transaction-title">
              <h2
                id="transaction-title"
                className="text-3xl font-semibold tracking-[-0.035em]"
              >
                Transaction
              </h2>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Riwayat yang cepat dicari dan mudah diperbaiki.
              </p>
              <ProductScreen
                src="/landing/transaction.png"
                alt="Transaction Pocket Mint dengan pencarian dan riwayat transaksi"
                frameClassName="mt-8 aspect-[4/5] w-full"
                imageClassName="object-cover object-[90%_34%] scale-[1.12]"
                sizes="(max-width: 1023px) 100vw, 50vw"
              />
            </article>
          </div>
        </section>

        <section
          id="installment"
          aria-labelledby="installment-title"
          className="mx-auto grid w-full max-w-7xl scroll-mt-20 items-center gap-10 px-5 py-20 md:px-8 lg:grid-cols-[0.35fr_0.65fr] lg:px-10 lg:py-24"
        >
          <div className="max-w-sm">
            <h2
              id="installment-title"
              className="text-3xl font-semibold tracking-[-0.035em] sm:text-4xl"
            >
              Installment
            </h2>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              Pantau kewajiban tanpa kehilangan tanggal jatuh tempo.
            </p>
          </div>
          <ProductScreen
            src="/landing/installment.png"
            alt="Installment Pocket Mint dengan pengingat, kartu cicilan, tanggal jatuh tempo, dan progres pembayaran"
            frameClassName="aspect-[4/3] w-full"
            imageClassName="object-cover object-[86%_26%] scale-[1.12]"
            sizes="(max-width: 1023px) 100vw, 65vw"
          />
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
