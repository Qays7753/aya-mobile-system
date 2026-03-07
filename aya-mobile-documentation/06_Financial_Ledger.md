# آية موبايل - النظام المحاسبي
## 6) Financial Ledger Proposal

---

## 💡 مقدمة

هذا المستند يشرح النظام المحاسبي لـ "آية موبايل" بشكل شامل. يجب أن يكون مرجعاً للمطور والمحاسبة على حد سواء.

**المبدأ الأساسي:** كل حركة مالية يجب أن تُسجل في `ledger_entries` - لا استثناءات.
**العملة المعتمدة:** الدينار الأردني (JOD) بالعرض `د.أ`.

---

## 🏦 تمثيل الحسابات (Accounts)

### أنواع الحسابات

| النوع | الاستخدام | العمولة |
|-------|-----------|---------|
| `cash` | الصندوق النقدي | 0% |
| `visa` | مدفوعات الفيزا | نسبة محددة (مثلاً 2%) |
| `wallet` | المحافظ الإلكترونية | 0% أو نسبة |
| `bank` | التحويل البنكي | 0% |

### هيكل جدول accounts

```
┌─────────────────────────────────────────────────────────┐
│                    accounts                             │
├─────────────────────────────────────────────────────────┤
│ id              │ UUID    │ Primary Key                │
│ name            │ VARCHAR │ اسم الحساب (فريد)          │
│ type            │ ENUM    │ cash/visa/wallet/bank      │
│ module_scope    │ ENUM    │ core/maintenance            │
│ fee_percentage  │ DECIMAL │ نسبة العمولة (للفيزا)      │
│ opening_balance │ DECIMAL │ الرصيد الافتتاحي           │
│ current_balance │ DECIMAL │ الرصيد الحالي (محسوب)      │
│ is_active       │ BOOLEAN │ هل الحساب نشط؟             │
└─────────────────────────────────────────────────────────┘
```

**ملاحظة:** `current_balance` يُحسب من `ledger_entries`، لكننا نخزنه للوصول السريع.
**سياسة موحدة:** `ledger_entries` هو Source of Truth. أي تعارض مع `accounts.current_balance` يُعامل كـ drift ويُصحح من المصدر.
**ملاحظة إضافية:** حسابات الصيانة تُدار عبر `module_scope = maintenance` بشكل منفصل عن الحسابات العامة.

---

## 📊 تمثيل الحركات المالية (Ledger Entries)

### أنواع القيود

| النوع | الوصف | أمثلة |
|-------|-------|-------|
| `income` | وارد للحساب | مبيعات، تسديد دين، شحن |
| `expense` | صادر من الحساب | مرتجع، مصروفات، شراء نقدي |
| `adjustment` | تسوية | فرق جرد، تسوية حساب |

### هيكل جدول ledger_entries

```
┌─────────────────────────────────────────────────────────┐
│                  ledger_entries                         │
├─────────────────────────────────────────────────────────┤
│ id              │ UUID    │ Primary Key                │
│ entry_date      │ DATE    │ تاريخ القيد                │
│ account_id      │ UUID    │ Foreign Key → accounts     │
│ entry_type      │ ENUM    │ income/expense/adjustment  │
│ amount          │ DECIMAL │ المبلغ (موجب دائماً)       │
│ adjustment_direction │ ENUM│ increase/decrease (اختياري)│
│ reference_type  │ VARCHAR │ نوع المرجع                 │
│ reference_id    │ UUID    │ رقم المرجع                 │
│ description     │ VARCHAR │ وصف القيد                  │
│ created_at      │ TIMESTAMP                          │
│ created_by      │ UUID    │ من أنشأ القيد              │
└─────────────────────────────────────────────────────────┘
```

### أنواع المراجع (Reference Types)

