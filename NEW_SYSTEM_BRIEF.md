# نظام POS — موجز البناء الكامل
# Offline POS PWA for Android — Complete Build Brief

---

## 0. هدف هذا الملف

هذا موجز تقني كامل لبناء نظام نقطة بيع (POS) من الصفر.
اتبع كل مواصفة بدقة. لا تضف ميزات غير مذكورة. لا تستخدم مكتبات غير مدرجة.
اسأل قبل أي انحراف عن هذه المواصفات.

---

## 1. القيود الصارمة (غير قابلة للتفاوض)

- **Android فقط** — لا iOS، لا Safari، لا أجهزة Apple
- **صفر تكلفة إلى الأبد** — لا سيرفرات، لا APIs مدفوعة، لا اشتراكات
- **offline بالكامل** — كل البيانات على الجهاز، لا إنترنت مطلوب بعد التثبيت
- **عربي RTL بالكامل** — كل الواجهة من اليمين لليسار
- **الأرقام غربية** (1234 وليس ١٢٣٤)
- **التقويم ميلادي فقط** — لا هجري
- **تابلت أولاً** — ثم هاتف. الشاشات من 360px إلى 1200px+
- **لا نظام تسجيل دخول** — PIN فقط للوصول للميزات المحمية

---

## 2. Stack التقني (مثبّت — لا تغيير)

### الأساس
```
Framework:     Vite + React 19 + TypeScript (strict mode)
Build:         Vite 6+
PWA:           vite-plugin-pwa + Workbox
Router:        React Router v6
```

### قاعدة البيانات (محلية على الجهاز)
```
DB:            @sqlite.org/sqlite-wasm (OPFS SAH Pool VFS)
Worker:        Web Worker مخصص للـ DB
RPC:           Comlink (تواصل Main Thread ↔ Worker)
KV Store:      idb-keyval (الإعدادات، PIN hash، metadata)
```

### إدارة البيانات والحالة
```
Data layer:    @tanstack/react-query v5
UI state:      Zustand v5
```

### الواجهة
```
Styling:       Tailwind CSS v4
Font Arabic:   @fontsource/tajawal (self-hosted, weights: 400/500/700)
Font Numeric:  @fontsource/inter (self-hosted, weights: 400/600/700)
Icons:         lucide-react
Charts:        echarts + echarts-for-react
Toasts:        sonner
```

### النماذج والتحقق
```
Forms:         react-hook-form
Validation:    zod
Lists:         @tanstack/react-virtual (للقوائم الطويلة)
```

### الأموال والتواريخ
```
Money:         أرقام صحيحة (integer - fils) — لا مكتبة خارجية
               انظر قسم 5 لدوال المساعدة المطلوبة
Dates:         date-fns
```

### التصدير والطباعة
```
Excel:         SheetJS (xlsx) — lazy loaded
PDF/Receipt:   html2canvas-pro → pdf-lib
               (تحويل HTML إلى صورة ثم PDF لضمان دعم العربية)
```

### الجودة
```
Error:         react-error-boundary
IDs:           nanoid
Testing:       Vitest + Playwright
```

### مكتبات محظورة
```
❌ moment.js
❌ dinero.js أو decimal.js
❌ bcryptjs
❌ axios (استخدم fetch)
❌ lodash (استخدم مساعدات مخصصة)
❌ recharts (استخدم echarts)
❌ Any CDN fonts (كل الخطوط self-hosted)
❌ Any paid API or service
```

---

## 3. إعداد المشروع

### بنية المجلدات
```
src/
├── main.tsx
├── app.tsx                    # Router shell
├── db/
│   ├── worker.ts              # SQLite Web Worker
│   ├── client.ts              # Comlink proxy + helpers
│   ├── migrations/
│   │   ├── 001_init.sql
│   │   ├── 002_xxx.sql
│   │   └── index.ts           # Migration runner (PRAGMA user_version)
│   └── queries/               # مجلد لكل module
│       ├── products.ts
│       ├── sales.ts
│       ├── inventory.ts
│       ├── expenses.ts
│       ├── operations.ts
│       ├── maintenance.ts
│       └── reports.ts
├── modules/
│   ├── pos/
│   ├── products/
│   ├── inventory/
│   ├── expenses/
│   ├── operations/
│   ├── maintenance/
│   ├── dashboard/
│   └── reports/
├── components/
│   ├── ui/                    # مكونات قابلة لإعادة الاستخدام
│   ├── layout/                # Shell، Navigation، Bottom Bar
│   └── pin/                   # PIN dialog
├── hooks/                     # Custom hooks
├── lib/
│   ├── money.ts               # دوال الأموال (6 دوال)
│   ├── pin.ts                 # PBKDF2 PIN hashing
│   ├── storage.ts             # navigator.storage.persist()
│   ├── backup.ts              # تصدير DB
│   └── utils.ts
├── stores/
│   ├── cart.store.ts          # سلة POS
│   └── ui.store.ts            # حالة الواجهة
└── styles/
    └── globals.css            # CSS variables + Tailwind v4
```

