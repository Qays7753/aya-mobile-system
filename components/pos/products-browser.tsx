"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { PackageSearch, RefreshCcw, ShieldCheck } from "lucide-react";
import { StatusBanner } from "@/components/ui/status-banner";
import { useProducts } from "@/hooks/use-products";
import { formatCompactNumber, formatCurrency } from "@/lib/utils/formatters";

function normalizeArabic(value: string) {
  return value.toLowerCase().trim();
}

export function ProductsBrowser() {
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

  return (
    <section className="workspace-stack">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">المنتجات</p>
          <h1>المنتجات المتاحة للبيع</h1>
          <p className="workspace-lead">
            اعرض المنتجات الجاهزة للبيع وابحث بينها بسرعة، مع إظهار البيانات المناسبة فقط لنقطة
            البيع.
          </p>
        </div>

        <div className="hero-stat-grid">
          <article className="hero-stat-card">
            <span>المنتجات الظاهرة</span>
            <strong>{formatCompactNumber(filteredProducts.length)}</strong>
          </article>
          <article className="hero-stat-card">
            <span>سريع الإضافة</span>
            <strong>{formatCompactNumber(products.filter((product) => product.is_quick_add).length)}</strong>
          </article>
          <article className="hero-stat-card hero-stat-card--safe">
            <ShieldCheck size={18} />
            <strong>عرض مناسب لنقطة البيع</strong>
          </article>
        </div>
      </div>

      <div className="workspace-panel">
        <div className="workspace-toolbar">
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

          <button type="button" className="secondary-button" onClick={refresh}>
            <RefreshCcw size={16} />
            تحديث
          </button>
        </div>

        <div className="chip-row" aria-label="product categories">
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
          <div className="empty-panel">
            <h2>لا توجد نتائج مطابقة</h2>
            <p>جرّب تغيير كلمة البحث أو اختر تصنيفًا آخر لعرض المنتجات المتاحة.</p>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-card__meta">
                  <span className="product-pill">{product.category}</span>
                  {product.is_quick_add ? <span className="product-pill product-pill--accent">سريع</span> : null}
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
        )}

        <p className="workspace-footnote">
          {isTyping ? "تحديث نتائج البحث..." : "البحث محلي بعد التحميل الأولي وبمهلة debounce مقدارها 200ms."}
        </p>
      </div>
    </section>
  );
}
