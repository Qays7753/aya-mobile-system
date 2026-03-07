# آية موبايل - لايف تراكر التنفيذ
## 31) Execution Live Tracker (AI Build Tracker)

---

## الهدف

هذا المستند هو **أداة التنفيذ اليومية** للنظام.

هو لا يستبدل:
- `09_Implementation_Plan.md` كخطة استراتيجية.
- `24_AI_Build_Playbook.md` كدليل أوامر ومهام AI.
- `27_PreBuild_Verification_Matrix.md` كمرجع Go/No-Go.

بل يربطها في مستند واحد حيّ يُحدَّث بعد كل تنفيذ.

---

## الحكم على الخطة الحالية

**هل خطة التنفيذ الحالية مناسبة؟**

نعم، **مناسبة كخطة استراتيجية وبناء تدريجي**، للأسباب التالية:
- تقسيم واضح إلى `Phase 0` ثم `MVP` ثم `V1` ثم `V2`.
- وجود Gates وشروط عبور بين المراحل.
- وجود `AI Build Playbook` و`Verification Matrix` يدعمان التنفيذ.
- وجود فصل جيد بين ما هو MVP وما هو مؤجل إلى `V1/V2`.

**لكنها ليست كافية وحدها كـ Live Tracker**، لأن:
- مهام `09` واسعة نسبيًا على مطور AI-first.
- `24` يشرح كيف تبدأ، لكنه لا يوفّر سجل حالة حيّ للمشروع.
- لا يوجد مستند واحد يجيب لحظيًا على: ما الذي بدأ؟ ما الذي اكتمل؟ ما الذي منعنا من التقدم؟ وما هو شرط نجاح المرحلة الحالية؟

لذلك هذا الملف هو طبقة المتابعة التنفيذية المفقودة.

---

## نموذج الحوكمة التنفيذية

هذا البناء يُدار عبر **دورين منفصلين إلزاميًا**:

| الدور | المسؤولية | الممنوع |
|------|-----------|---------|
| `Execution Agent` | التنفيذ الفعلي، التحديثات، الاختبارات، تقرير التنفيذ، معالجة الملاحظات | لا يغلق المهمة أو المرحلة وحده |
| `Review Agent (Review-Only)` | **قراءة + تحليل + مقارنة + تقديم تقرير فقط** | ممنوع التنفيذ، ممنوع التعديل، ممنوع كتابة كود، ممنوع تشغيل أوامر تغيّر الحالة، ممنوع إعلان الإغلاق النهائي |

**المعيار الحاكم للتنفيذ:** الصحة، الدقة، المسؤولية، وإثبات المطابقة مع العقود. السرعة ليست معيارًا للإغلاق.

---

## دورة المهمة الإلزامية

كل مهمة أو مرحلة يجب أن تمر بنفس التسلسل:

1. `Task Contract`
   - الهدف
   - النطاق
   - الملفات المسموح لمسها
   - شروط النجاح
   - الأدلة المطلوبة
   - Stop Rules
2. `Execute`
   - ينفذ `Execution Agent` التغيير المطلوب فقط ضمن العقد.
3. `Self-Check`
   - يتحقق `Execution Agent` من المطابقة قبل إرسال العمل للمراجعة.
4. `Execution Report`
   - يسجل ما تم، وما لم يتم، وما الأدلة.
5. `Review Prompt`
   - يكتب `Execution Agent` برومبت واضح لـ `Review Agent` ينص صراحة أن مهمته **قراءة وتحليل وتقديم تقرير فقط**.
6. `Independent Review`
   - يراجع `Review Agent` المخرجات مقابل العقود والوثائق وشروط النجاح.
7. `Findings`
   - يصدر حكمًا: `PASS` أو `PASS WITH FIXES` أو `FAIL`.
8. `Remediation`
   - يعالج `Execution Agent` الملاحظات ويحدث تقرير المعالجة.
9. `Re-Review`
   - تعاد المراجعة إذا وُجدت ملاحظات `P0/P1`.
10. `Close Gate`
   - لا تتحول المهمة أو المرحلة إلى `Done` إلا بعد اكتمال الحزمة وإغلاق الملاحظات الحرجة.