| المرجع | entry_type | الوصف |
|--------|------------|-------|
| `invoice` | income | فاتورة بيع |
| `return` | expense | مرتجع |
| `debt_payment` | income | تسديد دين |
| `topup` | income | شحن |
| `transfer` | adjustment | تحويل مالي داخلي بين حسابين (decrease + increase) |
| `expense` | expense | مصروف عام |
| `reconciliation` | adjustment | تسوية حساب |
| `purchase` | expense | عملية شراء |
| `manual_debt` | — | دين يدوي |
| `supplier_payment` | expense | تسديد مورد |
| `maintenance_job` | income | أمر صيانة — عند التسليم والدفع |
| `reversal` | عكس الأصلي | قيد عكسي (تصحيح) |

> [!CAUTION]
> **لا Backdating مطلقاً (ADR-034 مُعدّل):** `entry_date = CURRENT_DATE` في جميع القيود. أي تصحيح لخطأ في تاريخ سابق يتم عبر إدخال **قيد تسوية (adjustment)** بتاريخ اليوم الحالي مع وصف نصي يشير للمرجع الأصلي. لا يتم إدراج أي سجل في الماضي أبداً.

> [!IMPORTANT]
> **Soft Delete إلزامي (Polymorphic Integrity):** حقول `reference_id` في `ledger_entries` و `record_id` في `audit_logs` تشير لجداول متعددة بدون FK صارم. لذلك يجب على جميع الجداول المصدرية (فواتير، مصروفات، مرتجعات، إلخ) استخدام **Soft Delete** (`is_active = false` أو `status = 'cancelled'`) بدلاً من الحذف الفعلي، لضمان عدم كسر هذه الروابط.

---

## 💰 معالجة الدفع المختلط (Split Payment)

### السيناريو
فاتورة بقيمة 5,000 د.أ:
- نقدي: 2,000
- فيزا: 2,000 (عمولة 2% = 40)
- محفظة: 1,000

### ما يُسجل في payments

| invoice_id | account_id | amount | fee_amount | net_amount |
|------------|------------|--------|------------|------------|
| AYA-2026-00001 | cash | 2,000 | 0 | 2,000 |
| AYA-2026-00001 | visa | 2,000 | 40 | 1,960 |
| AYA-2026-00001 | wallet | 1,000 | 0 | 1,000 |

### ما يُسجل في ledger_entries

| account_id | entry_type | amount | reference_type | description |
|------------|------------|--------|----------------|-------------|
| cash | income | 2,000 | invoice | مبيعات نقدي - فاتورة AYA-2026-00001 |
| visa | income | 2,000 | invoice | مبيعات فيزا - فاتورة AYA-2026-00001 |
| visa | expense | 40 | invoice | عمولة فيزا 2% - فاتورة AYA-2026-00001 |
| wallet | income | 1,000 | invoice | مبيعات محفظة - فاتورة AYA-2026-00001 |

**الإجمالي:**
- وارد (إجمالي): 5,000
- صادر (عمولة): 40
- الرصيد الفعلي للفيزا: 2,000 - 40 = 1,960

---

## 🔄 معالجة المرتجع بأي طريقة دفع

### السيناريو
فاتورة أصلية: 5,000 (نقدي)
مرتجع: 5,000 (يُرجع بالفيزا)

### ما يُسجل في returns

| field | value |
|-------|-------|
| original_invoice_id | AYA-2026-00001 |
| total_amount | 5,000 |
| refund_account_id | visa |
| reason | العميل غير راضٍ |

### ما يُسجل في ledger_entries

| account_id | entry_type | amount | reference_type | description |
|------------|------------|--------|----------------|-------------|
| visa | expense | 5,000 | return | مرتجع - فاتورة #001 |

**ملاحظة:** لا نُعيد العمولة لأننا لم نستلمها أصلاً.

### السيناريو المعقد
فاتورة أصلية: 5,000 (فيزا 2,000 + نقدي 3,000)
مرتجع: 5,000 (نقدي بالكامل)

