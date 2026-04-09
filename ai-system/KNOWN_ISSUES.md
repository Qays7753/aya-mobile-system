# KNOWN_ISSUES.md — Aya Mobile UI/UX Audit

**تاريخ التحليل:** 2026-04-09
**المحلل:** Claude Sonnet 4.6 (بعد مراجعة مباشرة للكود)
**الملفات المراجعة:**
- `components/pos/pos-workspace.tsx`
- `components/pos/view/pos-surface-shell.tsx`
- `components/pos/view/pos-toolbar.tsx`
- `components/pos/view/pos-checkout-panel.tsx`
- `components/pos/view/pos-cart-rail.tsx`
- `components/pos/pos-view.module.css`
- `components/dashboard/dashboard-shell.tsx`
- `components/dashboard/reports-overview.tsx`
- `components/ui/section-card.tsx`
- `app/globals.css` (كامل)

---

## فهرس المشاكل

| # | المشكلة | النوع | النطاق | الموجة |
|---|---|---|---|---|
| G4 | Token migration غير مكتمل (نظامان متوازيان) | تقني | System-wide | **6A — أولاً** |
| G2 | غياب max-width مركزي على dashboard-content | بنيوي | System-wide | **6A** |
| G1 | Surface Layering — ثلاث طبقات بصرية متفككة | بنيوي | System-wide | **6A** |
| G3 | SectionCard universal بدون surface hierarchy | بنيوي | System-wide | **6A — أخيراً** |
| P3 | CSS مزدوج بين module CSS وglobals لعناصر POS | تقني | `/pos` | **6B — أولاً** |
| P1 | `position: sticky` مكسور في POS Toolbar | وظيفي — حرج | `/pos` | **6B** |
| P2 | PosToolbar داخل جسم الصفحة (placement خاطئ) | بنيوي | `/pos` | **6B** |
| P4 | max-width محلي داخل productsContent يُفسد layout الكبير | بنيوي | `/pos` | **6B — أخيراً** |
| P5 | تكرار زر "مراجعة الدفع" مرتين في Checkout | وظيفي | `/pos` cart | **6C** |
| R1 | نظام التبويبات + nav + فلاتر متكدسة في Reports | بنيوي | `/reports` | **6C** |
| P6 | كثافة عالية في PosCheckoutPanel وضعف hierarchy | تجميلي | `/pos` cart | **6C** |
| R2 | غياب focal point في صفحة التقارير | تجميلي | `/reports` | **6C** |
| G5 | Spacing system غير متسق بين الصفحات | تجميلي | System-wide | **6C — أخيراً** |

---

## G1 — Surface Layering: ثلاث طبقات بصرية متفككة

**النوع:** بنيوي | **النطاق:** System-wide | **الأولوية:** عالية جداً

### الوصف
الإحساس العام في النظام كله: "المحتوى مركب فوق الخلفية وليس مندمجاً معها". الواجهة تعمل بثلاث طبقات بصرية منفصلة بدلاً من نظام سطحي مترابط.

### الطبقات الثلاث الحالية
```
Layer 1: dashboard-topbar       → background: #FFFFFF (color-bg-surface)
Layer 2: dashboard-content      → background: gradient ضعيف جداً من surface إلى transparent
Layer 3: section-card           → background: #FFFFFF + border + box-shadow
```
الخلفية بين Layer 2 وLayer 3: `--color-bg-base: #F9F8F5` (بيج/ثلجي)

### الكود المسبب — `globals.css` سطر 6169-6180
```css
.dashboard-content {
  flex: 1 1 auto;
  min-width: 0;
  display: grid;
  gap: var(--sp-4);
  padding: var(--sp-4) var(--sp-6) var(--sp-6);
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-bg-surface) 14%, transparent),
    transparent 10rem
  );
}
```
- الـ gradient من `surface 14%` إلى `transparent` يخلق انتقالاً غير واضح بين الـ topbar وجسم الصفحة.
- النتيجة: الـ topbar (أبيض) → فراغ (بيجي من الـ base) → cards (أبيض مرفوع). لا استمرارية.

