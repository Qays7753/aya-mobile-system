# 📌 مهام مستقبلية — تُنفّذ عند بدء التطوير
## 21) Future Tasks (Pre-Build Backlog)

---

## الغرض

هذا الملف يوثّق جميع المهام التي يجب تنفيذها **عند بدء مرحلة البناء الفعلي** وليس أثناء التوثيق. مُرتّبة حسب الأولوية والمرحلة.

---

## 🔴 أولوية قصوى — تُنفّذ أول يوم تطوير

### 1. إنشاء Migration: سحب جميع الصلاحيات (REVOKE ALL)

**الملف:** `supabase/migrations/00001_revoke_all_permissions.sql`

**المطلوب:**
- تنفيذ `REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated, anon`
- إنشاء سياسات RLS جديدة تسمح بـ SELECT فقط لكل جدول
- اختبار أن `INSERT` من المتصفح يُرفض

**المرجع:** ADR-044 في `10_ADRs.md` + جدول RLS في `05_Database_Design.md` (سطر 1526)

---

### 2. إنشاء API Routes (14 route)

**المجلد:** `app/api/`

**القائمة الكاملة:**

| Route | الدالة | الصلاحية |
|-------|--------|---------|
| `POST /api/sales` | `create_sale()` | POS + Admin |
| `POST /api/invoices/edit` | `edit_invoice()` | POS + Admin |
| `POST /api/invoices/cancel` | `cancel_invoice()` | Admin فقط |
| `POST /api/returns` | `create_return()` | POS + Admin |
| `POST /api/payments/debt` | `create_debt_payment()` | POS + Admin |
| `POST /api/payments/supplier` | `create_supplier_payment()` | Admin فقط |
| `POST /api/expenses` | `create_expense()` | POS + Admin |
| `POST /api/topups` | `create_topup()` | POS + Admin |
| `POST /api/transfers` | `create_transfer()` | Admin فقط |
| `POST /api/purchases` | `create_purchase()` | Admin فقط |
| `POST /api/maintenance` | `create_maintenance_job()` | POS + Admin |
| `POST /api/reconciliation` | `reconcile_account()` | Admin فقط |
| `POST /api/snapshots` | `create_daily_snapshot()` | Admin فقط |
| `POST /api/inventory/complete` | `complete_inventory_count()` | Admin فقط |
| `GET /api/health` | فحص صحة النظام | عام |

**كل route يقوم بـ:**
1. `getSession()` — التحقق من الجلسة
2. فحص الدور (`admin` أو `pos_staff`)
3. Zod validation للمدخلات
4. استدعاء RPC بـ `service_role`
5. إرجاع `StandardEnvelope`

**المرجع:** ADR-042 في `10_ADRs.md` + هيكل المشروع في `13_Tech_Config.md` (سطر 153)

---

### 3. تعديل دوال RPC لسحب الأسعار من DB

**الدوال المتأثرة:**
- `create_sale()` — حذف `unit_price` من المدخلات، سحب `sale_price` من `products`
- `edit_invoice()` — نفس التعديل

**المطلوب داخل كل دالة:**
```
SELECT sale_price FROM products WHERE id = :product_id FOR UPDATE;
-- استخدام sale_price من DB وليس من العميل
```

**المرجع:** ADR-043 في `10_ADRs.md` + توقيعات الدوال في `15_Seed_Data_Functions.md` (سطر 192)

---

### 4. إنشاء عميل Supabase للسيرفر (service_role)

**الملف:** `lib/supabase/admin.ts`

**المطلوب:**
- إنشاء Supabase client يستخدم `SUPABASE_SERVICE_ROLE_KEY`
- يُستخدم **فقط** في API Routes — لا يُستورد أبداً في مكونات الواجهة
- التأكد من عدم تسرب المفتاح عبر `NEXT_PUBLIC_`

**المرجع:** `13_Tech_Config.md` (سطر 79-82)

---

## 🟠 أولوية عالية — تُنفّذ في أسبوع التطوير الأول

### 5. إنشاء Vercel Edge Middleware للـ Rate Limiting

**الملف:** `middleware.ts`

**المطلوب:**
- تطبيق حدود الطلبات على `/api/*`:
  - كتابة: 30 طلب / دقيقة / مستخدم
  - قراءة: 100 طلب / دقيقة / مستخدم
- إرجاع HTTP 429 عند التجاوز

**المرجع:** `13_Tech_Config.md` (سطر 402-416)

---

### 6. إنشاء Zod Schemas لجميع API Routes

**المجلد:** `lib/validations/`

