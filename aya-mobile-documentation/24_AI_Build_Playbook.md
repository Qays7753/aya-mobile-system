# آية موبايل - دليل البناء بالذكاء الاصطناعي
## 24) AI Build Playbook (Execution-Ready)

---

## الهدف

هذا الدليل يحول التوثيق الحالي إلى خطوات تنفيذ عملية لمطور غير متخصص يعتمد على الذكاء الاصطناعي في بناء النظام.

**المبدأ:** كل خطوة يجب أن تُنتج مخرجًا قابلًا للفحص + معيار قبول واضح قبل الانتقال لما بعدها.

**ملاحظة تنفيذية:** هذا الدليل يحدد **كيف ينفذ AI المهمة**، بينما الحالة اليومية للمشروع وإغلاق المراحل تُدار عبر [31_Execution_Live_Tracker.md](./31_Execution_Live_Tracker.md).

---

## القواعد الإلزامية قبل أي تنفيذ

1. الالتزام بمرجعية التصميم: `10_ADRs.md` (خصوصًا ADR-042/043/044).
2. أي كتابة بيانات مالية تمر عبر API فقط (`service_role`) وفق `13_Tech_Config.md`.
3. الواجهة لا تُرسل السعر النهائي للبيع، والسيرفر يسحبه من قاعدة البيانات.
4. لا تعديل مباشر على `ledger_entries` و`audit_logs` (Append-Only).
5. كل مهمة تُبنى عموديًا: DB → API → UI → Test.
6. لا بدء أي مهمة جديدة قبل إغلاق معيار قبول المهمة الحالية.
7. جميع الشاشات التشغيلية يجب أن تعمل على الهاتف + التابلت + اللابتوب.

---

## بروتوكول التنفيذ والمراجعة

هذا المشروع يعمل عبر **Agent منفذ** و**Agent مراجع مستقل**.

### 1) Execution Agent

مسؤول عن:
- قراءة `Task Contract`
- تنفيذ التغيير
- إجراء `Self-Check`
- كتابة `Execution Report`
- كتابة `Review Prompt`
- معالجة الملاحظات

غير مسموح له:
- إغلاق المهمة أو المرحلة نهائيًا بمفرده
- اعتبار العمل صحيحًا نهائيًا بدون مراجعة مستقلة

### 2) Review Agent (Review-Only)

مسؤول عن:
- **قراءة**
- **تحليل**
- **مقارنة التنفيذ بالعقد والوثائق**
- **تقديم تقرير مراجعة فقط**

غير مسموح له:
- تنفيذ أي تعديل
- كتابة كود
- تشغيل أوامر تغيّر الحالة
- تعديل الملفات
- إعلان أن المهمة "تم تنفيذها" بدلًا من "تمت مراجعتها"

أي طلب يُوجّه إلى `Review Agent` يجب أن ينص صراحة أن مهمته:
**قراءة وتحليل وتقديم تقرير فقط**.

### 3) معيار القرار

المعيار الحاكم هو:
- الصحة
- الدقة
- المسؤولية
- اكتمال الأدلة

السرعة ليست معيار قبول.

---

## دورة العمل الإلزامية

1. `Task Contract`
2. `Execute`
3. `Self-Check`
4. `Execution Report`
5. `Review Prompt`
6. `Independent Review`
7. `Remediation`
8. `Re-Review`
9. `Close`

لا يجوز تجاوز أي خطوة من هذه الخطوات.

---

## شكل المهمة القياسي (Task Card)

استخدم هذا القالب لكل مهمة أثناء البناء:

```md
### TASK-ID: <code>
- الهدف:
- النطاق:
- الملفات المسموح لمسها:
- شروط النجاح:
- الأدلة المطلوبة:
- Stop Rules:
- Prompt للـ Execution Agent:
- الملفات المتوقعة:
- اختبار القبول:
- Self-Check:
- حالة المهمة: Open / In Progress / Review / Done / Blocked
```

---

## قالب عقد المرحلة

استخدم هذا القالب قبل بدء أي Phase:

```md
## Phase Contract — <PHASE-ID>
- الهدف التنفيذي:
- In Scope:
- Allowed Paths:
- Required Proofs:
- Stop Rules:
- Execution Owner:
- Review Owner:
```

---

## قالب تقرير التنفيذ