### إعداد Tailwind v4 + RTL
```css
/* في globals.css */
@import "tailwindcss";

@theme {
  --font-sans: "Tajawal", system-ui, sans-serif;
  --font-numeric: "Inter", system-ui, sans-serif;

  /* كل الـ color tokens — انظر قسم 4 */
}
```

```html
<!-- في index.html -->
<html dir="rtl" lang="ar">
```

**قاعدة صارمة:** استخدم دائماً الـ logical properties:
- `ms-*` / `me-*` بدلاً من `ml-*` / `mr-*`
- `ps-*` / `pe-*` بدلاً من `pl-*` / `pr-*`
- `start-*` / `end-*` بدلاً من `left-*` / `right-*`
- `text-start` / `text-end` بدلاً من `text-left` / `text-right`

---

## 4. نظام التصميم المرئي

### الألوان (CSS Variables)
```css
:root {
  /* Backgrounds */
  --color-bg-base:        #F9F8F5;
  --color-bg-surface:     #FFFFFF;
  --color-bg-muted:       #F3F1EC;

  /* Borders */
  --color-border:         #E8E6E1;

  /* Text */
  --color-text-primary:   #181715;
  --color-text-secondary: #6D6A62;

  /* Accent — النحاسي الدافئ */
  --color-accent:         #CF694A;
  --color-accent-hover:   #BB5B3E;
  --color-accent-active:  #A84E35;
  --color-accent-light:   #FCF4F1;
  --color-accent-ring:    rgba(207, 105, 74, 0.18);

  /* Status */
  --color-success:        #13773A;
  --color-success-bg:     #EDF9F1;
  --color-danger:         #BA1C1C;
  --color-danger-bg:      #FEF1F1;
  --color-warning:        #B85F0E;
  --color-warning-bg:     #FEFAEB;

  /* Charts */
  --chart-primary:        #CF694A;
  --chart-secondary:      #2563eb;
  --chart-tertiary:       #B85F0E;
}
```

### الطباعة
```css
:root {
  /* الحجم الأساسي */
  font-size: 14px;
  line-height: 1.6;

  /* الأحجام */
  --text-heading:  20px; /* weight 600 */
  --text-body:     15px; /* weight 400 */
  --text-small:    13px; /* weight 400 */
}

/* الأرقام والمبالغ المالية — دائماً Inter */
.numeric {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: -0.5px;
}
```

### المسافات والأبعاد
```css
:root {
  --sp-1: 4px;    --sp-2: 8px;   --sp-3: 12px;
  --sp-4: 16px;   --sp-6: 24px;  --sp-8: 32px;

  --radius-sm:   6px;
  --radius-md:   10px;
  --radius-lg:   14px;
  --radius-pill: 999px;

  --shadow-sm: 0 10px 24px rgba(15, 23, 42, 0.05);
  --shadow-md: 0 18px 38px rgba(15, 23, 42, 0.10);

  --input-height:    44px;
  --btn-height:      44px;
  --height-topbar:   56px;
  --height-bottombar:60px;
}
```

### حالات التفاعل
**الأزرار الأساسية:**
- Idle: `bg: var(--color-accent)`, text: white
- Hover: `bg: var(--color-accent-hover)`
- Active: `bg: var(--color-accent-active)`, `transform: scale(0.98)`
- Disabled: `bg: var(--color-bg-muted)`, text: `var(--color-text-secondary)`, `opacity: 0.6`
- Focus: `box-shadow: 0 0 0 3px var(--color-accent-ring)`

**حقول الإدخال:**
- Idle: `border: 1px solid var(--color-border)`
- Focus: `border: 1px solid var(--color-accent)`, ring
- Error: `border: 1px solid var(--color-danger)`, `bg: var(--color-danger-bg)`

**البطاقات:**
- Default: `bg: white`, `border: 1px solid var(--color-border)`
- Clickable hover: `border: 1px solid var(--color-accent)`
- **لا shadows على البطاقات العادية** — فقط على الـ dialogs

### Breakpoints
```
Mobile:  360px – 767px
Tablet:  768px – 1199px
Desktop: 1200px+
```

---

## 5. هندسة الأموال (مهم جداً)

**القاعدة:** كل مبلغ في قاعدة البيانات وفي الكود هو `INTEGER` يمثل وحدات صغيرة (فلوس/هللات).

لا تستخدم float أو decimal أبداً للمبالغ المالية.

### الدوال المطلوبة في `src/lib/money.ts`

