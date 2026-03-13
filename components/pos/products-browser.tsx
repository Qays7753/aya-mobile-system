"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { PackageSearch, RefreshCcw, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBanner } from "@/components/ui/status-banner";
import { useProducts } from "@/hooks/use-products";
import { formatCompactNumber, formatCurrency } from "@/lib/utils/formatters";

type ProductsBrowserProps = {
  role?: "admin" | "pos_staff";
};

function normalizeArabic(value: string) {
  return value.toLowerCase().trim();
}

function getStockLabel(trackStock: boolean, stockQuantity: number) {
  if (!trackStock) {
    return "خدمة";
  }

  if (stockQuantity <= 0) {
    return "نفد المخزون";
  }

  if (stockQuantity <= 5) {
    return "مخزون منخفض";
  }

  return "متاح";
}

export function ProductsBrowser({ role = "pos_staff" }: ProductsBrowserProps) {
  const { products, isLoading, isOffline, errorMessage, refresh } = useProducts();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [isTyping, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchQuery(searchInput);
    }, 200);

    return () => {
      window.clearTimeout(handle);
    };
  }, [searchInput]);

  const categories = ["all", ...new Set(products.map((product) => product.category))];
  const normalizedQuery = normalizeArabic(deferredQuery);
  const filteredProducts = products.filter((product) => {
    const matchesCategory = activeCategory === "all" || product.category === activeCategory;
    const matchesQuery =
      normalizedQuery.length === 0 ||
      normalizeArabic(product.name).includes(normalizedQuery) ||
      normalizeArabic(product.sku ?? "").includes(normalizedQuery);

    return matchesCategory && matchesQuery;
  });

  const quickAddProducts = filteredProducts.filter((product) => product.is_quick_add).slice(0, 8);
  const lowStockCount = products.filter((product) => product.track_stock && product.stock_quantity > 0 && product.stock_quantity <= 5).length;

  return (
    <section className="operational-page">
      <PageHeader
        eyebrow="فهرس المنتجات"
        title="المنتجات الجاهزة للبيع"
        description="تصفح الكتالوج بحسب التصنيف، راقب حالة المخزون، وابدأ من أسرع المنتجات طلبًا دون ازدحام بصري."
        meta={
          <>
            <span className="status-pill status-pill--brand">الدور: {role === "admin" ? "إداري" : "نقطة بيع"}</span>
            <span className="status-pill">التصنيفات: {formatCompactNumber(categories.length - 1)}</span>
            <span className="status-pill">السريعة: {formatCompactNumber(products.filter((product) => product.is_quick_add).length)}</span>
          </>
        }
        actions={
          <button type="button" className="secondary-button" onClick={refresh}>
            <RefreshCcw size={16} />
            تحديث
          </button>
        }
      />

      <section className="operational-page__meta-grid" aria-label="ملخص الكتالوج">
        <article className="operational-page__meta-card">
          <span className="operational-page__meta-label">المنتجات الظاهرة</span>
          <strong className="operational-page__meta-value">{formatCompactNumber(filteredProducts.length)}</strong>
          <span className="operational-page__meta-hint">العدد يتغير مباشرة بحسب البحث والتصنيف الحاليين.</span>
        </article>
        <article className="operational-page__meta-card">
          <span className="operational-page__meta-label">مخزون منخفض</span>
          <strong className="operational-page__meta-value">{formatCompactNumber(lowStockCount)}</strong>
          <span className="operational-page__meta-hint">يعرض المنتجات التي تحتاج متابعة سريعة قبل نفاد الكمية.</span>
        </article>
        <article className="operational-page__meta-card">
          <span className="operational-page__meta-label">حالة العرض</span>
          <strong className="operational-page__meta-value">{role === "admin" ? "كتالوج إداري" : "عرض مخصص للبيع"}</strong>
          <span className="operational-page__meta-hint">
            {role === "admin"
              ? "يمكنك مراجعة حالة المخزون وسرعة الإضافة قبل الانتقال إلى مسارات الإدارة التفصيلية."
              : "المعروض هنا مناسب للبيع اليومي ويخفي التعقيد غير اللازم داخل نقطة البيع."}
          </span>
        </article>
      </section>

      <section className="operational-layout operational-layout--wide">
        <SectionCard
          eyebrow="البحث والتصنيف"
          title="ابدأ من المنتج أو التصنيف"
          description="حرّك الكتالوج بسرعة عبر البحث المباشر أو تصفية النتائج بحسب نوع المنتج."
          tone="accent"
          className="operational-sidebar operational-sidebar--sticky"
        >
          <label className="workspace-search">
            <PackageSearch size={18} />
            <input
              type="search"
              placeholder="ابحث باسم المنتج أو SKU"
              value={searchInput}
              onChange={(event) => {
                const nextValue = event.target.value;
                startTransition(() => {
                  setSearchInput(nextValue);
                });
              }}
            />
          </label>

          <div className="chip-row" aria-label="تصنيفات المنتجات">
            {categories.map((category) => (
              <button
                key={category}
                type="button"
                className={category === activeCategory ? "chip chip--active" : "chip"}
                aria-pressed={category === activeCategory}
                onClick={() => setActiveCategory(category)}
              >
                {category === "all" ? "الكل" : category}
              </button>
            ))}
          </div>

          <p className="workspace-footnote">
            {isTyping ? "تحديث نتائج البحث..." : "البحث محلي بعد التحميل الأول مع مهلة 200ms للحفاظ على سرعة التصفح."}
          </p>

          {quickAddProducts.length > 0 ? (
            <div className="operational-list">
              <p className="workspace-footnote">الأكثر استخدامًا داخل البيع اليومي:</p>
              {quickAddProducts.map((product) => (
                <article key={product.id} className="operational-list-card">
                  <div className="operational-list-card__header">
                    <div>
                      <h3 className="operational-list-card__title">{product.name}</h3>
                      <p className="operational-list-card__description">{formatCurrency(product.sale_price)}</p>
                    </div>
                    <div className="operational-list-card__meta">
                      <span className="status-pill status-pill--brand">سريع</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </SectionCard>

        <div className="operational-content">
          {isOffline ? (
            <StatusBanner
              variant="offline"
              title="أنت الآن خارج الاتصال"
              message="سيستمر عرض آخر بيانات تم تحميلها، لكن تحديث القائمة يحتاج عودة الشبكة."
              actionLabel="إعادة المحاولة"
              onAction={refresh}
            />
          ) : null}

          {isLoading ? (
            <div className="product-grid" aria-label="جارٍ تحميل المنتجات">
              {Array.from({ length: 6 }).map((_, index) => (
                <article key={`product-skeleton-${index}`} className="product-card product-card--skeleton">
                  <div className="skeleton-line skeleton-line--sm" />
                  <div className="skeleton-line skeleton-line--lg" />
                  <div className="skeleton-line" />
                  <div className="skeleton-line" />
                </article>
              ))}
            </div>
          ) : errorMessage ? (
            <StatusBanner
              variant="danger"
              title="تعذر جلب المنتجات"
              message={errorMessage}
              actionLabel="إعادة المحاولة"
              onAction={refresh}
            />
          ) : filteredProducts.length === 0 ? (
            <SectionCard
              eyebrow="لا توجد نتائج"
              title="لم نصل إلى منتجات مطابقة"
              description="جرّب عبارة أخرى أو انتقل إلى تصنيف مختلف لإظهار المنتجات المتاحة للبيع."
              tone="subtle"
            />
          ) : (
            <SectionCard
              eyebrow="الكتالوج"
              title="بطاقات المنتجات"
              description="بطاقات مضغوطة تسهّل قراءة الاسم والسعر والمخزون دون إخفاء المعلومات الضرورية للبيع."
            >
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <article key={product.id} className="product-card">
                    <div className="product-card__meta">
                      <span className="product-pill">{product.category}</span>
                      {product.is_quick_add ? <span className="product-pill product-pill--accent">سريع</span> : null}
                      <span className={product.track_stock && product.stock_quantity <= 5 ? "product-pill product-pill--warning" : "product-pill"}>
                        {getStockLabel(product.track_stock, product.stock_quantity)}
                      </span>
                    </div>

                    <div className="product-card__copy">
                      <h2>{product.name}</h2>
                      <p>{product.description || "بدون وصف إضافي لهذا المنتج."}</p>
                    </div>

                    <dl className="product-card__stats">
                      <div>
                        <dt>السعر</dt>
                        <dd>{formatCurrency(product.sale_price)}</dd>
                      </div>
                      <div>
                        <dt>المخزون</dt>
                        <dd>{product.track_stock ? formatCompactNumber(product.stock_quantity) : "خدمة"}</dd>
                      </div>
                      <div>
                        <dt>رمز المنتج</dt>
                        <dd>{product.sku || "غير محدد"}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </SectionCard>
          )}

          <SectionCard
            eyebrow="ملاحظات العرض"
            title="استخدام تشغيلي أوضح"
            description="الكتالوج هنا مخصص للمراجعة والبحث السريع فقط. عمليات البيع والتحكم بالكميات تبقى داخل مساحة نقطة البيع نفسها."
            tone="subtle"
          >
            <div className="operational-inline-summary">
              <span className="status-pill">
                <ShieldCheck size={16} />
                العرض مناسب للبيع اليومي
              </span>
              <span className="status-pill">البحث يشمل الاسم وSKU</span>
            </div>
          </SectionCard>
        </div>
      </section>
    </section>
  );
}