### الكود المسبب — `globals.css` سطر 3513-3520
```css
.section-card,
.workspace-panel {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--sp-6);
  box-shadow: 0 1px 3px rgba(24, 23, 21, 0.04);
}
```
- `box-shadow` ضعيف جداً (0.04 opacity) لا يُبرر الرفع البصري ولا يُلغيه.
- كل section-card في النظام تبدو طافية بدون سبب بصري مقنع.

### سبب الإحساس بـ "شيء داخل شيء"
الـ shell يعمل على طبقة → الـ content area على طبقة أخرى → الـ cards على طبقة ثالثة. لا يوجد visual connective tissue بين هذه الطبقات.

### الحل المقترح (لا تنفذ الآن)
**خياران:**

**الخيار A — Flat Integration (الأفضل):**
- جعل `dashboard-content` شفافاً تماماً أو `background: var(--color-bg-base)`.
- جعل `dashboard-topbar` بنفس الخلفية أو بـ `border-bottom` فقط بدون خلفية مختلفة.
- الـ cards تبقى بيضاء لكن مع `box-shadow` أكثر وضوحاً يُبرر رفعها (مثلاً `0 2px 8px rgba(..., 0.08)`).

**الخيار B — Layered System (موحد):**
- تعريف surface system صريح: `--surface-base`, `--surface-raised`, `--surface-overlay`.
- تطبيقه بشكل منتظم: الـ content area على base، الـ cards على raised، الـ dialogs على overlay.
- يتطلب تعديل `SectionCard` و`dashboard-content` و`dashboard-topbar`.

**الأهم:** القرار يجب أن يُتخذ على مستوى `globals.css` وينعكس تلقائياً على كل الصفحات.

---

## G2 — غياب max-width مركزي على dashboard-content

**النوع:** بنيوي | **النطاق:** System-wide | **الأولوية:** عالية جداً

### الوصف
عند zoom out أو على الشاشات الكبيرة (≥1600px)، الواجهة لا تستفيد من المساحة بشكل صحيح. كل صفحة تحل مشكلة الـ width بطريقتها الخاصة، مما يخلق تناقضاً مرئياً بين الصفحات ويُعطي إحساسًا عامًا بأن "المحتوى محشور داخل إطار أصغر".

### الكود المسبب
`dashboard-content` في `globals.css` سطر 6169:
```css
.dashboard-content {
  flex: 1 1 auto;
  min-width: 0;
  /* لا يوجد max-width هنا */
}
```

### كيف تحل كل صفحة المشكلة بطريقتها
| الصفحة | الحل المحلي |
|---|---|
| `/pos` | `max-width: 1540px; margin-inline: auto` داخل `.productsContent` في module CSS |
| `/reports` | لا شيء — يمتد بالكامل |
| `/debts` | `transaction-layout` بـ `grid-template-columns` ثابتة |
| `/settings` | `settings-page__shell` بـ columns ثابتة |
| `/portability` | `meta-grid` بـ columns ثابتة |
| باقي الصفحات | كل واحدة مختلفة |

### التأثير على zoom out
- على شاشة 1920px: بعض الصفحات تمتد بالكامل، بعضها يتمركز في 1540px، بعضها يبقى ضيقاً.
- على شاشة 2560px: الفراغات الجانبية تكبر بشكل ملحوظ في الصفحات التي لها `max-width` محلي.
- عند zoom out في Chrome: المحتوى يبدو "صغيراً داخل شاشة كبيرة" لأن الـ max-width المحلي يُقيّده.

### الحل المقترح (لا تنفذ الآن)
إضافة `max-width` و `margin-inline: auto` على مستوى `dashboard-main` أو `dashboard-content` بدلاً من تركها لكل صفحة:

```css
/* المقترح — في globals.css */
.dashboard-main {
  width: 100%;
  max-width: 1600px;       /* قابل للتعديل */
  margin-inline: auto;
  /* باقي الخصائص تبقى */
}
```

ثم حذف كل `max-width` المحلية المتفرقة في الصفحات المختلفة.

