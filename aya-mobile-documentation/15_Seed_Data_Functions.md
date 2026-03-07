# آية موبايل - البيانات الأولية والدوال
## 15) Seed Data & Edge Functions

---

## 🌱 البيانات الأولية (Seed Data)

عند نشر النظام لأول مرة، يتم إدخال البيانات التالية تلقائياً.

### 1. الحسابات المالية (accounts)

| الاسم | النوع | العمولة | الوحدة | الرصيد الافتتاحي |
|-------|-------|---------|--------|------------------|
| الصندوق | `cash` | 0% | `core` | 0.000 |
| فيزا | `visa` | 2% | `core` | 0.000 |
| Orange Money | `wallet` | 0% | `core` | 0.000 |
| صندوق الصيانة | `cash` | 0% | `maintenance` | 0.000 |

---

### 2. فئات المنتجات (categories)

| الاسم | القيمة في DB | الوصف |
|-------|-------------|-------|
| أجهزة | `device` | موبايلات، تابلت |
| إكسسوارات | `accessory` | سماعات، شواحن، كفرات |
| شرائح | `sim` | خطوط جوال |
| خدمات صيانة | `service_repair` | إصلاح شاشة، برمجة (قسم الصيانة) |
| خدمات عامة | `service_general` | تركيب حماية، برمجة (بدون مخزون) |

---

### 3. فئات المصروفات (expense_categories)

| الاسم | النوع |
|-------|-------|
| إيجار | ثابتة |
| رواتب | ثابتة |
| إنترنت | ثابتة |
| كهرباء | ثابتة |
| مواصلات | متغيرة |
| صيانة محل | متغيرة |
| مستلزمات | متغيرة |
| أخرى | متغيرة |

---

### 4. إعدادات النظام (system_settings)

| المفتاح | القيمة | النوع | الوصف |
|---------|--------|-------|-------|
| `max_pos_discount_percentage` | `10` | number | الحد الأقصى لخصم موظف POS (%) — Admin مُستثنى |
| `discount_warning_threshold` | `10` | number | حد التنبيه (إشعار Admin عند خصم يقترب من الحد) |
| `allow_negative_stock` | `false` | boolean | السماح بالبيع عند نفاد المخزون |
| `prevent_sale_below_cost` | `true` | boolean | منع البيع بأقل من التكلفة (POS فقط — Admin مُستثنى) |
| `default_credit_limit` | `100` | number | سقف الدين الافتراضي للعميل الجديد (د.أ) |
| `default_due_date_days` | `30` | number | أيام الاستحقاق الافتراضية لفواتير الدين |
| `invoice_edit_window_hours` | `24` | number | ساعات السماح بتعديل الفاتورة بعد إصدارها |
| `pos_idle_timeout_minutes` | `240` | number | تسجيل خروج تلقائي بعد 4 ساعات عدم نشاط (Frontend) — قرار المستخدم: الخروج يتم يدوياً غالباً |
| `hide_cost_prices_pos` | `true` | boolean | إخفاء أسعار التكلفة والأرباح عن شاشة POS |
| `require_reason_min_chars` | `50` | number | الحد الأدنى لأحرف سبب الإلغاء/التعديل |
| `max_login_attempts` | `5` | number | عدد المحاولات قبل قفل الحساب مؤقتاً |
| `low_stock_threshold` | `2` | number | حد المخزون المنخفض |
| `store_name` | `آية موبايل` | string | اسم المتجر (ترويسة + إيصالات) |
| `store_phone` | `` | string | رقم المتجر |
| `currency_symbol` | `د.أ` | string | رمز العملة |
| `receipt_footer_text` | `` | string | نص أسفل الفاتورة (شروط الإرجاع) |

---

### 5. المستخدمون (profiles)

| الاسم | الدور | البريد |
|-------|-------|--------|
| أحمد | `admin` | يُحدد عند النشر |
| الموظف | `pos_staff` | يُحدد عند النشر |

---

## ⚡ قائمة الدوال (PostgreSQL Functions / Edge Functions)

## ملخص صلاحيات الدوال

| الدالة | الصلاحية |
|--------|----------|
| create_sale() | Admin + POS |
| edit_invoice() | Admin فقط |
| cancel_invoice() | Admin فقط |
| create_return() | Admin + POS |
| create_debt_payment() | Admin + POS |
| create_debt_manual() | Admin فقط |
| reconcile_account() | Admin فقط |
| create_expense() | Admin + POS |
| create_daily_snapshot() | Admin فقط |
| create_purchase() | Admin فقط |
| create_supplier_payment() | Admin فقط |
| create_topup() | Admin + POS |
| create_transfer() | Admin فقط |
| create_maintenance_job() | Admin + POS |
| complete_inventory_count() | Admin فقط |
| update_settings() | Admin فقط |
| fn_verify_balance_integrity() | Admin فقط |
| جميع دوال get_*() | يختلف حسب الدالة والـ Admin يرى الكل |

