# آية موبايل - Documentation Remediation Tracker
## 23) Final Documentation Fix Tracker (Pre-Build)

---

## الهدف

تتبّع إصلاح التناقضات الحرجة في التوثيق قبل بدء البناء البرمجي (Go/No-Go)، مع توحيد العقود النصية بين الملفات وضمان جاهزية التنفيذ.

**النطاق:** توثيق فقط (بدون تعديل كود).

---

## قواعد التنفيذ

1. يتم تنفيذ المهام بالتسلسل حسب الأولوية (`P0` ثم `P1` ثم `P2`).
2. لا يُفتح أكثر من مهمة `In Progress` في نفس الوقت.
3. بعد إغلاق كل مهمة:
   - تحديث حالتها في هذا الملف.
   - تسجيل الملفات التي تم تعديلها.
   - إضافة سطر في سجل التنفيذ (Execution Log).
4. أي تعارض جديد يُضاف كمهمة جديدة برقم مستقل.

---

## تعريف الحالات

| الحالة | الوصف |
|--------|-------|
| `Open` | لم يبدأ العمل |
| `In Progress` | جاري التنفيذ |
| `Blocked` | متوقف بسبب قرار/اعتماد |
| `Done` | مكتمل ومعتمد |

---

## تعريف الأولويات

| الأولوية | المعنى |
|----------|--------|
| `P0` | مانع للبناء أو قد يسبب خطأ مالي/أمني |
| `P1` | مهم جداً لصحة التوثيق قبل Go |
| `P2` | تحسينات اتساق وجودة |

---

## Backlog الإصلاحات