### ما يُسجل في ledger_entries

| account_id | entry_type | amount | reference_type | description |
|------------|------------|--------|----------------|-------------|
| cash | expense | 5,000 | return | مرتجع - فاتورة #001 |

**التحليل:**
- الفاتورة الأصلية: فيزا 2,000 (عمولة 40) + نقدي 3,000 = صافي 4,960
- المرتجع: نقدي 5,000
- الفرق: 40 (خسارة العمولة)

**التعامل:** الفرق 40 يُسجل كـ "خسارة مرتجع" في المصروفات.

---

## 💳 معالجة عمولة الفيزا

### الخيار المختار: العمولة كمصروف منفصل

**لماذا؟**
1. يوضح الإيراد الحقيقي (2,000)
2. يوضح تكلفة طريقة الدفع (40)
3. يسهل التقارير (إجمالي عمولات الفيزا)

### السيناريو
فاتورة: 2,000 فيزا (عمولة 2%)

### ledger_entries

| account_id | entry_type | amount | description |
|------------|------------|--------|-------------|
| visa | income | 2,000 | مبيعات فيزا |
| visa | expense | 40 | عمولة فيزا 2% |

### الرصيد الفعلي
- visa: +1,960

---

## 💸 آلية التسديد الجزئي للديون (FIFO)

عند تسديد دين عميل بمبلغ جزئي يغطي أكثر من `debt_entry` واحد:

1. يُحدد أقدم `debt_entry` غير مسدد بالكامل (`ORDER BY due_date ASC`)
2. يُطبق المبلغ على `remaining_amount` لهذا القيد
3. إذا تبقى مبلغ بعد تصفير القيد الأول، يُنتقل للـ `debt_entry` التالي
4. يُسجل التوزيع في `debt_payment_allocations` (جدول وسيط)
5. يُحدّث `debt_customer.current_balance` بالمبلغ الإجمالي المُسدد

### مثال

```
عميل لديه 3 ديون:
  debt_entry_1: remaining = 100 (due: 1 فبراير)
  debt_entry_2: remaining = 200 (due: 15 فبراير)
  debt_entry_3: remaining = 300 (due: 1 مارس)

تسديد 250 د.أ:
  → debt_entry_1: 100 → 0 (مسدد بالكامل)
  → debt_entry_2: 200 → 50 (سُدد 150)
  → debt_entry_3: بدون تغيير
```

> **مرجع:** جدول `debt_payment_allocations` في [05_Database_Design.md](./05_Database_Design.md)

---

## 📈 حساب الأرصدة المتوقعة (Expected Balance)

### المعادلة

```
Expected Balance = Opening Balance 
                   + SUM(income entries)
                   - SUM(expense entries)
                   + SUM(adjustment where direction='increase')
                   - SUM(adjustment where direction='decrease')
```

### مثال: الصندوق

| البند | المبلغ |
|-------|--------|
| الرصيد الافتتاحي | 10,000 |
| + مبيعات نقدي | +15,420 |
| - مرتجع نقدي | -2,000 |
| - مصروفات | -1,500 |
| - سحب | -500 |
| **المتوقع** | **21,420** |

### التسوية

| البند | المبلغ |
|-------|--------|
| الرصيد المتوقع | 21,420 |
| الرصيد الفعلي | 21,000 |
| **الفرق** | **-420** |

**الفرق يُسجل:**
- reconciliation_entries: الفرق -420 مع سبب
- ledger_entries: adjustment 420 + `adjustment_direction = 'decrease'` "تسوية صندوق"

---

## 🔄 عملية التسوية الكاملة

### الخطوات

1. **حساب المتوقع**
   ```sql
   expected = opening_balance 
              + SUM(income WHERE date <= today)
              - SUM(expense WHERE date <= today)
              + SUM(adjustment WHERE direction='increase' AND date <= today)
              - SUM(adjustment WHERE direction='decrease' AND date <= today)
   ```

