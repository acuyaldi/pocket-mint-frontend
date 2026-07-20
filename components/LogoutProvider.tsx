"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { logout as logoutAction } from "@/app/actions/auth";
import { FullPageLoader } from "@/components/ui/full-page-loader";
import { toast } from "@/components/ui/toaster";

interface LogoutContextValue {
  isLoggingOut: boolean;
  handleLogout: () => void;
}

const LogoutContext = createContext<LogoutContextValue | null>(null);

// Single logout state shared by every trigger (desktop sidebar, mobile
// account menu, future ones) so the full-page loader survives the menu that
// opened it closing, and duplicate clicks can't fire a second logout.
export function LogoutProvider({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const pending = useRef(false);
  const pathname = usePathname();
  const [prevPathname, setPrevPathname] = useState(pathname);

  const handleLogout = useCallback(() => {
    if (pending.current) return;
    pending.current = true;
    setIsLoggingOut(true);

    logoutAction().then((result) => {
      // logout() redirects on success; a return value only happens when
      // sign-out failed and the user never left this page. On success the
      // pathname-change effect below clears the loader once the logged-out
      // route has actually mounted.
      if (result?.error) {
        pending.current = false;
        setIsLoggingOut(false);
        toast(t("logoutFailed"), "error");
      }
    });
  }, [t]);

  // Adjusting state during render (React's documented pattern for reacting
  // to a changed value) instead of an effect — the loader must clear in the
  // same commit the new route mounts, not one tick later.
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (isLoggingOut) setIsLoggingOut(false);
  }

  // Keep the re-entrancy guard in sync with the state it mirrors; a ref
  // write belongs in an effect, not the render branch above.
  useEffect(() => {
    pending.current = isLoggingOut;
  }, [isLoggingOut]);

  return (
    <LogoutContext.Provider value={{ isLoggingOut, handleLogout }}>
      {children}
      {isLoggingOut ? <FullPageLoader label={t("loggingOut")} /> : null}
    </LogoutContext.Provider>
  );
}

export function useLogout() {
  const ctx = useContext(LogoutContext);
  if (!ctx) throw new Error("useLogout must be used within LogoutProvider");
  return ctx;
}