| ID | Priority | المحور | المشكلة | الملفات المتأثرة | الإجراء المطلوب | معيار القبول | الحالة |
|----|----------|--------|---------|-------------------|------------------|--------------|--------|
| `TRK-001` | P0 | Sanity / Schema Contract | توحيد حقل حساب الإرجاع إلى `refund_account_id` | `04`, `05`, `15`, `08` | اعتماد اسم واحد فقط وتوحيده في الجداول والتواقيع والأمثلة | لا يظهر إلا اسم واحد متطابق في كل الملفات | Done |
| `TRK-002` | P0 | Debt Flow / Schema Contract | توحيد عمود تخصيص التسديد إلى `payment_id` | `04`, `05`, `06`, `15` | اعتماد اسم عمود مرجعي واحد في كل التوثيق | مخطط الجدول + SQL الأمثلة + signatures متطابقة حرفياً | Done |
| `TRK-003` | P0 | Purchase Contract | توحيد عقد الشراء إلى (`is_paid`/`unit_cost`) | `04`, `05`, `15`, `16` | توحيد DTO + SQL + أسماء الحقول | نفس العقد يظهر في كل الملفات بدون تحويلات ضمنية | Done |
| `TRK-004` | P0 | ADR-042 API-First | إكمال تغطية API Routes لكل عمليات DB الموثقة | `13`, `15`, `05` | إنشاء مصفوفة ربط: عملية DB ↔ RPC ↔ API Route | كل عملية كتابة لها Route واضح وصريح | Done |
| `TRK-005` | P0 | ADR-044 / Blind POS | توحيد سياسة Blind POS عبر Views آمنة ومنع القراءة المباشرة للحقول الحساسة | `05`, `13`, `18`, `11` | توثيق سياسة قراءة تمنع كشف الحقول الحساسة على POS (Views/API) | لا يوجد مسار موثق يسمح لـ POS بقراءة حقول مالية حساسة | Done |
| `TRK-006` | P0 | Privacy | حسم `national_id` كحقل اختياري إداري فقط مع اتساق السياسة والمخطط | `18`, `05`, `01`, `07` | حسم القرار: إبقاء الحقل أو إزالته توثيقياً مع اتساق كامل | السياسة + المخطط + القاموس متطابقة | Done |
| `TRK-007` | P0 | Financial Integrity | تثبيت قاعدة موحدة للشراء الآجل (بدون `ledger_entry` عند `is_paid=false`) | `04`, `05`, `06`, `15` | تثبيت قاعدة محاسبية موحدة للشراء الآجل (مع/بدون Ledger) وتبريرها | قاعدة واحدة متسقة بكل المراجع المالية | Done |
| `TRK-008` | P1 | Debt / Returns | تحويل معالجة مرتجع فاتورة الدين إلى قاعدة آلية موثقة + خطأ صريح | `08`, `04`, `05`, `15`, `16` | تحويل المعالجة إلى قواعد نظامية موثقة + أكواد أخطاء واضحة | لا توجد عبارة "تنسيق يدوي" في السيناريو المحاسبي الحرج | Done |
| `TRK-009` | P1 | Concurrency | توثيق سياسة deadlock/lock ordering بشكل صريح | `04`, `13`, `15`, `17` | توثيق ترتيب قفل موحّد وآلية retry/failure handling | سيناريو التزامن مكتمل: lock order + retry policy + error code | Done |
| `TRK-010` | P1 | Ledger Consistency | توحيد مصدر الحقيقة: `ledger_entries` مع `current_balance` كـ Cache | `04`, `05`, `06`, `15` | توحيد سياسة Source of Truth وتحديث الصيغ | لا تعارض بين تقارير الأرصدة وسياسة التخزين | Done |
| `TRK-011` | P1 | Index/Schema Sanity | تصحيح فهرس `audit_logs_action_date` ليتوافق مع `action_timestamp` | `05` | تصحيح الفهرس/الأمثلة لتطابق المخطط | جميع فهارس `audit_logs` تستخدم أعمدة موجودة فعلياً | Done |
| `TRK-012` | P1 | Error Coverage | تغطية الأخطاء مربوطة رسمياً بكل عمليات الكتابة | `05`, `15`, `16` | إنشاء مصفوفة: العملية ↔ حالات الفشل ↔ ERR code | كل عملية كتابة لديها تغطية أخطاء صريحة | Done |
| `TRK-013` | P2 | Risks Register | تحديث سجل المخاطر ليعكس المخاطر المكتشفة في مراجعة Go/No-Go | `02` | تحديث سجل المخاطر بالبنود الحرجة الجديدة | توافق كامل بين الواقع الحالي وسجل المخاطر | Done |
| `TRK-014` | P2 | Final Sanity Sweep | مراجعة نهائية للأسماء والدوال والمراجع بعد الإغلاق | `04`, `05`, `06`, `08`, `13`, `15`, `16`, `18` | تنفيذ تدقيق اتساق شامل بعد إنجاز المهام | صفر تناقضات نصية مانعة في المراجعة النهائية | Done |
| `TRK-015` | P0 | Post-Review Security & Returns | حسم تعارض `refund_account_id` + تشديد صلاحيات قراءة POS المالية | `04`, `05`, `13`, `15`, `17`, `18` | توحيد القاعدة: `refund_account_id` اختياري مشروط بـ `cash_refund` + منع SELECT مباشر للـ POS على الجداول المالية الحساسة | لا يوجد تعارض بين Returns/UAT/RLS وBlind POS | Done |
| `TRK-016` | P1 | Financial Reporting Coherence | توحيد معادلات وأسماء تقارير الربحية/المرتجعات + سد فجوة UAT الأداء | `05`, `06`, `15`, `17` | إزالة الحقول غير الموجودة (`total_refund`, `invoice_items.gross_profit`) وتوحيد أسماء report functions وإضافة UAT أداء | تطابق نصي كامل بين مخطط الجداول والتقارير وتغطية أداء أساسية | Done |
| `TRK-017` | P0 | Returns Consistency | توحيد قاعدة مرتجع الفيزا: المرتجع يسجل بالمبلغ الكامل وليس `net_amount` | `04`, `06` | اعتماد صياغة واحدة لقاعدة عمولة الفيزا عند المرتجع في جميع المواضع | لا يوجد نص متعارض حول `net_amount` مقابل `total_amount` | Done |
| `TRK-018` | P0 | Manual Debt Ledger Rule | تثبيت سياسة الدين اليدوي بدون قيد Ledger مباشر | `04`, `06` | إزالة أي إشارة لقيد `manual_debt` مباشر وتوجيه أي تحصيل فوري إلى `create_debt_payment()` | قاعدة `manual_debt` متسقة في جميع الملفات | Done |
| `TRK-019` | P1 | Profit Formula Accuracy | ربط معادلات الربح بالمرتجعات الجزئية عبر `returned_quantity` | `05`, `06`, `15` | تحديث جميع صيغ الربح اليومية/التراكمية لتستخدم `(quantity - returned_quantity)` | لا تضخيم للربح بعد المرتجعات في التوثيق | Done |
| `TRK-020` | P1 | Security + Naming Sanity | تشديد Blind POS على `ledger_entries` + تصحيح اسم إعداد الخصم | `05`, `13`, `16`, `18` | منع القراءة المباشرة لـ `ledger_entries` من POS وتوحيد اسم الإعداد إلى `max_pos_discount_percentage` | اتساق أمني ونصي كامل بين السياسات والأخطاء | Done |
| `TRK-021` | P0 | Execution Governance | غياب موجة تنفيذ عملية قبل البناء لمطور يعتمد على AI | `23` | إنشاء موجة تنفيذ جديدة `Wave-3` بمهام واضحة، مع معايير قبول وسجل تنفيذ خطوة بخطوة | وجود خطة تفصيلية قابلة للتنفيذ مباشرة وتحديث حالة كل مهمة بعد إنجازها | Done |
| `TRK-022` | P0 | Table Count Sanity | تعارض عددي في عدد الجداول بين ملفات التشغيل (26/28/29) | `13`, `17` | توحيد العدد المرجعي إلى 29 جدول في جميع المواضع المتعارضة | لا يظهر أي رقم جداول متعارض مع المرجع الرسمي `05/README` | Done |
| `TRK-023` | P1 | AI Build Enablement | عدم وجود Playbook تشغيلي مخصص لمطور غير متخصص يستخدم AI بالكامل | `24` (new), `23` | إنشاء `24_AI_Build_Playbook.md` (خطوة/أمر/مخرج/قبول) من Day-0 حتى MVP | يمكن لمطور غير متخصص تنفيذ الخطة بدون قرارات ضمنية أو فجوات تشغيلية | Done |
| `TRK-024` | P1 | API Contracts | لا يوجد كتالوج عقود API تفصيلي موحد لكل المسارات الحرجة | `25` (new), `13`, `23` | إنشاء `25_API_Contracts.md` مع Request/Response/Error/Idempotency/Role لكل Route | كل API كتابة/قراءة حرجة لها عقد JSON واضح ومربوط بـ ADR/ERR | Done |
| `TRK-025` | P1 | Pre-Build Validation Pack | غياب حزمة تحقق قبل البناء تجمع Dry Run المالي + مصفوفة الاختبارات التنفيذية | `26` (new), `27` (new), `23` | إنشاء ملفين: `26_Dry_Run_Financial_Scenarios.md` و`27_PreBuild_Verification_Matrix.md` | توفر حزمة تنفيذ وفحص كاملة قبل بدء الكود وقابلة للتتبع | Done |
| `TRK-026` | P0 | Execution Governance | لا توجد موجة رسمية لتثبيت دعم الأجهزة المتعددة بدون استثناء | `23` | إنشاء `Wave-4` مخصصة لـ Device-Agnostic Support مع مهام قابلة للتتبع | وجود خطة تنفيذ رسمية + Execution Log لكل إغلاق | Done |
| `TRK-027` | P0 | Device Architecture | غياب سياسة معمارية صريحة تؤكد التشغيل على الهاتف/التابلت/اللابتوب | `13`, `README` | توثيق سياسة `Device-Agnostic Web App` + قواعد الوصول من أي متصفح + تثبيت Web App على الجهاز | وضوح أن النظام يعمل على كل الأجهزة بدون استثناء مع بقاء Online-only | Done |
| `TRK-028` | P1 | UX Responsive Contract | معايير Responsive الحالية عامة وتحتاج قواعد تشغيل تفصيلية | `03`, `11` | إضافة معايير تفصيلية: breakpoints, touch targets, density, navigation behavior per device | وجود شروط تصميم وقياس واضحة لكل فئة جهاز | Done |
| `TRK-029` | P1 | Build Plan Coverage | خطة التنفيذ لا تحتوي بنود قبول صريحة لتوافق الأجهزة عبر كل الشاشات | `09`, `24` | إضافة مهام تنفيذ وبوابات قبول Device QA في الخطة وPlaybook | لا ينتقل الفريق للمرحلة التالية بدون اجتياز Device Acceptance | Done |
| `TRK-030` | P1 | UAT Device Readiness | سيناريوهات UAT لا تغطي بشكل كافٍ تحقق الهاتف/التابلت/اللابتوب | `17` | إضافة UAT مخصصة للأجهزة + تثبيت Web App (A2HS/Install) + touch/keyboard parity | وجود سيناريوهات قبول صريحة متعددة الأجهزة | Done |
| `TRK-031` | P1 | Go/No-Go Device Gate | مصفوفة التحقق لا تحتوي بوابة حاسمة للأجهزة المتعددة | `27`, `23` | إضافة بنود VB خاصة بالأجهزة وربطها ببوابة `Gate-D` | قرار Go ممنوع عند فشل Device Gate | Done |
| `TRK-032` | P0 | SQL↔Docs Parity | تباينات تشغيلية بين SQL migrations والتوثيق (تحويلات، أخطاء، Legacy references، صلاحيات RPC) | `04`, `05`, `06`, `15`, `16`, `25`, `28`, `supabase/migrations` | توحيد العقود والأخطاء ومخطط التحويلات مع SQL الحالي وإزالة أي مراجع ملغاة | تطابق نصي وتشغيلي كامل بين SQL والوثائق دون تعارضات مانعة | Done |