```typescript
// 1. جمع مبلغين
addMoney(a: number, b: number): number

// 2. طرح مبلغين
subMoney(a: number, b: number): number

// 3. ضرب مبلغ في كمية (quantity دائماً integer)
mulMoney(amount: number, qty: number): number

// 4. تطبيق نسبة مئوية (تقريب لأقرب وحدة)
applyPercent(amount: number, percent: number): number

// 5. عرض المبلغ للمستخدم (من فلوس إلى عرض)
formatMoney(fils: number, currency?: string): string
// مثال: formatMoney(15050) → "150.50"

// 6. تحويل إدخال المستخدم إلى فلوس
parseMoney(input: string): number
// مثال: parseMoney("150.50") → 15050
```

**قاعدة التقريب:** `Math.round()` عند تطبيق النسب فقط — لا تقريب في العمليات الأخرى.

---

## 6. نظام PIN

### المنطق
```
الحالة الافتراضية: الموظف (بدون PIN)
الميزات المحمية: تطلب PIN المدير
```

### الميزات المحمية (تطلب PIN)
- إضافة وتعديل المنتجات
- الرئيسية والتقارير
- إدارة فئات المصروفات
- التحويل بين الحسابات
- التسوية في المخزون
- إلغاء طلب صيانة
- إعدادات النظام وتغيير PIN

### التخزين الآمن في `src/lib/pin.ts`
```typescript
// تشفير PBKDF2 عبر SubtleCrypto المدمجة — لا مكتبة خارجية
async hashPin(pin: string): Promise<{ hash: string; salt: string }>
async verifyPin(pin: string, stored: { hash: string; salt: string }): Promise<boolean>

// PBKDF2 parameters:
// iterations: 200_000
// hash: "SHA-256"
// salt: 16 bytes random (crypto.getRandomValues)
// خزّن في idb-keyval تحت مفتاح "admin_pin"
```

### سلوك PIN Dialog
- يظهر كـ bottom sheet على الهاتف، dialog في المنتصف على التابلت
- 4 أرقام (يمكن تغييره من الإعدادات: 4-8 أرقام)
- Rate limiting: بعد 5 محاولات فاشلة → قفل 2 دقيقة
- تخزين حالة القفل في idb-keyval (لا يُعاد الضبط عند الإغلاق)
- PIN افتراضي عند أول تشغيل: `1234` مع إجبار المستخدم على التغيير

---

## 7. معمارية التطبيق

### SQLite Worker
```typescript
// src/db/worker.ts
// يعمل في Web Worker مستقل
// يستخدم OPFS SAH Pool VFS
// يُشغَّل عبر Comlink من Main Thread

// عند أول تشغيل:
// 1. فتح/إنشاء DB في OPFS
// 2. تشغيل migration runner
// 3. PRAGMA synchronous = NORMAL
// 4. PRAGMA foreign_keys = ON
```

### Migration Runner
```typescript
// src/db/migrations/index.ts
// يقرأ PRAGMA user_version
// يشغّل كل migration جديدة بالترتيب
// كل migration في transaction منفصلة
// يحدّث PRAGMA user_version بعد كل migration
// عند فشل migration: يوقف التطبيق ويعرض شاشة خطأ
```

### TanStack Query + SQLite
```typescript
// كل query تستخدم queryFn تنادي Comlink proxy
// Mutations تستخدم mutationFn + invalidateQueries
// لا شبكة — offline فقط — networkMode: 'always'
// staleTime: Infinity لأغلب البيانات (لا سيرفر يُحدّثها)
```

### تحديثات PWA — Prompt Mode فقط
```typescript
// registerType: 'prompt' في vite-plugin-pwa
// عند اكتشاف SW جديد: toast "تحديث متوفر — اضغط للتحديث"
// skipWaiting() فقط عند موافقة المستخدم
// منع التحديث إذا كانت سلة POS تحتوي على عناصر
```

---

## 8. PWA والـ Offline

### عند أول تشغيل
```typescript
// 1. طلب navigator.storage.persist() — صامت للـ PWA المثبتة
// 2. التحقق من navigator.storage.persisted()
// 3. إذا false: عرض banner تحذيري مستمر
// 4. Precache كل ملفات التطبيق عبر Workbox
// 5. self-host الخطوط (Tajawal + Inter) — لا CDN
```

### استراتيجية Workbox
```
App shell:      CacheFirst (hashed assets)
Fonts:          CacheFirst (immutable)
Navigation:     NetworkOnly fallback to index.html
```

### كشف وضع التثبيت
```typescript
// الكشف عن display-mode
// إذا لم يكن standalone: عرض شاشة "أضف للشاشة الرئيسية"
// مع تعليمات مصوّرة (Android Chrome خطوات التثبيت)
```

---

## 9. قاعدة البيانات

### الجداول

