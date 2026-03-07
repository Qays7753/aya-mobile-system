# آية موبايل - نظام إدارة متجر الموبايلات
## المصدر الوحيد للحقيقة | Single Source of Truth

![Aya Mobile Logo](./assets/logo_horizontal.png)

---

## 📋 معلومات المشروع

| الجانب | التفاصيل |
|--------|----------|
| **الاسم** | آية موبايل (Aya Mobile) |
| **الموقع** | الأردن 🇯🇴 |
| **العملة** | الدينار الأردني (JOD) |
| **النوع** | نظام إدارة متجر موبايلات |
| **التقنية** | Supabase (Backend) + Vercel (Frontend) |
| **اللغة** | العربية |
| **قنوات الوصول** | Web App عبر المتصفح: هاتف + تابلت + لابتوب + ديسكتوب |
| **التثبيت على الجهاز** | مدعوم (Add to Home Screen / Install App) بدون Offline mode |
| **مرجع الأجهزة/المتصفحات** | [29_Device_Browser_Policy.md](./29_Device_Browser_Policy.md) |
| **المرحلة** | التوثيق (Pre-Development) |

---

## 🏗️ المبدأ الأساسي

> **كل Business Logic يُدار في قاعدة البيانات، الواجهة للإدخال والعرض فقط.**

> **مرجع المصطلحات الرسمي:** [07_Definitions_Glossary.md](./07_Definitions_Glossary.md)

```
Frontend (Vercel)          →  إدخال/عرض فقط، لا Business Logic
    ↓
Supabase Backend           →  كل المنطق هنا:
  • PostgreSQL DB          →  Tables, Constraints, Indexes
  • RLS Policies           →  صلاحيات الوصول
  • Functions/Triggers     →  العمليات المعقدة
```

---

## 👥 المستخدمون

| المستخدم | الدور | الصلاحيات |
|----------|-------|-----------|
| **أحمد** | Admin | كاملة - إدارة، تقارير، إعدادات، صلاحيات |
| **موظف** | POS | مبيعات، فواتير، مرتجعات، تسديد ديون، تحويل، تسوية |

---

## 📁 فهرس الوثائق

### المجموعة 1: الفهم والسياق
| # | الملف | المحتوى |
|---|-------|---------|
| 01 | [Overview, Assumptions & Risks](./01_Overview_Assumptions.md) | نظرة عامة، الأهداف، الافتراضات، الثغرات والمخاطر |
| 07 | [Glossary](./07_Definitions_Glossary.md) | قاموس المصطلحات |

### المجموعة 2: التصميم والتجربة
| # | الملف | المحتوى |
|---|-------|---------|
| 03 | [UI/UX Sitemap](./03_UI_UX_Sitemap.md) | الشاشات وتجربة المستخدم |
| 11 | [Design & UX Guidelines](./11_Design_UX_Guidelines.md) | الهوية البصرية، إرشادات UX، رسائل النظام |

### المجموعة 3: التدفقات والعمليات
| # | الملف | المحتوى |
|---|-------|---------|
| 04 | [Core Flows](./04_Core_Flows.md) | تدفقات العمل الأساسية |
| 08 | [SOPs & Data Retention](./08_SOPs.md) | إجراءات التشغيل + سياسة الاحتفاظ بالبيانات والخصوصية |
| 12 | [Message Templates](./12_Message_Templates.md) | قوالب رسائل الواتساب |

### المجموعة 4: التقنية
| # | الملف | المحتوى |
|---|-------|---------|
| 05 | [Database Design](./05_Database_Design.md) | تصميم قاعدة البيانات (29 جدول) |
| 06 | [Financial Ledger](./06_Financial_Ledger.md) | النظام المحاسبي |
| 13 | [Tech Config](./13_Tech_Config.md) | التقنيات، هيكل المشروع، النشر |
| 15 | [Seed Data & Functions](./15_Seed_Data_Functions.md) | البيانات الأولية، الدوال (29) |
| 16 | [Error Codes](./16_Error_Codes.md) | كتالوج رموز الأخطاء |

### المجموعة 5: القرارات والتخطيط
| # | الملف | المحتوى |
|---|-------|---------|
| 09 | [Implementation Plan](./09_Implementation_Plan.md) | خطة التنفيذ MVP/V1/V2 |
| 10 | [ADRs](./10_ADRs.md) | 46 قرار تصميمي موثق |
| 17 | [UAT Scenarios](./17_UAT_Scenarios.md) | سيناريوهات اختبار القبول |
| 22 | [Operations Guide](./22_Operations_Guide.md) | إعداد البيئة، إدارة الحسابات، Backup، ما بعد الإطلاق |