---

### دوال البيع والفواتير

| # | الدالة | الغرض | المُستدعى | Transaction |
|---|--------|-------|----------|-------------|
| 1 | `create_sale()` | إنشاء فاتورة كاملة (عناصر + دفع + مخزون + ledger) | POS + Admin | ✅ |
| 2 | `edit_invoice()` | تعديل فاتورة (عكس + إعادة) مع سبب | Admin فقط | ✅ |
| 3 | `cancel_invoice()` | إلغاء فاتورة (عكس كل الحركات) | Admin فقط | ✅ |

### دوال المرتجعات

| # | الدالة | الغرض | المُستدعى | Transaction |
|---|--------|-------|----------|-------------|
| 4 | `create_return()` | تسجيل مرتجع (إرجاع مخزون + ledger + دين) | POS + Admin | ✅ |

### دوال الديون

| # | الدالة | الغرض | المُستدعى | Transaction |
|---|--------|-------|----------|-------------|
| 5 | `create_debt_payment()` | تسديد دين (ledger + إشعار عند التجاوز) | POS + Admin | ✅ |
| 5b | `create_debt_manual()` | تسجيل دين يدوي (بتاريخ اليوم — ADR-034) | Admin فقط | ✅ |

### دوال الحسابات

| # | الدالة | الغرض | المُستدعى | Transaction |
|---|--------|-------|----------|-------------|
| 6 | `reconcile_account()` | تسوية حساب (فرق الجرد) | Admin فقط | ✅ |

### دوال المصروفات

| # | الدالة | الغرض | المُستدعى | Transaction |
|---|--------|-------|----------|-------------|
| 8 | `create_expense()` | تسجيل مصروف (ledger) | POS + Admin | ✅ |

### دوال التشغيل

| # | الدالة | الغرض | المُستدعى | Transaction |
|---|--------|-------|----------|-------------|
| 9 | `create_daily_snapshot()` | لقطة يومية لجميع الأرصدة | Admin فقط | ✅ |
| 10 | `get_sales_history()` | جلب هيستوري المبيعات مع الفلاتر | Admin + POS (حسب الصلاحية) | - |
| 11 | `create_purchase()` | إنشاء أمر شراء (مدفوع/آجل) مع تحديث مخزون + (`ledger` عند النقدي) + مورد عند الآجل | Admin فقط | ✅ |
| 12 | `create_supplier_payment()` | تسديد دين مورد | Admin فقط | ✅ |
| 13 | `create_topup()` | تسجيل شحن رصيد مع ربح | POS + Admin | ✅ |
| 14 | `create_transfer()` | تحويل بين حسابين | Admin فقط | ✅ |
| 15 | `create_maintenance_job()` | إنشاء طلب صيانة | POS + Admin | ✅ |
| 16 | `complete_inventory_count()` | إكمال الجرد وتحديث المخزون تلقائياً | Admin فقط | ✅ |

---

## 🔄 الدوال المشتركة لكل دالة (create_sale كمثال)

```
create_sale(items[], payments[], customer_id?, pos_terminal_code?, notes?, idempotency_key, created_by)
├── 1. BEGIN TRANSACTION
├── 2. ترتيب `items` حسب `product_id ASC` قبل أي قفل (Lock Ordering Policy)
├── 2a. لكل منتج: SELECT FOR UPDATE (قفل المخزون + جلب sale_price من products — ADR-043)
├── 2b. عند `deadlock_detected (40P01)` أو `lock_not_available (55P03)`: إعادة المحاولة تلقائياً (max 2 retries, backoff قصير)
├── 2c. قراءة `max_pos_discount_percentage` من system_settings **داخل** الترانزاكشن (X-02 Fix — لتفادي Race Condition)
├── 3. التحقق: هل الكمية متوفرة؟ → إذا لا: ROLLBACK + ERR_STOCK_INSUFFICIENT
├── 4. التحقق: هل الخصم ضمن الحد (القيمة المقروءة للتو؟)؟ → إذا لا (POS): ROLLBACK + ERR_DISCOUNT_EXCEEDED
├── 4b. توليد idempotency_key والتحقق من عدم التكرار (ADR-033)
├── 5. حساب الأسعار سيرفرياً: unit_price = products.sale_price, total = qty × price × (1 - discount%) (ADR-043)
├── 6. إنشاء invoice + invoice_items (بما يشمل product_name_at_time و `cost_price_at_time = COALESCE(cost_price, 0)`)
├── 6b. التحقق: إذا كان `cost_price IS NULL` لأي منتج، إنشاء إشعار في `notifications` لأحمد (BP-02 Fix)
├── 7. إنشاء payments (طرق دفع متعددة) + التحقق: SUM(payments) + debt = computed_total
├── 8. خصم المخزون (products.stock_quantity -= quantity)
├── 9. إنشاء ledger_entries (لكل طريقة دفع — income بالمبلغ الإجمالي + expense للعمولة)
├── 9b. تحديث accounts.current_balance += net_amount (لكل حساب)
├── 10. إذا دفع بالدين: إنشاء debt_entry + تحديث debt_customer.current_balance
├── 11. إذا تجاوز حد الدين: إنشاء notification لأحمد
├── 12. إذا خصم > حد التنبيه: إنشاء notification لأحمد
├── 13. إنشاء audit_log (action_type='create_sale')
├── 14. COMMIT
└── 15. إرجاع: {invoice_id, invoice_number, total, change}
```

