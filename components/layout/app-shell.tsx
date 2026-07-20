"use client";

import { useLayoutEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Next.js's built-in Link scroll-to-top walks top-level siblings of the
// navigated segment looking for a scrollable element — it never reaches this
// nested <main>, so it was left at its previous scrollTop after every menu
// navigation. Reset it here instead, keyed on pathname only (not search
// params) so in-page filters/tabs don't trigger a jump.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const scrollRef = useRef<HTMLElement>(null);
  const prevPathname = useRef(pathname);

  useLayoutEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    scrollRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return (
    <main ref={scrollRef} className="min-w-0 flex-1 overflow-y-auto bg-background">
      {children}
    </main>
  );
}
