import Image from "next/image";
import Link from "next/link";

import { PocketMintLogo } from "@/components/Logo";
import { PocketMintHero } from "@/components/ui/pocket-mint-hero";

const screens = {
  dashboard: "/landing/dashboard.png",
  wallet: "/landing/wallet.png",
  transaction: "/landing/transaction.png",
  installment: "/landing/installment.png",
} as const;

const largePrimaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:bg-primary/85";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PocketMintHero />

      <main className="mx-auto w-full max-w-7xl px-5 md:px-8 lg:px-10">
        <section
          id="privacy"
          className="scroll-mt-20 border-b border-border py-16 md:py-24"
        >
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.55fr)] lg:items-end">
            <div>
              <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-primary md:text-4xl">
                Data finansial Anda tetap milik Anda.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground">
                Pocket Mint membantu Anda membaca kondisi finansial tanpa
                iklan, pelacakan marketing, atau pengumpulan data yang tidak
                diperlukan.
              </p>
            </div>
            <div className="space-y-4 text-sm leading-6 text-muted-foreground">
              <p className="border-t border-border pt-4">Tanpa iklan.</p>
              <p className="border-t border-border pt-4">
                Tanpa pelacakan marketing.
              </p>
              <p className="border-t border-border pt-4">
                Hanya data yang diperlukan untuk workspace Anda.
              </p>
            </div>
          </div>
        </section>

        <section
          id="dashboard"
          className="scroll-mt-20 py-16 md:py-24"
        >
          <div className="mb-8 max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-primary">
              Dashboard
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Lihat posisi keuangan Anda dalam satu ringkasan.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
            <Image
              src={screens.dashboard}
              alt="Dashboard Pocket Mint"
              width={1280}
              height={1312}
              sizes="(max-width: 1280px) calc(100vw - 40px), 1200px"
              className="h-auto w-full object-contain"
            />
          </div>
        </section>

        <section className="grid gap-12 border-t border-border py-16 md:py-24 lg:grid-cols-2">
          <article id="wallet" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight text-primary">
              Wallet
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Semua aset dan kewajiban dalam satu ledger.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
              <Image
                src={screens.wallet}
                alt="Wallet Pocket Mint"
                width={1384}
                height={1600}
                sizes="(max-width: 1023px) calc(100vw - 40px), 560px"
                className="h-auto w-full object-contain"
              />
            </div>
          </article>

          <article id="transactions" className="scroll-mt-20">
            <h2 className="text-2xl font-semibold tracking-tight text-primary">
              Transaction
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Riwayat yang cepat dicari dan mudah diperbaiki.
            </p>
            <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
              <Image
                src={screens.transaction}
                alt="Transaction Pocket Mint"
                width={1489}
                height={1600}
                sizes="(max-width: 1023px) calc(100vw - 40px), 560px"
                className="h-auto w-full object-contain"
              />
            </div>
          </article>
        </section>

        <section
          id="installment"
          className="scroll-mt-20 border-t border-border py-16 md:py-24"
        >
          <div className="mb-8 max-w-xl">
            <h2 className="text-3xl font-semibold tracking-tight text-primary">
              Installment
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Pantau kewajiban tanpa kehilangan tanggal jatuh tempo.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-sm">
            <Image
              src={screens.installment}
              alt="Installment Pocket Mint"
              width={1600}
              height={1280}
              sizes="(max-width: 1280px) calc(100vw - 40px), 1200px"
              className="h-auto w-full object-contain"
            />
          </div>
        </section>

        <section
          id="cta"
          className="border-t border-border py-20 text-center md:py-28"
        >
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-primary md:text-4xl">
            Mulai bangun ruang kerja finansial privat Anda.
          </h2>
          <Link href="/login" className={`${largePrimaryButton} mt-8`}>
            Mulai Sekarang
          </Link>
        </section>
      </main>

      <footer id="about" className="w-full border-t border-border bg-muted">
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
