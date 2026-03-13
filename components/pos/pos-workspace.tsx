"use client";

import React from "react";
import { useDeferredValue, useEffect, useState, useTransition } from "react";
import { AlertTriangle, Loader2, RefreshCcw, Search, ShieldCheck, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/ui/page-header";
import { SectionCard } from "@/components/ui/section-card";
import { StatusBanner } from "@/components/ui/status-banner";
import { useProducts } from "@/hooks/use-products";
import { usePosAccounts } from "@/hooks/use-pos-accounts";
import type { SaleResponseData, StandardEnvelope } from "@/lib/pos/types";
import { formatCompactNumber, formatCurrency } from "@/lib/utils/formatters";
import {
  calculateCartDiscount,
  calculateCartSubtotal,
  calculateCartTotal,
  usePosCartStore
} from "@/stores/pos-cart";

function normalizeArabic(value: string) {
  return value.toLowerCase().trim();
}

export function PosWorkspace() {
  const {
    products,
    isLoading: productsLoading,
    isOffline: productsOffline,
    errorMessage: productsError,
    refresh: refreshProducts
  } = useProducts();
  const {
    accounts,
    isLoading: accountsLoading,
    isOffline: accountsOffline,
    errorMessage: accountsError,
    refresh: refreshAccounts
  } = usePosAccounts();

  const items = usePosCartStore((state) => state.items);
  const selectedAccountId = usePosCartStore((state) => state.selectedAccountId);
  const posTerminalCode = usePosCartStore((state) => state.posTerminalCode);
  const notes = usePosCartStore((state) => state.notes);
  const currentIdempotencyKey = usePosCartStore((state) => state.currentIdempotencyKey);
  const submissionState = usePosCartStore((state) => state.submissionState);
  const lastCompletedSale = usePosCartStore((state) => state.lastCompletedSale);
  const addProduct = usePosCartStore((state) => state.addProduct);
  const removeItem = usePosCartStore((state) => state.removeItem);
  const setQuantity = usePosCartStore((state) => state.setQuantity);
  const setDiscountPercentage = usePosCartStore((state) => state.setDiscountPercentage);
  const setSelectedAccountId = usePosCartStore((state) => state.setSelectedAccountId);
  const setNotes = usePosCartStore((state) => state.setNotes);
  const setPosTerminalCode = usePosCartStore((state) => state.setPosTerminalCode);
  const clearCart = usePosCartStore((state) => state.clearCart);
  const markSubmitting = usePosCartStore((state) => state.markSubmitting);
  const markError = usePosCartStore((state) => state.markError);
  const refreshIdempotencyKey = usePosCartStore((state) => state.refreshIdempotencyKey);
  const completeSale = usePosCartStore((state) => state.completeSale);

  const [cartHydrated, setCartHydrated] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [submissionErrorMessage, setSubmissionErrorMessage] = useState<string | null>(null);
  const [isTyping, startTransition] = useTransition();
  const [isSubmitting, startSubmission] = useTransition();
  const deferredQuery = useDeferredValue(searchQuery);

  const isOffline = productsOffline || accountsOffline;

  useEffect(() => {
    setCartHydrated(usePosCartStore.persist.hasHydrated());

    const unsubscribe = usePosCartStore.persist.onFinishHydration(() => {
      setCartHydrated(true);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      setSearchQuery(searchInput);
    }, 200);

    return () => {
      window.clearTimeout(handle);
    };
  }, [searchInput]);

  useEffect(() => {
    if (!selectedAccountId && accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId, setSelectedAccountId]);

  useEffect(() => {
    if (cartHydrated && !currentIdempotencyKey) {
      refreshIdempotencyKey();
    }
  }, [cartHydrated, currentIdempotencyKey, refreshIdempotencyKey]);

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
  const quickAddProducts = products.filter((product) => product.is_quick_add).slice(0, 8);
  const subtotal = calculateCartSubtotal(items);
  const totalDiscount = calculateCartDiscount(items);
  const total = calculateCartTotal(items);
  const selectedAccount = accounts.find((account) => account.id === selectedAccountId) ?? null;

  function clearSubmissionFeedback() {
    if (submissionErrorMessage) {
      setSubmissionErrorMessage(null);
    }
  }

  function refreshOperationalData() {
    void refreshProducts();
    void refreshAccounts();
  }

  async function submitSale() {
    if (!cartHydrated) {
      return;
    }

    if (items.length === 0) {
      const message = "أضف منتجًا واحدًا على الأقل قبل تأكيد البيع.";
      setSubmissionErrorMessage(message);
      toast.error(message);
      return;
    }

    if (!selectedAccountId) {
      const message = "اختر حساب الدفع أولًا.";
      setSubmissionErrorMessage(message);
      toast.error(message);
      return;
    }

    if (!currentIdempotencyKey) {
      refreshIdempotencyKey();
      const message = "جارٍ تهيئة الطلب. انتظر لحظة ثم أعد المحاولة.";
      setSubmissionErrorMessage(message);
      toast.error(message);
      return;
    }

    markSubmitting();
    setSubmissionErrorMessage(null);

    const payload = {
      items: items.map((item) => ({
        product_id: item.product_id,
        quantity: item.quantity,
        discount_percentage: item.discount_percentage
      })),
      payments: [
        {
          account_id: selectedAccountId,
          amount: Number(total.toFixed(3))
        }
      ],
      pos_terminal_code: posTerminalCode || undefined,
      notes: notes || undefined,
      idempotency_key: currentIdempotencyKey
    };

    try {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const envelope = (await response.json()) as StandardEnvelope<SaleResponseData>;

      if (!response.ok || !envelope.success || !envelope.data) {
        const errorCode = envelope.error?.code ?? "ERR_API_INTERNAL";
        const message = envelope.error?.message ?? "فشل تنفيذ البيع.";
        markError(errorCode);

        if (errorCode === "ERR_IDEMPOTENCY") {
          const existingInvoice = (envelope.error?.details as { existing_result?: SaleResponseData } | undefined)
            ?.existing_result;
          const duplicateMessage = existingInvoice
            ? `تم تنفيذ الطلب مسبقًا. الفاتورة السابقة: ${existingInvoice.invoice_number}.`
            : "تم استخدام نفس الطلب مسبقًا، لذلك لم تُنشأ فاتورة جديدة.";
          setSubmissionErrorMessage(duplicateMessage);
          toast.warning(duplicateMessage);
          return;
        }

        if (errorCode === "ERR_CONCURRENT_STOCK_UPDATE") {
          refreshIdempotencyKey();
          const concurrencyMessage =
            "تغير المخزون أثناء التنفيذ. تم توليد طلب جديد تلقائيًا، حدّث السلة ثم أعد المحاولة.";
          setSubmissionErrorMessage(concurrencyMessage);
          toast.error(concurrencyMessage);
          void refreshProducts();
          return;
        }

        setSubmissionErrorMessage(message);
        toast.error(message);
        return;
      }

      completeSale(envelope.data);
      setSubmissionErrorMessage(null);
      toast.success(`تم إنشاء الفاتورة ${envelope.data.invoice_number} بنجاح.`);
      refreshOperationalData();
    } catch (error) {
      const message = (error as Error).message || "تعذر الوصول إلى مسار البيع.";
      markError("ERR_API_INTERNAL");
      setSubmissionErrorMessage(message);
      toast.error(message);
    }
  }

  return (
    <section className="workspace-stack transaction-page">
      <PageHeader
        eyebrow="نقطة البيع"
        title="نقطة البيع السريعة"
        description="ابحث بسرعة، أضف المنتجات، وراجع الحساب ثم أكمل البيع من مساحة واحدة مصممة للعمل تحت ضغط المتجر."
        meta={
          <div className="transaction-page__meta" aria-label="ملخص نقطة البيع">
            <article className="transaction-page__meta-card">
              <span>عناصر السلة</span>
              <strong>{formatCompactNumber(items.length)}</strong>
            </article>
            <article className="transaction-page__meta-card">
              <span>الإجمالي الحالي</span>
              <strong>{formatCurrency(total)}</strong>
            </article>
            <article className="transaction-page__meta-card transaction-page__meta-card--safe">
              <ShieldCheck size={18} />
              <strong>{selectedAccount?.name ?? "اختر حساب الدفع"}</strong>
            </article>
          </div>
        }
      />

      {isOffline ? (
        <StatusBanner
          variant="offline"
          title="أنت الآن خارج الاتصال"
          message="يمكنك مراجعة السلة الحالية، لكن إتمام البيع وتحديث المنتجات والحسابات يحتاج اتصالًا نشطًا."
          actionLabel="إعادة تحميل البيانات"
          onAction={refreshOperationalData}
        />
      ) : null}

      {productsError || accountsError ? (
        <StatusBanner
          variant="danger"
          title="تعذر تحديث بيانات نقطة البيع"
          message={productsError ?? accountsError ?? "تعذر تحميل البيانات التشغيلية."}
          actionLabel="إعادة المحاولة"
          onAction={refreshOperationalData}
          onDismiss={() => setSubmissionErrorMessage(null)}
        />
      ) : null}

      {submissionState === "submitting" || isSubmitting ? (
        <StatusBanner
          variant="info"
          title="جارٍ تنفيذ البيع"
          message="انتظر قليلًا حتى يصل تأكيد العملية وتُحدّث الأرصدة والمخزون."
        />
      ) : null}

      {submissionErrorMessage ? (
        <StatusBanner
          variant="warning"
          title="تحتاج العملية إلى متابعة"
          message={submissionErrorMessage}
          actionLabel="إعادة المحاولة"
          onAction={() => {
            startSubmission(() => {
              void submitSale();
            });
          }}
          onDismiss={() => setSubmissionErrorMessage(null)}
        />
      ) : null}

      <div className="transaction-layout transaction-layout--pos">
        <div className="transaction-stack">
          <SectionCard
            eyebrow="تصفح سريع"
            title="أدوات البيع السريع"
            description="ابدأ بالبحث أو اختر فئة جاهزة، ثم استخدم بطاقات الإضافة السريعة لتقليل عدد الخطوات."
            tone="accent"
            className="transaction-card transaction-card--filters"
          >
            <div className="workspace-toolbar transaction-toolbar">
              <label className="workspace-search transaction-toolbar__search">
                <Search size={18} />
                <input
                  type="search"
                  autoFocus
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

              <button type="button" className="secondary-button" onClick={refreshProducts}>
                <RefreshCcw size={16} />
                تحديث المنتجات
              </button>
            </div>

            <div className="chip-row transaction-chip-row" aria-label="فئات المنتجات">
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

            {quickAddProducts.length > 0 ? (
              <div className="quick-add-row">
                {quickAddProducts.map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    className="quick-add-card"
                    onClick={() => {
                      clearSubmissionFeedback();
                      addProduct(product);
                    }}
                  >
                    <span>{product.name}</span>
                    <strong>{formatCurrency(product.sale_price)}</strong>
                  </button>
                ))}
              </div>
            ) : (
              <div className="info-strip">
                <span>أضف منتجات شائعة إلى الإضافة السريعة لخفض زمن التنقل أثناء البيع.</span>
              </div>
            )}
          </SectionCard>

          <SectionCard
            eyebrow="المخزون المعروض"
            title="المنتجات الجاهزة للبيع"
            description="بطاقات مضغوطة وسهلة المسح البصري تعرض السعر والمخزون بوضوح، مع تحذير فوري عند اقتراب نفاد الكمية."
            className="transaction-card"
          >
            {productsLoading ? (
              <div className="product-grid product-grid--compact" aria-label="جارٍ تحميل منتجات نقطة البيع">
                {Array.from({ length: 8 }).map((_, index) => (
                  <article key={`pos-product-skeleton-${index}`} className="product-card product-card--skeleton">
                    <div className="skeleton-line skeleton-line--sm" />
                    <div className="skeleton-line skeleton-line--lg" />
                    <div className="skeleton-line" />
                    <div className="skeleton-line" />
                  </article>
                ))}
              </div>
            ) : (
              <div className="product-grid product-grid--compact transaction-product-grid">
                {filteredProducts.map((product) => {
                  const lowStock = product.track_stock && product.stock_quantity <= product.min_stock_level;

                  return (
                    <button
                      key={product.id}
                      type="button"
                      className="product-card product-card--interactive"
                      onClick={() => {
                        clearSubmissionFeedback();
                        addProduct(product);
                      }}
                    >
                      <div className="product-card__meta">
                        <span className="product-pill">{product.category}</span>
                        {product.is_quick_add ? (
                          <span className="product-pill product-pill--accent">سريع</span>
                        ) : null}
                      </div>

                      <div className="product-card__copy">
                        <h2>{product.name}</h2>
                        <p>{product.description || "بدون وصف إضافي."}</p>
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
                      </dl>

                      {lowStock ? (
                        <p className="warning-inline">
                          <AlertTriangle size={14} />
                          الكمية قريبة من حد التنبيه
                        </p>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="transaction-card__footer">
              <p className="workspace-footnote">
                {isTyping
                  ? "تحديث نتائج البحث..."
                  : "البحث محلي بمُهلة 200ms ويعرض النتائج فورًا بدون أي كتابة أو محاولة بيع حتى تضغط تأكيد البيع."}
              </p>
              <span className="product-pill product-pill--accent">{formatCompactNumber(filteredProducts.length)} منتجًا معروضًا</span>
            </div>
          </SectionCard>
        </div>

        <aside className="transaction-stack transaction-stack--sticky">
          <SectionCard
            eyebrow="سلة الطلب"
            title="سلة الطلب الحالية"
            description="راجع البنود والتعديلات الحسابية في مساحة ثابتة وواضحة قبل إرسال البيع."
            className="transaction-card transaction-card--checkout"
          >
            <div className="cart-panel__header">
              <div>
                <p className="workspace-footnote">آخر اختيار محفوظ داخل المتصفح حتى تنهي البيع أو تفرغ السلة.</p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  clearSubmissionFeedback();
                  clearCart();
                }}
                disabled={items.length === 0}
              >
                <Trash2 size={16} />
                تفريغ السلة
              </button>
            </div>

            {!cartHydrated ? (
              <div className="stack-list" aria-label="جارٍ استعادة السلة">
                <div className="skeleton-card" />
                <div className="skeleton-card" />
              </div>
            ) : items.length === 0 ? (
              <div className="empty-panel transaction-empty-panel">
                <h3>السلة فارغة</h3>
                <p>ابدأ بإضافة منتج من القائمة أو من بطاقات الإضافة السريعة ليظهر ملخص الطلب هنا مباشرة.</p>
              </div>
            ) : (
              <div className="cart-line-list">
                {items.map((item) => (
                  <article key={item.product_id} className="cart-line-card">
                    <div className="cart-line-card__header">
                      <div>
                        <strong>{item.name}</strong>
                        <p>{formatCurrency(item.sale_price)} للوحدة</p>
                      </div>

                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => {
                          clearSubmissionFeedback();
                          removeItem(item.product_id);
                        }}
                        aria-label={`حذف ${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="cart-line-card__controls">
                      <label>
                        <span>الكمية</span>
                        <input
                          type="number"
                          min={1}
                          max={item.track_stock ? Math.max(item.stock_quantity, 1) : undefined}
                          value={item.quantity}
                          onChange={(event) => {
                            clearSubmissionFeedback();
                            setQuantity(item.product_id, Number(event.target.value));
                          }}
                        />
                      </label>

                      <label>
                        <span>خصم %</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={item.discount_percentage}
                          onChange={(event) => {
                            clearSubmissionFeedback();
                            setDiscountPercentage(item.product_id, Number(event.target.value));
                          }}
                        />
                      </label>
                    </div>
                  </article>
                ))}
              </div>
            )}

            <div className="cart-summary transaction-checkout-summary">
              <dl>
                <div>
                  <dt>المجموع قبل الخصم</dt>
                  <dd>{formatCurrency(subtotal)}</dd>
                </div>
                <div>
                  <dt>إجمالي الخصم</dt>
                  <dd>{formatCurrency(totalDiscount)}</dd>
                </div>
                <div className="cart-summary__total">
                  <dt>الإجمالي النهائي</dt>
                  <dd>{formatCurrency(total)}</dd>
                </div>
              </dl>

              <div className="transaction-checkout-fields">
                <label className="stack-field">
                  <span>حساب الدفع</span>
                  <select
                    value={selectedAccountId ?? ""}
                    onChange={(event) => {
                      clearSubmissionFeedback();
                      setSelectedAccountId(event.target.value);
                    }}
                    disabled={accountsLoading || accounts.length === 0}
                  >
                    <option value="" disabled>
                      {accountsLoading ? "تحميل الحسابات..." : "اختر حساب الدفع"}
                    </option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="stack-field">
                  <span>رمز الجهاز</span>
                  <input
                    type="text"
                    maxLength={30}
                    value={posTerminalCode}
                    onChange={(event) => {
                      clearSubmissionFeedback();
                      setPosTerminalCode(event.target.value);
                    }}
                    placeholder="POS-01"
                  />
                </label>

                <label className="stack-field">
                  <span>ملاحظات</span>
                  <textarea
                    rows={3}
                    maxLength={500}
                    value={notes}
                    onChange={(event) => {
                      clearSubmissionFeedback();
                      setNotes(event.target.value);
                    }}
                    placeholder="ملاحظات اختيارية للفاتورة"
                  />
                </label>
              </div>

              <div className="info-strip">
                <span>الحساب الحالي: {selectedAccount?.name ?? "غير محدد"}</span>
                <span>كل محاولة بيع محمية تلقائيًا من الإرسال المكرر والتعارض في المخزون.</span>
              </div>

              <button
                type="button"
                className="primary-button transaction-checkout-button"
                disabled={isSubmitting || submissionState === "submitting" || items.length === 0 || isOffline}
                onClick={() => {
                  startSubmission(() => {
                    void submitSale();
                  });
                }}
              >
                {isSubmitting || submissionState === "submitting" ? (
                  <>
                    <Loader2 className="spin" size={16} />
                    جارٍ تنفيذ البيع...
                  </>
                ) : (
                  "تأكيد البيع"
                )}
              </button>
            </div>

            {lastCompletedSale ? (
              <div className="result-card transaction-result-card">
                <p className="eyebrow">آخر عملية بيع</p>
                <h3>{lastCompletedSale.invoice_number}</h3>
                <p>الإجمالي: {formatCurrency(lastCompletedSale.total)}</p>
                <p>الباقي: {formatCurrency(lastCompletedSale.change ?? 0)}</p>
              </div>
            ) : null}
          </SectionCard>
        </aside>
      </div>
    </section>
  );
}
