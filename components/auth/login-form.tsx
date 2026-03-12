"use client";

import React from "react";
import { useEffect, useState, useTransition } from "react";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBanner } from "@/components/ui/status-banner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(() => (typeof navigator === "undefined" ? false : !navigator.onLine));
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  function clearError() {
    if (errorMessage) {
      setErrorMessage(null);
    }
  }

  return (
    <div className="login-grid">
      <section className="workspace-panel login-panel">
        <div className="workspace-hero">
          <div>
            <p className="eyebrow">الوصول الآمن</p>
            <h1>تسجيل الدخول إلى مساحة العمل</h1>
            <p className="workspace-lead">
              سجّل الدخول بالحساب المخصص لك للوصول إلى نقطة البيع أو المساحات الإدارية ومتابعة
              العمل اليومي من شاشة واحدة.
            </p>
          </div>
        </div>

        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            setErrorMessage(null);

            startTransition(() => {
              void (async () => {
                try {
                  const supabase = createSupabaseBrowserClient();
                  const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                  });

                  if (error) {
                    setErrorMessage(error.message);
                    toast.error(error.message);
                    return;
                  }

                  await supabase.auth.getSession();
                  router.replace("/pos");
                  router.refresh();
                } catch (error) {
                  const message = (error as Error).message || "تعذر إكمال تسجيل الدخول الآن.";
                  setErrorMessage(message);
                  toast.error(message);
                }
              })();
            });
          }}
        >
          {isOffline ? (
            <StatusBanner
              variant="offline"
              title="الاتصال غير متاح"
              message="لا يمكن إكمال تسجيل الدخول بدون اتصال نشط. تحقق من الشبكة ثم أعد المحاولة."
            />
          ) : null}

          {errorMessage ? (
            <StatusBanner
              variant="danger"
              title="تعذر تسجيل الدخول"
              message={errorMessage}
              onDismiss={() => setErrorMessage(null)}
            />
          ) : null}

          <label className="stack-field">
            <span>البريد الإلكتروني</span>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearError();
              }}
              placeholder="admin@aya.local"
              required
            />
          </label>

          <label className="stack-field">
            <span>كلمة المرور</span>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearError();
              }}
              placeholder="••••••••"
              required
            />
          </label>

          <button type="submit" className="primary-button" disabled={isPending || isOffline}>
            {isPending ? (
              <>
                <Loader2 className="spin" size={16} />
                جارٍ تسجيل الدخول...
              </>
            ) : (
              <>
                <LogIn size={16} />
                الدخول إلى بيئة التشغيل
              </>
            )}
          </button>
        </form>
      </section>

      <aside className="workspace-panel login-panel login-panel--accent">
        <p className="eyebrow">جاهزية التشغيل</p>
        <h2>ما الذي ستجده بعد الدخول؟</h2>
        <div className="workspace-stack">
          <article className="baseline-card">
            <div className="hero-stat-card hero-stat-card--safe">
              <ShieldCheck size={18} />
              <strong>الهاتف والتابلت والكمبيوتر</strong>
            </div>
            <p>
              نفس المهام الأساسية متاحة على مختلف الأجهزة مع واجهة واحدة واضحة وسهلة المتابعة.
            </p>
          </article>

          <article className="baseline-card">
            <h3>المسارات المتاحة</h3>
            <p>
              البيع، الفواتير، الديون، الإشعارات، والتقارير تظهر حسب دورك والصلاحيات الممنوحة لك.
            </p>
          </article>
        </div>
      </aside>
    </div>
  );
}