**المطلوب:**
- schema لكل route (مثلاً: `createSaleSchema`, `editInvoiceSchema`)
- التحقق يتم في API Route **قبل** استدعاء RPC
- عند الفشل: إرجاع `ERR_API_VALIDATION_FAILED` مع تفاصيل الأخطاء

**المرجع:** توقيعات الدوال في `15_Seed_Data_Functions.md` (سطر 192-384)

---

## 🟡 أولوية متوسطة — تُنفّذ عند مرحلة الاختبار

### 7. إضافة سيناريوهات أمان لـ UAT

**الملف:** `17_UAT_Scenarios.md`

**السيناريوهات المطلوبة:**

| السيناريو | الوصف | النتيجة المتوقعة |
|-----------|-------|-----------------|
| UAT-28 | محاولة `INSERT INTO invoices(...)` مباشرة من المتصفح بـ anon_key | `permission denied` |
| UAT-29 | إرسال `unit_price` مزيف في body الطلب إلى `/api/sales` | يُتجاهل — السعر يُسحب من DB |
| UAT-30 | POS يستدعي `POST /api/invoices/cancel` (admin-only) | HTTP 403 + `ERR_API_ROLE_FORBIDDEN` |

---

### 8. اختبار اختراق (Penetration Test) للواجهة

**المطلوب:**
- فحص أن `SUPABASE_SERVICE_ROLE_KEY` لا يظهر في Network tab أو HTML source
- فحص أن `anon_key` لا يسمح بأي عملية كتابة
- فحص أن Rate Limiting يعمل فعلياً
- فحص CSP headers

---

## 🟢 أولوية منخفضة — تُنفّذ أثناء التطوير أو بعده

### 9. تحديث `06_Financial_Ledger.md` بمرجع API-First

**المطلوب:**
- إضافة ملاحظة أن جميع القيود المحاسبية تُنشأ عبر API Routes وليس من الواجهة مباشرة
- تحديث الإصدار إلى v2.0

---

### 10. تحديث `09_Implementation_Plan.md` بأولوية الأمان

**المطلوب:**
- إضافة ملاحظة في Week 1 أن API Routes + REVOKE ALL هي أول مهمة
- ربط بـ ADR-042/043/044

---

### 11. إضافة Security Headers في Vercel

**الملف:** `next.config.js` أو `vercel.json`

**المطلوب:**
```
Content-Security-Policy: default-src 'self'
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Strict-Transport-Security: max-age=31536000
```

**المرجع:** ADR-040 في `10_ADRs.md` (سطر 569)

---

### 12. إضافة Audit Trail على API Routes

**المطلوب:**
- تسجيل كل استدعاء API ناجح أو فاشل في `audit_logs`
- تسجيل: endpoint, user_id, role, status_code, timestamp

---

### 13. إضافة جدول `maintenance_job_items` (D-03)

**الملف:** Migration جديد

**الهدف:** دعم تسجيل طلبات صيانة متعددة الأجزاء بمبالغ منفصلة

**المطلوب:**
```sql
CREATE TABLE maintenance_job_items (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES maintenance_jobs(id) ON DELETE CASCADE,
  description VARCHAR(255),  -- "استبدال شاشة"
  part_cost DECIMAL(12,3),   -- تكلفة القطعة
  labor_cost DECIMAL(12,3),  -- تكلفة العمالة
  total_cost DECIMAL(12,3) GENERATED ALWAYS AS (part_cost + labor_cost) STORED
);
```

**ملاحظة:** في MVP يكفي `final_amount` الإجمالي فقط. هذا الجدول يُضاف في V1 عند طلب أحمد.

---

## 📊 ملخص

| الأولوية | عدد المهام | متى تُنفّذ |
|----------|-----------|-----------|
| 🔴 قصوى | 4 | أول يوم تطوير |
| 🟠 عالية | 2 | الأسبوع الأول |
| 🟡 متوسطة | 2 | مرحلة الاختبار |
| 🟢 منخفضة | 4 | أثناء أو بعد التطوير |
| **المجموع** | **12** | |

---

## 🔗 الملفات المرتبطة

- [10_ADRs.md](./10_ADRs.md) — ADR-042/043/044
- [13_Tech_Config.md](./13_Tech_Config.md) — هيكل المشروع + API Routes
- [15_Seed_Data_Functions.md](./15_Seed_Data_Functions.md) — توقيعات الدوال
- [05_Database_Design.md](./05_Database_Design.md) — سياسات RLS
- [16_Error_Codes.md](./16_Error_Codes.md) — أخطاء API الجديدة
- [implementation_plan.md](./implementation_plan.md) — خطة التنفيذ

---

**الإصدار:** 1.0  
**تاريخ الإنشاء:** 20 فبراير 2026