---

## طريقة الاستخدام

1. افتح **مرحلة واحدة فقط** على أنها `In Progress`.
2. لا تبدأ مهمة جديدة قبل إنشاء `Task Contract` للمهمة الحالية.
3. بعد كل تنفيذ، حدّث:
   - `Status`
   - `Evidence`
   - `Updated At`
   - `Notes / Blockers`
4. بعد كل تنفيذ، أنشئ:
   - `Execution Report`
   - `Review Prompt`
5. أرسل العمل إلى `Review Agent` مع نص صريح أن مهمته:
   - قراءة
   - تحليل
   - تقديم تقرير فقط
   - بدون أي تنفيذ أو تعديل
6. إذا خرجت المراجعة بـ `PASS WITH FIXES` أو `FAIL`، تعود المهمة إلى `In Progress` حتى إغلاق الملاحظات.
7. لا تنتقل إلى المرحلة التالية قبل تحقق **Gate Success** الخاصة بالمرحلة الحالية + اكتمال حزمة الإغلاق.
8. إذا فشل شرط نجاح واحد من شروط المرحلة، تتحول المرحلة إلى `Blocked` حتى يُوثق سبب الفشل وخطة الإغلاق.

---

## حالات التتبع

| الحالة | المعنى |
|--------|--------|
| `Open` | لم يبدأ العمل |
| `In Progress` | جارٍ التنفيذ |
| `Blocked` | يوجد مانع يمنع الإغلاق |
| `Review` | التنفيذ انتهى وينتظر تقرير مراجعة مستقل |
| `Done` | أُغلق مع دليل |
| `Deferred` | مؤجل رسميًا إلى مرحلة لاحقة |

---

## حزمة الإغلاق الإلزامية

لا يجوز إغلاق أي مهمة أو مرحلة بدون العناصر التالية:

1. `Task Contract`
2. `Execution Report`
3. `Review Prompt`
4. `Review Report`
5. `Remediation Log` إذا وُجدت ملاحظات
6. `Close Decision`

**Close Decision** يجب أن يوضح واحدًا من التالي:
- `Closed`
- `Closed with Deferred Items`
- `Blocked`

---

## شروط إغلاق المرحلة

لا تُغلق المرحلة إلا إذا تحقق ما يلي معًا:

1. جميع مهام المرحلة = `Done` أو `Deferred` رسميًا
2. `Phase Execution Report` موجود
3. `Phase Review Prompt` موجود
4. `Phase Review Report` موجود من `Review Agent`
5. جميع ملاحظات `P0/P1` مغلقة أو مؤجلة بقرار صريح
6. قرار الإغلاق النهائي مسجل مع الأدلة

---

## ملخص المراحل

| Phase ID | المرحلة | الهدف | المصدر الأساسي | Gate Success | الحالة |
|----------|---------|-------|----------------|--------------|--------|
| `PX-00` | Pre-Build Freeze | تثبيت مرجعية الوثائق والـ locks قبل أي بناء | `27`, `31`, `archive/30` | كل `GP-01..GP-08 = Pass` | `Done` |
| `PX-01` | Workspace + Runtime Baseline | تجهيز المشروع وبيئة التنفيذ والاتصال الأساسي | `09:26+`, `24:41+` | التطبيق يعمل محليًا + Health + Device baseline | `In Progress` |
| `PX-02` | DB Security Foundation | تطبيق schema/RLS/RPC boundaries ومنع direct writes | `05`, `10`, `13`, `15` | كل write عبر RPC wrappers فقط | `Open` |
| `PX-03` | Sales Core Slice | المنتجات + POS + `create_sale` + concurrency | `04`, `16`, `25` | بيع كامل ناجح + replay محمي + لا stock drift | `Open` |
| `PX-04` | Invoice Control + Debt | المرتجعات + الديون + الإلغاء + التعديل | `04`, `06`, `08`, `15` | flows الحرجة تمر بدون تناقض مالي | `Open` |
| `PX-05` | Reports + Snapshot + Integrity + Device | اللقطة اليومية + التقارير + فحص النزاهة + جودة الأجهزة | `03`, `09`, `17`, `29` | Device/UAT/Integrity checks ناجحة | `Open` |
| `PX-06` | MVP Release Gate | فحص قبول MVP وإعلان الجاهزية | `17`, `24`, `27` | اجتياز جميع اختبارات MVP المطلوبة | `Open` |
| `PX-07` | V1 Expansion | الموردون/المشتريات/الشحن/الجرد/التسوية/الصيانة | `09`, `24` | تسليم V1 بدون كسر عقود MVP | `Open` |

