import Link from "next/link";
import { InstallPrompt } from "@/components/runtime/install-prompt";

export default function HomePage() {
  return (
    <main className="baseline-shell">
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <p className="eyebrow">PX-05 Reports + Snapshot + Integrity + Device</p>
          <h1>Aya Mobile</h1>
          <p className="hero-panel__lead">
            خط الأساس الحالي لا يقتصر على البيع فقط. المرحلة الحالية تضيف اللقطة اليومية، تقارير
            التشغيل، فحص النزاهة، ومسارات الدين والفواتير بشكل جاهز للتشغيل على الهاتف والتابلت
            واللابتوب.
          </p>
        </div>

        <dl className="hero-metrics" aria-label="baseline checkpoints">
          <div>
            <dt>الأجهزة</dt>
            <dd>Phone / Tablet / Laptop / Desktop</dd>
          </div>
          <div>
            <dt>النقاط المرجعية</dt>
            <dd>360 / 768 / 1024+</dd>
          </div>
          <div>
            <dt>الوضع</dt>
            <dd>Online-only</dd>
          </div>
        </dl>
      </section>

      <section className="baseline-grid" aria-label="baseline sections">
        <article className="baseline-card">
          <p className="eyebrow">Daily Ops</p>
          <h2>تشغيل يومي حقيقي</h2>
          <p>
            صفحة الإعدادات والإدارة أصبحت نقطة تشغيل للّقطة اليومية، فحص الأرصدة، التسوية، وإكمال
            الجرد بدون القفز خارج العقد المالي.
          </p>
        </article>

        <article className="baseline-card">
          <p className="eyebrow">Reports</p>
          <h2>ملخصات وتقارير قابلة للفلترة</h2>
          <p>
            أصبح هناك سطح واضح لهيستوري المبيعات، أحدث اللقطات، الديون، الحسابات، وتنبيهات المخزون
            المنخفض مع فلاتر تاريخ/موظف/جهاز/حالة.
          </p>
        </article>

        <article className="baseline-card">
          <p className="eyebrow">Device Readiness</p>
          <h2>جاهزية التشغيل على كل الأجهزة</h2>
          <p>
            نفس المسارات التشغيلية الرئيسية أصبحت قابلة للمراجعة على الهاتف والتابلت واللابتوب،
            مع baseline للطباعة وتثبيت التطبيق والجلسة الموحدة.
          </p>
        </article>
      </section>

      <section className="baseline-actions" aria-label="px-05 entry points">
        <Link href="/login" className="baseline-link-card">
          <p className="eyebrow">Access</p>
          <h2>تسجيل الدخول</h2>
          <p>فتح الجلسة التشغيلية لاختبار Admin/POS على المسارات المحمية.</p>
        </Link>

        <Link href="/products" className="baseline-link-card">
          <p className="eyebrow">PX-03 Baseline</p>
          <h2>قائمة المنتجات الآمنة</h2>
          <p>قراءة مباشرة من المسار الآمن مع الحفاظ على Blind POS.</p>
        </Link>

        <Link href="/pos" className="baseline-link-card baseline-link-card--accent">
          <p className="eyebrow">PX-03 + PX-05</p>
          <h2>شاشة نقطة البيع</h2>
          <p>سلة محلية + create_sale + idempotency + نقطة انطلاق لاختبار الأجهزة.</p>
        </Link>

        <Link href="/invoices" className="baseline-link-card">
          <p className="eyebrow">PX-04 / PX-05</p>
          <h2>الفواتير والمرتجعات</h2>
          <p>قائمة فواتير حديثة مع مرتجع وتشغيل baseline للطباعة.</p>
        </Link>

        <Link href="/debts" className="baseline-link-card">
          <p className="eyebrow">PX-04 / PX-05</p>
          <h2>الديون والتسديد</h2>
          <p>عرض العملاء المستحقين مع دين يدوي وتسديد FIFO من نفس الواجهة.</p>
        </Link>

        <Link href="/reports" className="baseline-link-card">
          <p className="eyebrow">PX-05-T01</p>
          <h2>التقارير</h2>
          <p>فلاتر مبيعات + آخر اللقطات + حسابات + ديون + مخزون منخفض.</p>
        </Link>

        <Link href="/settings" className="baseline-link-card">
          <p className="eyebrow">PX-05-T02..T06</p>
          <h2>الإعدادات التشغيلية</h2>
          <p>حفظ لقطة يومية، فحص الأرصدة، التسوية، وإكمال الجرد من سطح واحد.</p>
        </Link>
      </section>

      <InstallPrompt />

      <section className="compatibility-strip" aria-label="supported targets">
        <span>Chrome / Edge: دعم كامل</span>
        <span>Safari / Firefox: دعم للوظائف الأساسية</span>
        <span>اللغة الأساسية: العربية RTL</span>
      </section>
    </main>
  );
}
