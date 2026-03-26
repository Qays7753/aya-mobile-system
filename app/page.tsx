import Link from "next/link";
import type { Metadata } from "next";
import { InstallPrompt } from "@/components/runtime/install-prompt";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "نظام تشغيل يومي للبيع والمخزون والتقارير."
};

export default function HomePage() {
  return (
    <main className="baseline-shell baseline-shell--auth login-shell">
      <section className="compatibility-strip" aria-label="روابط سريعة">
        <span>Aya Mobile - نظام تشغيل المتجر</span>
        <Link href="/pos" className="secondary-button">
          نقطة البيع المباشرة
        </Link>
      </section>

      <LoginForm />

      <div style={{ maxWidth: '400px', margin: '2rem auto 0', padding: '0 1rem' }}>
        <InstallPrompt />
      </div>
    </main>
  );
}
