import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const appShellSource = readFileSync(root + "components/layout/app-shell.tsx", "utf8");
const layoutSource = readFileSync(root + "app/(app)/layout.tsx", "utf8");
const sidebarSource = readFileSync(root + "components/layout/app-sidebar.tsx", "utf8");
const bottomNavSource = readFileSync(root + "components/layout/bottom-nav.tsx", "utf8");

describe("AppShell scroll reset source contract", () => {
  it("owns the real scroll container via a ref instead of relying on window scroll", () => {
    expect(appShellSource).toContain("scrollRef");
    expect(appShellSource).toContain('ref={scrollRef}');
    expect(appShellSource).toContain("overflow-y-auto");
  });

  it("resets on pathname change, not on every rerender", () => {
    expect(appShellSource).toContain("usePathname()");
    expect(appShellSource).toContain("prevPathname.current === pathname) return");
    expect(appShellSource).toContain("[pathname]");
  });

  it("resets immediately (no smooth scroll, no timers)", () => {
    expect(appShellSource).toContain('behavior: "auto"');
    expect(appShellSource).not.toContain("smooth");
    expect(appShellSource).not.toContain("setTimeout");
  });

  it("uses useLayoutEffect so the reset lands before paint, not useEffect", () => {
    expect(appShellSource).toContain("useLayoutEffect");
  });
});

describe("AppLayout wires the shared shell instead of a per-page reset", () => {
  it("both desktop and mobile navigation render through the single AppShell", () => {
    expect(layoutSource).toContain("<AppShell>");
    expect(layoutSource).toContain("<AppSidebar");
    expect(layoutSource).toContain("<BottomNav");
    // sidebar and bottom nav are outside AppShell (persistent chrome), only
    // routed page content goes through the scroll-owning shell
    expect(layoutSource).not.toContain("overflow-y-auto");
  });

  it("no primary menu link opts out of navigation via scroll={false}", () => {
    expect(sidebarSource).not.toContain("scroll={false}");
    expect(bottomNavSource).not.toContain("scroll={false}");
  });
});