**ملاحظة صلاحيات (ADR-034 مُعدّل):** `invoice_date = CURRENT_DATE` دائماً — لا يُسمح بالـ Backdating لأي مستخدم. أي تصحيح يتم عبر قيد تسوية بتاريخ اليوم.

**ملاحظة مهمة (ADR-043):** الواجهة تُرسل `product_id` و `quantity` فقط — الباك-إند يسحب `sale_price` من `products` ويحسب الإجماليات. مثال على المدخلات:
```
items = [
  { product_id: "xxx", quantity: 2, discount_percentage: 5 },
  { product_id: "yyy", quantity: 1 },
  { product_id: "zzz", quantity: 3 }
]
// الباك-إند يجلب sale_price من products ويحسب:
// unit_price, discount_amount, total_price لكل عنصر (ADR-043)
// كذلك يحفظ product_name_at_time من products.name (P-02 Fix)
```

---

## 📜 جلب هيستوري المبيعات (get_sales_history)

```
get_sales_history(
  from_date,
  to_date,
  created_by?,
  status?,
  pos_terminal_code?,
  page?,
  page_size?
)
```

**النتيجة:**
- قائمة فواتير مرتبة من الأحدث للأقدم
- تتضمن: رقم الفاتورة، تاريخ التشغيل، وقت الإنشاء، المستخدم، الجهاز، الإجمالي، الحالة

**قواعد الصلاحيات:**
- Admin: يرى جميع الفواتير حسب الفلاتر
- POS: يرى فواتيره فقط (`created_by = auth.uid()`)

---

## 👥 ضمانات التشغيل المتزامن (Concurrent POS)

- كل عملية بيع تستخدم `idempotency_key` فريد.
- المخزون يُقفل داخل المعاملة (`SELECT FOR UPDATE`) لمنع التضارب بين جهازين.
- إذا تغير المخزون أثناء التنفيذ وتسبب بنقص، ترجع الدالة خطأ واضح للمستخدم (`ERR_STOCK_INSUFFICIENT` أو `ERR_CONCURRENT_STOCK_UPDATE`).

---

## 📐 توقيعات الدوال المُنمّطة (Function Signatures)

### 1. `create_sale()`
```
Input: {
  items: [{ product_id: UUID, quantity: INT, discount_percentage?: DECIMAL }],
  payments: [{ account_id: UUID, amount: DECIMAL }],
  customer_id?: UUID,         -- لعملاء الدين فقط — يُحفظ كـ `debt_customer_id` في جدول invoices و debt_entries
  pos_terminal_code?: VARCHAR,
  notes?: TEXT,
  idempotency_key: UUID,
  created_by: UUID            -- إلزامي: يُمرر من API Route (لأن service_role لا يملأ auth.uid())
}
// ملاحظة ADR-034: invoice_date = CURRENT_DATE دائماً — لا يُقبل من المستخدم
// ملاحظة ADR-043: unit_price يُجلب من products.sale_price داخل الدالة — لا يُقبل من العميل
Output: { invoice_id: UUID, invoice_number: VARCHAR, total: DECIMAL, change: DECIMAL }
Errors: ERR_PRODUCT_NOT_FOUND, ERR_STOCK_INSUFFICIENT, ERR_DISCOUNT_EXCEEDED, ERR_PAYMENT_MISMATCH, ERR_IDEMPOTENCY, ERR_CONCURRENT_STOCK_UPDATE
```

