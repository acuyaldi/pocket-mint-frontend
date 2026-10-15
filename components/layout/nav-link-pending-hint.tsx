"use client";

import { useLinkStatus } from "next/link";

/**
 * Subtle, fixed-size dot rendered inside a `<Link>` to confirm a click
 * instantly when the destination hasn't finished prefetching. Reserves its
 * own space (no layout shift) and stays invisible once prefetch/navigation
 * is already fast — see `useLinkStatus` docs: most primary nav destinations
 * are prefetched, so this only surfaces on a genuinely slow transition.
 */
export function NavLinkPendingHint() {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden="true"
      className={`inline-block size-1.5 shrink-0 rounded-full bg-current transition-opacity delay-100 duration-200 ${
        pending ? "opacity-60 motion-safe:animate-pulse" : "opacity-0"
      }`}
    />
  );
}