```sql
-- =================== PRODUCTS ===================
CREATE TABLE products (
  id           TEXT PRIMARY KEY,
  name         TEXT NOT NULL,
  sku          TEXT UNIQUE,
  category     TEXT NOT NULL CHECK(category IN (
                 'device','sim','service_general',
                 'service_repair','accessory','package')),
  sale_price   INTEGER NOT NULL DEFAULT 0,  -- fils
  stock_qty    INTEGER NOT NULL DEFAULT 0,
  min_stock    INTEGER NOT NULL DEFAULT 0,
  track_stock  INTEGER NOT NULL DEFAULT 1,  -- boolean
  is_quick_add INTEGER NOT NULL DEFAULT 0,
  is_active    INTEGER NOT NULL DEFAULT 1,
  notes        TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_category ON products(category);

-- =================== ACCOUNTS ===================
CREATE TABLE accounts (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK(type IN (
                    'cash','card','bank','wallet','receivable','payable')),
  balance         INTEGER NOT NULL DEFAULT 0,  -- fils
  fee_percent     INTEGER NOT NULL DEFAULT 0,  -- بالألف (0.1% = 100)
  module_scope    TEXT,  -- 'pos','maintenance','operations' أو NULL للكل
  is_active       INTEGER NOT NULL DEFAULT 1,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL
);

-- =================== CUSTOMERS ===================
CREATE TABLE customers (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  phone         TEXT,
  balance       INTEGER NOT NULL DEFAULT 0,  -- fils (سالب = مديون)
  credit_limit  INTEGER NOT NULL DEFAULT 0,
  notes         TEXT,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL
);

-- =================== SUPPLIERS ===================
CREATE TABLE suppliers (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  phone      TEXT,
  balance    INTEGER NOT NULL DEFAULT 0,  -- fils
  notes      TEXT,
  created_at TEXT NOT NULL
);

-- =================== INVOICES ===================
CREATE TABLE invoices (
  id               TEXT PRIMARY KEY,
  invoice_number   TEXT NOT NULL UNIQUE,
  invoice_date     TEXT NOT NULL,  -- YYYY-MM-DD
  customer_id      TEXT REFERENCES customers(id),
  subtotal         INTEGER NOT NULL DEFAULT 0,  -- fils
  discount_amount  INTEGER NOT NULL DEFAULT 0,  -- fils
  total_amount     INTEGER NOT NULL DEFAULT 0,  -- fils
  paid_amount      INTEGER NOT NULL DEFAULT 0,  -- fils
  debt_amount      INTEGER NOT NULL DEFAULT 0,  -- fils
  status           TEXT NOT NULL DEFAULT 'active'
                     CHECK(status IN ('active','returned','cancelled')),
  pos_terminal     TEXT,
  notes            TEXT,
  created_at       TEXT NOT NULL
);
CREATE INDEX idx_invoices_date ON invoices(invoice_date);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);

CREATE TABLE invoice_items (
  id              TEXT PRIMARY KEY,
  invoice_id      TEXT NOT NULL REFERENCES invoices(id),
  product_id      TEXT REFERENCES products(id),
  product_name    TEXT NOT NULL,
  quantity        INTEGER NOT NULL,
  unit_price      INTEGER NOT NULL,  -- fils
  discount_amount INTEGER NOT NULL DEFAULT 0,  -- fils
  line_total      INTEGER NOT NULL   -- fils
);
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);

CREATE TABLE invoice_payments (
  id          TEXT PRIMARY KEY,
  invoice_id  TEXT NOT NULL REFERENCES invoices(id),
  account_id  TEXT NOT NULL REFERENCES accounts(id),
  amount      INTEGER NOT NULL,  -- fils
  fee_amount  INTEGER NOT NULL DEFAULT 0  -- fils
);

-- =================== EXPENSES ===================
CREATE TABLE expense_categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('fixed','variable')),
  is_active   INTEGER NOT NULL DEFAULT 1,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  description TEXT
);

CREATE TABLE expenses (
  id                  TEXT PRIMARY KEY,
  expense_number      TEXT NOT NULL UNIQUE,
  expense_date        TEXT NOT NULL,
  account_id          TEXT NOT NULL REFERENCES accounts(id),
  category_id         TEXT NOT NULL REFERENCES expense_categories(id),
  amount              INTEGER NOT NULL,  -- fils
  description         TEXT NOT NULL,
  notes               TEXT,
  created_at          TEXT NOT NULL
);
CREATE INDEX idx_expenses_date ON expenses(expense_date);

-- =================== OPERATIONS ===================
CREATE TABLE topups (
  id            TEXT PRIMARY KEY,
  topup_number  TEXT NOT NULL UNIQUE,
  topup_date    TEXT NOT NULL,
  account_id    TEXT NOT NULL REFERENCES accounts(id),
  supplier_id   TEXT REFERENCES suppliers(id),
  amount        INTEGER NOT NULL,   -- fils (المبلغ المستلم)
  cost          INTEGER NOT NULL,   -- fils (التكلفة)
  profit        INTEGER NOT NULL,   -- fils (الربح = amount - cost)
  notes         TEXT,
  created_at    TEXT NOT NULL
);

CREATE TABLE transfers (
  id               TEXT PRIMARY KEY,
  transfer_number  TEXT NOT NULL UNIQUE,
  transfer_date    TEXT NOT NULL,
  from_account_id  TEXT NOT NULL REFERENCES accounts(id),
  to_account_id    TEXT NOT NULL REFERENCES accounts(id),
  amount           INTEGER NOT NULL,  -- fils
  notes            TEXT,
  created_at       TEXT NOT NULL
);

-- =================== MAINTENANCE ===================
CREATE TABLE maintenance_jobs (
  id                  TEXT PRIMARY KEY,
  job_number          TEXT NOT NULL UNIQUE,
  job_date            TEXT NOT NULL,
  customer_name       TEXT NOT NULL,
  customer_phone      TEXT,
  device_type         TEXT NOT NULL,
  issue_description   TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'new'
                        CHECK(status IN ('new','in_progress','ready','delivered','cancelled')),
  estimated_cost      INTEGER,       -- fils
  final_amount        INTEGER,       -- fils
  payment_account_id  TEXT REFERENCES accounts(id),
  notes               TEXT,
  delivered_at        TEXT,
  created_at          TEXT NOT NULL,
  updated_at          TEXT NOT NULL
);
CREATE INDEX idx_maintenance_status ON maintenance_jobs(status);

-- =================== INVENTORY ===================
CREATE TABLE inventory_counts (
  id           TEXT PRIMARY KEY,
  count_date   TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'active'
                 CHECK(status IN ('active','completed')),
  notes        TEXT,
  created_at   TEXT NOT NULL
);

CREATE TABLE inventory_count_items (
  id                    TEXT PRIMARY KEY,
  inventory_count_id    TEXT NOT NULL REFERENCES inventory_counts(id),
  product_id            TEXT NOT NULL REFERENCES products(id),
  system_qty            INTEGER NOT NULL,
  actual_qty            INTEGER NOT NULL DEFAULT 0,
  reason                TEXT
);

-- =================== LEDGER ===================
CREATE TABLE ledger_entries (
  id          TEXT PRIMARY KEY,
  entry_date  TEXT NOT NULL,
  account_id  TEXT NOT NULL REFERENCES accounts(id),
  type        TEXT NOT NULL CHECK(type IN ('debit','credit')),
  amount      INTEGER NOT NULL,  -- fils
  ref_type    TEXT,  -- 'invoice','expense','topup','transfer','maintenance','debt_payment'
  ref_id      TEXT,
  description TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX idx_ledger_account ON ledger_entries(account_id);
CREATE INDEX idx_ledger_date ON ledger_entries(entry_date);

-- =================== DEBT PAYMENTS ===================
CREATE TABLE debt_payments (
  id           TEXT PRIMARY KEY,
  payment_date TEXT NOT NULL,
  customer_id  TEXT NOT NULL REFERENCES customers(id),
  account_id   TEXT NOT NULL REFERENCES accounts(id),
  amount       INTEGER NOT NULL,  -- fils
  notes        TEXT,
  created_at   TEXT NOT NULL
);

-- =================== APP SEQUENCES ===================
CREATE TABLE sequences (
  name     TEXT PRIMARY KEY,
  last_val INTEGER NOT NULL DEFAULT 0
);
INSERT INTO sequences VALUES ('invoice',0),('expense',0),('topup',0),
  ('transfer',0),('maintenance',0);
```