---

## ترتيب التنفيذ (Waves)

| Wave | النطاق | الشرط |
|------|--------|-------|
| `Wave-0` | `TRK-001` إلى `TRK-007` (P0) | إغلاق كامل قبل أي تقدم للبناء |
| `Wave-1` | `TRK-008` إلى `TRK-012` (P1) | بعد إغلاق Wave-0 |
| `Wave-2` | `TRK-013` إلى `TRK-014` (P2) | بعد إغلاق Wave-1 |
| `Wave-3` | `TRK-021` إلى `TRK-025` (Pre-Build Enablement) | تنفيذ متسلسل مع تحديث Execution Log بعد كل مهمة |
| `Wave-4` | `TRK-026` إلى `TRK-031` (Device-Agnostic Support) | تثبيت دعم الهاتف/التابلت/اللابتوب وتحديث الاختبارات والبوابات |

---

## Gate Criteria (Go/No-Go)

| Gate | الشرط |
|------|-------|
| `Gate-A (Doc Freeze)` | جميع `P0 = Done` |
| `Gate-B (Build Ready)` | جميع `P0 + P1 = Done` ولا توجد Contradictions مفتوحة |
| `Gate-C (AI Handoff Ready)` | اكتمال `TRK-021..TRK-025` وإتاحة Playbook + API Contracts + Validation Pack |
| `Gate-D (Device Ready)` | اكتمال `TRK-026..TRK-031` واجتياز فحوصات الهاتف/التابلت/اللابتوب |

---