```md
## Execution Report — <TASK-ID / PHASE-ID>
- الحالة الحالية:
- ما تم تنفيذه:
- ما لم يتم تنفيذه:
- الملفات التي تم لمسها:
- الاختبارات أو الأدلة:
- الانحرافات عن العقد:
- المخاطر أو العوائق:
- قرار الإرسال للمراجعة: Ready / Not Ready
```

---

## قالب برومبت المراجعة المستقلة

استخدم هذا القالب كما هو مع `Review Agent`:

```text
You are the Review Agent for Aya Mobile.

Your role is strictly review-only.
Your task is to read, analyze, compare, and produce a report only.

You must not:
- implement anything
- modify files
- write code
- run change-producing commands
- claim execution is complete

Review scope:
- Task/Phase: <TASK-ID / PHASE-ID>
- Goal: <goal>
- Contract: <task contract summary>
- Success criteria: <success criteria>
- Evidence provided: <evidence list>
- Files changed: <files>
- Reference docs: <docs>

Required output:
1. Verdict: PASS / PASS WITH FIXES / FAIL
2. Findings by severity: P0 / P1 / P2
3. Contract mismatches
4. Missing proofs
5. Clear remediation actions for the Execution Agent

Important:
This is a reading, analysis, and reporting task only.
Do not execute or change anything.
```

---

## قالب برومبت مراجعة المرحلة

```text
You are the Review Agent for Aya Mobile.

This is a phase review only.
Your task is to read, analyze, compare, and produce a report only.
You must not implement, edit, or execute anything.

Phase:
- PHASE-ID: <PHASE-ID>
- Objective: <phase objective>
- In Scope: <phase scope>
- Allowed Paths: <allowed paths>
- Required Proofs: <required proofs>
- Gate Success: <gate success criteria>

Artifacts to review:
- Phase Execution Report
- Task evidence
- Changed files
- Reference docs

Required output:
1. Verdict: PASS / PASS WITH FIXES / FAIL
2. P0 / P1 / P2 findings
3. Gate mismatches
4. Missing proofs
5. Required remediation before phase close

Important:
This is a reading, analysis, and reporting task only.
You are not allowed to implement or modify anything.
```

---

## قالب تقرير المراجعة

```md
## Review Report — <TASK-ID / PHASE-ID>
- الدور: Review Agent (Review-Only)
- Verdict: PASS / PASS WITH FIXES / FAIL
- Findings:
  - P0:
  - P1:
  - P2:
- Contract mismatches:
- Missing evidence:
- Required remediation:
- Re-review required: Yes / No
```

---

## قالب تقرير المعالجة

```md
## Remediation Log — <TASK-ID / PHASE-ID>
- Findings addressed:
- Files updated:
- New evidence:
- Remaining gaps:
- Ready for re-review: Yes / No
```

---

## المرحلة 0: الإقلاع الآمن (Day 1)

### TASK-00-01: Bootstrap المشروع
- الهدف: إنشاء مشروع Next.js + TypeScript.
- Prompt للـ AI: "Create Next.js App Router project with TypeScript in the current repo."
- الملفات المتوقعة: `app/`, `package.json`, `tsconfig.json`.
- اختبار القبول: تشغيل `npm run dev` بدون أخطاء.

### TASK-00-02: تثبيت المكتبات الأساسية
- الهدف: تثبيت مكتبات التوثيق المعتمدة.
- Prompt للـ AI: "Install runtime libs from 13_Tech_Config and keep versions stable."
- الملفات المتوقعة: `package.json`, `package-lock.json`.
- اختبار القبول: نجاح `npm install` وظهور المكتبات:
  - `@supabase/supabase-js`
  - `@supabase/ssr`
  - `zod`
  - `zustand`
  - `date-fns`
  - `lucide-react`
  - `sonner`
  - `recharts`

### TASK-00-03: تهيئة Supabase
- الهدف: تفعيل الاتصال بالمشروع وقاعدة البيانات.
- Prompt للـ AI: "Initialize Supabase CLI and prepare migration workflow."
- الملفات المتوقعة: `supabase/config.toml`, `supabase/migrations/*`.
- اختبار القبول: `supabase status` يعمل.

### TASK-00-04: إعداد عملاء Supabase
- الهدف: فصل عميل المتصفح عن عميل الخادم.
- Prompt للـ AI: "Create browser and server Supabase clients with strict key boundaries."
- الملفات المتوقعة:
  - `lib/supabase/client.ts`
  - `lib/supabase/server.ts`
  - `lib/supabase/admin.ts`