---

## PX-00 — Pre-Build Freeze

**الهدف:** تثبيت مرجعية البناء قبل التنفيذ.

**Entry Rule:** لا شيء.

**Exit Rule:** كل بوابات `GP-01..GP-08` في `27_PreBuild_Verification_Matrix.md` = `Pass`.

**Gate Success**
- لا يوجد contradiction مفتوح في الوثائق.
- `LOCK-SINGLE-BRANCH` مثبت.
- authority موحدة في الهوية والكتابة والـ ledger والـ drift.

**الحالة الحالية:** `Done`

---

## PX-01 — Workspace + Runtime Baseline

**الهدف:** تجهيز workspace قابل للبناء مع AI بدون غموض.

**المراجع**
- `09_Implementation_Plan.md`
- `13_Tech_Config.md`
- `24_AI_Build_Playbook.md`
- `29_Device_Browser_Policy.md`

**Gate Success**
- `npm run dev` يعمل.
- `GET /api/health` يعمل.
- حدود مفاتيح Supabase صحيحة.
- baseline متعدد الأجهزة مثبت.

### Phase Contract

- **Primary Outcome:** workspace محلي نظيف وقابل للتشغيل مع baseline آمن للأجهزة والاتصال.
- **In Scope:** bootstrap، المكتبات الأساسية، Supabase setup، clients، health endpoint، responsive shell، installability baseline.
- **Allowed Paths:** `app/`, `lib/`, `public/`, `supabase/config.toml`, `package.json`, `tsconfig.json`, `next.config.*`, `middleware.ts`, `vercel.json`, `.env.example`, `aya-mobile-documentation/31_Execution_Live_Tracker.md`.
- **Required Proofs:** تشغيل محلي ناجح، `GET /api/health = 200`، إثبات عدم تسريب `service_role` للعميل، smoke test على هاتف/تابلت/لابتوب.
- **Stop Rules:** ممنوع بناء flows تجارية كاملة داخل هذه المرحلة، ممنوع direct writes من المتصفح، ممنوع أي secret في `NEXT_PUBLIC_*`.

### Phase Review Focus

- صحة حدود clients ومفاتيح البيئة
- minimality في baseline بدون features إضافية
- جاهزية shell متعدد الأجهزة
- وضوح الأدلة قبل الانتقال إلى `PX-02`

### Phase Close Package

- `Phase Execution Report — PX-01`
- `Phase Review Prompt — PX-01`
- `Phase Review Report — PX-01`
- `Phase Close Decision — PX-01`

### Current Phase Status

- **Phase State:** `In Progress`
- **Active Task:** `PX-01-T01`
- **Started At:** `2026-03-07`
- **Execution Owner:** `Execution Agent`
- **Review Owner:** `Review Agent (Review-Only)`
- **Next Gate:** إنهاء `PX-01-T01` بعقد واضح ثم الانتقال تدريجيًا إلى `PX-01-T02..T06`

| Task ID | المهمة | المرجع | Status | Evidence | Updated At | Notes / Blockers |
|--------|--------|--------|--------|----------|------------|------------------|
| `PX-01-T01` | Bootstrap المشروع (`Next.js`, `TypeScript`) | `24/TASK-00-01` | `In Progress` | `PX-01 kickoff started` | `2026-03-07` | التنفيذ يبدأ من bootstrap فقط. لا يسمح بفتح أي مهمة خارج `PX-01` حاليًا. |
| `PX-01-T02` | تثبيت المكتبات الأساسية | `24/TASK-00-02` | `Open` |  |  |  |
| `PX-01-T03` | إعداد Supabase CLI والربط | `24/TASK-00-03` | `Open` |  |  |  |
| `PX-01-T04` | إنشاء browser/server/admin clients بحدود واضحة | `24/TASK-00-04` | `Open` |  |  |  |
| `PX-01-T05` | Health endpoint | `24/TASK-00-06` | `Open` |  |  |  |
| `PX-01-T06` | baseline installability + responsive shell | `24/TASK-00-07`, `29` | `Open` |  |  |  |