## سجل التنفيذ (Execution Log)

| التاريخ | Task ID | الحالة الجديدة | الملفات المعدلة | ملخص التنفيذ |
|---------|---------|----------------|------------------|--------------|
| 2026-03-01 | `TRK-001` | Done | `15_Seed_Data_Functions.md`, `08_SOPs.md`, `23_Documentation_Remediation_Tracker.md` | توحيد اسم الحقل إلى `refund_account_id` في التواقيع وسيناريوهات SOP وتحديث حالة المهمة. |
| 2026-03-01 | `TRK-002` | Done | `04_Core_Flows.md`, `23_Documentation_Remediation_Tracker.md` | توحيد عمود تخصيص تسديد الديون إلى `payment_id` وتحديث المراجع المرتبطة في SQL flow. |
| 2026-03-01 | `TRK-003` | Done | `15_Seed_Data_Functions.md`, `23_Documentation_Remediation_Tracker.md` | توحيد توقيع `create_purchase()` إلى `is_paid` و`unit_cost` ليتطابق مع تصميم DB وتدفق OP-07. |
| 2026-03-01 | `TRK-004` | Done | `13_Tech_Config.md`, `23_Documentation_Remediation_Tracker.md` | إضافة مصفوفة رسمية تربط عمليات DB بدوال RPC ومسارات API وإدراج المسارات الناقصة في هيكل المشروع. |
| 2026-03-01 | `TRK-005` | Done | `05_Database_Design.md`, `13_Tech_Config.md`, `18_Data_Retention_Privacy.md`, `11_Design_UX_Guidelines.md`, `23_Documentation_Remediation_Tracker.md` | فرض Blind POS توثيقياً عبر منع القراءة المباشرة للجداول الحساسة للـ POS واعتماد `v_pos_*` Views أو API مفلتر. |
| 2026-03-01 | `TRK-006` | Done | `18_Data_Retention_Privacy.md`, `05_Database_Design.md`, `01_Overview_Assumptions.md`, `07_Definitions_Glossary.md`, `23_Documentation_Remediation_Tracker.md` | اعتماد `national_id` كحقل اختياري لعميل الدين (Admin only) وتوحيد الصياغة بين السياسة والمخطط والقاموس. |
| 2026-03-01 | `TRK-007` | Done | `04_Core_Flows.md`, `05_Database_Design.md`, `06_Financial_Ledger.md`, `15_Seed_Data_Functions.md`, `23_Documentation_Remediation_Tracker.md` | توحيد سياسة الشراء الآجل: لا قيد `purchase` عند الإنشاء إذا `is_paid=false`، والقيد المالي يُثبت عند `supplier_payment`. |
| 2026-03-01 | `TRK-008` | Done | `08_SOPs.md`, `04_Core_Flows.md`, `05_Database_Design.md`, `15_Seed_Data_Functions.md`, `16_Error_Codes.md`, `23_Documentation_Remediation_Tracker.md` | اعتماد قاعدة آلية لمرتجع فاتورة الدين (تقليل الدين غير المسدد أولاً ثم رد الجزء المسدد) وإضافة `ERR_RETURN_REFUND_ACCOUNT_REQUIRED`. |
| 2026-03-01 | `TRK-009` | Done | `13_Tech_Config.md`, `15_Seed_Data_Functions.md`, `04_Core_Flows.md`, `17_UAT_Scenarios.md`, `23_Documentation_Remediation_Tracker.md` | توثيق Lock Ordering (`product_id ASC`) وسياسة Retry عند deadlock/lock-timeout وربطها بسيناريو UAT مخصص. |
| 2026-03-01 | `TRK-010` | Done | `04_Core_Flows.md`, `05_Database_Design.md`, `06_Financial_Ledger.md`, `15_Seed_Data_Functions.md`, `23_Documentation_Remediation_Tracker.md` | تثبيت سياسة Source of Truth: القيود المحاسبية هي المرجع النهائي و`current_balance` cache تشغيلي مع Drift Check. |
| 2026-03-01 | `TRK-011` | Done | `05_Database_Design.md`, `23_Documentation_Remediation_Tracker.md` | تصحيح فهرس سجل التدقيق المركب ليستخدم `action_timestamp` وإضافة صيغة SQL المطابقة. |
| 2026-03-01 | `TRK-012` | Done | `16_Error_Codes.md`, `23_Documentation_Remediation_Tracker.md` | إضافة مصفوفة رسمية تربط كل عملية DB كتابة بدوالها وأكواد الأخطاء المغطية + أخطاء طبقة API المشتركة. |
| 2026-03-01 | `TRK-013` | Done | `02_Gaps_Risks_Recommendations.md`, `23_Documentation_Remediation_Tracker.md` | توسيع سجل المخاطر بمخاطر Go/No-Go الحرجة مع حالة الإغلاق التوثيقي لكل بند. |
| 2026-03-01 | `TRK-014` | Done | `04_Core_Flows.md`, `11_Design_UX_Guidelines.md`, `15_Seed_Data_Functions.md`, `23_Documentation_Remediation_Tracker.md` | تنفيذ تدقيق نهائي شامل: إزالة تعارضات `idempotency_key` وتواقيع التاريخ الاختيارية المخالفة لـ ADR-034 وتوحيد تغطية ERR codes بين 04/11/15/16. |
| 2026-03-01 | `TRK-015` | Done | `04_Core_Flows.md`, `05_Database_Design.md`, `13_Tech_Config.md`, `15_Seed_Data_Functions.md`, `17_UAT_Scenarios.md`, `18_Data_Retention_Privacy.md`, `23_Documentation_Remediation_Tracker.md` | معالجة تعارض مرتجع الدين (`refund_account_id` مشروط) + تشديد Blind POS بمنع القراءة المباشرة للجداول المالية الحساسة للـ POS. |
| 2026-03-01 | `TRK-016` | Done | `05_Database_Design.md`, `06_Financial_Ledger.md`, `15_Seed_Data_Functions.md`, `17_UAT_Scenarios.md`, `23_Documentation_Remediation_Tracker.md` | توحيد معادلات التقارير وأسماء دوالها وإزالة الإشارات لحقول غير موجودة وإضافة سيناريوهين UAT للأداء (UAT-31/32). |
| 2026-03-01 | `TRK-017` | Done | `04_Core_Flows.md`, `06_Financial_Ledger.md`, `23_Documentation_Remediation_Tracker.md` | توحيد قاعدة مرتجع الفيزا: ledger refund بالمبلغ الكامل (`total_amount`) وليس `net_amount`. |
| 2026-03-01 | `TRK-018` | Done | `04_Core_Flows.md`, `06_Financial_Ledger.md`, `23_Documentation_Remediation_Tracker.md` | إزالة تعارض الدين اليدوي: لا `ledger_entry` مباشر لـ `manual_debt`، والتحصيل الفوري يتم عبر `create_debt_payment()`. |
| 2026-03-01 | `TRK-019` | Done | `05_Database_Design.md`, `06_Financial_Ledger.md`, `15_Seed_Data_Functions.md`, `23_Documentation_Remediation_Tracker.md` | تحديث معادلات الربح لتأخذ `returned_quantity` بالحسبان في التقارير واللقطات اليومية. |
| 2026-03-01 | `TRK-020` | Done | `05_Database_Design.md`, `13_Tech_Config.md`, `16_Error_Codes.md`, `18_Data_Retention_Privacy.md`, `23_Documentation_Remediation_Tracker.md` | تشديد Blind POS على `ledger_entries` + توحيد اسم إعداد الخصم إلى `max_pos_discount_percentage`. |
| 2026-03-01 | `TRK-021` | Done | `23_Documentation_Remediation_Tracker.md` | إنشاء موجة تنفيذ `Wave-3` (TRK-021..TRK-025) بخطة تفصيلية قابلة للتنفيذ المباشر والتتبع. |
| 2026-03-01 | `TRK-022` | Done | `13_Tech_Config.md`, `17_UAT_Scenarios.md`, `23_Documentation_Remediation_Tracker.md` | توحيد عدد الجداول المرجعي إلى 29 في مواضع التعارض داخل التكوين التقني وسيناريو الاستعادة. |
| 2026-03-01 | `TRK-023` | Done | `24_AI_Build_Playbook.md`, `23_Documentation_Remediation_Tracker.md` | إنشاء Playbook تنفيذي لمطور AI-first (Task Cards + Prompts + Acceptance Gates) من الإقلاع حتى MVP. |
| 2026-03-01 | `TRK-024` | Done | `25_API_Contracts.md`, `13_Tech_Config.md`, `23_Documentation_Remediation_Tracker.md` | إنشاء كتالوج عقود API موحّد (17 Route) مع أدوار الوصول، body schema، النجاح، وأكواد الأخطاء المرجعية. |
| 2026-03-01 | `TRK-025` | Done | `26_Dry_Run_Financial_Scenarios.md`, `27_PreBuild_Verification_Matrix.md`, `README.md`, `23_Documentation_Remediation_Tracker.md` | إنشاء حزمة تحقق ما قبل البناء (Dry Run + Verification Matrix) وربطها بفهرس المشروع لسهولة التسليم والتنفيذ. |
| 2026-03-01 | `TRK-026` | Done | `23_Documentation_Remediation_Tracker.md` | إطلاق موجة `Wave-4` لدعم الأجهزة المتعددة وإضافة Gate-D كمعيار إلزامي قبل Go. |
| 2026-03-01 | `TRK-027` | Done | `13_Tech_Config.md`, `README.md`, `23_Documentation_Remediation_Tracker.md` | تثبيت سياسة معمارية رسمية: Web App متعدد الأجهزة (هاتف/تابلت/لابتوب) مع دعم التثبيت على الجهاز وبدون Offline mode. |
| 2026-03-01 | `TRK-028` | Done | `03_UI_UX_Sitemap.md`, `11_Design_UX_Guidelines.md`, `23_Documentation_Remediation_Tracker.md` | تحويل التوافق متعدد الأجهزة إلى عقد UX إلزامي بمعايير قياس واضحة (touch targets, overflow, navigation behavior). |
| 2026-03-01 | `TRK-029` | Done | `09_Implementation_Plan.md`, `24_AI_Build_Playbook.md`, `23_Documentation_Remediation_Tracker.md` | إضافة تغطية تنفيذ وقبول متعددة الأجهزة داخل الخطة وPlaybook (Device QA + Installability + UAT device gate). |
| 2026-03-01 | `TRK-030` | Done | `17_UAT_Scenarios.md`, `23_Documentation_Remediation_Tracker.md` | إضافة سيناريوهات UAT-33/34/35 لتغطية توافق الهاتف/التابلت/اللابتوب + touch/orientation + تثبيت Web App. |
| 2026-03-01 | `TRK-031` | Done | `27_PreBuild_Verification_Matrix.md`, `23_Documentation_Remediation_Tracker.md` | تفعيل بوابة الأجهزة في Go/No-Go عبر بنود VB-15/16/17 وربط القرار النهائي بـ Gate-D. |
| 2026-03-05 | `TRK-032` | Done | `supabase/migrations/002_operations.sql`, `supabase/migrations/004_functions_triggers.sql`, `supabase/migrations/005_rls_security.sql`, `04_Core_Flows.md`, `05_Database_Design.md`, `06_Financial_Ledger.md`, `07_Definitions_Glossary.md`, `15_Seed_Data_Functions.md`, `16_Error_Codes.md`, `25_API_Contracts.md`, `28_Reference_Implementation.md`, `23_Documentation_Remediation_Tracker.md` | توحيد كامل بين SQL والوثائق: إلغاء مرجع `transfer_between_accounts`، توحيد `create_transfer` (Output + ledger adjustments)، إكمال أكواد SQL الناقصة في كتالوج الأخطاء، تحديث عقود API، وتثبيت منع تنفيذ RPC المباشر من `authenticated/anon`. |

