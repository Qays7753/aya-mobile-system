"use client";

import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { PackageSearch, RefreshCcw, ShieldCheck } from "lucide-react";
import { useProducts } from "@/hooks/use-products";
import { formatCompactNumber, formatCurrency } from "@/lib/utils/formatters";

function normalizeArabic(value: string) {
  return value.toLowerCase().trim();
}

export function ProductsBrowser() {
  const { products, isLoading, errorMessage, refresh } = useProducts();
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
          <p className="eyebrow">PX-03 / T01</p>
          <h1>قراءة المنتجات للـ POS مع Blind POS</h1>
          <p className="workspace-lead">
            هذه الشاشة تقرأ من <code>v_pos_products</code> فقط. لا يوجد أي حقل تكلفة أو ربح أو
            mutation path داخل هذا المسار.
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
            <strong>Blind POS محفوظ</strong>
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
              onClick={() => setActiveCategory(category)}
            >
              {category === "all" ? "الكل" : category}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="empty-panel">
            <p>جارٍ تحميل قائمة المنتجات الآمنة...</p>
          </div>
        ) : errorMessage ? (
          <div className="empty-panel empty-panel--danger">
            <h2>تعذر جلب المنتجات</h2>
            <p>{errorMessage}</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-panel">
            <h2>لا توجد نتائج مطابقة</h2>
            <p>غيّر البحث أو التصنيف لإظهار المنتجات المتاحة في نقطة البيع.</p>
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
                    <dt>SKU</dt>
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