### Active Task Contract — PX-01-T01

- **الهدف:** تثبيت baseline مشروع `Next.js + TypeScript` صالح للبناء بدون أي logic تجاري.
- **In Scope:** bootstrap هيكل المشروع فقط، مع الحفاظ على التوافق مع هيكل التوثيق الحالي.
- **Allowed Paths:** `app/`, `package.json`, `tsconfig.json`, `next.config.*`, `next-env.d.ts`, `.gitignore`, `aya-mobile-documentation/31_Execution_Live_Tracker.md`.
- **Required Proofs:** نجاح تشغيل `npm run dev`، ظهور baseline project structure، وعدم إدخال features أو business flows.
- **Stop Rules:** ممنوع بناء routes تجارية، ممنوع إضافة Supabase logic في هذه المهمة، ممنوع القفز إلى `PX-01-T02` قبل تقرير تنفيذ ومراجعة لهذه المهمة.

### Required Delivery For PX-01-T01

- `Execution Report — PX-01-T01`
- `Review Prompt — PX-01-T01`
- `Review Report — PX-01-T01`
- `Close Decision — PX-01-T01`

---

## PX-02 — DB Security Foundation

**الهدف:** تثبيت طبقة البيانات بشكل يمنع أي multiple truth منذ اليوم الأول.

**المراجع**
- `05_Database_Design.md`
- `10_ADRs.md`
- `13_Tech_Config.md`
- `15_Seed_Data_Functions.md`
- `27_PreBuild_Verification_Matrix.md`

**Gate Success**
- لا direct writes من العميل.
- wrappers فقط قابلة للاستدعاء.
- RLS وBlind POS يعملان حسب العقد.
- idempotency وadmin guards مفروضان داخل DB boundary.

### Phase Contract

- **Primary Outcome:** قاعدة بيانات محكومة تمنع multiple truth وshadow writes قبل أي feature business.
- **In Scope:** schema baseline، migrations، RLS، grants، wrappers، Blind POS، idempotency، admin guards.
- **Allowed Paths:** `supabase/migrations/`, `supabase/config.toml`, `lib/supabase/`, `aya-mobile-documentation/31_Execution_Live_Tracker.md`.
- **Required Proofs:** SQL/grants proofs، رفض direct writes، إثبات أن wrappers فقط قابلة للاستدعاء، إثبات Blind POS، إثبات عدم وجود shadow mutation paths.
- **Stop Rules:** ممنوع إضافة features UI، ممنوع منح `authenticated` أو `anon` صلاحيات على `_core` أو الجداول الحساسة، ممنوع اعتماد runtime كسلطة بديلة عن DB guards.

### Phase Review Focus

- authority على مستوى DB فقط
- توافق RLS/grants مع الوثائق
- سلامة idempotency وadmin guards
- عدم وجود bypass عبر view/function grants

### Phase Close Package

- `Phase Execution Report — PX-02`
- `Phase Review Prompt — PX-02`
- `Phase Review Report — PX-02`
- `Phase Close Decision — PX-02`

| Task ID | المهمة | المرجع | Status | Evidence | Updated At | Notes / Blockers |
|--------|--------|--------|--------|----------|------------|------------------|
| `PX-02-T01` | تطبيق schema والمigrations الأساسية | `05`, `15` | `Open` |  |  |  |
| `PX-02-T02` | تفعيل `REVOKE ALL` + RLS baseline | `10/ADR-044`, `24/TASK-00-05` | `Open` |  |  |  |
| `PX-02-T03` | التحقق من Blind POS على `products/accounts/suppliers` | `18`, `05`, `13` | `Open` |  |  |  |
| `PX-02-T04` | التحقق من wrappers الحساسة (`sale`, `return`, `debt`, `snapshot`) | `15`, `25` | `Open` |  |  |  |
| `PX-02-T05` | إثبات عدم وجود shadow mutation paths | `27/VB-01`, `28` | `Open` |  |  |  |

