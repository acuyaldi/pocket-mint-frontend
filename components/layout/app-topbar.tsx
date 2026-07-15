"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function formatTopbarDate(date: Date) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function AppTopbar() {
  const [accountLabel, setAccountLabel] = useState("Akun");
  const currentDate = useMemo(() => formatTopbarDate(new Date()), []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active || !user) return;
      const meta = user.user_metadata ?? {};
      setAccountLabel(meta.full_name || meta.name || user.email || "Akun");
    });

    return () => {
      active = false;
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 hidden h-16 shrink-0 items-center justify-between bg-background/85 px-10 backdrop-blur-sm md:flex">
      <div className="flex flex-col">
        <p className="text-xs text-muted-foreground">
          Welcome{" "}
          <span className="font-semibold text-primary">{accountLabel}</span>
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{currentDate}</p>
      </div>
      <button
        type="button"
        aria-label="Notifikasi"
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-surface-high hover:text-primary active:scale-95"
      >
        <Bell className="size-5" />
      </button>
    </header>
  );
}
