import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="baseline-shell">
      <section className="compatibility-strip" aria-label="login quick links">
        <span>الدخول مخصص لحسابات Admin / POS النشطة</span>
        <Link href="/" className="secondary-button">
          العودة إلى الصفحة الرئيسية
        </Link>
      </section>

      <LoginForm />
    </main>
  );
}