---

## PX-03 — Sales Core Slice

**الهدف:** بناء أول slice تشغيلية كاملة تخدم نقطة البيع فعليًا.

**المراجع**
- `04_Core_Flows.md`
- `03_UI_UX_Sitemap.md`
- `16_Error_Codes.md`
- `17_UAT_Scenarios.md`
- `24_AI_Build_Playbook.md`

**Gate Success**
- شاشة POS تعمل سريعًا.
- `create_sale` ناجح.
- replay محمي.
- لا stock negative.
- السعر authoritative من السيرفر فقط.

### Phase Contract

- **Primary Outcome:** أول مسار بيع مكتمل وآمن وقابل للاستخدام الفعلي.
- **In Scope:** قراءة المنتجات للـPOS، cart state، search، `create_sale` route/RPC، idempotency، concurrency، POS local cart.
- **Allowed Paths:** `app/(dashboard)/pos/`, `app/(dashboard)/products/`, `app/api/sales/`, `components/pos/`, `stores/`, `hooks/`, `lib/validations/`, `aya-mobile-documentation/31_Execution_Live_Tracker.md`.
- **Required Proofs:** sale happy path، replay proof، concurrency proof بين جهازين، إثبات تجاهل السعر القادم من العميل، إثبات عدم `stock negative`.
- **Stop Rules:** ممنوع الثقة بـ `unit_price` أو totals من العميل، ممنوع direct client writes، ممنوع bypass لـ RPC wrapper، ممنوع إغلاق المرحلة بدون دليل تزامن.

### Phase Review Focus

- server-authoritative pricing
- correctness لمسار `create_sale`
- سلامة التزامن وidempotency
- أداء شاشة POS وحدودها التشغيلية

### Phase Close Package

- `Phase Execution Report — PX-03`
- `Phase Review Prompt — PX-03`
- `Phase Review Report — PX-03`
- `Phase Close Decision — PX-03`

| Task ID | المهمة | المرجع | Status | Evidence | Updated At | Notes / Blockers |
|--------|--------|--------|--------|----------|------------|------------------|
| `PX-03-T01` | قراءة المنتجات للـ POS مع Blind POS | `24/TASK-MVP-01` | `Open` |  |  |  |
| `PX-03-T02` | سلة محلية + بحث سريع + Auto-Focus | `24/TASK-MVP-02`, `02/GAP-03` | `Open` |  |  |  |
| `PX-03-T03` | Route + validation + RPC لـ `create_sale` | `24/TASK-MVP-03`, `25` | `Open` |  |  |  |
| `PX-03-T04` | إثبات idempotency في البيع | `16`, `17/UAT-21` | `Open` |  |  |  |
| `PX-03-T05` | إثبات concurrency بين جهازين POS | `17/UAT-21b` | `Open` |  |  |  |
| `PX-03-T06` | حفظ سلة POS محليًا | `02/GAP-02` | `Open` |  |  |  |

---

## PX-04 — Invoice Control + Debt

**الهدف:** إغلاق المسارات المالية الحرجة بعد البيع.

**المراجع**
- `04_Core_Flows.md`
- `06_Financial_Ledger.md`
- `08_SOPs.md`
- `15_Seed_Data_Functions.md`
- `16_Error_Codes.md`

**Gate Success**
- المرتجع الكامل/الجزئي يعمل.
- الدين FIFO يعمل.
- الإلغاء والتعديل محكومان بصلاحيات وAudit.
- لا يظهر تناقض بين stored balances والـ ledger truth.

### Phase Contract

