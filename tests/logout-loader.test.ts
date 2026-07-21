import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const root = fileURLToPath(new URL("../", import.meta.url));
const providerSource = readFileSync(root + "components/LogoutProvider.tsx", "utf8");
const loaderSource = readFileSync(root + "components/ui/full-page-loader.tsx", "utf8");
const rootLayoutSource = readFileSync(root + "app/layout.tsx", "utf8");
const sidebarSource = readFileSync(root + "components/layout/app-sidebar.tsx", "utf8");
const accountMenuSource = readFileSync(root + "components/layout/account-menu.tsx", "utf8");
const authActionsSource = readFileSync(root + "app/actions/auth.ts", "utf8");

describe("LogoutProvider source contract", () => {
  it("guards against duplicate logout submissions", () => {
    expect(providerSource).toContain("pending.current");
    expect(providerSource).toContain("if (pending.current) return");
  });

  it("sets pending state immediately, synchronously, before the async call", () => {
    const handleLogoutIndex = providerSource.indexOf("const handleLogout");
    const setPendingIndex = providerSource.indexOf("setIsLoggingOut(true)");
    const actionCallIndex = providerSource.indexOf("logoutAction()");
    expect(setPendingIndex).toBeGreaterThan(handleLogoutIndex);
    expect(actionCallIndex).toBeGreaterThan(setPendingIndex);
  });

  it("clears the loader and shows a toast on failure", () => {
    expect(providerSource).toContain("result?.error");
    expect(providerSource).toContain("setIsLoggingOut(false)");
    expect(providerSource).toContain('toast(t("logoutFailed")');
  });

  it("clears the loader on the pathname-change signal (destination route mounted), not eagerly on promise resolution", () => {
    expect(providerSource).toContain("usePathname()");
    expect(providerSource).toContain("prevPathname !== pathname");
  });

  it("renders the full-page loader from context state, not inside a dropdown", () => {
    expect(providerSource).toContain("isLoggingOut ? <FullPageLoader");
  });

  it("is mounted at the root layout so it survives route changes across (app) and public segments", () => {
    expect(rootLayoutSource).toContain("<LogoutProvider>");
  });
});

describe("FullPageLoader source contract", () => {
  it("is not a modal/dialog primitive", () => {
    expect(loaderSource).not.toContain("Dialog");
    expect(loaderSource).not.toContain("onOpenChange");
  });

  it("blocks the full viewport above other stacking contexts", () => {
    expect(loaderSource).toContain("fixed inset-0");
    expect(loaderSource).toContain("z-150");
  });

  it("has accessible loading semantics", () => {
    expect(loaderSource).toContain('role="alert"');
    expect(loaderSource).toContain('aria-live="assertive"');
    expect(loaderSource).toContain('aria-busy="true"');
  });

  it("respects reduced motion via the motion-safe variant instead of an unconditional animation class", () => {
    expect(loaderSource).toContain("motion-safe:animate-pulse");
    expect(loaderSource).not.toMatch(/className="[^"]*\banimate-pulse\b[^"]*"/);
  });

  it("reuses the existing logo component instead of a new spinner asset", () => {
    expect(loaderSource).toContain("PocketMintLogo");
  });
});

describe("Desktop and mobile logout triggers share the same action/state", () => {
  it("app sidebar uses the shared useLogout hook", () => {
    expect(sidebarSource).toContain('useLogout } from "@/components/LogoutProvider"');
    expect(sidebarSource).toContain("const { handleLogout } = useLogout()");
    expect(sidebarSource).not.toContain("async function handleLogout");
  });

  it("account menu (used by mobile bottom nav) uses the shared useLogout hook", () => {
    expect(accountMenuSource).toContain('useLogout } from "@/components/LogoutProvider"');
    expect(accountMenuSource).toContain("const { handleLogout } = useLogout()");
  });
});

describe("Logout server action navigation safety", () => {
  it("replaces history on sign-out so Back cannot return to the authenticated route", () => {
    expect(authActionsSource).toContain("RedirectType.replace");
  });
});
