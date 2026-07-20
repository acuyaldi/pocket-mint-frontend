import { AppShell } from "@/components/layout/app-shell";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppTopbar } from "@/components/layout/app-topbar";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Toaster } from "@/components/ui/toaster";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      <AppSidebar />

      <AppShell>
        <AppTopbar />
        <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-6 px-5 py-6 pb-[calc(6.5rem+env(safe-area-inset-bottom))] md:px-10 md:pt-6 md:pb-10">
          {children}
        </div>
      </AppShell>

      <BottomNav />
      <Toaster />
    </div>
  );
}