2. **إدخال الفعلي**
   - المستخدم يدخل العد الفعلي

3. **حساب الفرق**
   ```
   difference = actual - expected
   ```

4. **تسجيل التسوية**
   - reconciliation_entries: السجل الرئيسي
   - ledger_entries: تسجيل الفرق كـ adjustment

5. **تحديث الرصيد**
   - accounts.current_balance = actual

### أنواع الفروقات والأسباب

| الفرق | السبب المحتمل | المعالجة |
|-------|---------------|----------|
| سالب (نقص) | سرقة، تلف، خطأ | تسجيل `adjustment` مع `decrease` |
| موجب (زيادة) | خطأ إدخال، نسيان تسجيل | تسجيل `adjustment` مع `increase` |

---

## 📊 التقارير المالية — كتالوج شامل

### خريطة التقارير → الجداول

| # | التقرير | الجداول المصدرية | الدالة (RPC) | الوصول |
|---|---------|------------------|-------------|--------|
| R-01 | ملخص المبيعات اليومي | `invoices`, `invoice_items`, `payments`, `ledger_entries` | `get_daily_summary()` | Admin |
| R-02 | هيستوري المبيعات | `invoices`, `invoice_items`, `profiles` | `get_sales_history()` | Admin + POS |
| R-03 | تقرير الحسابات | `accounts`, `ledger_entries` | `get_account_balances()` | Admin |
| R-04 | تقرير الديون | `debt_customers`, `debt_entries`, `debt_payments` | `get_debts_report()` | Admin |
| R-05 | تقرير المخزون | `products` | `get_inventory_report()` | Admin |
| R-06 | تقرير المرتجعات | `returns`, `return_items`, `invoices` | `get_returns_report()` | Admin |
| R-07 | تقرير عمولات الفيزا | `payments` (visa) | `get_visa_fees_report()` | Admin |
| R-08 | تقرير الأرباح | `invoice_items`, `expenses`, `payments`, `topups`, `transfers` | `get_profit_report()` | Admin |
| R-09 | تقرير المصروفات | `expenses`, `expense_categories` | `get_expenses_report()` | Admin |
| R-10 | مقارنة اللقطات | `daily_snapshots` | `get_snapshot_comparison()` | Admin |

---

### R-01: ملخص المبيعات اليومي

**مصادر البيانات:**
```
invoices      → COUNT(*), SUM(total_amount) WHERE status != 'cancelled'
invoice_items → SUM((quantity - returned_quantity) × (unit_price × (1 - (discount_percentage / 100)) - cost_price_at_time)) = ربح
payments      → SUM(amount) مجمّعة حسب account_id
returns       → COUNT(*), SUM(total_amount)
```

**صيغ الحساب:**
```
إجمالي المبيعات  = SUM(invoices.total_amount) WHERE status IN ('active','partially_returned')
صافي المبيعات    = إجمالي المبيعات - إجمالي المرتجعات
إجمالي الربح     = SUM((items.quantity - items.returned_quantity) × (unit_price × (1 - (discount_percentage / 100)) - cost_price_at_time))
متوسط الفاتورة   = إجمالي المبيعات / عدد الفواتير
```

**الفلاتر:** `target_date`

**RPC:**
```
get_daily_summary(target_date)
→ { total_sales, net_sales, total_profit, invoice_count, average_invoice,
     total_returns, return_count, sales_by_account[], top_products[] }
```

---

### R-03: تقرير الحسابات

**صيغ الحساب:**
```
لكل حساب:
  وارد  = SUM(ledger_entries.amount) WHERE entry_type = 'income' AND account_id = X
  صادر  = SUM(ledger_entries.amount) WHERE entry_type = 'expense' AND account_id = X
  تسوية = SUM(CASE WHEN adjustment_direction = 'increase' THEN amount ELSE -amount END) WHERE entry_type = 'adjustment' AND account_id = X
  صافي  = وارد - صادر + تسوية
```

