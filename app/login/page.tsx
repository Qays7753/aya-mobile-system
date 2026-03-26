import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "سجّل الدخول للوصول إلى بيئة التشغيل."
};

export default function LoginPage() {
  return (
    <main className="baseline-shell baseline-shell--auth">
      <LoginForm />
    </main>
  );
}