- **Primary Outcome:** إغلاق المسارات المالية بعد البيع بدون كسر ledger authority.
- **In Scope:** returns، debt manual/payment، FIFO، cancel/edit invoice، audit coverage، debt scenarios.
- **Allowed Paths:** `app/api/returns/`, `app/api/debts/`, `app/api/payments/debt/`, `app/api/invoices/`, `lib/validations/`, `app/(dashboard)/debts/`, `aya-mobile-documentation/31_Execution_Live_Tracker.md`.
- **Required Proofs:** partial return proof، FIFO settlement proof، admin-only cancel/edit proof، audit log proof، debt/overpay scenario outputs.
- **Stop Rules:** ممنوع تعديل `ledger_entries` مباشرة، ممنوع السماح لـ non-admin في cancel/edit، ممنوع اعتماد cached balances كحقيقة مالية نهائية.

### Phase Review Focus

- صحة تدفقات الدين والمرتجعات
- التوافق مع FIFO وledger truth
- صلاحيات الإلغاء والتعديل
- اكتمال audit trail

### Phase Close Package

- `Phase Execution Report — PX-04`
- `Phase Review Prompt — PX-04`
- `Phase Review Report — PX-04`
- `Phase Close Decision — PX-04`

| Task ID | المهمة | المرجع | Status | Evidence | Updated At | Notes / Blockers |
|--------|--------|--------|--------|----------|------------|------------------|
| `PX-04-T01` | `create_return` مع قواعد partial/debt refund | `24/TASK-MVP-04` | `Open` |  |  |  |
| `PX-04-T02` | `create_debt_manual` و`create_debt_payment` | `24/TASK-MVP-05` | `Open` |  |  |  |
| `PX-04-T03` | `cancel_invoice` و`edit_invoice` | `24/TASK-MVP-06` | `Open` |  |  |  |
| `PX-04-T04` | اختبار FIFO + overpay + debt return scenarios | `26`, `08` | `Open` |  |  |  |
| `PX-04-T05` | إثبات audit coverage للمسارات الحساسة | `18`, `16` | `Open` |  |  |  |

---

## PX-05 — Reports + Snapshot + Integrity + Device

**الهدف:** إغلاق التشغيل اليومي الحقيقي للنظام قبل إعلان MVP.

**المراجع**
- `03_UI_UX_Sitemap.md`
- `09_Implementation_Plan.md`
- `17_UAT_Scenarios.md`
- `29_Device_Browser_Policy.md`

**Gate Success**
- Daily snapshot تعمل.
- التقارير الأساسية متاحة.
- فحص النزاهة المالية يعمل.
- الهاتف/التابلت/اللابتوب مجتازة.
- installability موجودة بدون offline financial behavior.

### Phase Contract

- **Primary Outcome:** تشغيل يومي متكامل مع integrity checks ودعم أجهزة واضح قبل إطلاق MVP.
- **In Scope:** snapshot، reports baseline، reconciliation/inventory completion، balance integrity route، device QA، print/user-device backlog decisions.
- **Allowed Paths:** `app/api/snapshots/`, `app/api/reconciliation/`, `app/api/inventory/`, `app/api/health/`, `app/(dashboard)/reports/`, `app/(dashboard)/settings/`, `components/`, `lib/`, `aya-mobile-documentation/31_Execution_Live_Tracker.md`.
- **Required Proofs:** snapshot proof، integrity route proof، report/filter proof، device QA outputs، backlog decisions الموثقة للعناصر غير المنفذة.
- **Stop Rules:** ممنوع إضافة offline behavior، ممنوع backdating، ممنوع drift authority split، ممنوع ترك print/user-device gaps بدون قرار موثق.

### Phase Review Focus

- صحة integrity authority
- readiness على الهاتف/التابلت/اللابتوب
- عدم تحول backlog إلى claims تشغيلية كاذبة
- اتساق snapshot/report behavior مع العقود

### Phase Close Package

- `Phase Execution Report — PX-05`
- `Phase Review Prompt — PX-05`
- `Phase Review Report — PX-05`
- `Phase Close Decision — PX-05`