### 2. `edit_invoice()`
```
Input: {
  invoice_id: UUID,
  items: [{ product_id: UUID, quantity: INT, discount_percentage?: DECIMAL }],
  payments: [{ account_id: UUID, amount: DECIMAL }],
  customer_id?: UUID,        -- يُحفظ كـ `debt_customer_id` في جدول invoices
  edit_reason: VARCHAR(255),   -- إلزامي (5 أحرف+)
  idempotency_key: UUID,
  created_by: UUID            -- إلزامي: يُمرر من API Route
}
// ملاحظة ADR-043: unit_price يُجلب من products.sale_price داخل الدالة — لا يُقبل من العميل
Output: { invoice_id: UUID, invoice_number: VARCHAR, total: DECIMAL }
Errors: ERR_CANCEL_ALREADY, ERR_CANCEL_HAS_RETURN, ERR_CANCEL_REASON, ERR_STOCK_INSUFFICIENT, ERR_PAYMENT_MISMATCH, ERR_UNAUTHORIZED
```

### 3. `cancel_invoice()`
```
Input: { invoice_id: UUID, cancel_reason: VARCHAR(255), created_by: UUID }
Output: { success: BOOLEAN, reversed_entries_count: INT }
Errors: ERR_CANCEL_ALREADY, ERR_CANCEL_HAS_RETURN, ERR_CANCEL_REASON, ERR_CANNOT_CANCEL_PAID_DEBT, ERR_UNAUTHORIZED
```

### 4. `create_return()`
```
Input: {
  invoice_id: UUID,
  items: [{ invoice_item_id: UUID, quantity: INT }],
  refund_account_id?: UUID,     -- اختياري: يُطلب فقط إذا وُجد cash_refund > 0
  return_type: 'full' | 'partial',
  reason: VARCHAR(255),
  idempotency_key: UUID,
  created_by: UUID            -- إلزامي: يُمرر من API Route
}
// M-04 Fix: بعد كل return — يتحقق الكود:
// IF NOT EXISTS (SELECT 1 FROM invoice_items WHERE invoice_id = ? AND returned_quantity < quantity)
//   THEN UPDATE invoices SET status = 'returned'  (كل العناصر أصبحت مُرجعة)
//   ELSE UPDATE invoices SET status = 'partially_returned'
// حالة خاصة: فاتورة فيها دين (تلقائي):
//   1) المرتجع يخصم أولاً من debt_entries.remaining_amount
//   2) إذا تبقى مبلغ بعد تصفير الدين غير المسدد -> يُرد نقداً عبر refund_account_id
//   3) إذا مطلوب رد نقدي ولا يوجد refund_account_id -> ERR_RETURN_REFUND_ACCOUNT_REQUIRED
Output: { return_id: UUID, return_number: VARCHAR, refunded_amount: DECIMAL }
// Permissions: Admin OR POS Staff (via API Route check in ADR-042)
Errors: ERR_INVOICE_NOT_FOUND, ERR_INVOICE_CANCELLED, ERR_ITEM_NOT_FOUND, ERR_RETURN_QUANTITY, ERR_CANCEL_ALREADY, ERR_IDEMPOTENCY, ERR_UNAUTHORIZED, ERR_RETURN_REFUND_ACCOUNT_REQUIRED
```

### 5b. `create_debt_manual()`
```
Input: {
  debt_customer_id: UUID,
  amount: DECIMAL,
  description?: VARCHAR(255),
  idempotency_key: UUID,
  created_by: UUID            -- إلزامي: يُمرر من API Route
}
// idempotency_key يُخزن في debt_entries.idempotency_key (UNIQUE WHERE NOT NULL)
// ملاحظة ADR-034: entry_date = CURRENT_DATE دائماً — لا يُقبل من المستخدم
Output: { debt_entry_id: UUID }
Errors: ERR_IDEMPOTENCY, ERR_VALIDATION_NEGATIVE_AMOUNT, ERR_CUSTOMER_NOT_FOUND, ERR_UNAUTHORIZED
```