**استثناء واجب:** `dashboard-layout--pos` و`dashboard-shell--pos` يجب أن تبقى `width: 100%` بدون max-width لأن POS يحتاج كل المساحة المتاحة.

---

## G3 — SectionCard: مكوّن universal بدون surface hierarchy

**النوع:** بنيوي | **النطاق:** System-wide | **الأولوية:** عالية

### الوصف
`SectionCard` يُستخدم 98 مرة في dashboard و20 مرة في POS. كل استخدام يُضيف نفس الطبقة البصرية: أبيض + border + box-shadow + padding 24px. لا يوجد فرق بصري بين حاوي رئيسي وعنصر ثانوي، ولا بين section وcard.

### تعريف المكوّن — `components/ui/section-card.tsx`
```tsx
// tone variants الموجودة: "default" | "accent" | "subtle"
// لكن كلها تحمل نفس border + padding + radius
const classNames = ["section-card", `section-card--${tone}`, className]
```

### الكود المسبب — `globals.css` سطر 3513-3526
```css
.section-card,
.workspace-panel {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--sp-6);
  box-shadow: 0 1px 3px rgba(24, 23, 21, 0.04);
}
.section-card {
  display: grid;
  gap: var(--sp-4);
  min-height: 100%;
}
```

### المشكلة
- Variant `subtle` يغير الخلفية فقط لكن يبقي نفس الـ border والـ padding.
- لا يوجد variant "flat" (بدون border وبدون shadow) للـ sections الثانوية.
- لا يوجد variant "inset" للمحتوى الداخلي.
- النتيجة: كل شيء يبدو بنفس الثقل البصري — الـ topbar والـ sidebar والـ cards والـ sub-sections كلها "level 1".

### الحل المقترح (لا تنفذ الآن)
إضافة variants جديدة للـ SectionCard:
- `flat`: بدون border, بدون shadow, padding مخفف — للـ sections الثانوية
- `inset`: خلفية `color-bg-muted`, بدون shadow — للمحتوى المُدمج
- `raised`: الحالي (default) — للـ cards الرئيسية فقط

وتحديد متى يُستخدم كل variant في نظام موحد (DESIGN_SYSTEM.md).

---

## G4 — Token migration غير مكتمل (نظامان متوازيان)

**النوع:** تقني | **النطاق:** System-wide | **الأولوية:** متوسطة

### الوصف
في `:root` داخل `globals.css` يوجد نظامان من الـ CSS tokens في نفس الوقت:

**النظام القديم (أسطر 1-113):**
```css
--aya-bg: #f8fafc
--aya-panel: #ffffff
--aya-line: #e2e8f0
--aya-ink: #0f172a
--aya-primary: #4f46e5
```

**النظام الجديد (أسطر 108-200+):**
```css
--color-bg-base: #F9F8F5
--color-bg-surface: #FFFFFF
--color-border: ...
--color-text-primary: ...
--color-accent: ...
```

### الخطر
- بعض الـ components تستخدم `--aya-*` وبعضها `--color-*`.
- الـ aliases موجودة (`--aya-accent: var(--aya-primary)`) لكنها غير مكتملة.
- أي تغيير في قيمة token واحد لن ينعكس على المكونات التي تستخدم النظام الآخر.
- الـ token للـ background الرئيسي مختلف بين النظامين: `--aya-bg: #f8fafc` مقابل `--color-bg-base: #F9F8F5` — ليسا نفس اللون.

### الملف المرجعي
`ai-system/DESIGN_SYSTEM.md` يحتوي على جدول migration. المطلوب إكمال الـ migration لكل المكونات.

### الحل المقترح (لا تنفذ الآن)
1. grep لكل استخدام `--aya-` في components وتحويله لـ `--color-`.
2. حذف النظام القديم من `:root` بعد التأكد من عدم وجود أي استخدام متبقٍ.
3. مراجعة الـ aliases للتأكد من أن القيم متطابقة.

---

## G5 — Spacing System غير متسق بين الصفحات

**النوع:** تجميلي | **النطاق:** System-wide | **الأولوية:** منخفضة

### الوصف
الـ gap بين عناصر الصفحة مختلف بحسب الـ class المستخدمة:

| Class | Gap |
|---|---|
| `.workspace-stack` | `1rem` (16px) |
| `.analytical-page` | `1.25rem` (20px) |
| `.dashboard-main` | `var(--sp-6)` = 24px |
| `.dashboard-content` | `var(--sp-4)` = 16px |
| `.section-card` | `var(--sp-4)` = 16px |

الصفحات التي تجمع أكثر من class (مثل `className="workspace-stack analytical-page reports-page"`) تحصل على gap مزدوج أو متعارض.

### الحل المقترح (لا تنفذ الآن)
توحيد الـ gap على مستوى `dashboard-main` وجعل باقي الـ classes لا تُعيد تعريفه. استخدام `--sp-5` (20px) كقيمة موحدة للـ gap بين sections.

---

## P1 — `position: sticky` مكسور في POS Toolbar

**النوع:** وظيفي | **النطاق:** `/pos` | **الأولوية:** حرج — أعلى أولوية

### الوصف
عند التمرير داخل قائمة المنتجات، شريط البحث والتصنيفات (`PosToolbar`) لا يبقى ثابتاً في الأعلى كما هو مقصود. المنتجات تمر من وراء الـ toolbar أو تتداخل معه بشكل غير صحيح.

### السبب الجذري — قاعدة CSS أساسية مكسورة
`position: sticky` لا يعمل داخل عنصر له `overflow: auto` أو `overflow: hidden`.

**في `pos-view.module.css`:**
```css
/* الـ discoveryCard (PosToolbar wrapper) */
.discoveryCard {
  position: sticky;
  top: 0;
  z-index: 3;
}

/* الـ productsContent (الأب المباشر) */
.productsContent {
  overflow: auto;        /* ← هذا يُبطل sticky الأبناء */
  padding: var(--sp-4);
  max-width: 1540px;
  margin-inline: auto;
}
```

**في `globals.css` سطر 7325:**
```css
.pos-products__content {
  min-height: 0;
  overflow: auto;        /* ← نفس المشكلة في globals */
}
```

### الشجرة الهيكلية الحالية
```
.pos-workspace__stage
  ├── {header} = <PosToolbar> داخل <SectionCard className=".discoveryCard">
  └── .pos-layout
      └── .pos-products
          └── .productsContent [overflow: auto]  ← scroll container
              ├── .discoveryCard [position: sticky] ← لا يعمل هنا
              └── .productPanel
```

### التأثير الوظيفي
- المستخدم يفقد حقل البحث عند التمرير لأسفل.
- تبديل التصنيف يتطلب التمرير للأعلى أولاً.
- تجربة مكسورة على الشاشات الطويلة وعند وجود منتجات كثيرة.

### الحل المقترح (لا تنفذ الآن)
**الحل الصحيح:** نقل `overflow: auto` من `.productsContent` إلى `.productsPane` أو إلى `.pos-products`، وجعل `.productsContent` بدون overflow. هذا يجعل `position: sticky` على `.discoveryCard` يعمل لأن أباه المباشر لن يكون هو الـ scroll container.

```css
/* المقترح */
.productsPane,
.pos-products {
  overflow: auto;        /* scroll container هنا */
}

.productsContent {
  overflow: visible;     /* أو حذف overflow كلياً */
  /* position: sticky للأبناء يعمل الآن */
}
```

**تحذير مهم:** أي تعديل على `overflow` في هذه الشجرة يجب اختباره ضد test files:
- `device-qa.spec.ts`
- `px06-device-gate.spec.ts`
- `px22-transactional-ux.spec.ts`

---

## P2 — PosToolbar داخل جسم الصفحة (Placement خاطئ معمارياً)

**النوع:** بنيوي | **النطاق:** `/pos` | **الأولوية:** عالية جداً

### الوصف
`PosToolbar` (شريط البحث + تصنيفات المنتجات + أزرار "بيع جديد" و"سلال معلقة" + toggle العرض) موجودة داخل جسم صفحة المنتجات كـ `SectionCard` كاملة. هذا يجعل الصفحة تبدو مزدحمة ومركبة: topbar الـ shell + toolbar الـ POS + محتوى المنتجات، ثلاثة أشياء قبل أن تصل للمحتوى الفعلي.