**الفلاتر:** لا يوجد (يعرض جميع الحسابات الحالية)

**RPC:**
```
get_account_balances()
→ { accounts[{ account_name, type, total_in, total_out, net }], grand_total }
```

---

### R-04: تقرير الديون

**صيغ الحساب:**
```
الرصيد الحالي  = debt_customers.current_balance
إجمالي الدين   = SUM(debt_entries.amount)
إجمالي التسديد = SUM(debt_payments.amount)
تحقق: الدين - التسديد = الرصيد الحالي
متأخر: ديون عمرها > 30 يوماً بدون تسديد
```

**RPC:**
```
get_debts_report(status?, from_date?, to_date?, customer_id?)
→ { customers[{ name, phone, balance, credit_limit, last_payment, is_overdue }],
     total_outstanding, customer_count }
```

---

### R-05: تقرير المخزون

**صيغ الحساب:**
```
قيمة المخزون بالتكلفة = SUM(stock_quantity × cost_price) WHERE is_active
قيمة المخزون بالبيع   = SUM(stock_quantity × sale_price) WHERE is_active
منخفض = stock_quantity <= low_stock_threshold
نافد  = stock_quantity = 0
```

**الفلاتر:** `category?`, `low_stock_only?`, `zero_stock_only?`

**RPC:**
```
get_inventory_report(category?, low_stock_only?, zero_stock_only?)
→ { products[{ name, category, quantity, status }], total_value_cost, low_count, out_count }
```

---

### R-06: تقرير المرتجعات

**الفلاتر:** `from_date`, `to_date`, `return_type?` (full/partial)

**RPC:**
```
get_returns_report(from_date, to_date, return_type?)
→ { returns[{ return_number, invoice_number, type, total_amount }],
     total_amount, full_count, partial_count }
```

---

### R-07: تقرير عمولات الفيزا

**صيغ الحساب:**
```
إجمالي مبيعات الفيزا = SUM(payments.amount) WHERE account.type = 'visa'
إجمالي العمولات      = SUM(payments.fee_amount)
الصافي المستلم       = SUM(payments.net_amount)
نسبة العمولة         = (العمولات / المبيعات) × 100
```

**الفلاتر:** `from_date`, `to_date`

---

### R-08: تقرير الأرباح

**صيغ الحساب:**
```
  ربح المنتجات     = SUM((quantity - returned_quantity) × (unit_price × (1 - (discount_percentage / 100)) - cost_price_at_time))
+ ربح الشحن       = SUM(topups.profit_amount)
+ ربح التحويلات   = SUM(transfers.profit_amount)
- عمولة الفيزا    = SUM(payments.fee_amount)
- المصروفات       = SUM(expenses.amount)
= صافي الربح
```

**الفلاتر:** `from_date`, `to_date`

---

### R-09: تقرير المصروفات

**الفلاتر:** `from_date`, `to_date`, `category_id?`

**RPC:**
```
get_expenses_report(from_date, to_date, category_id?)
→ { expenses[{ description, amount, category, date }],
     total, by_category[{ category_name, total }] }
```

---

### R-10: مقارنة اللقطات اليومية

**الفائدة:** مقارنة أداء يومين — اتجاه المبيعات صعوداً أو نزولاً.

**RPC:**
```
get_snapshot_comparison(snapshot_id_1, snapshot_id_2)
→ { snapshot_a{}, snapshot_b{}, diff{} }
```

---

## 🧮 حساب الربح

### ربح المنتج الواحد

```
profit_per_unit = sale_price - cost_price_at_time
```

**لماذا `cost_price_at_time`؟** لأن التكلفة قد تتغير — نحتفظ بها وقت البيع للدقة.

### إجمالي ربح الفاتورة

```
total_profit = SUM((invoice_items.quantity - invoice_items.returned_quantity) × (unit_price × (1 - (discount_percentage / 100)) - cost_price_at_time))
               - SUM(payments.fee_amount)
```

