import Link from "next/link";
import type { Metadata } from "next";
import { InstallPrompt } from "@/components/runtime/install-prompt";

export const metadata: Metadata = {
  title: "الصفحة الرئيسية",
  description: "نقطة البداية للوصول إلى البيع والمنتجات والفواتير والتقارير وإعدادات التشغيل."
};

export default function HomePage() {
  return (
    <main className="baseline-shell baseline-shell--landing">
      <section className="hero-panel hero-panel--landing">
        <div className="hero-panel__copy">
          <p className="eyebrow">لوحة تشغيل موحدة</p>
          <h1>Aya Mobile</h1>
          <p className="hero-panel__lead">
            نظام تشغيل يومي للمبيعات والمخزون والدين والفواتير، مصمم ليعمل بسلاسة على الهاتف
            والتابلت والكمبيوتر مع مسارات واضحة لكل دور.
          </p>

          <div className="hero-panel__actions">
            <Link href="/login" className="primary-button">
              ابدأ جلسة العمل
            </Link>
            <Link href="/pos" className="secondary-button">
              معاينة نقطة البيع
            </Link>
          </div>
        </div>

        <div className="hero-panel__visual">
          <dl className="hero-metrics" aria-label="جاهزية التشغيل">
            <div>
              <dt>الأجهزة</dt>
              <dd>هاتف / تابلت / لابتوب / كمبيوتر مكتبي</dd>
            </div>
            <div>
              <dt>النقاط المرجعية</dt>
              <dd>360 / 768 / 1024+</dd>
            </div>
            <div>
              <dt>الوضع</dt>
              <dd>يعمل عبر الاتصال المباشر فقط</dd>
            </div>
          </dl>

          <div className="hero-feature-stack" aria-label="أبرز النقاط">
            <article className="hero-feature-card">
              <strong>بيع سريع وتتبع يومي</strong>
              <p>المسارات الأساسية تبقى قريبة من فريق العمل مع ترتيب أوضح للاستخدام اليومي.</p>
            </article>
            <article className="hero-feature-card">
              <strong>تجربة متسقة على كل الأجهزة</strong>
              <p>تعمل نفس المهام الرئيسية على الهاتف والتابلت والكمبيوتر دون إرهاق بصري أو تعقيد.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="baseline-grid" aria-label="أقسام التشغيل">
        <article className="baseline-card">
          <p className="eyebrow">التشغيل اليومي</p>
          <h2>أدوات واضحة لفريق العمل</h2>
          <p>
            من شاشة واحدة يمكن متابعة اللقطة اليومية، مراجعة الأرصدة، تنفيذ التسويات، وإغلاق
            الجرد بخطوات تشغيلية واضحة.
          </p>
        </article>

        <article className="baseline-card">
          <p className="eyebrow">التقارير</p>
          <h2>مؤشرات يومية وتقارير قابلة للتصفية</h2>
          <p>
            راقب المبيعات، الديون، الحسابات، المخزون، واللقطات اليومية بفلاتر سهلة حسب التاريخ
            والموظف والجهاز.
          </p>
        </article>

        <article className="baseline-card">
          <p className="eyebrow">جاهزية الأجهزة</p>
          <h2>تجربة موحدة على كل الشاشات</h2>
          <p>
            نفس المهام الأساسية تعمل على الهاتف والتابلت والكمبيوتر مع دعم التثبيت من المتصفح
            والطباعة المباشرة عند الحاجة.
          </p>
        </article>
      </section>

      <section className="baseline-actions" aria-label="نقاط الدخول الرئيسية">
        <Link href="/login" className="baseline-link-card">
          <p className="eyebrow">ابدأ من هنا</p>
          <h2>تسجيل الدخول</h2>
          <p>افتح جلسة العمل للوصول إلى المسارات المناسبة لدورك.</p>
        </Link>

        <Link href="/products" className="baseline-link-card">
          <p className="eyebrow">المنتجات</p>
          <h2>تصفّح المنتجات</h2>
          <p>اعرض المنتجات الجاهزة للبيع مع معلومات واضحة ومباشرة.</p>
        </Link>

        <Link href="/pos" className="baseline-link-card baseline-link-card--accent">
          <p className="eyebrow">نقطة البيع</p>
          <h2>شاشة نقطة البيع</h2>
          <p>أضف المنتجات للسلة وأنهِ البيع من شاشة سريعة ومناسبة للعمل اليومي.</p>
        </Link>

        <Link href="/invoices" className="baseline-link-card">
          <p className="eyebrow">الفواتير</p>
          <h2>الفواتير والمرتجعات</h2>
          <p>راجع الفواتير الأخيرة ونفّذ المرتجعات واطبع الإيصال مباشرة من المتصفح.</p>
        </Link>

        <Link href="/debts" className="baseline-link-card">
          <p className="eyebrow">الديون</p>
          <h2>الديون والتسديد</h2>
          <p>تابع العملاء المستحقين وسجّل الديون أو التسديدات من واجهة واحدة.</p>
        </Link>

        <Link href="/reports" className="baseline-link-card">
          <p className="eyebrow">التقارير</p>
          <h2>التقارير</h2>
          <p>اطّلع على المبيعات واللقطات والحسابات والديون والمخزون ضمن تقارير سهلة.</p>
        </Link>

        <Link href="/settings" className="baseline-link-card">
          <p className="eyebrow">الإعدادات</p>
          <h2>الإعدادات التشغيلية</h2>
          <p>نفّذ اللقطة اليومية وافحص الأرصدة وأكمل الجرد من شاشة تشغيل موحدة.</p>
        </Link>
      </section>

      <InstallPrompt />

      <section className="compatibility-strip" aria-label="الأجهزة والمتصفحات المدعومة">
        <span>Chrome / Edge: دعم كامل</span>
        <span>Safari / Firefox: دعم للوظائف الأساسية</span>
        <span>اللغة الأساسية: العربية RTL</span>
      </section>
    </main>
  );
}
