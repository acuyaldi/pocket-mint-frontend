import Link from "next/link";

import { PocketMintLogo } from "@/components/Logo";
import { PocketMintHero } from "@/components/ui/pocket-mint-hero";
import { VerticalTabs } from "@/components/ui/vertical-tabs";

const largePrimaryButton =
  "landing-cta-sweep inline-flex min-h-11 items-center justify-center rounded-[40px] bg-primary px-[50px] py-[17px] text-base font-medium leading-[27px] text-primary-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:bg-primary/85";

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
          id="features"
          className="scroll-mt-20 py-16 md:py-24"
        >
          <VerticalTabs />
        </section>

        <section
          id="cta"
          className="border-t border-border py-20 text-center md:py-28"
        >
          <h2 className="mx-auto max-w-2xl text-3xl font-semibold tracking-tight text-primary md:text-4xl">
            Mulai bangun ruang kerja finansial privat Anda.
          </h2>
          <Link href="/login" className={`${largePrimaryButton} mt-8`}>
            <span>Mulai Sekarang</span>
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
