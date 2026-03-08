import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aya Mobile",
  description: "Aya Mobile ERP/POS web app baseline for phone, tablet, laptop, and desktop.",
  applicationName: "Aya Mobile",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Aya Mobile",
    statusBarStyle: "default"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="aya-shell">
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
