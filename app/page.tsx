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

const heroImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB89ClmV7TCkB9Ydw3hDKHAOfUGDfa5qlwSomyoW48A1ugO46TQkh48tsmFqQsSXWfgybNaFsmfdbhyLt8eA4kYCrzfQS4cv6DnAiLOAItO5sK4k2-JbzffouUDYVzlFs_o64MkdkuNl3qjLKfMLOGkPYZ-ON5C5nI4RJ5dHz-aOInRqxqDLwtbreHVVuzf6uNSQtNeo692WstH5p9iadi5n-IH9C3GTH3LoXY6locQkPKUMFMnl8rl";

const dashboardImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDNq00J7NCxCEeCQbjHrHMclU3VF5OV7tMg8wSAHH-7czgl6KCZckriVzzWhIYTLfdoVLR1GVoq_avPOAk2IuxUHjEfxOz3K6KjYPi9KFSfH62Kn7dXly55l_xlMBjvgCkAUThXemFQkTFV0pnvSzB92K0BBICPpQLMULrLNFTzg-ja7b0j5jRvzKFRynBNJmMTflrWnu_gt6d-kGgLhrwtbwyx7T9oPIcd5bzmGGsV1D8_4GkP6mQr";

const analyticsImage =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuB2aUCdKKpvB_qAVQzef0DR0T5azpUTWp6A1rmcjFtH4LCBAjpkGaz1t343tYX7zlVv3SX5v2gGqoiYfAk-NFc7Eh7Z_iRJ6eL04Q47oWzDTehf6Gc3XMxmSpbqa6ABDy_tilEC7avHJtxNdu1dro58MWrYx3z4e2ReWipgXj_yWyuTv9hPcaDTVKzvXZYa9l8NyVfM1bWQ6INWnWJfHtBax7bbpp5qZ5hY1PBSEq3tXbbkVZJXPmmt";

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
                src={heroImage}
                alt="Tampilan workspace finansial Pocket Mint pada ruang kerja modern"
                fill
                sizes="(max-width: 767px) 100vw, 50vw"
                className="object-cover"
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
            <article className="stitch-bento group relative flex min-h-[420px] flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 md:col-span-8 md:row-span-2 md:min-h-0">
              <div className="relative z-10">
                <LayoutDashboard aria-hidden="true" className="mb-4 size-8 text-primary" strokeWidth={1.75} />
                <h3 className="mb-2 text-xl font-bold text-primary">Dashboard Workspace</h3>
                <p className="max-w-xs text-sm leading-5 text-muted-foreground">
                  Visualisasi Net Worth, Aset, dan Hutang dalam satu tampilan bersih tanpa distraksi.
                </p>
              </div>
              <div className="absolute bottom-0 right-0 h-2/3 w-2/3 translate-x-12 translate-y-12 overflow-hidden rounded-tl-xl border-l border-t border-border shadow-lg transition-transform duration-500 group-hover:translate-x-8 group-hover:translate-y-8">
                <Image src={dashboardImage} alt="Tampilan ringkas Dashboard Workspace" fill sizes="(max-width: 767px) 66vw, 44vw" className="object-cover" />
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
                <Image src={analyticsImage} alt="Laporan finansial berbasis tabel" fill sizes="(max-width: 767px) 100vw, 33vw" className="object-cover opacity-60" />
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
