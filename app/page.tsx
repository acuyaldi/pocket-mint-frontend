import Image from "next/image";
import Link from "next/link";
import {
  CalendarDays,
  ChartNoAxesCombined,
  Database,
  EyeOff,
  LayoutDashboard,
  LockKeyhole,
  ReceiptText,
  WalletCards,
} from "lucide-react";

const dashboardImage = "/landing/dashboard.png";
const transactionImage = "/landing/transaction.png";

const primaryButton =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-[#002b2b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:opacity-80";

const largePrimaryButton =
  "inline-flex min-h-14 items-center justify-center rounded-xl bg-primary px-8 py-4 text-xl font-semibold text-primary-foreground shadow-sm transition-all hover:bg-[#002b2b] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:scale-95";

const largeSecondaryButton =
  "inline-flex min-h-14 items-center justify-center rounded-xl border border-[#717978] bg-transparent px-8 py-4 text-xl font-semibold text-foreground transition-all hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:scale-95";

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-20 w-full border-b border-border bg-background">
        <nav
          aria-label="Navigasi utama"
          className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 md:px-10"
        >
          <div className="flex items-center gap-8">
            <Link href="/" className="text-xl font-bold text-primary">
              Pocket Mint
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              <Link href="#features" className="text-sm text-muted-foreground hover:text-primary">
                Fitur
              </Link>
              <Link href="#privacy" className="text-sm text-muted-foreground hover:text-primary">
                Privasi
              </Link>
              <Link href="#about" className="text-sm text-muted-foreground hover:text-primary">
                Tentang Kami
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="min-h-11 px-4 py-3 text-sm text-muted-foreground hover:text-primary">
              Login
            </Link>
            <Link href="/login" className={primaryButton}>
              Daftar
            </Link>
          </div>
        </nav>
      </header>

      <main className="mx-auto w-full max-w-7xl">
        <section className="flex flex-col items-center justify-between gap-12 overflow-hidden px-5 py-24 md:flex-row md:px-10">
          <div className="w-full space-y-6 md:w-1/2">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#d0e1fb] px-3 py-1 text-[#54647a]">
              <LockKeyhole aria-hidden="true" className="size-4" strokeWidth={1.75} />
              <span className="text-xs font-medium tracking-[0.02em]">Private &amp; Secured</span>
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-tight tracking-tight text-primary md:text-[56px] md:leading-[1.1]">
              Clarity Over Complexity
            </h1>
            <p className="max-w-md text-base leading-6 text-muted-foreground">
              Satu tempat pribadi untuk memahami posisi finansial Anda tanpa kebisingan iklan atau pelacakan data.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link href="/login" className={largePrimaryButton}>
                Mulai Sekarang
              </Link>
              <Link href="#features" className={largeSecondaryButton}>
                Pelajari Demo
              </Link>
            </div>
          </div>

          <div className="relative w-full md:w-1/2">
            <div className="stitch-float relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-card shadow-xl md:aspect-video">
              <Image
                src={dashboardImage}
                alt="Dashboard Pocket Mint dari ekspor Google Stitch"
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                className="object-contain object-center p-2"
                preload
              />
            </div>
            <div className="absolute -bottom-6 -left-6 -z-10 size-48 rounded-full bg-mint/10 blur-3xl" />
          </div>
        </section>

        <section id="privacy" className="scroll-mt-20 px-5 py-8 md:px-10">
          <div className="relative overflow-hidden rounded-3xl bg-[#002b2b] p-12 text-[#6e9493] md:p-20">
            <div className="relative z-10 max-w-2xl">
              <h2 className="mb-6 text-3xl font-semibold tracking-tight text-[#c2eae9]">
                Privasi adalah Prioritas Kami
              </h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <Database aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-mint" strokeWidth={1.75} />
                  <div>
                    <h3 className="text-xl font-semibold text-white">Data Terlokalisasi</h3>
                    <p className="mt-1 text-sm leading-6 text-[#a7cecd]">
                      Semua data keuangan Anda dienkripsi dan disimpan secara aman. Kami tidak pernah menjual data Anda kepada pihak ketiga.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <EyeOff aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-mint" strokeWidth={1.75} />
                  <div>
                    <h3 className="text-xl font-semibold text-white">Tanpa Pelacakan</h3>
                    <p className="mt-1 text-sm leading-6 text-[#a7cecd]">
                      Tidak ada pixel pelacak atau algoritma marketing. Hanya alat murni untuk manajemen kekayaan Anda.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-20 px-5 py-8 md:px-10">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-xl font-bold uppercase tracking-widest text-primary">Fitur Utama</h2>
            <p className="text-base text-muted-foreground">Alat profesional untuk kejernihan finansial yang sesungguhnya.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:auto-rows-[280px] md:grid-cols-12">
            <article className="stitch-bento relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 md:col-span-8 md:row-span-2 md:min-h-0">
              <div className="relative z-10">
                <LayoutDashboard aria-hidden="true" className="mb-4 size-8 text-primary" strokeWidth={1.75} />
                <h3 className="mb-2 text-xl font-bold text-primary">Dashboard Workspace</h3>
                <p className="max-w-xs text-sm leading-5 text-muted-foreground">
                  Visualisasi Net Worth, Aset, dan Hutang dalam satu tampilan bersih tanpa distraksi.
                </p>
              </div>
              <div className="absolute bottom-0 right-0 h-2/3 w-2/3 overflow-hidden rounded-tl-xl border-l border-t border-border shadow-lg">
                <Image src={dashboardImage} alt="Tampilan ringkas Dashboard Workspace dari Google Stitch" fill sizes="(max-width: 767px) 66vw, 44vw" className="object-contain object-bottom p-2" />
              </div>
            </article>

            <article className="stitch-bento flex min-h-[220px] flex-col justify-center rounded-2xl bg-muted p-6 md:col-span-4 md:min-h-0">
              <WalletCards aria-hidden="true" className="mb-4 size-8 text-primary" strokeWidth={1.75} />
              <h3 className="mb-2 text-xl font-bold text-primary">Inventory Dompet</h3>
              <p className="text-sm leading-5 text-muted-foreground">Kelola rekening bank, e-wallet, dan aset fisik dalam satu inventori terpusat.</p>
            </article>

            <article className="stitch-bento flex min-h-[420px] flex-col justify-between rounded-2xl bg-primary p-6 text-primary-foreground md:col-span-4 md:row-span-2 md:min-h-0">
              <div>
                <ChartNoAxesCombined aria-hidden="true" className="mb-4 size-8 text-mint" strokeWidth={1.75} />
                <h3 className="mb-2 text-xl font-bold">Laporan Analitik</h3>
                <p className="text-sm leading-5 text-[#a7cecd]">Dapatkan wawasan mendalam tentang arus kas Anda tanpa visualisasi yang berlebihan.</p>
              </div>
              <div className="relative mt-8 h-44 overflow-hidden rounded-lg border border-white/10">
                <Image src={transactionImage} alt="Riwayat transaksi Pocket Mint dari Google Stitch" fill sizes="(max-width: 767px) 100vw, 33vw" className="object-contain object-bottom p-2 opacity-80" />
              </div>
            </article>

            <article className="stitch-bento flex min-h-[180px] items-center gap-6 rounded-2xl border border-border bg-card p-6 md:col-span-4 md:min-h-0">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e8e8e7]">
                <ReceiptText aria-hidden="true" className="size-6 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary">Transaksi</h3>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">Pencatatan cepat dan kategorisasi otomatis.</p>
              </div>
            </article>

            <article className="stitch-bento flex min-h-[180px] items-center gap-6 rounded-2xl border border-border bg-card p-6 md:col-span-4 md:min-h-0">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#e8e8e7]">
                <CalendarDays aria-hidden="true" className="size-6 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-primary">Cicilan</h3>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">Pantau sisa tenor dan tanggal jatuh tempo.</p>
              </div>
            </article>
          </div>
        </section>

        <section id="cta" className="px-5 py-24 text-center md:px-10">
          <div className="mx-auto max-w-3xl space-y-8">
            <h2 className="text-3xl font-semibold tracking-tight text-primary">Siap Meraih Kejernihan Finansial?</h2>
            <p className="text-base leading-6 text-muted-foreground">
              Bergabunglah dengan profesional lainnya yang telah memilih Pocket Mint untuk mengelola masa depan finansial mereka secara privat.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link href="/login" className={largePrimaryButton}>Mulai Gratis Sekarang</Link>
              <Link href="mailto:hello@pocketmint.app" className={largeSecondaryButton}>Hubungi Tim Kami</Link>
            </div>
            <p className="text-xs italic text-muted-foreground/60">Tanpa kartu kredit diperlukan. Data 100% milik Anda.</p>
          </div>
        </section>
      </main>

      <footer id="about" className="mt-24 w-full border-t border-border bg-muted">
        <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between px-5 py-8 md:flex-row md:px-10">
          <div className="mb-8 text-center md:mb-0 md:text-left">
            <Link href="/" className="text-xl font-bold text-primary">Pocket Mint</Link>
            <p className="mt-2 text-xs text-muted-foreground">© 2024 Pocket Mint. Seluruh hak cipta dilindungi.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {['Kebijakan Privasi', 'Syarat & Ketentuan', 'Bantuan', 'Kontak'].map((label) => (
              <Link key={label} href="#" className="text-xs text-muted-foreground hover:text-primary hover:underline">{label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