### الكود الحالي — `pos-toolbar.tsx`
```tsx
export function PosToolbar(...) {
  return (
    <SectionCard className={`${styles.discoveryCard} transaction-card pos-discovery-card`}>
      {/* شريط البحث */}
      {/* أزرار الأكشن */}
      {/* تصنيفات المنتجات */}
    </SectionCard>
  );
}
```

### كيف يُمرَّر حالياً — `pos-surface-shell.tsx`
```tsx
export function PosSurfaceShell({ header, ... }) {
  return (
    <div className="pos-workspace__stage">
      {header}               {/* ← PosToolbar هنا، داخل جسم الـ stage */}
      <div className="pos-layout">
        {/* المنتجات والسلة */}
      </div>
    </div>
  );
}
```

### المشكلة المرئية
- المستخدم يرى: Topbar عام (48px) → PosToolbar كـ card كاملة → قائمة المنتجات.
- الـ toolbar يأخذ مساحة بصرية كبيرة من جسم الصفحة.
- يعطي إحساس "صفحة داخل صفحة" — card مستقلة داخل layout.

### الحل المقترح (لا تنفذ الآن)
**الأفضل معمارياً: Sub-topbar مخصص للـ POS**

نقل محتوى `PosToolbar` إلى منطقة أسفل `dashboard-topbar` مباشرة كـ sub-bar ثابت:

```
dashboard-shell--pos
  ├── dashboard-topbar        (48px) — الحالي
  ├── pos-sub-topbar          (~52px جديد) — البحث + التصنيفات + الأكشن
  └── pos-layout
      ├── pos-products        — المنتجات فقط
      └── pos-cart-sheet      — السلة فقط
```

هذا يُفرغ جسم الصفحة بالكامل للمحتوى الفعلي ويُحسن وضوح الـ layout.

**تأثير على tests — يجب التحقق:**
- `px22-transactional-ux.spec.ts` — يحتوي على assertions لـ `pos-discovery-card` و`pos-discovery-toolbar`
- `px06-device-gate.spec.ts`
- `device-qa.spec.ts`

---

## P3 — CSS مزدوج بين module CSS وglobals لعناصر POS

**النوع:** تقني | **النطاق:** `/pos` | **الأولوية:** عالية

### الوصف
نفس عناصر POS مُعرَّفة في مكانين: `pos-view.module.css` و`globals.css`. هذا يخلق تعارضاً محتملاً وصعوبة في التتبع.

### الأمثلة الموثقة

**`.pos-products__content` مُعرَّف في كلا الملفين:**

في `pos-view.module.css`:
```css
.productsContent {
  display: grid;
  align-content: start;
  gap: var(--sp-4);
  overflow: auto;
  padding: var(--sp-4);
  width: 100%;
  max-width: 1540px;
  margin-inline: auto;
}
```

في `globals.css` سطر 7325:
```css
.pos-products__content {
  min-height: 0;
  overflow: auto;
  padding: var(--sp-4);
  background: var(--color-bg-base);
}
```

وأيضاً سطر 8197:
```css
.pos-workspace .pos-products__content {
  display: grid;
  align-content: start;
  overflow: auto;
  gap: var(--sp-4);
  padding: var(--sp-4);
  /* بدون max-width هنا */
}
```

**ثلاثة تعريفات لنفس العنصر** — أيها يُطبَّق يعتمد على الـ specificity والترتيب، وهو مصدر bugs غير واضحة.

### الحل المقترح (لا تنفذ الآن)
اختيار مصدر واحد للحقيقة:
- إما توحيد كل POS CSS في `globals.css` وحذف `pos-view.module.css`.
- أو توحيد كل POS CSS في `pos-view.module.css` وحذف الـ overrides من `globals.css`.

الأفضل: الإبقاء على `globals.css` كمصدر وحيد لأن الـ e2e tests تستخدم class names من globals وليس من module CSS.

---