### مثال

| المنتج | الكمية | سعر البيع | التكلفة | الربح |
|--------|--------|-----------|---------|-------|
| iPhone | 1 | 45,000 | 40,000 | 5,000 |
| شاحن | 2 | 600 | 400 | 400 |
| **المجموع** | | **46,200** | **40,800** | **5,400** |
| - خصم | | | | -200 |
| - عمولة فيزا | | | | -40 |
| **صافي الربح** | | | | **5,160** |

---

## 🔒 قيود النظام المالي

### قيود في قاعدة البيانات

| القيد | الغرض |
|-------|-------|
| `amount > 0` | منع الأرقام السالبة |
| `net_amount = amount - fee_amount` | ضمان صحة الحسابات |
| `reference_type IN (...)` | منع مراجع غير معروفة |

### قيود العمل

| القيد | التنفيذ |
|-------|---------|
| لا حذف ledger_entries | RLS: لا DELETE |
| لا يوجد إقفال يومي | الاعتماد على التقارير بالتاريخ + Daily Snapshot |
| التوازن في الفاتورة | Check: المجموع = الدفعات + الدين |

### قيد أساسي: Append-Only Ledger (ADR-032)

```
-- ممنوع: UPDATE أو DELETE على ledger_entries
-- التصحيح: إنشاء قيد عكسي (reversal entry)
INSERT INTO ledger_entries (entry_type, amount, account_id, reference_type, description)
VALUES ('expense', 100, :account_id, 'reversal', 'عكس قيد خاطئ #123');
```

---

## سياسة التقريب (Rounding Policy)

| البند | القاعدة |
|-------|---------|
| **الدقة** | DECIMAL(12,3) — 3 خانات عشرية |
| **طريقة التقريب** | ROUND_HALF_UP (التقريب لأقرب رقم، 0.5 يُقرّب للأعلى) |
| **توزيع الخصم** | يُوزّع بالتناسب على العناصر. الفرق (إن وجد) يُضاف للعنصر الأخير |
| **التحقق** | `SUM(item_totals) = invoice_total` — يُفحص قبل الحفظ |

**مثال:**
- فاتورة 100 د.أ + خصم 7%
- 3 عناصر (40, 35, 25)
- التوزيع: 2.800 + 2.450 + 1.750 = 7.000 ✅

---

## 📋 قائمة التحقق المالية

### يومياً
- [ ] جميع الفواتير لها payments
- [ ] مجموع payments = total_amount - debt_amount
- [ ] ledger_entries متوازنة
- [ ] لا فواتير بدون items

### أسبوعياً
- [ ] تسوية جميع الحسابات
- [ ] مراجعة الفروقات
- [ ] تقرير عمولات الفيزا
- [ ] تقرير الأرباح
- [ ] مراجعة Daily Snapshot للأيام السابقة

### شهرياً
- [ ] جرد شامل
- [ ] مطابقة الديون
- [ ] تقرير شامل للأرباح والخسائر

---

## 🔍 Ledger Consistency Checks

### الغرض
فحوصات سلامة دورية للتأكد أن كل قيد في `ledger_entries` له مرجع صحيح وأن لا قيود يتيمة أو مكررة.

### 1. Unbalanced References Report

تقرير يكشف قيود `ledger_entries` التي تشير لمرجع غير موجود:

```sql
-- pseudo-code: قيود بمرجع فاتورة غير موجودة
SELECT le.id, le.reference_type, le.reference_id
FROM ledger_entries le
WHERE le.reference_type = 'invoice'
  AND NOT EXISTS (SELECT 1 FROM invoices i WHERE i.id = le.reference_id);

-- كرر لكل reference_type
```

### 2. Matching Rules per reference_type

