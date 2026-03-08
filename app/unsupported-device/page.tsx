export default function UnsupportedDevicePage() {
  return (
    <main className="unsupported-shell">
      <section className="unsupported-panel">
        <p className="eyebrow">Device Policy</p>
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