## P4 — max-width محلي داخل productsContent يُفسد layout الكبير

**النوع:** بنيوي | **النطاق:** `/pos` | **الأولوية:** عالية

### الوصف
`productsContent` في `pos-view.module.css` لديه `max-width: 1540px; margin-inline: auto`.

على الشاشات الكبيرة:
- عرض الشاشة: 2560px
- `--pos-cart-width: clamp(320px, 30vw, 400px)` = 400px عند هذا العرض
- عرض منطقة المنتجات: `2560 - 400 = 2160px`
- الـ `productsContent` يُقيَّد بـ 1540px ويتمركز → هامش جانبي 310px من كل جانب
- الـ pos-cart-sheet تبقى 400px على الجانب الآخر

الناتج: فراغ ضخم داخل منطقة المنتجات مع سلة صغيرة نسبياً على الجانب.

### الحل المقترح (لا تنفذ الآن)
حذف `max-width` من `productsContent` والسماح لـ `--pos-cart-width` وحده بالتحكم في توزيع المساحة. إذا أُريد حد أقصى، يكون على مستوى `.pos-layout` بالكامل وليس على منطقة المنتجات فقط.

---

## P5 — تكرار زر "مراجعة الدفع" مرتين في Checkout

**النوع:** وظيفي | **النطاق:** `/pos` cart | **الأولوية:** متوسطة

### الوصف
في `pos-checkout-panel.tsx` يوجد زران منفصلان بنفس الوظيفة (`onToggleCheckoutOptions`):

**الزر الأول — سطر 358:**
```tsx
<div className="pos-checkout-review">
  <button
    type="button"
    className="secondary-button pos-checkout-review__button"
    onClick={onToggleCheckoutOptions}
  >
    مراجعة الدفع
  </button>
</div>
```

**الزر الثاني — سطر 392:**
```tsx
<div className="pos-checkout-options-toggle">
  <button
    type="button"
    className="secondary-button pos-checkout-options-toggle__button"
    onClick={onToggleCheckoutOptions}
  >
    {checkoutOptionsToggleLabel}   {/* نفس الوظيفة */}
  </button>
</div>
```

### التأثير
- المستخدم يرى زرين لنفس الشيء في منطقة السلة.
- مربك بصرياً ويزيد الكثافة في منطقة محدودة المساحة.

### الحل المقترح (لا تنفذ الآن)
حذف أحد الزرين (على الأرجح `pos-checkout-review` الأول) والإبقاء على `pos-checkout-options-toggle` الذي يستخدم `checkoutOptionsToggleLabel` المتغير (يقرأ "مراجعة الدفع" أو "إغلاق الخيارات" حسب الحالة).

**تحذير:** التحقق من `px22-transactional-ux.spec.ts` قبل حذف أي من الـ class names.

---

## P6 — كثافة عالية وضعف hierarchy في PosCheckoutPanel

**النوع:** تجميلي | **النطاق:** `/pos` cart | **الأولوية:** متوسطة

### الوصف الكامل للمشاكل المرئية

**أ. Action chips الخمسة متراصة بلا تمييز:**
```tsx
/* في pos-checkout-panel.tsx */
<div className="pos-cart-actions-row">
  <button className="chip pos-action-chip"><Plus size={14} /> تمدد</button>
  <button className="chip pos-action-chip"><Plus size={14} /> خصم</button>
  <button className="chip pos-action-chip"><Plus size={14} /> عميل</button>
  <button className="chip pos-action-chip"><Plus size={14} /> ملاحظات</button>
  <button className="chip pos-action-chip"><Plus size={14} /> رمز الطرفية</button>
</div>
```
- `Plus size={14}` صغير جداً بجانب نص قصير = chips تبدو كـ metadata لا كـ actions.
- لا يوجد grouping — "تمدد" (split payment) في نفس صف "ملاحظات".

