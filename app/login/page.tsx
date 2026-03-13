import Link from "next/link";
import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجّل الدخول للوصول إلى نقطة البيع أو المساحات الإدارية حسب صلاحيتك."
};

export default function LoginPage() {
  return (
    <main className="baseline-shell baseline-shell--auth login-shell">
      <section className="compatibility-strip" aria-label="روابط سريعة">
        <span>الدخول متاح للحسابات النشطة بحسب الصلاحية الممنوحة لها</span>
        <Link href="/" className="secondary-button">
          العودة إلى الصفحة الرئيسية
        </Link>
      </section>

      <LoginForm />
    </main>
  );
}