---

## 10. مواصفات الوحدات

---

### الوحدة 1: POS (نقطة البيع) — الأهم

#### تخطيط التابلت (768px+)
```
┌──────────────────────────┬───────────────────────┐
│   بحث    [فئة][فئة][فئة] │  السلة                │
│  ┌──────────────────────┐│  ─────────────────────│
│  │ [منتج][منتج][منتج]  ││  عنصر 1  ×2    200    │
│  │ [منتج][منتج][منتج]  ││  عنصر 2  ×1    150    │
│  │ [منتج][منتج][منتج]  ││  ─────────────────────│
│  └──────────────────────┘│  خصم:          - 50   │
│        65%               │  الإجمالي:      300   │
│                          │  ─────────────────────│
│                          │  [إتمام البيع]        │
│                          │        35%            │
└──────────────────────────┴───────────────────────┘
```

#### تخطيط الهاتف (< 768px)
```
شاشة كاملة للمنتجات + زر عائم "السلة (3)"
عند الضغط: Bottom Sheet للسلة والدفع
```

#### ميزات POS
**البحث والتصفية:**
- بحث فوري (debounce 150ms)
- يبحث في: الاسم، SKU
- فلتر الفئات: chips أفقية قابلة للتمرير
- الفئات: الكل، أجهزة، شرائح، خدمات، إكسسوار، باقات
- عرض المنتجات: grid بالصور (افتراضي) / قائمة نصية