---

## ملاحظات إدارة العمل

- هذا الملف هو المرجع التشغيلي الرسمي لتقدم إصلاح التوثيق.
- أي تعديل في الأولويات أو إضافة مهام يتم عبر تحديث مباشر لهذا المستند.

---

**الإصدار:** 1.0  
**تاريخ الإنشاء:** 1 مارس 2026  
**الحالة العامة:** Closed (Wave-4 Device-Agnostic Support Completed)

---

## Addendum - Runtime SQL Remediation (2026-03-05)

| ID | Priority | Issue | Files Updated | Status |
|----|----------|-------|---------------|--------|
| `TRK-033` | P0 | Fix `005_rls_security.sql` deployment blocker (`suppliers.tax_number/created_by` mismatch) and enforce admin-only RLS on sensitive finance tables | `supabase/migrations/005_rls_security.sql` | Done |
| `TRK-034` | P0 | Fix FK execution-order defects in `create_sale`, `create_return`, `create_purchase` (parent rows must exist before child rows) | `supabase/migrations/004_functions_triggers.sql` | Done |
| `TRK-035` | P0 | Fix debt-return accounting update to respect `debt_entries` constraints (`amount`, `paid_amount`, `remaining_amount`) | `supabase/migrations/004_functions_triggers.sql` | Done |
| `TRK-036` | P1 | Replace non-atomic document numbering (`COUNT+1`) with concurrency-safe advisory lock strategy and align drift notification type with allowed constraint values | `supabase/migrations/004_functions_triggers.sql`, `supabase/migrations/005_rls_security.sql` | Done |