### المجموعة 6: الجاهزية قبل البناء
| # | الملف | المحتوى |
|---|-------|---------|
| 24 | [AI Build Playbook](./24_AI_Build_Playbook.md) | خطة تنفيذ عملية لمطور AI-first |
| 25 | [API Contracts](./25_API_Contracts.md) | عقود API التفصيلية (Request/Response/Error) |
| 26 | [Financial Dry Run Scenarios](./26_Dry_Run_Financial_Scenarios.md) | سيناريوهات المحاكاة المالية الحرجة قبل البناء |
| 27 | [Pre-Build Verification Matrix](./27_PreBuild_Verification_Matrix.md) | مصفوفة Go/No-Go قبل بدء التطوير |
| 31 | [Execution Live Tracker](./31_Execution_Live_Tracker.md) | تتبع التنفيذ الحي للمراحل والمهام وشروط النجاح أثناء البناء |

### المجموعة 7: الأرشيف التاريخي
| # | الملف | المحتوى |
|---|-------|---------|
| 21 | [Future Tasks](../archive/2026-03-07/aya-mobile-documentation/21_Future_Tasks.md) | نسخة مؤرشفة من backlog قديم تم استبداله بالتراكر الحالي |
| 23 | [Documentation Remediation Tracker](../archive/2026-03-07/aya-mobile-documentation/23_Documentation_Remediation_Tracker.md) | سجل تاريخي لإغلاقات التوثيق السابقة |
| 30 | [Governance Remediation Package](../archive/2026-03-07/aya-mobile-documentation/30_Documentation_Governance_Remediation_Package.md) | حزمة الإغلاق التاريخية قبل بدء التنفيذ |


---

## ✅ القرارات المتخذة (ملخص)

| القرار | القيمة |
|--------|--------|
| العملة | دينار أردني (JOD) |
| صيغة الفاتورة | `AYA-2026-00001` |
| الألوان | داكنة احترافية (Teal + Slate) |
| المحافظ | ديناميكية (المستخدم يضيفها) |
| عمولة الفيزا | قابلة للتعديل لكل حساب |
| تجاوز حد الدين | إشعار داخلي (تنبيه فقط) |
| الخصم | الموظف حتى 10%، أحمد بلا حد |
| إلغاء الفاتورة | أحمد فقط + سبب إلزامي |
| حذف البيانات | Soft Delete (لا حذف فعلي) |
| الضريبة | لا يوجد |
| الورديات | لا يوجد |
| الأوفلاين | غير مدعوم نهائياً (MVP/V1/V2) — رسالة `ERR_NETWORK` فقط |
| هيستوري المبيعات | مدعوم بفلترة تاريخ/موظف/جهاز/حالة |
| نقاط بيع متزامنة | مدعومة (أكثر من جهاز بنفس الوقت) |

📌 **التفاصيل الكاملة:** [10_ADRs.md](./10_ADRs.md)

---

## 🚀 خطة التنفيذ

| المرحلة | المدة | المخرجات |
|---------|-------|----------|
| **MVP** | 4-6 أسابيع | POS، فواتير، مرتجعات، ديون، تقارير يومية بالفلاتر |
| **V1** | +2-3 أسابيع | مشتريات، تسديد موردين، شحن، جرد، تسوية، صيانة أساسية |
| **V2** | +3-4 أسابيع | واتساب، صلاحيات، تقارير متقدمة |

📌 **التفاصيل الكاملة:** [09_Implementation_Plan.md](./09_Implementation_Plan.md)

---

## 🎨 الهوية البصرية (ملخص)

| الجانب | القيمة |
|--------|--------|
| **اللون الأساسي** | Teal (`#14b8a6`) |
| **الخلفية** | Slate Dark (`#0f172a`) |
| **الخط العربي** | IBM Plex Sans Arabic |
| **الأسلوب** | عصري، احترافي، مريح للعين |

📌 **التفاصيل الكاملة:** [11_Design_UX_Guidelines.md](./11_Design_UX_Guidelines.md)

---

## 📊 قاعدة البيانات (ملخص)

**29 جدول** مقسمة إلى:

| المجموعة | الجداول |
|----------|---------|
| المستخدمون | `profiles` |
| المنتجات | `products` |
| المبيعات | `invoices`, `invoice_items`, `payments` |
| المحاسبة | `accounts`, `ledger_entries` |
| الديون | `debt_customers`, `debt_entries`, `debt_payments` |
| المرتجعات | `returns`, `return_items` |
| المشتريات | `suppliers`, `purchase_orders`, `purchase_items`, `supplier_payments` |
| الخدمات | `topups`, `transfers`, `expenses` |
| الصيانة | `maintenance_jobs` |
| الجرد | `inventory_counts`, `inventory_count_items` |
| التشغيل | `reconciliation_entries`, `daily_snapshots`, `audit_logs` |
| الإعدادات | `system_settings`, `notifications`, `expense_categories` |