**بطاقة المنتج:**
- اسم المنتج
- السعر (Inter Bold)
- مؤشر مخزون منخفض (إذا qty <= min_stock)
- زر + كبير قابل للمس (min 44px)

**السلة:**
- إضافة/حذف/تعديل الكمية لكل عنصر
- خصم لكل عنصر (مبلغ أو نسبة)
- خصم على الفاتورة الكلية
- عرض الإجمالي الفوري
- حفظ حتى 3 سلات محفوظة (عنوان قصير لكل سلة)
- مسح السلة مع تأكيد

**عميل الفاتورة (اختياري):**
- بحث بالاسم أو الهاتف
- عرض الرصيد الحالي
- إضافة عميل جديد سريع من POS

**شاشة الدفع:**
- يُفتح كـ overlay / bottom sheet
- اختيار حساب الدفع (نقد، بطاقة، ...)
- إمكانية دفع مقسّم (حسابات متعددة)
- حقل المبلغ المستلم (للنقد) → حساب الباقي
- المبلغ المتبقي يتحول لدين تلقائياً إذا كان هناك عميل
- تأكيد قبل الإتمام

**بعد البيع:**
- شاشة نجاح مع ملخص
- زر "مشاركة الإيصال" (PDF عبر Web Share API)
- زر "بيع جديد" (يصفّر السلة)
- عرض الباقي المُسلَّم

**قواعد عمل POS:**
- لا بيع إذا كان المخزون = 0 وخاصية track_stock مفعّلة
- الخصم لا يتجاوز قيمة العنصر
- الدفع المقسّم: مجموع المدفوعات + الدين = الإجمالي
- رقم الفاتورة: تسلسل تلقائي من جدول sequences
- كل عملية بيع في transaction واحدة (atomically):
  1. إنشاء invoice + items + payments
  2. خصم المخزون
  3. تحديث رصيد الحسابات في ledger
  4. إذا دين: تحديث رصيد العميل

---

### الوحدة 2: إدارة المنتجات

**متاح للجميع:** عرض قائمة المنتجات
**يطلب PIN:** إضافة، تعديل، تفعيل/تعطيل

**قائمة المنتجات:**
- بحث + فلتر فئة + فلتر (نشط/معطّل)
- عمودان على التابلت، عمود واحد على الهاتف
- مؤشر مخزون منخفض
- Quick toggle نشط/معطّل

**نموذج المنتج:**
```
الاسم*         : نص
SKU            : نص اختياري (unique)
الفئة*         : device | sim | service_general | service_repair | accessory | package
السعر*         : رقم عشري (يُحوَّل لفلوس)
المخزون الحالي : رقم صحيح
الحد الأدنى   : رقم صحيح (تحذير إذا وصل)
تتبع المخزون  : toggle
إضافة سريعة  : toggle (يظهر أولاً في POS)
ملاحظات       : نص اختياري
```

**تعديل المخزون:**
- زر "تعديل المخزون" منفصل
- يقبل: زيادة / نقصان / ضبط مباشر
- يسجّل السبب

---

### الوحدة 3: المخزون

**الجرد:**
1. إنشاء جلسة جرد (تاريخ + ملاحظات اختيارية)
2. اختيار النطاق: كل المنتجات أو مختارة
3. إدخال الكميات الفعلية لكل منتج
4. الفرق = الفعلي - النظام
5. إدخال سبب للفروقات (اختياري)
6. إتمام الجرد → يحدّث المخزون (يطلب PIN)

**سجل الجرد:**
- قائمة الجلسات المكتملة
- تفاصيل الفروقات

**التسوية (يطلب PIN):**
- اختيار حساب
- إدخال الرصيد الفعلي
- مقارنة بالرصيد المتوقع
- تسجيل الفرق مع السبب

---

### الوحدة 4: المصروفات

**تسجيل مصروف:**
```
المبلغ*        : رقم عشري
الحساب*        : قائمة الحسابات النشطة
الفئة*         : قائمة الفئات النشطة
الوصف*         : نص (إلزامي)
ملاحظات       : اختياري
```

**قائمة المصروفات:**
- اليوم / الأسبوع / الشهر
- إجمالي المصروفات للفترة
- تصدير CSV

**إدارة الفئات (يطلب PIN):**
- إضافة / تعديل فئة
- النوع: ثابت / متغيّر
- ترتيب العرض
- تفعيل/تعطيل

---

### الوحدة 5: العمليات

**شحن رصيد (Topup):**
```
الحساب*        : قائمة حسابات العمليات
المورّد        : اختياري
المبلغ المستلم* : رقم عشري (ما دفعه العميل)
التكلفة*       : رقم عشري (ما دفعته للمورّد)
الربح          : يُحسب تلقائياً (مستلم - تكلفة)
ملاحظات       : اختياري
```