### 5. `create_debt_payment()`
```
Input: {
  debt_customer_id: UUID,
  amount: DECIMAL,
  account_id: UUID,
  notes?: TEXT,
  idempotency_key: UUID,
  debt_entry_id?: UUID,  -- اختياري: لتجاوز FIFO وتحديد دين معين (V1)
  created_by: UUID            -- إلزامي: يُمرر من API Route
}
// ملاحظة ADR-034: payment_date = CURRENT_DATE دائماً — لا يُقبل من المستخدم
// L-01 FIFO Fix: إذا debt_entry_id غير محدد:
//   يُطبّق على debt_entries ORDER BY due_date ASC حتى يصفر كل دين (تسجل في debt_payment_allocations)
//   إذا محدد: يُطبّق على ذلك الدين تحديداً
Output: { payment_id: UUID, receipt_number: VARCHAR, remaining_balance: DECIMAL, allocations: [{debt_entry_id, allocated_amount}] }
Errors: ERR_DEBT_OVERPAY, ERR_DEBT_ENTRY_NOT_FOUND, ERR_IDEMPOTENCY, ERR_VALIDATION_NEGATIVE_AMOUNT, ERR_CUSTOMER_NOT_FOUND, ERR_UNAUTHORIZED
```

### 6. `reconcile_account()`
```
Input: { account_id: UUID, actual_balance: DECIMAL, notes?: TEXT, created_by: UUID }
Output: { reconciliation_id: UUID, expected: DECIMAL, actual: DECIMAL, difference: DECIMAL }
Errors: ERR_ACCOUNT_NOT_FOUND, ERR_RECONCILIATION_UNRESOLVED, ERR_UNAUTHORIZED
```

### 8. `create_expense()`
```
Input: {
  amount: DECIMAL,
  account_id: UUID,
  expense_category_id: UUID,
  description: VARCHAR(255),
  idempotency_key: UUID,
  created_by: UUID            -- إلزامي: يُمرر من API Route
}
// ملاحظة ADR-034: expense_date = CURRENT_DATE دائماً — لا يُقبل من المستخدم
Output: { expense_id: UUID, ledger_entry_id: UUID }
Errors: ERR_IDEMPOTENCY, ERR_VALIDATION_NEGATIVE_AMOUNT
```

### 9. `create_daily_snapshot()`
```
Input: { notes?: TEXT, created_by: UUID }
// ملاحظة ADR-034: snapshot_date = CURRENT_DATE دائماً — لا يُقبل من المستخدم
// idempotent by natural key: UNIQUE(snapshot_date) في MVP (فرع واحد)
Output: { snapshot_id: UUID, total_sales: DECIMAL, net_sales: DECIMAL, invoice_count: INT }
Errors: ERR_VALIDATION_SNAPSHOT_DATE, ERR_UNAUTHORIZED
```

### 10. `get_sales_history()`
```
Input: {
  from_date: DATE,
  to_date: DATE,
  created_by?: UUID,
  status?: VARCHAR,
  pos_terminal_code?: VARCHAR,
  page?: INT (default: 1),
  page_size?: INT (default: 20, max: 100)
}
Output: {
  data: [{ invoice_id, invoice_number, invoice_date, created_at, created_by, pos_terminal_code, total, status }],
  total_count: INT,
  page: INT,
  page_size: INT
}
Errors: لا — استعلام فقط
```

### 11. `create_purchase()`
```
Input: {
  supplier_id: UUID,
  items: [{ product_id: UUID, quantity: INT, unit_cost: DECIMAL }],
  is_paid: BOOLEAN,                -- true = نقدي, false = آجل
  payment_account_id?: UUID,       -- مطلوب إذا is_paid = true
  notes?: TEXT,
  idempotency_key: UUID,
  created_by: UUID            -- إلزامي: يُمرر من API Route
}
// ملاحظة ADR-034: purchase_date = CURRENT_DATE دائماً — لا يُقبل من المستخدم
Output: { purchase_order_id: UUID, purchase_number: VARCHAR, total: DECIMAL }
Errors: ERR_IDEMPOTENCY, ERR_UNAUTHORIZED, ERR_VALIDATION_REQUIRED_FIELD
```

### 12. `create_supplier_payment()`
```
Input: {
  supplier_id: UUID,
  account_id: UUID,
  amount: DECIMAL,
  notes?: TEXT,
  idempotency_key: UUID,
  created_by: UUID            -- إلزامي: يُمرر من API Route
}
// ملاحظة ADR-034: payment_date = CURRENT_DATE دائماً — لا يُقبل من المستخدم
Output: { payment_id: UUID, payment_number: VARCHAR, remaining_balance: DECIMAL }
Errors: ERR_SUPPLIER_NOT_FOUND, ERR_SUPPLIER_OVERPAY, ERR_IDEMPOTENCY, ERR_VALIDATION_NEGATIVE_AMOUNT, ERR_UNAUTHORIZED
```

> **Append-Only Guard:** أي محاولة UPDATE/DELETE مباشرة على `ledger_entries` أو `audit_logs` أو `daily_snapshots` تُرفض بالخطأ `ERR_APPEND_ONLY_VIOLATION`.

