import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "جهاز غير مدعوم",
  description: "تعليمات التوافق المطلوبة لاستخدام Aya Mobile على جهاز أو متصفح مناسب."
};

export default function UnsupportedDevicePage() {
  return (
    <main className="unsupported-shell">
      <section className="unsupported-panel">
        <p className="eyebrow">التوافق مع الجهاز</p>
        <h1>هذا المتصفح أو الجهاز غير مدعوم حاليًا</h1>
        <p>
          الجلسة الحالية لا تطابق سياسة تشغيل Aya Mobile. استخدم Chrome أو Edge
          أو Safari أو Firefox بإصدار حديث، وعلى هاتف أو تابلت أو لابتوب أو
          ديسكتوب مدعوم.
        </p>
      </section>
    </main>
  );
}