- اختبار القبول: عدم وجود `SUPABASE_SERVICE_ROLE_KEY` في أي ملف `NEXT_PUBLIC_*`.

### TASK-00-05: تطبيق REVOKE-ALL أولاً
- الهدف: منع الكتابة المباشرة من المتصفح.
- Prompt للـ AI: "Generate SQL migration for ADR-044 revoke-all-first and RLS baseline."
- الملفات المتوقعة: ملف Migration جديد في `supabase/migrations/`.
- اختبار القبول: أي `INSERT` مباشر من المتصفح يفشل بصلاحيات.

### TASK-00-06: Health Endpoint
- الهدف: فحص جاهزية البيئة.
- Prompt للـ AI: "Create GET /api/health with status + timestamp."
- الملفات المتوقعة: `app/api/health/route.ts`.
- اختبار القبول: `GET /api/health` يرجع `200` و`status: ok`.

### TASK-00-07: Device & Installability Baseline
- الهدف: تجهيز دعم الأجهزة المتعددة + قابلية التثبيت.
- Prompt للـ AI: "Configure responsive viewport, manifest metadata, and install prompt handling without enabling offline financial behavior."
- الملفات المتوقعة:
  - `app/manifest.ts` أو `public/manifest.webmanifest`
  - تحديث metadata/viewport في `app/layout.tsx`
- اختبار القبول:
  - التطبيق يفتح بشكل صحيح على `360px` و`768px` و`1024px+`.
  - يظهر خيار Add to Home Screen / Install App على المتصفحات المدعومة.
  - لا توجد أي ميزة Offline transactions.

---

## المرحلة 1: MVP (بناء عمودي)

## Slice-01: المنتجات + القراءة الآمنة

### TASK-MVP-01
- الهدف: صفحات المنتجات + قراءة POS عبر `v_pos_products`.
- Prompt للـ AI: "Build products listing and forms while preserving Blind POS."
- الملفات المتوقعة:
  - `app/(dashboard)/products/page.tsx`
  - `hooks/use-products.ts`
- اختبار القبول: POS لا يرى `cost_price` نهائيًا.

## Slice-02: POS سلة محلية + بحث سريع

### TASK-MVP-02
- الهدف: سلة محلية مع بحث ≤ 400ms.
- Prompt للـ AI: "Build POS cart using zustand, local search, debounce 200ms."
- الملفات المتوقعة:
  - `app/(dashboard)/pos/page.tsx`
  - `components/pos/*`
  - `stores/pos-cart.ts`
- اختبار القبول: البحث يعمل محليًا بدون طلبات كتابة.

## Slice-03: Create Sale (أهم Slice)

### TASK-MVP-03
- الهدف: `POST /api/sales` مع تحقق جلسة/دور/validation/idempotency.
- Prompt للـ AI: "Implement API route for create_sale RPC using StandardEnvelope."
- الملفات المتوقعة:
  - `app/api/sales/route.ts`
  - `lib/validations/sales.ts`
- اختبار القبول:
  - نجاح عملية بيع مكتملة.
  - إعادة نفس `idempotency_key` لا تنشئ فاتورة جديدة.
  - تجاهل أي `unit_price` قادم من العميل.

## Slice-04: المرتجعات

### TASK-MVP-04
- الهدف: `POST /api/returns` (full/partial) حسب العقود.
- Prompt للـ AI: "Implement return flow aligned with OP-02 and debt-return rules."
- الملفات المتوقعة:
  - `app/api/returns/route.ts`
  - `lib/validations/returns.ts`
- اختبار القبول:
  - مرتجع جزئي صحيح.
  - عند `cash_refund > 0` يلزم `refund_account_id`.

## Slice-05: الديون

### TASK-MVP-05
- الهدف: دين يدوي + تسديد FIFO.
- Prompt للـ AI: "Implement debt manual and debt payment API routes with FIFO allocations."
- الملفات المتوقعة:
  - `app/api/debts/manual/route.ts`
  - `app/api/payments/debt/route.ts`
- اختبار القبول:
  - تطبيق FIFO افتراضيًا.
  - تحديث `remaining_balance` بدقة.

## Slice-06: الإلغاء والتعديل

### TASK-MVP-06
- الهدف: `cancel_invoice` و`edit_invoice` بصلاحيات Admin فقط.
- Prompt للـ AI: "Build admin-only invoice cancel/edit routes with audit logging."
- الملفات المتوقعة:
  - `app/api/invoices/cancel/route.ts`
  - `app/api/invoices/edit/route.ts`
