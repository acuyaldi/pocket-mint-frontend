import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  ShieldCheck,
  Wallet,
  Webhook,
} from "lucide-react";
import { PocketMintLogo } from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const capabilityCards = [
  {
    title: "Multi-wallet clarity",
    body: "Pantau kas, bank, e-wallet, kartu kredit, dan paylater dalam satu permukaan yang tetap rapi saat datanya makin padat.",
    icon: Wallet,
  },
  {
    title: "Debt told straight",
    body: "Outstanding, sisa limit, debt ratio, dan status aman atau bahaya tetap tampil jujur tanpa dibungkus gamifikasi.",
    icon: ShieldCheck,
  },
  {
    title: "Installment intelligence",
    body: "Cicilan dipantau dari grand total, tenor berjalan, sampai due terdekat supaya keputusan bayar tidak menunggu kejutan tagihan.",
    icon: CalendarClock,
  },
];

const productSignals = [
  { label: "Access model", value: "Email & Google sign-in" },
  { label: "Deployment", value: "Cloud-ready private workspace" },
  { label: "Money engine", value: "IDR-first precise tracking" },
  { label: "Automation", value: "Webhook + n8n ready roadmap" },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-360 flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="surface-card sticky top-4 z-20 flex items-center justify-between gap-3 rounded-2xl border border-white/70 px-4 py-3 backdrop-blur sm:px-6 sm:py-4">
          <PocketMintLogo />
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/login"
              className={cn(
                buttonVariants({ variant: "outline" }),
                "hidden border-border/80 bg-card/70 px-4 sm:inline-flex"
              )}
            >
              Sign In
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants(),
                "bg-primary px-4 text-primary-foreground hover:bg-primary/92"
              )}
            >
              Get Started
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col justify-center py-8 lg:py-12">
          <section className="surface-grid relative overflow-hidden rounded-[28px] border border-white/70 bg-card/64 px-6 py-8 duration-700 animate-in fade-in-0 sm:px-8 lg:px-10 lg:py-10">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at top left, color-mix(in srgb, var(--color-primary) 12%, transparent), transparent 28%), radial-gradient(circle at bottom right, color-mix(in srgb, var(--color-warning) 10%, transparent), transparent 22%)",
              }}
            />
            <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_420px] lg:items-end">
              <div>
                <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/12 bg-card/85 px-3 py-1.5 text-[11px] font-semibold tracking-[0.08em] text-primary duration-700 animate-in fade-in-0 slide-in-from-bottom-2">
                  <ShieldCheck className="size-3.5" />
                  PRIVATE PERSONAL FINANCE TERMINAL
                </div>

                <h1 className="max-w-4xl font-heading text-4xl font-bold leading-[1.04] tracking-[-0.03em] text-foreground duration-700 animate-in fade-in-0 slide-in-from-bottom-3 sm:text-5xl lg:text-[64px]">
                  Financial clarity for people juggling assets, debt, and
                  cicilan in one private workspace.
                </h1>

                <p className="mt-6 max-w-3xl text-base leading-7 text-muted-foreground duration-700 animate-in fade-in-0 slide-in-from-bottom-3 [animation-delay:120ms] sm:text-lg">
                  Pocket Mint is a premium personal finance workspace built for
                  people who need net worth, debt, and cicilan to stay clearly
                  readable — precise, private, and always under your control.
                </p>

                <div className="mt-8 flex flex-col items-stretch gap-3 duration-700 animate-in fade-in-0 slide-in-from-bottom-3 [animation-delay:220ms] sm:flex-row sm:items-center">
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "group h-11 min-w-52 justify-between bg-primary px-4 text-primary-foreground hover:bg-primary/92"
                    )}
                  >
                    <span>Get Started</span>
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/login"
                    className={cn(
                      buttonVariants({ size: "lg", variant: "outline" }),
                      "h-11 justify-center border-border/80 bg-card/70 px-6"
                    )}
                  >
                    Sign In
                  </Link>
                </div>
              </div>

              <div className="surface-card rounded-[24px] border border-white/80 p-5 duration-700 animate-in fade-in-0 slide-in-from-bottom-4 [animation-delay:320ms]">
                <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
                  SYSTEM SIGNALS
                </p>
                <div className="mt-5 grid gap-3">
                  {productSignals.map((signal) => (
                    <div
                      key={signal.label}
                      className="rounded-2xl border border-border/80 bg-card/85 px-4 py-3"
                    >
                      <p className="text-[11px] font-semibold tracking-[0.08em] text-muted-foreground">
                        {signal.label.toUpperCase()}
                      </p>
                      <p className="mt-2 font-mono text-sm font-semibold text-foreground">
                        {signal.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="grid gap-4 md:grid-cols-3">
              {capabilityCards.map((card, index) => {
                const Icon = card.icon;

                return (
                  <article
                    key={card.title}
                    style={{ animationDelay: `${420 + index * 90}ms` }}
                    className="surface-card rounded-2xl border border-white/80 p-5 transition-transform hover:-translate-y-0.5 fill-mode-both animation-duration-[700ms] animate-in fade-in-0 slide-in-from-bottom-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl border border-primary/12 bg-primary/10 p-2 text-primary">
                        <Icon className="size-4" />
                      </div>
                      <h2 className="font-heading text-base font-semibold text-foreground">
                        {card.title}
                      </h2>
                    </div>
                    <p className="mt-4 text-sm leading-6 text-muted-foreground">
                      {card.body}
                    </p>
                  </article>
                );
              })}
            </div>

            <aside className="surface-card rounded-2xl border border-white/80 p-5 fill-mode-both animation-duration-[700ms] [animation-delay:690ms] animate-in fade-in-0 slide-in-from-bottom-4">
              <div className="flex items-center gap-2 text-primary">
                <Webhook className="size-4" />
                <p className="text-[11px] font-semibold tracking-[0.08em]">
                  CURRENT ROADMAP
                </p>
              </div>
              <h2 className="mt-3 font-heading text-xl font-semibold text-foreground">
                Automation-ready, but privacy still stays in your hands.
              </h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Next up: secure webhooks and n8n flows to ingest transaction
                notifications — automation that never trades away the privacy
                and precision at the core of the product.
              </p>
            </aside>
          </section>
        </main>
      </div>
    </div>
  );
}