**تحويل بين حسابات (يطلب PIN):**
```
من حساب*  : قائمة + الرصيد الحالي
إلى حساب* : قائمة + الرصيد المتوقع
المبلغ*   : رقم عشري
ملاحظات  : اختياري
```

**السجل:**
- جدول عمليات الشحن (التاريخ، الحساب، المورّد، المستلم، التكلفة، الربح)
- جدول التحويلات (التاريخ، من، إلى، المبلغ)
- إجمالي الربح للفترة

---

### الوحدة 6: الصيانة

**إنشاء طلب:**
```
اسم العميل*       : نص
هاتف العميل       : اختياري
نوع الجهاز*       : نص حر (موبايل، لابتوب، ساعة...)
وصف المشكلة*      : نص (textarea)
التكلفة التقديرية : رقم عشري اختياري
ملاحظات          : اختياري
```

**workflow الحالات:**
```
new → in_progress → ready → delivered
                 ↘ cancelled (يطلب PIN)
```

**عند التسليم:**
- المبلغ النهائي (إلزامي)
- حساب الدفع (إلزامي)
- يُسجَّل في ledger تلقائياً

**قائمة الطلبات:**
- بحث: رقم الطلب، اسم العميل، نوع الجهاز
- فلتر الحالة
- عرض الطلبات في جدول أو بطاقات
- الضغط → تفاصيل + تغيير الحالة

**ملخص:**
- طلبات مفتوحة، جاهزة للتسليم، مُسلَّمة اليوم
- إجمالي إيرادات الصيانة

---

### الوحدة 7: الرئيسية (يطلب PIN)

**بطاقات KPI (اليوم):**
- عدد الفواتير
- إجمالي المبيعات
- إجمالي المصروفات
- طلبات صيانة جاهزة

**تنبيهات:**
- منتجات مخزون منخفض (عدد)
- طلبات صيانة معلّقة
- كل تنبيه له رابط للوحدة المختصة

**آخر 5 فواتير اليوم:**
- رقم الفاتورة، الوقت، الإجمالي، الحالة

**زر "فتح POS" بارز**

---

### الوحدة 8: التقارير (يطلب PIN)

**فلاتر:**
- تاريخ من / إلى
- تجميع: يومي / أسبوعي / شهري

**ملخص المبيعات:**
- إجمالي المبيعات، عدد الفواتير، متوسط الفاتورة
- رسم بياني للمبيعات (ECharts — bar chart)

**4 أقسام:**

**١. المبيعات:**
- جدول الفواتير (رقم، تاريخ، الإجمالي، الحالة)
- أعلى 10 منتجات مبيعاً (الكمية + الإيراد)

**٢. المالية:**
- رصيد كل حساب
- إجمالي المصروفات بالفئة
- إجمالي إيرادات الصيانة

**٣. المخزون:**
- المنتجات ذات المخزون المنخفض (اسم، كمية حالية، الحد الأدنى)

**٤. الصيانة:**
- مفتوحة، جاهزة، مُسلَّمة، الإيراد الكلي
- جدول الطلبات مع كل التفاصيل

**التصدير:**
- Excel (SheetJS) للتقرير الحالي
- CSV كخيار بديل

---

## 11. التنقل والـ Shell

### تابلت (768px+)
```
┌──────────────────────────────────────────────────┐
│  [☰ الاسم]        [اليوم والتاريخ]   [الإعدادات] │ ← TopBar
├──────────────────────────────────────────────────┤
│ الرئيسية  │                                      │
│ POS       │     محتوى الصفحة                     │
│ المنتجات  │                                      │
│ المخزون   │                                      │
│ المصروفات │                                      │
│ العمليات  │                                      │
│ الصيانة   │                                      │
│ التقارير  │                                      │
└───────────┴──────────────────────────────────────┘
  Side Rail (60px مطوية / 240px مفتوحة)
```

### هاتف (< 768px)
```
┌────────────────────────────┐
│  TopBar مبسّطة              │
├────────────────────────────┤
│                            │
│    محتوى الصفحة            │
│                            │
├────────────────────────────┤
│ [🏠][💳][📦][🔧][📊]       │ ← Bottom Navigation (5 رموز)
└────────────────────────────┘
```

**Bottom Navigation icons:**
1. الرئيسية (house)
2. POS (shopping-cart) — دائماً في المنتصف وأكبر
3. المخزون + المصروفات + العمليات → More (menu)
4. الصيانة
5. التقارير

**قواعد Shell:**
- عنصر التنقل النشط: `bg: var(--color-accent-light)`, border-inline-start accent
- TopBar ارتفاع 56px، sticky
- Bottom bar ارتفاع 60px + safe-area-inset-bottom

