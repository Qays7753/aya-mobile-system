import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "تنظيف الكاش المحلي",
  description: "تنظيف Service Worker والكاش المحلي لنسخة التطوير."
};

const resetScript = `
  (async function resetAyaLocalCache() {
    const status = document.getElementById("reset-cache-status");
    const setStatus = (message) => {
      if (status) status.textContent = message;
    };

    try {
      setStatus("جارٍ إلغاء Service Worker القديم ومسح الكاش...");

      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }

      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(
          keys
            .filter((key) => key.startsWith("aya-mobile"))
            .map((key) => caches.delete(key))
        );
      }

      setStatus("تم تنظيف الكاش المحلي. سيتم تحويلك الآن إلى تسجيل الدخول.");

      window.setTimeout(() => {
        window.location.replace("/login?fresh=" + Date.now());
      }, 900);
    } catch (error) {
      console.error(error);
      setStatus("تعذر تنظيف الكاش تلقائيًا. أغلق الصفحة وافتحها من جديد أو استخدم أدوات المتصفح لمسح بيانات الموقع.");
    }
  })();
`;

export default function ResetCachePage() {
  return (
    <main className="auth-page">
      <section className="auth-shell auth-shell--compact">
        <div className="auth-card">
          <div className="auth-card__content">
            <span className="auth-badge">تنظيف محلي</span>
            <h1 className="auth-title">إعادة ضبط نسخة المتصفح المحلية</h1>
            <p className="auth-description">
              هذه الصفحة تنظف Service Worker والكاش المحلي لواجهة Aya Mobile على جهازك فقط.
            </p>
            <div className="auth-inline-note">
              <strong id="reset-cache-status">جارٍ تحضير أداة التنظيف...</strong>
            </div>
            <a className="secondary-button" href="/login">
              العودة يدويًا إلى تسجيل الدخول
            </a>
          </div>
        </div>
      </section>
      <script dangerouslySetInnerHTML={{ __html: resetScript }} />
    </main>
  );
}
