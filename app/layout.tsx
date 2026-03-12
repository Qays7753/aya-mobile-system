import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { JetBrains_Mono, Tajawal } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--aya-font-body",
  display: "swap"
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--aya-font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: {
    default: "Aya Mobile",
    template: "%s | Aya Mobile"
  },
  description: "نظام تشغيل للمبيعات والمخزون والمحاسبة اليومية على الهاتف والتابلت والكمبيوتر.",
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
      <body className={`${tajawal.variable} ${jetBrainsMono.variable} aya-shell`}>
        {children}
        <Toaster position="top-center" richColors closeButton />
      </body>
    </html>
  );
}