---

## 12. النسخ الاحتياطي

**زر "نسخ احتياطي" في الإعدادات:**
1. تصدير ملف `.db` من OPFS
2. Web Share API → المستخدم يختار (واتساب، إيميل، Drive...)
3. تسمية الملف: `backup-YYYY-MM-DD-HHmm.db`

**تتبع النسخ:**
- خزّن `lastBackupAt` في idb-keyval
- إذا مرّت > 24 ساعة: banner تحذير في أعلى الشاشة (قابل للإغلاق)
- عرض "آخر نسخة: قبل X أيام" في الإعدادات

**الاستعادة:**
- زر "استعادة من ملف" في الإعدادات
- يقبل ملف `.db`
- يتحقق من صحة الـ schema قبل الاستبدال
- يعمل نسخة احتياطية من البيانات الحالية قبل الاستبدال
- يطلب PIN

---

## 13. الإعدادات

**قسم الحسابات (يطلب PIN):**
- قائمة الحسابات مع الأرصدة
- إضافة / تعديل حساب

**قسم النظام (يطلب PIN):**
- تغيير PIN المدير
- رقم المحطة (POS terminal code)
- اسم المتجر (يظهر في الإيصالات)

**قسم النسخ الاحتياطي:**
- زر النسخ الاحتياطي الفوري
- آخر تاريخ نسخ
- زر الاستعادة

**قسم عن النظام:**
- إصدار التطبيق (`import.meta.env.VITE_BUILD`)
- حجم قاعدة البيانات
- حالة التخزين الدائم

---

## 14. الإيصال

**محتوى الإيصال:**
```
[اسم المتجر]
──────────────
رقم الفاتورة: INV-0001
التاريخ: 13/05/2026  الوقت: 14:30

المنتج          الكمية    السعر
───────────────────────────────
[اسم المنتج]       2      100.00
[اسم المنتج]       1       50.00
───────────────────────────────
المجموع:                  250.00
خصم:                       25.00
الإجمالي:                 225.00
───────────────────────────────
نقد:                      250.00
الباقي:                    25.00
───────────────────────────────
شكراً لزيارتكم
```

**توليد الإيصال:**
1. بناء HTML للإيصال (Arabic RTL)
2. html2canvas-pro → PNG
3. pdf-lib → PDF (A6 أو عرض 80mm)
4. Web Share API → واتساب / إيميل

---

## 15. متطلبات التسليم

### قبل اعتبار أي وحدة مكتملة:
- [ ] TypeScript strict mode بدون أخطاء
- [ ] كل العمليات المالية تستخدم integer fils
- [ ] RTL صحيح بالكامل (logical properties)
- [ ] touch targets بحد أدنى 44px
- [ ] الـ PIN يُطلب في كل الميزات المحمية
- [ ] كل العمليات الحرجة في DB transaction واحدة
- [ ] react-error-boundary على كل وحدة

### الشاشات الإلزامية:
- [ ] شاشة "أضف للشاشة الرئيسية" للمستخدمين خارج standalone
- [ ] شاشة تحميل DB (أثناء فتح OPFS)
- [ ] شاشة خطأ Migration مع زر "نسخ احتياطي"
- [ ] شاشة تحديث متاح (toast)

### الأداء:
- [ ] قائمة المنتجات تستخدم @tanstack/react-virtual
- [ ] ECharts lazy loaded فقط في التقارير
- [ ] SheetJS lazy loaded فقط عند التصدير
- [ ] DB Worker يعمل في خيط منفصل دائماً

---

## 16. ترتيب البناء المقترح

```
المرحلة 1: الأساس
├── إعداد Vite + React + TS + Tailwind v4
├── SQLite Worker + Comlink + Migration runner
├── Schema كامل (001_init.sql)
├── Shell التنقل (TopBar + Side Rail + Bottom Nav)
└── نظام PIN (lib/pin.ts + PIN dialog)

المرحلة 2: POS — القلب
├── قائمة المنتجات (مع virtual scroll)
├── سلة الشراء (Zustand store)
├── شاشة الدفع
├── إتمام البيع (DB transaction)
└── الإيصال (html2canvas + pdf-lib)

المرحلة 3: الوحدات التشغيلية
├── إدارة المنتجات
├── المصروفات
├── العمليات (topup + transfer)
└── الصيانة

المرحلة 4: الإدارية
├── المخزون (جرد + تسوية)
├── الرئيسية (dashboard)
└── التقارير (ECharts + export)

المرحلة 5: النهائيات
├── الإعدادات الكاملة
├── النسخ الاحتياطي + الاستعادة
├── PWA manifest + icons
└── اختبار شامل على Android Chrome
```

---

**ملاحظة نهائية:** Google Drive التلقائي سيُضاف في مرحلة منفصلة بعد اكتمال النظام.

