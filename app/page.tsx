import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BellRing,
  ChartColumnIncreasing,
  PackageSearch,
  ShieldCheck,
  ShoppingCart,
  Smartphone,
  Store
} from "lucide-react";
import { InstallPrompt } from "@/components/runtime/install-prompt";
import { SectionCard } from "@/components/ui/section-card";

export const metadata: Metadata = {
  title: "الصفحة الرئيسية",
  description: "نقطة البداية للوصول إلى البيع والمنتجات والفواتير والتقارير وإعدادات التشغيل."
};

export default function HomePage() {
  return (
    <main className="baseline-shell baseline-shell--landing">
      <section className="hero-panel hero-panel--landing landing-hero">
        <div className="hero-panel__copy">
          <p className="eyebrow">تشغيل تجزئة عربي وواضح</p>
          <h1>Aya Mobile</h1>
          <p className="hero-panel__lead">
            منصة تشغيل يومية لنقطة البيع والمخزون والفواتير والمتابعة الإدارية، مصممة لتبقى
            سريعة وواضحة في بيئة المتجر وعلى كل شاشة.
          </p>

          <div className="hero-panel__actions">
            <Link href="/login" className="primary-button">
              ادخل إلى مساحة العمل
              <ArrowLeft size={16} />
            </Link>
            <Link href="/pos" className="secondary-button">
              افتح نقطة البيع
            </Link>
          </div>

          <div className="hero-badge-row" aria-label="أبرز مزايا المنصة">
            <span className="hero-badge">RTL أصيل للعربية</span>
            <span className="hero-badge">جاهز للهاتف والتابلت</span>
            <span className="hero-badge">مسارات واضحة لكل دور</span>
          </div>
        </div>

        <div className="hero-panel__visual">
          <div className="hero-stat-grid" aria-label="جاهزية التشغيل">
            <article className="hero-stat-card">
              <span>قنوات العمل</span>
              <strong>بيع - متابعة - تقارير</strong>
            </article>
            <article className="hero-stat-card">
              <span>الأجهزة</span>
              <strong>هاتف / تابلت / كمبيوتر</strong>
            </article>
            <article className="hero-stat-card hero-stat-card--safe">
              <ShieldCheck size={18} />
              <div>
                <span>جاهزية التشغيل</span>
                <strong>مسارات واضحة وصلاحيات مضبوطة</strong>
              </div>
            </article>
          </div>

          <SectionCard
            tone="accent"
            eyebrow="كيف تبدو البداية؟"
            title="شريط تنقل واضح ومساحات تشغيل متخصصة"
            description="كل دور يصل سريعًا إلى المسارات المناسبة له: البيع السريع، المتابعة اليومية، والتقارير الإدارية."
          >
            <div className="landing-highlight-list">
              <span>
                <ShoppingCart size={16} />
                نقطة بيع سريعة بسلة ظاهرة دائمًا
              </span>
              <span>
                <PackageSearch size={16} />
                متابعة المنتجات والفواتير والديون من مسار واحد
              </span>
              <span>
                <ChartColumnIncreasing size={16} />
                تقارير مرئية أوضح للمديرين والمشرفين
              </span>
            </div>
          </SectionCard>
        </div>
      </section>

      <section className="landing-pillars" aria-label="أعمدة التجربة">
        <SectionCard
          eyebrow="التشغيل اليومي"
          title="نقطة بيع سريعة ومسار واضح للموظف"
          description="منتجات قابلة للبحث، سلة ظاهرة دائمًا، وخطوات بيع مختصرة تناسب ضغط العمل."
        >
          <div className="landing-feature-meta">
            <span>
              <ShoppingCart size={16} />
              بيع سريع
            </span>
            <span>
              <BellRing size={16} />
              إشعارات واضحة
            </span>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="المتابعة"
          title="مساحات منظمة للمخزون والفواتير والديون"
          description="تنقل مجمّع حسب نوع العمل مع بطاقات وأقسام أسهل للفهم على الشاشات الصغيرة والكبيرة."
          tone="subtle"
        >
          <div className="landing-feature-meta">
            <span>
              <Store size={16} />
              موردون ومشتريات
            </span>
            <span>
              <PackageSearch size={16} />
              جرد وتسوية
            </span>
          </div>
        </SectionCard>

        <SectionCard
          eyebrow="التحليل"
          title="تقارير ومؤشرات تقرأ بسرعة"
          description="بطاقات KPI، مقارنات أوضح، وتصدير منظم يساعد المدير على متابعة التشغيل دون ازدحام بصري."
        >
          <div className="landing-feature-meta">
            <span>
              <ChartColumnIncreasing size={16} />
              مقارنة الفترات
            </span>
            <span>
              <Smartphone size={16} />
              قابل للاستخدام على كل جهاز
            </span>
          </div>
        </SectionCard>
      </section>

      <section className="entry-grid" aria-label="نقاط الدخول الرئيسية">
        <Link href="/login" className="baseline-link-card landing-link-card">
          <p className="eyebrow">ابدأ جلسة العمل</p>
          <h2>تسجيل الدخول</h2>
          <p>ادخل إلى مساحة العمل المناسبة لدورك مع مسارات واضحة من اللحظة الأولى.</p>
        </Link>

        <Link href="/pos" className="baseline-link-card baseline-link-card--accent landing-link-card">
          <p className="eyebrow">الأولوية الأولى</p>
          <h2>نقطة البيع</h2>
          <p>شاشة بيع سريعة، سلة ثابتة، وخطوات مختصرة لإنهاء العملية بثقة.</p>
        </Link>

        <Link href="/products" className="baseline-link-card landing-link-card">
          <p className="eyebrow">المنتجات</p>
          <h2>استعراض الأصناف</h2>
          <p>تصفّح المنتجات والمخزون بصورة أوضح مع وصول أسرع للفئات والبحث.</p>
        </Link>

        <Link href="/reports" className="baseline-link-card landing-link-card">
          <p className="eyebrow">التحليل</p>
          <h2>التقارير</h2>
          <p>اطّلع على المبيعات والعوائد والمؤشرات اليومية ضمن قراءة أكثر هدوءًا وتنظيمًا.</p>
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