| reference_type | المرجع في | القواعد |
|---------------|----------|---------|
| `invoice` | `invoices.id` | يجب أن يكون status ≠ 'cancelled' (أو يوجد قيد عكسي) |
| `return` | `returns.id` | يجب أن يكون entry_type = 'expense' |
| `debt_payment` | `debt_payments.id` | يجب أن يكون entry_type = 'income' |
| `topup` | `topups.id` | يجب أن يوجد قيدان: income (المبلغ الكامل) + expense (تكلفة الشحن) |
| `transfer` | `transfers.id` | يجب أن يوجد قيدان متقابلان من نوع `adjustment` (decrease + increase) |
| `expense` | `expenses.id` | يجب أن يكون entry_type = 'expense' |
| `reconciliation` | `reconciliation_entries.id` | يجب أن يكون entry_type = 'adjustment' |
| `purchase` | `purchase_orders.id` | إذا `purchase_orders.is_paid = true` يجب أن يكون entry_type = 'expense'. إذا `is_paid = false` لا يُتوقع قيد `purchase` وقت الإنشاء |
| `manual_debt` | `debt_entries.id` | لا ledger entry مباشر |
| `supplier_payment` | `supplier_payments.id` | يجب أن يكون entry_type = 'expense' |
| `maintenance_job` | `maintenance_jobs.id` | يجب أن يكون entry_type = 'income' |
| `reversal` | القيد الأصلي المعكوس | يجب أن يكون entry_type عكس القيد الأصلي + نفس المبلغ |

### 3. Daily Integrity Checklist

يُنفّذ مع OP-24 (الإقفال اليومي):

| # | الفحص | النتيجة المتوقعة |
|---|-------|-----------------|
| 1 | عدد الفواتير المكتملة اليوم = عدد مجموعات ledger_entries بـ reference_type='invoice' | متطابق |
| 2 | مجموع income اليوم = مجموع أرصدة الحسابات المُستلمة | متطابق |
| 3 | لا توجد قيود orphaned (بلا مرجع) | 0 |
| 4 | لا توجد قيود مكررة (نفس reference_id + reference_type + نفس المبلغ) | 0 |
| 5 | Balance Drift = 0 لجميع الحسابات | ✅ (OP-23) |

---

## ⚠️ مبدأ API-First للقيود المحاسبية

> **هام:** جميع القيود في `ledger_entries` تُنشأ **حصراً** عبر API Routes الخادم (`/api/*`) باستخدام `service_role`.
> الواجهة الأمامية لا تكتب في `ledger_entries` مباشرة — أي محاولة مباشرة ترفضها RLS Policies.

| مصدر القيد | مسموح؟ | الطريقة الصحيحة |
|------------|--------|----------------|
| UI → Supabase مباشرة | ❌ ممنوع | عبر API Route |
| API Route (server) → Supabase بـ service_role | ✅ مسموح | `POST /api/sales` وما شابه |
| RPC داخل دالة SECURITY DEFINER | ✅ مسموح | مستدعاة من API Route فقط |

**المرجع:** ADR-042 في `10_ADRs.md`

---

## 🔗 الملفات المرتبطة

- [05_Database_Design.md](./05_Database_Design.md) - التصميم التقني
- [07_Definitions_Glossary.md](./07_Definitions_Glossary.md) - المصطلحات
- [15_Seed_Data_Functions.md](./15_Seed_Data_Functions.md) - دوال API
- [04_Core_Flows.md](./04_Core_Flows.md) - OP-23/24 وعمليات التسوية
- [16_Error_Codes.md](./16_Error_Codes.md) - رموز الأخطاء
- [10_ADRs.md](./10_ADRs.md) - ADR-042 (API-First)

---

**الإصدار:** 2.2  
**تاريخ التحديث:** 24 فبراير 2026  
**التغييرات:** v2.2 — إضافة عمود entry_type لجدول reference_type مع توضيح maintenance_job، إضافة سياسة التقريب (Rounding Policy).