### Addendum Execution Log

| Date | Task ID | New Status | Files | Summary |
|------|---------|------------|-------|---------|
| 2026-03-05 | `TRK-033` | Done | `supabase/migrations/005_rls_security.sql` | Removed invalid `suppliers` column grant, kept direct table read blocked for `authenticated`, and expanded admin-only RLS set for sensitive financial tables. |
| 2026-03-05 | `TRK-034` | Done | `supabase/migrations/004_functions_triggers.sql` | Pre-created parent rows in `invoices/returns/purchase_orders`, then updated computed totals after item processing to eliminate FK failures. |
| 2026-03-05 | `TRK-035` | Done | `supabase/migrations/004_functions_triggers.sql` | Replaced debt-return update logic with consistent `paid_amount/remaining_amount` update to satisfy check constraints under full debt returns. |
| 2026-03-05 | `TRK-036` | Done | `supabase/migrations/004_functions_triggers.sql`, `supabase/migrations/005_rls_security.sql` | Implemented atomic numbering via `pg_advisory_xact_lock` + table-local `MAX(RIGHT(...))` and switched drift notifications to `reconciliation_difference` to match DB constraint. |

---

## Addendum - Governance Hardening P0 Closure (2026-03-05)

| ID | Priority | Issue | Files Updated | Status |
|----|----------|-------|---------------|--------|
| `TRK-037` | P0 | V-01 Backdating contradiction closed with one authoritative policy (`LOCK-NoBackdate`) | `01_Overview_Assumptions.md`, `04_Core_Flows.md`, `08_SOPs.md`, `10_ADRs.md` | Done |
| `TRK-038` | P0 | V-02 Drift authority split closed with canonical naming + authority map + deprecated aliases | `05_Database_Design.md`, `13_Tech_Config.md`, `15_Seed_Data_Functions.md`, `22_Operations_Guide.md`, `25_API_Contracts.md` | Done |
| `TRK-039` | P0 | V-03 Suppliers RLS contradiction closed with one RLS contract (no POS direct SELECT) | `05_Database_Design.md`, `18_Data_Retention_Privacy.md` | Done |
| `TRK-040` | P0 | V-04 Idempotency authority gaps closed (`create_debt_manual` required key, `create_daily_snapshot` natural-key) | `05_Database_Design.md`, `10_ADRs.md`, `13_Tech_Config.md`, `15_Seed_Data_Functions.md`, `16_Error_Codes.md`, `25_API_Contracts.md` | Done |
| `TRK-041` | P0 | V-05 Device/channel contract split closed with one authoritative policy page | `29_Device_Browser_Policy.md`, `01_Overview_Assumptions.md`, `11_Design_UX_Guidelines.md`, `13_Tech_Config.md`, `22_Operations_Guide.md`, `README.md` | Done |
| `TRK-042` | P0 | Remediation Package + Gate Package (Pre-Execution) published | `27_PreBuild_Verification_Matrix.md`, `30_Documentation_Governance_Remediation_Package.md`, `23_Documentation_Remediation_Tracker.md` | Done |
| `TRK-043` | P1 | Post-package integrity cleanup (error coverage + function permission + removal of legacy backticked token) | `15_Seed_Data_Functions.md`, `25_API_Contracts.md`, `04_Core_Flows.md`, `05_Database_Design.md`, `23_Documentation_Remediation_Tracker.md` | Done |

