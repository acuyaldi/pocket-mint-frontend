import type { Metadata, Viewport } from "next";
import QueryProvider from "@/components/QueryProvider";
import "./globals.css";

// viewport-fit=cover is required for env(safe-area-inset-*) to be non-zero on iOS
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Pocket Mint - Ruang Kerja Finansial Privat",
  description:
    "Pantau aset, hutang, cicilan, dan aktivitas keuangan pribadi dalam satu ruang kerja privat.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans antialiased bg-background text-foreground">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
