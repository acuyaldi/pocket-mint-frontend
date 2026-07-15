"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { LockKeyhole } from "lucide-react";

import { PocketMintLogo } from "@/components/Logo";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

export function PocketMintHero() {
  const reducedMotion = useReducedMotion() ?? false;

  return (
    <div className="mx-auto w-full max-w-5xl px-5">
      <header className="relative pt-4">
        <nav
          aria-label="Navigasi utama"
          className="flex min-h-16 items-center justify-between rounded-xl border border-border bg-background px-4 py-2 shadow-sm"
        >
          <div className="flex items-center gap-6">
            <Link href="/" className="inline-flex min-h-11 items-center text-primary">
              <PocketMintLogo />
            </Link>
            <div className="hidden items-center gap-6 md:flex">
              <Link href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Fitur
              </Link>
              <Link href="#privacy" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Privasi
              </Link>
              <Link href="#about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Tentang Kami
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/login" className="inline-flex min-h-11 items-center px-3 text-sm text-muted-foreground hover:text-foreground">
              Login
            </Link>
            <Link
              href="/login"
              className={cn(
                buttonVariants({ size: "lg" }),
                "min-h-11 rounded-full px-4 shadow-sm shadow-primary/10"
              )}
            >
              Daftar
            </Link>
          </div>
        </nav>
      </header>

      <div className="relative px-0 sm:px-2">
        <section className="w-full py-16 md:py-24">
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
              className="max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-primary sm:text-5xl md:text-6xl lg:text-7xl"
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
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "min-h-11 rounded-xl px-6 shadow-sm shadow-primary/10"
                )}
              >
                Mulai Sekarang
              </Link>
              <Link
                href="#features"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "min-h-11 rounded-xl px-6"
                )}
              >
                Lihat Demo
              </Link>
            </motion.div>

          </motion.div>

          <motion.div
            {...enter(0.5, 40, reducedMotion)}
            className="mt-12 w-full rounded-3xl border border-border bg-card p-2 md:mt-16"
          >
            <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <Image
                src="/landing/dashboard-clean.png"
                alt="Dashboard Pocket Mint dari ekspor Google Stitch"
                width={569}
                height={552}
                sizes="(max-width: 1024px) calc(100vw - 40px), 1024px"
                className="h-auto w-full object-contain"
                preload
              />
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
}