### Addendum Execution Log

| Date | Task ID | New Status | Files | Summary |
|------|---------|------------|-------|---------|
| 2026-03-05 | `TRK-037` | Done | `01_Overview_Assumptions.md`, `04_Core_Flows.md`, `08_SOPs.md`, `10_ADRs.md` | Removed remaining implied backdating text and aligned all references to strict `CURRENT_DATE` policy only. |
| 2026-03-05 | `TRK-038` | Done | `05_Database_Design.md`, `13_Tech_Config.md`, `15_Seed_Data_Functions.md`, `22_Operations_Guide.md`, `25_API_Contracts.md` | Drift authority locked to one RPC/route/job set with explicit alias deprecation and alert type alignment. |
| 2026-03-05 | `TRK-039` | Done | `05_Database_Design.md`, `18_Data_Retention_Privacy.md` | Unified suppliers access model: POS has no direct table read; limited operational exposure only via API fields. |
| 2026-03-05 | `TRK-040` | Done | `05_Database_Design.md`, `10_ADRs.md`, `13_Tech_Config.md`, `15_Seed_Data_Functions.md`, `16_Error_Codes.md`, `25_API_Contracts.md` | Enforced one idempotency policy per command and reconciled schema/contracts/error coverage. |
| 2026-03-05 | `TRK-041` | Done | `29_Device_Browser_Policy.md`, `01_Overview_Assumptions.md`, `11_Design_UX_Guidelines.md`, `13_Tech_Config.md`, `22_Operations_Guide.md`, `README.md` | Closed device/browser split and enforced one contract for phone/tablet/laptop/desktop + installability scope. |
| 2026-03-05 | `TRK-042` | Done | `27_PreBuild_Verification_Matrix.md`, `30_Documentation_Governance_Remediation_Package.md`, `23_Documentation_Remediation_Tracker.md` | Issued final remediation and gate package with stop rules and closure proofs for V-01..V-05. |
| 2026-03-05 | `TRK-043` | Done | `15_Seed_Data_Functions.md`, `25_API_Contracts.md`, `04_Core_Flows.md`, `05_Database_Design.md`, `23_Documentation_Remediation_Tracker.md` | Added missing documented errors (`ERR_CANNOT_CANCEL_PAID_DEBT`, `ERR_RECONCILIATION_UNRESOLVED`, `ERR_SUPPLIER_NOT_FOUND`, `ERR_APPEND_ONLY_VIOLATION`), added `fn_verify_balance_integrity()` permission summary entry, removed legacy backticked `retroactive_edit` token from change logs, and validated documentation integrity at `15/15 READY`. |

---

## Addendum - P0 Technical Execution Remediation (2026-03-06)

| ID | Priority | Issue | Files Updated | Status |
|----|----------|-------|---------------|--------|
| `TRK-044` | P0 | Drift authority runtime alignment: add canonical `fn_verify_balance_integrity()` and keep `check_balance_drift()` as deprecated alias | `supabase/migrations/004_functions_triggers.sql` | Done |
| `TRK-045` | P0 | Suppliers access contract alignment: Admin via `admin_suppliers` View/API only (no direct table read for `authenticated`) | `05_Database_Design.md`, `18_Data_Retention_Privacy.md`, `27_PreBuild_Verification_Matrix.md`, `30_Documentation_Governance_Remediation_Package.md` | Done |
| `TRK-046` | P0 | Debt manual idempotency hardening: enforce required key for `entry_type='manual'` at function + schema check | `supabase/migrations/003_accounting.sql`, `supabase/migrations/004_functions_triggers.sql`, `05_Database_Design.md` | Done |
| `TRK-047` | P0 | Daily snapshots natural-key idempotency: one snapshot/day with DB unique key + replay-safe function return | `supabase/migrations/003_accounting.sql`, `supabase/migrations/004_functions_triggers.sql` | Done |
| `TRK-048` | P0 | Device/Channel GAP closure: add runtime skeleton with middleware policy + manifest + cron/API bindings | `package.json`, `next.config.mjs`, `tsconfig.json`, `next-env.d.ts`, `vercel.json`, `middleware.ts`, `app/**`, `lib/supabaseAdmin.ts`, `public/**`, `.env.example` | Done |
| `TRK-049` | P0 | Ledger-derived decision checks for overpay/insufficient/reconciliation baselines | `supabase/migrations/004_functions_triggers.sql` | Done |