📌 **التفاصيل الكاملة:** [05_Database_Design.md](./05_Database_Design.md)

---

## 💰 النظام المحاسبي (ملخص)

1. كل حركة مالية = `Ledger Entry`
2. الدفع المختلط = `Ledger Entries` متعددة
3. عمولة الفيزا = مصروف منفصل
4. المرتجع = صادر من الحساب المُرجع إليه
5. التسوية = Expected vs Actual + تسجيل الفرق

📌 **التفاصيل الكاملة:** [06_Financial_Ledger.md](./06_Financial_Ledger.md)

---

## ⚠️ قيود المشروع

| القيد | الحالة |
|-------|--------|
| لا باركود | ✅ مقبول |
| لا IMEI/Serial | ✅ مقبول |
| لا تتبع أرقام الشحن | ✅ مقبول |
| فرع واحد | ✅ مقبول (قابل للتوسع) |
| مستخدمان | ✅ مقبول (قابل للتوسع) |
| لا Offline نهائياً | ✅ معتمد |
| لا إقفال يومي | ✅ مقبول (تعويضه بلقطات يومية وتقارير بالتاريخ) |

---

## 🔒 الأمان

- ✅ RLS مفعل على جميع الجداول (29 جدول)
- ✅ Constraints للتحقق من البيانات
- ✅ Audit Log لجميع العمليات الحساسة
- ✅ إشعارات داخلية (`notifications`) لتنبيه أحمد
- ✅ Soft Delete لحماية البيانات المالية
- ✅ PostgreSQL Transactions لكل عملية معقدة
- ✅ لقطات يومية (Daily Snapshot) عند الطلب

---

## 📖 كيف تقرأ هذه الوثائق

### إذا كنت المطور:
1. ابدأ بـ [01_Overview](./01_Overview_Assumptions.md) للفهم العام
2. راجع [10_ADRs](./10_ADRs.md) للقرارات المتخذة
3. راجع [05_Database](./05_Database_Design.md) للتصميم التقني
4. راجع [25_API_Contracts](./25_API_Contracts.md) قبل كتابة أي Route
5. اتبع [24_AI_Build_Playbook](./24_AI_Build_Playbook.md) للتنفيذ المرحلي
6. أغلق البوابات عبر [27_PreBuild_Verification_Matrix](./27_PreBuild_Verification_Matrix.md)

### إذا كنت المستخدم (أحمد):
1. راجع [07_Glossary](./07_Definitions_Glossary.md) للمصطلحات
2. راجع [08_SOPs](./08_SOPs.md) لإجراءات العمل

---

## ⚖️ Source of Truth Rule (قاعدة مصدر الحقيقة)

عند وجود تعارض بين المصادر، **الملف الأعلى في الهرم يربح**:

```
┌──────────────────────────────────────────┐
│  1️⃣  05_Database_Design.md  (الحقيقة)    │  ← أعلى سلطة: أسماء الجداول + الأعمدة + القيود
│  2️⃣  DDL Readiness Pack     (مشتق)       │  ← مُولّد من DB Design — لا يُعدّل يدوياً
│  3️⃣  15_Seed_Data_Functions (واجهة)      │  ← دوال RPC: I/O/Errors مستمد من DB Design
│  4️⃣  04_Core_Flows          (سلوك)       │  ← خطوات العمل مرتبطة بالدوال والجداول
│  5️⃣  06_Financial_Ledger    (أمثلة)      │  ← أمثلة حسابية توضيحية
└──────────────────────────────────────────┘
```

| القاعدة | المثال |
|---------|--------|
| اسم عمود أو نوع بيانات مختلف بين الملفات → **DB Design يربح** | `DECIMAL(12,3)` في DB Design ≠ `DECIMAL(10,2)` في مثال → استخدم `(12,3)` |
| DDL Pack ناقص → **خطأ في التوليد** — يُعاد التوليد من DB Design | إذا DDL لا يحتوي جدولاً موجوداً في DB Design → أعد توليد DDL Pack |
| دالة Seed Data تذكر عموداً غير موجود في DB Design → **خطأ في الدالة** | `edit_invoice()` تذكر عمود `edit_count` → لا يوجد في DB → احذفه من الدالة |
| Core Flows تذكر ERR_* غير موجود في Error Codes → **خطأ** | أضف الرمز للكتالوج أو صحح Core Flows |

> **ملاحظة:** عند تعديل أي عمود أو جدول في DB Design، يجب:
> 1. تحديث DDL Readiness Pack
> 2. تحديث function signatures في Seed Data (إن تأثرت)
> 3. تحديث Core Flows (إن تأثرت)

---

**الإصدار:** 2.9  
**آخر تحديث:** 5 مارس 2026  
**الموقع:** الأردن | **العملة:** JOD | **الملفات:** 18
