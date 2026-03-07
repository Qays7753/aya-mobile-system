# ملخص إصلاحات فحص جاهزية البناء — 5 مارس 2026

## ✅ مشاكل كانت مُصلحة مسبقاً (قبل هذا التشغيل)

| # | المشكلة | الحالة |
|---|---------|--------|
| **N-01** 🔴 | `message` → `body` في INSERT notifications | ✅ مُصلح (يستخدم `body` في سطر 728, 777, 1244) |
| **N-02** 🟠 | `purchases` → `purchase_orders` في SOPs | ✅ مُصلح (سطر 710) |
| **N-03** 🟠 | غموض `customer_id` في Seed_Data | ✅ مُوضّح (سطر 237, 254: "يُحفظ كـ `debt_customer_id`") |
| **F-01** 🟠 | OP-15a ناقص قيد expense | ✅ مُصلح (سطر 2329-2330 يظهران income + expense) |
| **SC-01** 🟡 | شاشة الجرد غير موجودة | ✅ مُضافة (UI_UX سطر 993+) |
| **ED-01** 🟡 | لا سياسة تقريب | ✅ مُضافة (Financial_Ledger سطر 540: ROUND_HALF_UP) |
| **S-01** 🟡 | صلاحية POS للمصروفات | ✅ واضحة (UI_UX سطر 1070: "أحمد + موظف المبيعات") |

## 🔧 إصلاحات تمت في هذا التشغيل

| # | الملف | التغيير |
|---|-------|---------|
| **T-01** 🟠 | `08_SOPs.md` سطر 712 | `stock_counts` → `inventory_counts` + `inventory_count_items` |
| **E-01a** 🟡 | `04_Core_Flows.md` OP-10 | إضافة ذكر صريح لـ `ERR_MAINTENANCE_INVALID_STATUS` |
| **E-01b** 🟡 | `04_Core_Flows.md` OP-18 | إضافة ذكر صريح لـ `ERR_COUNT_ALREADY_COMPLETED` + شرط `status = 'in_progress'` |
| **E-01c** 🟡 | `04_Core_Flows.md` OP-01 | إضافة ذكر صريح لـ `ERR_DEBT_LIMIT_WARNING` |
| **E-01d** 🟡 | `04_Core_Flows.md` تأكيدات | إضافة ذكر صريح لـ `ERR_PRODUCT_HAS_REFERENCES` |

## 📌 ملاحظات متبقية (لا تمنع البناء)

| # | الملف | الملاحظة |
|---|-------|----------|
| **S-02** | DB Design | `accounts` RLS = SELECT(all) — POS يرى الأرصدة. مراجعة إن أُريد Blind POS |
| **SC-02** | UI_UX | Audit Log بدون تصميم مفصل (مذكور في Dashboard فقط) |
| **E-01e** | Error Codes | `ERR_EXPORT_TOO_LARGE` و `ERR_AUTH_SESSION_EXPIRED` — ضمنية في Tech_Config، لا تحتاج ذكراً في Core_Flows |

## النتيجة النهائية

**🟢 التوثيق جاهز للبناء بالكامل — لا توجد مشاكل تكسر الكود.**