### Addendum Execution Log

| Date | Task ID | New Status | Files | Summary |
|------|---------|------------|-------|---------|
| 2026-03-06 | `TRK-044` | Done | `supabase/migrations/004_functions_triggers.sql` | Added canonical drift function and deprecated-alias comments without changing response contract. |
| 2026-03-06 | `TRK-045` | Done | `05_Database_Design.md`, `18_Data_Retention_Privacy.md`, `27_PreBuild_Verification_Matrix.md`, `30_Documentation_Governance_Remediation_Package.md` | Unified suppliers policy to View/API-only for Admin and API-limited access for POS. |
| 2026-03-06 | `TRK-046` | Done | `supabase/migrations/003_accounting.sql`, `supabase/migrations/004_functions_triggers.sql`, `05_Database_Design.md` | Enforced required idempotency key on manual debt path with schema + function checks. |
| 2026-03-06 | `TRK-047` | Done | `supabase/migrations/003_accounting.sql`, `supabase/migrations/004_functions_triggers.sql` | Enforced one snapshot/day and added deterministic replay behavior on duplicate day calls. |
| 2026-03-06 | `TRK-048` | Done | `package.json`, `next.config.mjs`, `tsconfig.json`, `next-env.d.ts`, `vercel.json`, `middleware.ts`, `app/**`, `lib/supabaseAdmin.ts`, `public/**`, `.env.example` | Added minimal runtime artifacts for device/browser enforcement and drift route/job bindings. |
| 2026-03-06 | `TRK-049` | Done | `supabase/migrations/004_functions_triggers.sql` | Replaced critical decision checks from `current_balance` to ledger-derived balances at decision time. |

---

## Addendum - P0 Technical Verification Closure (2026-03-06)

| ID | Priority | Issue | Files Updated | Status |
|----|----------|-------|---------------|--------|
| `TRK-050` | P0 | Fix migration compile blocker in `create_debt_manual` signature ordering/default rules | `supabase/migrations/004_functions_triggers.sql` | Done |
| `TRK-051` | P0 | Upgrade-safe idempotency alignment: drop legacy `create_daily_snapshot(date,text,uuid)` overload + normalize `daily_snapshots/debt_entries` constraints on existing databases | `supabase/migrations/003_accounting.sql`, `supabase/migrations/004_functions_triggers.sql` | Done |
| `TRK-052` | P0 | Idempotency race hardening for `create_debt_manual`: map concurrent duplicate key races to canonical `ERR_IDEMPOTENCY` | `supabase/migrations/004_functions_triggers.sql` | Done |
| `TRK-053` | P0 | Read-model authority hardening: debt-limit decision checks now derived from `debt_entries.remaining_amount` (not `debt_customers.current_balance`) in sale/edit flows | `supabase/migrations/004_functions_triggers.sql` | Done |
| `TRK-054` | P0 | Post-patch technical verification evidence executed on isolated audit database clone (`aya_verify_p0`) covering CF-01..CF-04 + GP-01..GP-07 | `aya-mobile-documentation/23_Documentation_Remediation_Tracker.md` | Done |

### Addendum Execution Log

| Date | Task ID | New Status | Files | Summary |
|------|---------|------------|-------|---------|
| 2026-03-06 | `TRK-050` | Done | `supabase/migrations/004_functions_triggers.sql` | Fixed PL/pgSQL signature default-order blocker so migration compiles in clean and upgrade paths. |
| 2026-03-06 | `TRK-051` | Done | `supabase/migrations/003_accounting.sql`, `supabase/migrations/004_functions_triggers.sql` | Added upgrade-compatibility SQL for idempotency constraints and removed legacy snapshot function overload to enforce one canonical command contract. |
| 2026-03-06 | `TRK-052` | Done | `supabase/migrations/004_functions_triggers.sql` | Added `unique_violation` handling in `create_debt_manual` to return deterministic `ERR_IDEMPOTENCY` under concurrent retries. |
| 2026-03-06 | `TRK-053` | Done | `supabase/migrations/004_functions_triggers.sql` | Replaced debt-limit checks in `create_sale` and `edit_invoice` with derived outstanding-debt sums from `debt_entries` to avoid cache-as-truth decisions. |
| 2026-03-06 | `TRK-054` | Done | `aya-mobile-documentation/23_Documentation_Remediation_Tracker.md` | Completed full verification run with SQL and policy evidence for drift authority, suppliers RLS, idempotency, device/runtime policy artifacts, and read-model authority boundaries. |
