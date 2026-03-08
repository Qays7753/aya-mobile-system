import Link from "next/link";
import { InstallPrompt } from "@/components/runtime/install-prompt";

export default function HomePage() {
  return (
    <main className="baseline-shell">
      <section className="hero-panel">
        <div className="hero-panel__copy">
          <p className="eyebrow">PX-03 Sales Core Slice</p>
          <h1>Aya Mobile</h1>
          <p className="hero-panel__lead">
            خط الأساس الحالي يثبت أن التطبيق يعمل كتطبيق ويب واحد عبر الهاتف والتابلت واللابتوب
            والديسكتوب، ومعه الآن نقطة دخول واضحة لمسارات القراءة الآمنة ونقطة البيع الأساسية.
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
          <p className="eyebrow">Responsive Shell</p>
          <h2>واجهة أساسية مرنة</h2>
          <p>
            الهيكل الحالي يحافظ على قراءة واضحة ولمس مريح على الشاشات الصغيرة، ويبقى مناسبًا للوحة
            المفاتيح والفأرة على الشاشات الأكبر.
          </p>
        </article>

        <article className="baseline-card">
          <p className="eyebrow">Blind POS</p>
          <h2>قراءة آمنة للمنتجات</h2>
          <p>
            مسار المنتجات الحالي مبني فوق <code>v_pos_products</code> فقط، لذلك لا تتسرب التكلفة أو
            أي أعمدة حساسة إلى واجهة نقطة البيع.
          </p>
        </article>

        <article className="baseline-card">
          <p className="eyebrow">Safety Guardrails</p>
          <h2>بدون Offline مالي</h2>
          <p>
            installability لا تعني أوضاع تخزين محلي للمعاملات المالية. كل كتابة ما تزال تمر من الخادم
            عبر API + RPC فقط.
          </p>
        </article>
      </section>

      <section className="baseline-actions" aria-label="px-03 entry points">
        <Link href="/products" className="baseline-link-card">
          <p className="eyebrow">PX-03-T01</p>
          <h2>قائمة المنتجات الآمنة</h2>
          <p>قراءة مباشرة من المسار الآمن مع الحفاظ على Blind POS.</p>
        </Link>

        <Link href="/pos" className="baseline-link-card baseline-link-card--accent">
          <p className="eyebrow">PX-03-T02..T06</p>
          <h2>شاشة نقطة البيع</h2>
          <p>سلة محلية + create_sale + idempotency + local persistence.</p>
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