| Task ID | المهمة | المرجع | Status | Evidence | Updated At | Notes / Blockers |
|--------|--------|--------|--------|----------|------------|------------------|
| `PX-05-T01` | `create_daily_snapshot` + report filters | `09`, `25` | `Open` |  |  |  |
| `PX-05-T02` | inventory count completion + reconciliation | `24/TASK-MVP-07` | `Open` |  |  |  |
| `PX-05-T03` | balance integrity route + admin check | `24`, `27/GP-02` | `Open` |  |  |  |
| `PX-05-T04` | Device QA للهاتف/التابلت/اللابتوب | `24/TASK-MVP-08`, `17/UAT-33..35` | `Open` |  |  |  |
| `PX-05-T05` | print baseline أو backlog decision | `02/GAP-01` | `Open` |  |  |  |
| `PX-05-T06` | user/device SOP gap decision | `02/GAP-07` | `Open` |  |  |  |

---

## PX-06 — MVP Release Gate

**الهدف:** إعلان أن MVP جاهز للاستخدام الحقيقي ضمن النطاق الموثق.

**المراجع**
- `17_UAT_Scenarios.md`
- `24_AI_Build_Playbook.md`
- `27_PreBuild_Verification_Matrix.md`
- `26_Dry_Run_Financial_Scenarios.md`

**Gate Success**
- جميع اختبارات MVP الحرجة = `Pass`.
- لا `Blocker` مفتوح.
- `UAT-21`, `UAT-21b`, `UAT-28..35` مجتازة.
- tracker محدث ومكتمل.

### Phase Contract

- **Primary Outcome:** قرار MVP رسمي مبني على أدلة، لا على الانطباع.
- **In Scope:** dry run مالي، UAT الأمن/التزامن/الأداء، device gate، قرار Go/No-Go.
- **Allowed Paths:** `aya-mobile-documentation/31_Execution_Live_Tracker.md`, `aya-mobile-documentation/17_UAT_Scenarios.md`, `aya-mobile-documentation/26_Dry_Run_Financial_Scenarios.md`, `aya-mobile-documentation/27_PreBuild_Verification_Matrix.md`, وأي ملفات bugfix minimal إذا ظهرت blockers فقط.
- **Required Proofs:** نتائج UAT، dry run outputs، device gate evidence، قائمة blockers closed/deferred، قرار Go/No-Go موثق.
- **Stop Rules:** ممنوع إضافة features جديدة، ممنوع إغلاق MVP مع `P0/P1` مفتوح، ممنوع اعتبار النجاح قائمًا بدون أدلة تشغيلية فعلية.

### Phase Review Focus

- اكتمال أدلة MVP
- سلامة قرار Go/No-Go
- عدم وجود blockers مخفية
- مطابقة التنفيذ للعقود الأصلية وليس فقط لاجتياز الاختبارات

### Phase Close Package

- `Phase Execution Report — PX-06`
- `Phase Review Prompt — PX-06`
- `Phase Review Report — PX-06`
- `Phase Close Decision — PX-06`

| Task ID | المهمة | المرجع | Status | Evidence | Updated At | Notes / Blockers |
|--------|--------|--------|--------|----------|------------|------------------|
| `PX-06-T01` | تشغيل dry run المالي الكامل | `26` | `Open` |  |  |  |
| `PX-06-T02` | تشغيل UAT الأمن والتزامن والأداء | `17` | `Open` |  |  |  |
| `PX-06-T03` | تشغيل Device Gate | `27/VB-15..17` | `Open` |  |  |  |
| `PX-06-T04` | قرار Go/No-Go لـ MVP | `27` | `Open` |  |  |  |

---

## PX-07 — V1 Expansion

**الهدف:** توسيع النظام بعد استقرار MVP، بدون كسر العقود الأساسية.

**المراجع**
- `09_Implementation_Plan.md`
- `24_AI_Build_Playbook.md`
- `10_ADRs.md`

**Gate Success**
- كل إضافة V1 تحافظ على authority الحالية.
- لا shadow paths جديدة.
- لا يتم كسر Single-Branch أو Device Contract أو API-first.

### Phase Contract