**ب. غياب divider بين مناطق السلة:**
```
المجموع النهائي          ← منطقة المبالغ
المبلغ المستحق
──────────────────
طرق الدفع               ← منطقة الدفع (لا يوجد separator)
المبلغ المستلم
──────────────────
المتبقي للسداد           ← منطقة النتيجة (لا يوجد separator)
──────────────────
[مراجعة الدفع]           ← اكشن zone
[تأكيد البيع]
```
لا يوجد فاصل بصري واضح بين هذه المناطق الأربعة.

**ج. Typography غير متسق:**
- `dl > dt` (المجموع النهائي، الخصم): لا font-size محدد — يرث.
- `cart-summary__total pos-amount-due`: لا تمييز بصري كافٍ عن باقي الصفوف.
- `field-label`: لا يوجد تعريف مرئي واضح لحجمه في السياق.

**د. button "تأكيد البيع" يحمل السعر بنص طويل:**
```tsx
`تأكيد البيع • ${formatCurrency(netTotal)}`
// أو
`إتمام البيع وتسجيل الدين • ${formatCurrency(netTotal)}`
```
النص الثاني طويل جداً على الشاشات الضيقة.

### الحل المقترح (لا تنفذ الآن)
- إضافة `border-top` أو `margin-top` كبير بين المناطق الأربعة.
- رفع `font-size` لـ `cart-summary__total` وجعله `font-weight: 800`.
- تقسيم action chips إلى مجموعتين: payment actions (تمدد) وinvoice options (خصم، عميل، ملاحظات، رمز الطرفية).
- اختصار نص الزر: "تسجيل دين" بدلاً من "إتمام البيع وتسجيل الدين".

---

## R1 — نظام التبويبات + nav + فلاتر متكدسة في Reports

**النوع:** بنيوي | **النطاق:** `/reports` | **الأولوية:** عالية

### الوصف
صفحة التقارير تحتوي على أربعة عناصر تحكم متتالية قبل المحتوى الفعلي:

```tsx
/* في reports-overview.tsx سطر 242 */
<section className="workspace-stack analytical-page reports-page">
  <PageHeader ... />           {/* 1. Page header */}
  
  <div className="reports-page__tabs">  {/* 2. التبويبات الثلاثة */}
    {REPORT_TABS.map(...)}
  </div>
  
  <nav className="analytical-section-nav reports-page__sections">  {/* 3. روابط الأقسام */}
    {REPORT_SECTIONS.map(...)}
  </nav>
  
  {/* 4. filter summary chips */}
  {renderFilterSummaryRow()}
  
  {/* ثم المحتوى الفعلي */}
  <SectionCard id="reports-filters"> ... </SectionCard>
```

### المشكلة
- على شاشة 768px ارتفاعاً: المحتوى الفعلي قد يكون خارج الـ viewport تماماً.
- كل العناصر الأربعة تقريباً بنفس الثقل البصري.
- `REPORT_SECTIONS` (7 روابط) + `REPORT_TABS` (3 tabs) = 10 عنصر تحكم متراصة.

### الحل المقترح (لا تنفذ الآن)
- دمج `reports-page__sections` داخل كل tab panel بدلاً من كونها صفاً مستقلاً.
- أو إخفاء section nav وتحويله لـ sticky sidebar ضيق على الجانب.
- الـ `PageHeader` يكفيه meta chips واحدة أو اثنتين بدلاً من ثلاث.

---

## R2 — غياب focal point في صفحة التقارير

**النوع:** تجميلي | **النطاق:** `/reports` | **الأولوية:** متوسطة

### الوصف
كل الـ `SectionCard` في صفحة التقارير تظهر بنفس الثقل البصري:
- بطاقة الفلاتر = نفس style بطاقة المقارنة = نفس style بطاقة المبيعات.
- لا يوجد عنصر "رئيسي" يجذب النظر أولاً.
- KPI cards (لوحة المؤشرات) لا تتميز عن sections الجداول.

### الحل المقترح (لا تنفذ الآن)
- تطبيق `SectionCard` variant مختلف (raised أو accent) على KPI section فقط.
- تصغير بصري لـ filter section وجعلها `subtle` variant.
- إضافة إحصائية رقمية كبيرة (hero stat) في أعلى الصفحة.

---

## ملاحظات ختامية للمنفذ

