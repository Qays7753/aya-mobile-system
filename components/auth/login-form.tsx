"use client";

import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, KeyRound, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { StatusBanner } from "@/components/ui/status-banner";
import { getSafeArabicErrorMessage } from "@/lib/error-messages";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const REMEMBERED_EMAIL_KEY = "aya.login.email";
const POST_LOGIN_CONTINUE_ROUTE = "/auth/continue";
const NAVIGATION_FAILSAFE_MS = 8000;

export function LoginForm() {
  const router = useRouter();
  const submitLockRef = useRef(false);
  const navigationFailSafeRef = useRef<number | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(true);

  useEffect(() => {
    setIsOffline(!navigator.onLine);

    try {
      const storedEmail = window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
      if (storedEmail) {
        setEmail(storedEmail);
        setRememberEmail(true);
      }
    } catch {
      // Ignore storage issues and keep the form usable.
    }

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      if (navigationFailSafeRef.current) {
        clearTimeout(navigationFailSafeRef.current);
      }
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  function releaseSubmitState() {
    submitLockRef.current = false;
    setIsPending(false);
  }

  function clearNavigationFailSafe() {
    if (navigationFailSafeRef.current) {
      clearTimeout(navigationFailSafeRef.current);
      navigationFailSafeRef.current = null;
    }
  }

  function clearError() {
    if (errorMessage) {
      setErrorMessage(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitLockRef.current || isPending) {
      return;
    }

    const normalizedEmail = email.trim();
    let didRequestRedirect = false;

    setEmail(normalizedEmail);
    setErrorMessage(null);
    setIsPending(true);
    submitLockRef.current = true;

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password
      });

      if (error) {
        const message = getSafeArabicErrorMessage(
          error,
          "تعذر إكمال تسجيل الدخول. حاول مجددًا."
        );
        setErrorMessage(message);
        toast.error(message);
        return;
      }

      try {
        if (rememberEmail) {
          window.localStorage.setItem(REMEMBERED_EMAIL_KEY, normalizedEmail);
        } else {
          window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
        }
      } catch {
        // Browser storage is optional for the login flow.
      }

      clearNavigationFailSafe();
      navigationFailSafeRef.current = window.setTimeout(() => {
        navigationFailSafeRef.current = null;
        const message = "تم تسجيل الدخول لكن تعذر فتح مساحة العمل. حاول مرة أخرى.";
        setErrorMessage(message);
        toast.error(message);
        releaseSubmitState();
      }, NAVIGATION_FAILSAFE_MS);

      didRequestRedirect = true;
      router.replace(POST_LOGIN_CONTINUE_ROUTE);
      router.refresh();
    } catch (error) {
      clearNavigationFailSafe();
      const message = getSafeArabicErrorMessage(
        error,
        "تعذر إكمال تسجيل الدخول. حاول مجددًا."
      );
      setErrorMessage(message);
      toast.error(message);
    } finally {
      if (!didRequestRedirect) {
        releaseSubmitState();
      }
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        {isOffline ? (
          <StatusBanner
            variant="offline"
            title="الاتصال غير متاح"
            message="يبدو أن الجهاز غير متصل حاليًا."
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

        <div className="input-group">
          <label htmlFor="email">البريد الإلكتروني</label>
          <div className="input-wrapper">
            <Mail className="icon" size={20} aria-hidden="true" />
            <input
              type="email"
              id="email"
              name="email"
              className="input-field"
              placeholder="أدخل البريد الإلكتروني"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                clearError();
              }}
              autoFocus
              required
              dir="ltr"
            />
          </div>
        </div>

        <div className="input-group">
          <label htmlFor="password">كلمة المرور</label>
          <div className="input-wrapper password-input">
            <KeyRound className="icon" size={20} aria-hidden="true" />
            <input
              type={isPasswordVisible ? "text" : "password"}
              id="password"
              name="password"
              className="input-field"
              placeholder="••••••••"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                clearError();
              }}
              required
              dir="ltr"
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
              aria-label={isPasswordVisible ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
              aria-pressed={isPasswordVisible}
              disabled={isPending}
            >
              {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <div className="form-options">
          <label className="remember-me">
            <input
              type="checkbox"
              checked={rememberEmail}
              onChange={(event) => setRememberEmail(event.target.checked)}
            />
            <span>تذكّر البريد على هذا الجهاز</span>
          </label>
          <a href="#" className="forgot-password">نسيت كلمة المرور؟</a>
        </div>

        <button type="submit" className="btn-submit" disabled={isPending}>
          {isPending ? <Loader2 className="spin" aria-hidden="true" size={20} /> : undefined}
          <span>تسجيل الدخول</span>
        </button>
      </form>
    </>
  );
}