- اختبار القبول:
  - POS يحصل على `403`.
  - `audit_logs` يسجل السبب والقيم قبل/بعد.

## Slice-07: الجرد + التسوية + اللقطة اليومية

### TASK-MVP-07
- الهدف: إغلاق العمليات المالية الأساسية.
- Prompt للـ AI: "Implement inventory count completion, reconciliation, and daily snapshot routes."
- الملفات المتوقعة:
  - `app/api/inventory/counts/complete/route.ts`
  - `app/api/reconciliation/route.ts`
  - `app/api/snapshots/route.ts`
- اختبار القبول:
  - التسوية تنشئ قيد `adjustment`.
  - `daily_snapshot` يعمل بتاريخ التشغيل.

## Slice-08: Device QA (Responsive + Touch + Install)

### TASK-MVP-08
- الهدف: إغلاق جودة التشغيل متعدد الأجهزة قبل Go.
- Prompt للـ AI: "Refine responsive behavior for key screens (POS, invoices, debts, settings) and validate touch + keyboard parity."
- الملفات المتوقعة:
  - `app/(dashboard)/pos/page.tsx`
  - `app/(dashboard)/invoices/page.tsx`
  - `app/(dashboard)/debts/page.tsx`
  - المكونات المشتركة في `components/ui/*`
- اختبار القبول:
  - لا Horizontal Overflow على الهاتف.
  - جميع الأزرار الأساسية قابلة للمس بسهولة.
  - نفس العمليات الأساسية تنجح على هاتف/تابلت/لابتوب.

---

## مرحلة فحص ما قبل الإطلاق (MVP Gate)

نفّذ هذه الاختبارات قبل اعتبار MVP جاهزًا:

1. UAT التزامن: `UAT-21` و`UAT-21b`.
2. UAT الأمان: `UAT-28` و`UAT-29` و`UAT-30`.
3. UAT الأداء: `UAT-31` و`UAT-32`.
4. UAT الأجهزة: `UAT-33` و`UAT-34` و`UAT-35`.
5. فحص النزاهة التوثيقي: تشغيل `doc_integrity_check.py`.

---

## Prompts جاهزة للمطور (نسخ/لصق)

### Prompt A: إنشاء API Route مضبوط
```text
Implement <route> in Next.js App Router.
Constraints:
- Validate session and role first.
- Validate body using Zod.
- Call RPC using service_role client only.
- Return StandardEnvelope { success, data?, error? }.
- Map errors to ERR_* from 16_Error_Codes.md.
- Never trust client-side price fields.
```

### Prompt B: شاشة POS سريعة
```text
Build POS screen optimized for speed:
- Local cart state with zustand.
- Product search with 200ms debounce.
- Keyboard shortcuts.
- Touch-first controls on mobile/tablet.
- No write calls until checkout action.
- Respect Blind POS (no cost fields).
- Ensure responsive behavior across 360px / 768px / 1024px+.
```

### Prompt D: دعم الأجهزة + التثبيت
```text
Implement device-agnostic UX behavior:
- Mobile/tablet/laptop responsive layouts.
- No horizontal overflow at 360px.
- Touch target minimum 44x44 for primary actions.
- Keep keyboard shortcuts on laptop.
- Add web installability metadata (A2HS/Install App).
- Do not add offline transaction logic.
```

### Prompt C: اختبار قبول لكل Slice
```text
Generate acceptance tests for <slice>:
- 1 happy path
- 2 validation failures
- 1 authorization failure
- 1 idempotency/concurrency scenario (if write route)
Use business rules from 04_Core_Flows.md and 16_Error_Codes.md.
```

---

## ملفات المرجع أثناء التنفيذ

1. `05_Database_Design.md` (العقود الجدولية وقواعد RLS)
2. `04_Core_Flows.md` (التدفقات التشغيلية خطوة بخطوة)
3. `13_Tech_Config.md` (المعمارية ومصفوفة API)
4. `15_Seed_Data_Functions.md` (تواقيع الدوال)
5. `16_Error_Codes.md` (خرائط الأخطاء)
6. `17_UAT_Scenarios.md` (اختبارات القبول)
7. `31_Execution_Live_Tracker.md` (تتبع التنفيذ الحالي)

---

**الإصدار:** 1.1  
**تاريخ التحديث:** 7 مارس 2026  
**الحالة:** Active Playbook for Build Handoff