### ترتيب التنفيذ — التسلسل الصحيح

```
Wave 5  (الحالية)
  → Loading Screen + A11y + Regression hardening
  → إغلاق رسمي للـ restructuring

Wave 6A — Infrastructure (بعد Wave 5 مباشرة)
  → يجب أن تسبق كل polish لأن كل صفحة تعتمد على globals.css

  الخطوة 1: G4 — حذف --aya-* tokens المتبقية (شرط لكل ما بعده)
  الخطوة 2: G2 — max-width مركزي على dashboard-main + حذف المحلية
  الخطوة 3: G1 — توحيد surface layering (gradient → flat/base)
  الخطوة 4: G3 — إضافة flat/inset variants للـ SectionCard

  سبب الترتيب:
  - G4 أولاً: tokens نظيفة تضمن أن G1 لن يُدخل تعارضات
  - G2 قبل G1: تحديد max-width قبل إعادة رسم الخلفيات
  - G3 أخيراً: تُبنى فوق القرارات المتخذة في G1 وG2

Wave 6B — POS Structural (بعد 6A)
  → يعتمد على G2 من 6A (max-width) وعلى tokens نظيفة من G4

  الخطوة 1: P3 — توحيد CSS (حذف التعريفات المزدوجة) — شرط لـ P1
  الخطوة 2: P1 — إصلاح sticky (نقل overflow للأب الصحيح)
  الخطوة 3: P2 — نقل PosToolbar إلى sub-topbar (يعتمد على P1)
  الخطوة 4: P4 — حذف max-width من productsContent (يعتمد على G2)

  سبب الترتيب:
  - P3 أولاً: ثلاثة تعريفات لنفس العنصر تجعل P1 غير قابل للتنبؤ
  - P1 قبل P2: إصلاح overflow ضروري قبل إعادة وضع الـ toolbar
  - P4 أخيراً: يعتمد على وجود max-width مركزي من G2

Wave 6C — Polish (بعد 6B)
  → تجميلية — تُنفَّذ فقط بعد استقرار البنية

  بأي ترتيب:
  - P5: حذف الزر المكرر في Checkout
  - R1: إعادة هيكلة navigation في Reports
  - P6: تحسين hierarchy وtypography في CheckoutPanel
  - R2: إضافة focal point في Reports
  - G5: توحيد spacing بين الصفحات (أقل أولوية)
```

### قيود يجب مراعاتها عند التنفيذ

1. **Protected CSS classes** — أي class مذكورة في `tests/e2e/` لا تُحذف أو تُعاد تسميتها. تحقق دائماً بـ grep أولاً.
2. **Protected Arabic strings** — النصوص المرئية للمستخدم لا تتغير بدون مراجعة `docs/PROTECTED_STRINGS.md`.
3. **POS tests حساسة جداً** — `px22-transactional-ux.spec.ts` و`device-qa.spec.ts` و`px06-device-gate.spec.ts` تحتوي على assertions تغطي layout وflow الـ POS.
4. **بعد كل تغيير:** `npx tsc --noEmit --pretty false` ثم `npx vitest run`.
5. **تغييرات G1/G2** قد تؤثر على `px18-visual-accessibility.spec.ts` الذي يحتوي على visual assertions.

### معلومات إضافية مهمة

- `--color-bg-base: #F9F8F5` ≠ `--aya-bg: #f8fafc` — ليسا نفس اللون رغم أنهما يبدوان متقاربين.
- `--pos-cart-width: clamp(320px, 30vw, 400px)` — على 1080px شاشة = 324px، على 1440px = 400px (الحد الأعلى)، على 2560px = 400px (لا يزداد). هذا يعني أن السلة تبدو أضيق نسبياً كلما كبرت الشاشة.
- `dashboard-shell--pos` يُضيف `height: 100dvh; overflow: hidden` على الـ shell كله — أي تعديل على overflow داخل POS يجب أن يأخذ هذا بعين الاعتبار.
- `globals.css` يحتوي على أكثر من 8000 سطر — أي بحث يجب أن يكون دقيقاً بـ class name كاملاً لتفادي false matches.