### 13. `create_topup()`
```
Input: {
  account_id: UUID,
  amount: DECIMAL,           -- المبلغ المستلم من العميل
  profit_amount: DECIMAL,    -- الربح الصافي (<=amount)
  supplier_id?: UUID,        -- شركة الشحن (اختياري — لتحليل الأرباح لاحقاً)
  notes?: TEXT,
  idempotency_key: UUID,
  created_by: UUID            -- إلزامي: يُمرر من API Route
}
// ملاحظة ADR-034: topup_date = CURRENT_DATE دائماً — لا يُقبل من المستخدم
// الباك-إند ينشئ قيدين:
//   income: amount (income entry)
//   expense: (amount - profit_amount) (تكلفة الشحن)
//   تحديث account.current_balance += profit_amount
Output: { topup_id: UUID, topup_number: VARCHAR, ledger_entry_ids: [UUID, UUID] }
Errors: ERR_IDEMPOTENCY, ERR_VALIDATION_NEGATIVE_AMOUNT, ERR_API_VALIDATION_FAILED
```

### 14. `create_transfer()`
```
Input: {
  from_account_id: UUID,
  to_account_id: UUID,
  amount: DECIMAL,
  notes?: TEXT,
  idempotency_key: UUID,
  created_by: UUID            -- إلزامي: يُمرر من API Route
}
// ملاحظة ADR-034: transfer_date = CURRENT_DATE دائماً — لا يُقبل من المستخدم
Output: { transfer_id: UUID, transfer_number: VARCHAR, ledger_entry_ids: [UUID, UUID] }
// التحقق: IF from_account.current_balance < amount → ERR_INSUFFICIENT_BALANCE + ROLLBACK
Errors: ERR_TRANSFER_SAME_ACCOUNT, ERR_IDEMPOTENCY, ERR_VALIDATION_NEGATIVE_AMOUNT, ERR_INSUFFICIENT_BALANCE
```

### 15. `create_maintenance_job()`
```
Input: {
  customer_name: VARCHAR,
  customer_phone?: VARCHAR,
  device_type: VARCHAR,
  issue_description: TEXT,
  estimated_cost?: DECIMAL,
  notes?: TEXT,
  idempotency_key: UUID,
  created_by: UUID            -- إلزامي: يُمرر من API Route
}
Output: { job_id: UUID, job_number: VARCHAR, status: 'new' }
// Permissions: Admin OR POS Staff (via API Route check in ADR-042)
Errors: ERR_IDEMPOTENCY, ERR_VALIDATION_REQUIRED_FIELD, ERR_API_VALIDATION_FAILED
```

### 16. `complete_inventory_count()`
```
Input: {
  inventory_count_id: UUID,
  items: [{ inventory_count_item_id: UUID, actual_quantity: INT, reason?: VARCHAR }],
  created_by: UUID            -- إلزامي: يُمرر من API Route
}
// D-02 Fix: عند الإكمال تُنفّذ داخل Transaction:
//   1. UPDATE inventory_counts SET status = 'completed', completed_at = now()
//   2. للمنتجات ذات الفرق:
//      UPDATE products SET stock_quantity = actual_quantity WHERE id = product_id
//   3. تسجيل سبب الفرق في inventory_count_items.reason
//   4. إنشاء audit_log (action_type = 'complete_inventory_count')
//   5. إذا فيه فرق (actual != system): إنشاء notification للـ Admin
Output: { count_id: UUID, adjusted_products: INT, total_difference: INT }
Errors: ERR_COUNT_NOT_FOUND, ERR_COUNT_ALREADY_COMPLETED, ERR_UNAUTHORIZED, ERR_VALIDATION_NEGATIVE_QUANTITY
```

## 📊 دوال القراءة والتقارير (Read / Report Functions)

### 17. `get_daily_summary()`
```
Input: { target_date: DATE }
Output: {
  date: DATE,
  total_sales: DECIMAL,      -- إجمالي المبيعات
  total_returns: DECIMAL,    -- إجمالي المرتجعات
  net_sales: DECIMAL,        -- صافي المبيعات
  total_expenses: DECIMAL,   -- إجمالي المصروفات
  total_purchases: DECIMAL,  -- إجمالي المشتريات
  total_profit: DECIMAL,     -- صافي الربح = SUM((quantity - returned_quantity) × (unit_price × (1 - discount%) - cost_price_at_time)) - SUM(payments.fee_amount)
  invoice_count: INT,
  accounts: [{ account_id, name, balance }]  -- أرصدة الحسابات في نهاية اليوم
}
Errors: ERR_UNAUTHORIZED
```

