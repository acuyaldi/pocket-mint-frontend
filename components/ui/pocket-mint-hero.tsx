"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { LockKeyhole } from "lucide-react";

import { PocketMintLogo } from "@/components/Logo";
import { PulseBeams } from "@/components/ui/pulse-beams";
import dashboard from "@/playwright/screenshots/dashboard.png";


function enter(delay: number, y = 20, reducedMotion = false) {
  return {
    initial: reducedMotion ? false : { opacity: 0, y },
    animate: { opacity: 1, y: 0 },
    transition: {
      delay: reducedMotion ? 0 : delay,
      duration: reducedMotion ? 0 : y === 40 ? 0.8 : 0.5,
    },
  };
}

const landingNavLink =
  "relative inline-flex min-h-11 items-center text-sm font-medium text-foreground transition-colors duration-200 ease-out after:absolute after:inset-x-0 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:bg-mint after:transition-transform after:duration-200 after:ease-out hover:text-primary hover:after:scale-x-100 focus-visible:after:scale-x-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring";

export function PocketMintHero() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <>
      <header className="sticky top-4 z-30 mx-auto mt-4 w-[calc(100%-2.5rem)] max-w-7xl">
        <nav
          aria-label="Navigasi utama"
          className="flex min-h-16 items-center justify-between rounded-xl border border-border bg-background/95 px-4 py-2 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-center gap-6">
            <Link href="/" className="inline-flex min-h-11 items-center text-primary">
              <PocketMintLogo />
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              <Link href="#privacy" className={landingNavLink}>
                Privasi
              </Link>
              <Link href="#features" className={landingNavLink}>
                Fitur
              </Link>
              <Link href="#whats-new" className={landingNavLink}>
                Changelog
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-muted-foreground transition-colors duration-200 ease-out hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Login
            </Link>
            <Link
              href="/login?mode=register"
              className="landing-cta-sweep inline-flex min-h-11 rounded-[40px] items-center justify-center bg-primary px-[50px] py-[17px] text-base font-medium leading-[27px] text-primary-foreground shadow-sm hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:bg-primary/85"
            >
              <span>Daftar</span>
            </Link>
          </div>
        </nav>
      </header>

      <div className="mx-auto w-full max-w-7xl px-5">
        <div className="relative isolate overflow-hidden px-0 sm:px-2">
          <PulseBeams variant="hero" className="text-primary opacity-75" />
          <section className="relative z-10 w-full py-16 md:py-24">
          <motion.div
            className="flex flex-col items-center gap-6 text-center"
            {...enter(0, 20, reducedMotion)}
          >
            <motion.div
              {...enter(0.1, 20, reducedMotion)}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-secondary"
            >
              <LockKeyhole aria-hidden="true" className="size-4" strokeWidth={1.75} />
              <span className="text-xs font-medium tracking-[0.02em]">Private &amp; Secured</span>
            </motion.div>

            <motion.h1
              {...enter(0.2, 20, reducedMotion)}
              className="max-w-5xl text-balance text-[clamp(3rem,7vw,5.5rem)] font-semibold leading-[0.98] tracking-[-0.045em] text-primary"
            >
              Clarity Over Complexity
            </motion.h1>

            <motion.p
              {...enter(0.3, 20, reducedMotion)}
              className="mx-auto max-w-2xl text-base leading-6 text-muted-foreground sm:text-xl sm:leading-8"
            >
              Pahami apa yang Anda miliki, apa yang Anda tanggung, dan apa yang perlu diperhatikan. Tanpa distraksi.
            </motion.p>

            <motion.div
              {...enter(0.4, 20, reducedMotion)}
              className="flex w-full flex-col justify-center gap-4 sm:w-auto sm:flex-row"
            >
              <Link
                href="/login"
                className="landing-cta-sweep inline-flex min-h-11 rounded-[40px] items-center justify-center bg-primary px-[50px] py-[17px] text-base font-medium leading-[27px] text-primary-foreground shadow-sm hover:text-primary focus-visible:text-primary focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring active:bg-primary/85"
              >
                <span>Mulai Sekarang</span>
              </Link>

            </motion.div>

          </motion.div>

          <motion.div
            {...enter(0.5, 40, reducedMotion)}
            className="relative mt-12 w-full rounded-3xl border border-border bg-card p-2 md:mt-16"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <Image
                src={dashboard}
                alt="Dashboard Pocket Mint"
                width={569}
                height={552}
                sizes="(max-width: 1024px) calc(100vw - 40px), 1024px"
                className="h-auto w-full object-contain"
                preload
              />
            </div>
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 rounded-b-3xl bg-linear-to-t from-background to-transparent" />
          </motion.div>
          </section>
        </div>
      </div>
    </>
  );
}
