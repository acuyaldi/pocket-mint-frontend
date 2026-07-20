"use client";

import { PocketMintLogo } from "@/components/Logo";

interface FullPageLoaderProps {
  label: string;
}

// Blocking full-viewport transition state — not a dialog. No close button,
// no Escape/backdrop dismissal; it disappears only when the caller stops
// rendering it. Kept separate from the modal primitives on purpose.
export function FullPageLoader({ label }: FullPageLoaderProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-busy="true"
      className="fixed inset-0 z-150 flex flex-col items-center justify-center gap-4 bg-background"
    >
      <PocketMintLogo
        markSize={40}
        showText={false}
        wrapperClassName="text-primary motion-safe:animate-pulse"
      />
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}