### 18. `get_account_balances()`
```
Input: {} -- لا مدخلات
Output: [
  { account_id, name, type, opening_balance, total_income, total_expense, current_balance }
]
// الرصيد = opening_balance + SUM(income) - SUM(expense) + adjustments
// الرصيد محسوب من ledger_entries — ليس من accounts.current_balance
// accounts.current_balance يُعامل كـ cache تشغيلي ويُتحقق منه عبر fn_verify_balance_integrity()
Errors: ERR_UNAUTHORIZED
```

### 19. `fn_verify_balance_integrity()`
```
Input: {} -- لا مدخلات
Output: [
  { entity: 'account', id, name, stored: DECIMAL, computed: DECIMAL, drift: DECIMAL },
  { entity: 'debt_customer', id, name, stored: DECIMAL, computed: DECIMAL, drift: DECIMAL },
  { entity: 'supplier', id, name, stored: DECIMAL, computed: DECIMAL, drift: DECIMAL }
]
// drift != 0 يعني بيان خاطئ — يجب التحقيق (مرجع: SOP-24)
Errors: ERR_UNAUTHORIZED
```

### 20. `get_debts_report()`
```
Input: {
  status?: 'pending' | 'paid' | 'overdue',  -- فلتر الحالة
  from_date?: DATE,
  to_date?: DATE,
  customer_id?: UUID
}
Output: {
  summary: { total_outstanding: DECIMAL, total_overdue: DECIMAL, customer_count: INT },
  customers: [{
    customer_id, name, phone,
    current_balance: DECIMAL,
    credit_limit: DECIMAL,
    oldest_debt_date: DATE,
    entries: [{ debt_entry_id, amount, remaining, due_date, status }]
  }]
}
Errors: ERR_UNAUTHORIZED
```

### 21. `get_inventory_report()`
```
Input: {
  category?: VARCHAR,
  low_stock_only?: BOOLEAN,  -- فقط المنتجات < low_stock_threshold
  zero_stock_only?: BOOLEAN
}
Output: [{
  product_id, name, category,
  stock_quantity: INT,
  cost_price: DECIMAL,
  sale_price: DECIMAL,
  stock_value: DECIMAL,  -- stock_quantity × cost_price
  low_stock_alert: BOOLEAN
}]
Errors: ERR_UNAUTHORIZED
```

### 22. `get_returns_report()`
```
Input: {
  from_date: DATE,
  to_date: DATE,
  return_type?: 'full' | 'partial'
}
Output: {
  summary: { total_returns: INT, total_amount: DECIMAL },
  returns: [{
    return_id, return_number, invoice_number,
    return_date, return_type, reason,
    total_amount: DECIMAL,
    items: [{ product_name, quantity, unit_price }]
  }]
}
Errors: ERR_UNAUTHORIZED
```

### 23. `get_visa_fees_report()`
```
Input: {
  from_date: DATE,
  to_date: DATE,
  account_id?: UUID  -- لحساب فيزا معين
}
Output: {
  summary: { total_fees: DECIMAL, transaction_count: INT },
  transactions: [{
    invoice_id, invoice_number, invoice_date,
    payment_amount: DECIMAL,
    fee_percentage: DECIMAL,
    fee_amount: DECIMAL
  }]
}
// يُحسب من payments WHERE fee_amount > 0 مع الربط على accounts.type = 'visa'
Errors: ERR_UNAUTHORIZED
```

### 24. `get_profit_report()`
```
Input: {
  from_date: DATE,
  to_date: DATE,
  group_by?: 'day' | 'week' | 'month' | 'category'
}
Output: {
  summary: {
    total_revenue: DECIMAL,      -- إجمالي المبيعات
    total_cost: DECIMAL,         -- تكلفة البضاعة المباعة
    gross_profit: DECIMAL,       -- الربح الإجمالي
    total_expenses: DECIMAL,     -- المصروفات
    net_profit: DECIMAL          -- صافي الربح
  },
  breakdown: [{
    period: VARCHAR,  -- أو category حسب group_by
    revenue: DECIMAL,
    cost: DECIMAL,
    profit: DECIMAL
  }]
}
// يُحسب gross_profit من:
//   SUM((invoice_items.quantity - invoice_items.returned_quantity) × (invoice_items.unit_price × (1 - invoice_items.discount_percentage / 100) - invoice_items.cost_price_at_time))
Errors: ERR_UNAUTHORIZED
```

