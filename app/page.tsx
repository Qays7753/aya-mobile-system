import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowLeft,
  BellRing,
  ChartColumnIncreasing,
  LogIn,
  PackageSearch,
  ShieldCheck,
  ShoppingCart
} from "lucide-react";
import { InstallPrompt } from "@/components/runtime/install-prompt";

export const metadata: Metadata = {
  title: "الصفحة الرئيسية",
  description: "نظام تشغيل يومي للبيع والمخزون والتقارير."
};

export default function HomePage() {
  return (
    <main className="baseline-shell baseline-shell--landing">
      <section className="lp-hero">
        <div className="lp-hero__brand">
          <p className="eyebrow">نظام تجزئة عربي</p>
          <h1>Aya Mobile</h1>
          <p className="lp-hero__tagline">بيع · مخزون · فواتير · تقارير</p>
          <div className="hero-panel__actions">
            <Link href="/login" className="primary-button">
              ادخل إلى مساحة العمل
              <ArrowLeft size={17} />
            </Link>
            <Link href="/pos" className="secondary-button">
              نقطة البيع
            </Link>
          </div>
        </div>

        <div className="lp-hero__visual">
          <div className="lp-stat-card">
            <ShoppingCart size={24} />
            <strong>نقطة البيع</strong>
            <span>بيع سريع · سلة ظاهرة</span>
          </div>
          <div className="lp-stat-card lp-stat-card--accent">
            <PackageSearch size={24} />
            <strong>المخزون</strong>
            <span>جرد · تسوية · أصناف</span>
          </div>
          <div className="lp-stat-card lp-stat-card--cyan">
            <ChartColumnIncreasing size={24} />
            <strong>التقارير</strong>
            <span>مبيعات · KPI · تحليل</span>
          </div>
          <div className="lp-stat-card lp-stat-card--safe">
            <ShieldCheck size={24} />
            <strong>الصلاحيات</strong>
            <span>مسارات حسب الدور</span>
          </div>
        </div>
      </section>

      <section className="lp-features" aria-label="المزايا الرئيسية">
        <div className="lp-feature-card">
          <div className="lp-feature-icon lp-feature-icon--blue">
            <ShoppingCart size={22} />
          </div>
          <strong>نقطة البيع</strong>
          <span>سلة · فاتورة فورية · مرتجع</span>
        </div>
        <div className="lp-feature-card">
          <div className="lp-feature-icon lp-feature-icon--cyan">
            <PackageSearch size={22} />
          </div>
          <strong>المخزون والجرد</strong>
          <span>تسوية · موردون · تحويلات</span>
        </div>
        <div className="lp-feature-card">
          <div className="lp-feature-icon lp-feature-icon--green">
            <ChartColumnIncreasing size={22} />
          </div>
          <strong>التقارير</strong>
          <span>مؤشرات · مقارنات · تصدير</span>
        </div>
        <div className="lp-feature-card">
          <div className="lp-feature-icon lp-feature-icon--amber">
            <BellRing size={22} />
          </div>
          <strong>الإشعارات</strong>
          <span>ديون · فواتير · تنبيهات</span>
        </div>
      </section>

      <section className="lp-actions" aria-label="الدخول السريع">
        <Link href="/login" className="lp-action-card lp-action-card--primary">
          <LogIn size={30} />
          <div>
            <strong>تسجيل الدخول</strong>
            <span>ادخل لمساحة العمل المناسبة لدورك</span>
          </div>
          <ArrowLeft size={20} />
        </Link>
        <Link href="/pos" className="lp-action-card">
          <ShoppingCart size={30} />
          <div>
            <strong>نقطة البيع المباشرة</strong>
            <span>ابدأ البيع فورا من هنا</span>
          </div>
          <ArrowLeft size={20} />
        </Link>
      </section>

      <InstallPrompt />
    </main>
  );
}