- **Primary Outcome:** توسعة V1 بدون تراجع معماري أو أمني.
- **In Scope:** الموردون، المشتريات، الشحن، الجرد المحسن، التسوية المحسنة، الصيانة، التقارير المحسنة ضمن حدود V1 فقط.
- **Allowed Paths:** `app/`, `lib/`, `supabase/migrations/`, `aya-mobile-documentation/31_Execution_Live_Tracker.md`, `aya-mobile-documentation/24_AI_Build_Playbook.md`, `aya-mobile-documentation/10_ADRs.md`.
- **Required Proofs:** إثبات عدم كسر عقود MVP، review على authority الجديدة، tests أو UAT خاصة بأي إضافة V1، قرار واضح لأي توسعة تتطلب ADR جديد.
- **Stop Rules:** ممنوع كسر `LOCK-SINGLE-BRANCH`، ممنوع إدخال mutation path إضافي خارج canonical path، ممنوع توسعة scope بدون ADR إذا مست branch/device/API-first.

### Phase Review Focus

- backward compatibility مع MVP
- سلامة authority بعد التوسعة
- الحاجة إلى ADR جديد من عدمها
- منع أي regression أمني أو تشغيلي

### Phase Close Package

- `Phase Execution Report — PX-07`
- `Phase Review Prompt — PX-07`
- `Phase Review Report — PX-07`
- `Phase Close Decision — PX-07`

| Task ID | المهمة | المرجع | Status | Evidence | Updated At | Notes / Blockers |
|--------|--------|--------|--------|----------|------------|------------------|
| `PX-07-T01` | الموردون والمشتريات | `09/V1`, `24` | `Open` |  |  |  |
| `PX-07-T02` | الشحن والتحويلات | `09/V1` | `Open` |  |  |  |
| `PX-07-T03` | الجرد والتسوية المحسنة | `09/V1` | `Open` |  |  |  |
| `PX-07-T04` | الصيانة الأساسية | `10/ADR-013`, `09/V1` | `Open` |  |  |  |
| `PX-07-T05` | التقارير المحسنة + Excel | `09/V1`, `18` | `Open` |  |  |  |

---

## قواعد الإغلاق المرحلي

### لا تعتبر المرحلة `Done` إلا إذا:
- كل المهام الحرجة داخلها = `Done` أو `Deferred` رسميًا.
- لا يوجد `Blocked` أو `FAIL` مراجعة مفتوح.
- `Phase Execution Report` موجود.
- `Phase Review Prompt` موجود.
- `Phase Review Report` موجود من `Review Agent`.
- أي `P0/P1` تمت معالجته أو تأجيله بقرار موثق.
- تم تحديث `Updated At` و`Evidence` لكل المهام.

### اعتبر المرحلة `Blocked` إذا:
- فشل شرط نجاح واحد من شروط Gate Success.
- ظهر تناقض بين التنفيذ والوثائق المرجعية.
- احتاجت المرحلة قرار ADR جديد غير محسوم.
- رفض `Review Agent` الإغلاق أو أعاد حكم `FAIL`.

---

## سجل التنفيذ الحي

| التاريخ | Phase / Task | التغيير | الحالة بعد التحديث | الدليل |
|---------|--------------|---------|--------------------|--------|
| 2026-03-07 | `PX-01` | تم فتح المرحلة الأولى للتنفيذ الفعلي وتحديد `PX-01-T01` كمهمة نشطة | `In Progress` | `31_Execution_Live_Tracker.md` |
| YYYY-MM-DD | `PX-XX-TXX` | مثال: تم إنشاء route / تم إغلاق bug / تم اجتياز UAT | `In Progress / Done / Blocked` | file path / test / screenshot / SQL |

---

## ملاحظات تشغيلية

- إذا استخدمت AI للبناء، فليكن **العمل دائمًا من هذا الترتيب**:
  1. اقرأ `31_Execution_Live_Tracker.md`
  2. افتح المرحلة الحالية فقط
  3. ارجع إلى `24_AI_Build_Playbook.md` للمهمة المنفذة
  4. ارجع إلى `04/05/13/15/16/25` كعقود تنفيذ
  5. حدّث هذا tracker بعد كل تنفيذ

- إذا أصبح هذا المستند غير محدث، يفقد قيمته فورًا حتى لو كانت الخطة الأصلية ممتازة.

---

**الحالة:** Active Live Tracker  
**الغرض:** متابعة التنفيذ الفعلي للنظام مع AI خطوة بخطوة  
