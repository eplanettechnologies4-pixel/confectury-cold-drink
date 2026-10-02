import type { Metadata } from "next";
import "./globals.css";
import { AppStateProvider } from "@/lib/store";
import { AppLayout } from "@/components/layout/AppLayout";

export const metadata: Metadata = {
  title: "Ahmad Traders — Confectionery & Cold Drinks Distribution ERP",
  description: "Official wholesale distribution ERP for Ahmad Traders. Khuram Chowk, Tezab Mills Road, Faisalabad, Pakistan. Ph: 03057165320 / 03040402614",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AppStateProvider>
          <AppLayout>{children}</AppLayout>
        </AppStateProvider>
      </body>
    </html>
  );
}