### 25. `get_expenses_report()`
```
Input: {
  from_date: DATE,
  to_date: DATE,
  category_id?: UUID
}
Output: {
  summary: { total_expenses: DECIMAL, expense_count: INT },
  by_category: [{
    category_id, category_name,
    total: DECIMAL,
    percentage: DECIMAL  -- نسبة من الإجمالي
  }],
  expenses: [{
    expense_id, expense_date, amount,
    category_name, description, account_name
  }]
}
Errors: ERR_UNAUTHORIZED
```

### 26. `get_snapshot_comparison()`
```
Input: {
  snapshot_id_1: UUID,
  snapshot_id_2: UUID
}
Output: {
  snapshot_1: { id, date, total_sales, net_profit },
  snapshot_2: { id, date, total_sales, net_profit },
  comparison: {
    sales_change: DECIMAL,
    sales_change_percent: DECIMAL,
    profit_change: DECIMAL,
    profit_change_percent: DECIMAL,
    account_changes: [{
      account_name,
      balance_1: DECIMAL,
      balance_2: DECIMAL,
      change: DECIMAL
    }]
  }
}
Errors: ERR_UNAUTHORIZED, ERR_VALIDATION_REQUIRED_FIELD
```

### 27. `get_suppliers_report()`
```
Input: {
  has_balance_only?: BOOLEAN  -- فقط الموردين بأرصدة مستحقة
}
Output: {
  summary: { total_outstanding: DECIMAL, supplier_count: INT },
  suppliers: [{
    supplier_id, name, phone,
    current_balance: DECIMAL,
    total_purchases: DECIMAL,
    last_purchase_date: DATE,
    last_payment_date: DATE
  }]
}
Errors: ERR_UNAUTHORIZED
```

### 28. `get_topups_report()`
```
Input: {
  from_date: DATE,
  to_date: DATE,
  supplier_id?: UUID
}
Output: {
  summary: { total_amount: DECIMAL, total_profit: DECIMAL, transaction_count: INT },
  topups: [{
    topup_id, topup_date, amount, profit_amount,
    supplier_name, account_name
  }]
}
Errors: ERR_UNAUTHORIZED
```

### 29. `get_top_products()`
```
Input: {
  limit?: INT,            -- الافتراضي 10
  period_days?: INT       -- الافتراضي 30 يوم
}
Output: [{
  product_id: UUID,
  name: VARCHAR,
  category: VARCHAR,
  sale_price: DECIMAL,
  total_sold: INT,        -- إجمالي الكميات المباعة خلال الفترة
  last_sold_at: TIMESTAMP
}]
// يُستخدم لعرض "الأكثر مبيعاً" في شاشة POS للوصول السريع
// يُحسب من SUM(invoice_items.quantity) WHERE invoice.status != 'cancelled'
Errors: لا — استعلام فقط
```

### 30. `update_settings()`
```
Input: {
  updates: [{ key: VARCHAR, value: VARCHAR }],
  created_by: UUID            -- إلزامي: يُمرر من API Route (يُستخدم كـ updated_by + في audit_logs)
}
Output: { success: BOOLEAN, updated_keys: INT }

// الصلاحية: Admin فقط
// التحقق (Validation Rules):
//   - key يجب أن يكون من المفاتيح المعرّفة في الجدول (لا إضافة عشوائية)
//   - value يتوافق مع value_type (مثلاً: boolean = 'true'|'false'، number = رقم صحيح)
//   - نطاقات: max_pos_discount_percentage (0-100)، pos_idle_timeout_minutes (1-480)
//             require_reason_min_chars (1-255)، max_login_attempts (1-20)
//             invoice_edit_window_hours (0-720)
// السلوك:
//   - يُحدّث updated_at و updated_by تلقائياً
//   - يُسجل كل تغيير في audit_logs (old_values + new_values)

Errors: ERR_UNAUTHORIZED, ERR_VALIDATION_INCORRECT_TYPE, ERR_VALIDATION_OUT_OF_RANGE
```

---

- [05_Database_Design.md](./05_Database_Design.md) - الجداول
- [04_Core_Flows.md](./04_Core_Flows.md) - التدفقات
- [06_Financial_Ledger.md](./06_Financial_Ledger.md) - النظام المحاسبي
- [13_Tech_Config.md](./13_Tech_Config.md) - التقنيات
- [07_Definitions_Glossary.md](./07_Definitions_Glossary.md) - مرجع المصطلحات المعتمد

---

**الإصدار:** 1.1  
**تاريخ التحديث:** 5 مارس 2026  
**التغييرات:** v1.1 — توحيد Drift Authority إلى `fn_verify_balance_integrity()`، توثيق `create_debt_manual` مع `debt_entries.idempotency_key`، وتعديل `create_daily_snapshot` إلى Natural-Key idempotency بدون `ERR_IDEMPOTENCY`.
