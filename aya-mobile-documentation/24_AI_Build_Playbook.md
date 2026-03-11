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

## المرحلة 2: ما بعد `PX-07` (Post-V1 / V2 Execution-Ready)

هذا القسم لا يفتح التنفيذ تلقائيًا، لكنه يجعل `V2` قابلة للتنفيذ بنفس صرامة `PX-01 .. PX-07`.

### قواعد إلزامية خاصة بـ V2

1. لا تبدأ أي شريحة `advanced reports` أو `data portability` قبل إغلاق `Expense Core Slice`.
2. لا تُفتح أي route عامة (`public receipt link`) قبل تثبيت token/revocation/privacy contract في `18/25/27`.
3. لا يتم توسيع الأدوار خارج `admin/pos_staff` قبل حزمة عقود صريحة (`ADR + schema + API matrix + UAT`).
4. لا يوجد `backup/export/import` بدون:
   - `audit trail`
   - سياسة احتفاظ واضحة
   - restore drill معزول
5. لا يُستخدم caching على أي write path مالي؛ caching مسموح فقط على read models محددة بوضوح.
6. أي reminders أو رسائل واتساب يجب أن تكون:
   - deduped
   - auditable
   - قابلة للتعطيل
7. كل شريحة جديدة في `V2` يجب أن تثبت أنها لم تكسر:
   - Blind POS
   - API-first
   - Single-Branch assumptions
   - device contract

### حزمة التحضير الإلزامية قبل أول Task في V2

1. اقرأ `09_Implementation_Plan.md` — قسم `PX-08 .. PX-14`.
2. افتح `31_Execution_Live_Tracker.md` وتأكد أن المرحلة الجديدة ما زالت `Open` وليست `In Progress`.
3. راجع العقود المرجعية:
   - `10_ADRs.md`
   - `13_Tech_Config.md`
   - `16_Error_Codes.md`
   - `18_Data_Retention_Privacy.md`
   - `25_API_Contracts.md`
4. إذا كانت الشريحة تمس public links أو roles أو backups، فراجع أيضًا:
   - `03_UI_UX_Sitemap.md`
   - `17_UAT_Scenarios.md`
   - `27_PreBuild_Verification_Matrix.md`
5. أنشئ `Task Contract` ثم نفذ الشريحة عموديًا: `DB → API → UI → Proof → Review`.

---

## PX-08 — Expense Core + Notification Inbox

### الهدف التنفيذي

إغلاق الدين الخارجي `PX-02-T04-D01 = create_expense` وفتح طبقة تشغيلية صحيحة للمصروفات والإشعارات الداخلية قبل أي توسعة أعلى.

### Phase Contract

- **In Scope:** `create_expense`, فئات المصروفات, `/api/expenses`, `/expenses`, inbox للإشعارات, mark-as-read, تكامل المصروفات مع `daily_snapshots/reports`.
- **Allowed Paths:** `supabase/migrations/*`, `app/api/expenses*`, `app/api/expense-categories*`, `app/api/notifications*`, `app/(dashboard)/expenses*`, `components/dashboard/*`, `lib/api/*`, `lib/validations/*`, `tests/*`, الوثائق المرجعية ذات الصلة.
- **Required Proofs:** مصروف ناجح, ledger impact صحيح, `total_expenses/net_profit` يتغيران بشكل صحيح, Admin/POS visibility صحيحة للإشعارات.
- **Stop Rules:** ممنوع بناء تقارير مقارنة أو export متقدم قبل إثبات أثر المصروفات على `snapshots/reports`.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-08-T01` | توحيد `create_expense` على `service_role + p_created_by` | `supabase/migrations/*`, `15`, `25` | route مستقبلية يمكنها استدعاء الدالة دون `auth.uid()` مباشر | ممنوع فتح route قبل إغلاق alignment |
| `PX-08-T02` | إدارة `expense_categories` | `app/api/expense-categories/*`, `app/(dashboard)/settings*`, `components/dashboard/*` | Admin CRUD يعمل وPOS يقرأ active categories فقط عند الحاجة التشغيلية | ممنوع direct table read جديد لـ POS |
| `PX-08-T03` | `/api/expenses` + `/expenses` + validation | `app/api/expenses/route.ts`, `app/(dashboard)/expenses/page.tsx`, `lib/validations/expenses.ts` | تسجيل مصروف كامل مع `ledger_entries/audit_logs` صحيحين | ممنوع bypass على الحسابات أو المصروفات |
| `PX-08-T04` | inbox للإشعارات + mark as read | `app/api/notifications/*`, `components/dashboard/*` | Admin يرى كل الإشعارات وPOS يرى scoped notifications فقط | ممنوع read-all للـ POS |
| `PX-08-T05` | proof تكامل المصروفات مع `daily_snapshot/reports` | `scripts/*`, `tests/*`, `reports` | `total_expenses` و`net_profit` يتغيران كما هو متوقع | ممنوع إغلاق المرحلة بدون proof مالي |

---

## PX-09 — Communication + Receipt Links

### الهدف التنفيذي

إضافة outbound communication وshareable receipts بطريقة قابلة للتدقيق وتحترم الخصوصية دون فتح public leakage.

### Phase Contract

- **In Scope:** receipt link tokens, public receipt page, share actions, debt reminder scheduler, WhatsApp adapter, delivery log.
- **Allowed Paths:** `app/api/receipts*`, `app/r/*`, `app/api/messages*`, `app/api/notifications/*`, `supabase/migrations/*`, `lib/*`, `tests/*`, الوثائق المرجعية ذات الصلة.
- **Required Proofs:** public receipt read-only يعمل, token revocation يعمل, reminders deduped, WhatsApp delivery logged.
- **Stop Rules:** ممنوع أي public route يكشف `cost/profit/internal_notes/current_balance/audit data`.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-09-T01` | عقد receipt links + token/revocation model | `25`, `18`, `27`, `supabase/migrations/*` | token opaque + revocable + expirable | ممنوع أي رابط عام بلا contract privacy |
| `PX-09-T02` | صفحة إيصال عامة read-only + share action | `app/r/[token]/page.tsx`, `app/api/receipts/link/route.ts` | رابط يعمل من الهاتف ويعرض فقط الحقول المسموحة | ممنوع كشف `cost/profit` أو notes داخلية |
| `PX-09-T03` | scheduler لتذكير الديون مع dedupe | `app/api/notifications/debts/run/route.ts`, `cron` | لا تتكرر التنبيهات لنفس invoice/status window | ممنوع duplicate spam |
| `PX-09-T04` | WhatsApp adapter + delivery log | `app/api/messages/whatsapp/send/route.ts`, `lib/*` | يمكن الإرسال وتتبع `queued/sent/failed` | ممنوع تخزين message body كامل بلا ضرورة |
| `PX-09-T05` | privacy/no-leakage proof | `tests/*`, `scripts/*`, `18`, `27` | كل الروابط والرسائل تحجب البيانات الحساسة | لا إغلاق قبل security/privacy proof |

---

## PX-10 — Fine-Grained Permissions + Discount Governance

### الهدف التنفيذي

نقل النظام من `role = admin/pos_staff` فقط إلى bundles أدوار أكثر دقة دون كسر authority الحالية أو Blind POS.

### Phase Contract

- **In Scope:** role expansion package, permission bundles, assignment flows, UI/API guards, discount governance.
- **Allowed Paths:** `10`, `13`, `25`, `supabase/migrations/*`, `app/api/roles*`, `app/api/permissions*`, `middleware.ts`, `components/*`, `tests/*`.
- **Required Proofs:** role matrix يعمل, navigation scoped, discount limits حسب الدور, regression على authority = Pass.
- **Stop Rules:** ممنوع تعديل schema roles أو policies قبل حزمة contract صريحة ومراجعة مستقلة.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-10-T01` | حزمة عقود role expansion (`ADR + schema + API matrix`) | `10`, `13`, `25`, `05` عند الحاجة | contract معتمد قبل أي كود feature | ممنوع التنفيذ قبل اعتماد الحزمة |
| `PX-10-T02` | permission bundles + assignment flows | `app/api/roles/*`, `app/(dashboard)/settings/*` | يمكن إسناد أدوار جديدة بشكل auditable | ممنوع silent privilege escalation |
| `PX-10-T03` | حراسة UI/API/navigation حسب الدور | `middleware.ts`, `components/*`, `routes` | كل شاشة ومسار يعملان وفق bundle | ممنوع fallback permissive |
| `PX-10-T04` | قيود الخصم والاعتماد بحسب الدور | `/api/sales`, `/api/invoices/edit`, `settings` | discount limits enforced + logged | ممنوع override بلا audit |
| `PX-10-T05` | regression على Blind POS وauthority | `tests/*`, `27` | لا shadow paths جديدة | لا إغلاق قبل full security regression |

---

## PX-11 — Advanced Reports + Comparative Analytics

### الهدف التنفيذي

توسيع التقارير من baseline تشغيلية إلى تحليلات comparative قابلة للتصدير ومطابقة للأرقام المالية.

### Phase Contract

- **In Scope:** period compare, trend reports, charts, drilldowns, parity UI/export.
- **Allowed Paths:** `app/(dashboard)/reports*`, `app/api/reports/*`, `lib/reports/*`, `output/*`, `tests/*`, `25`, `03`, `17`.
- **Required Proofs:** compare/trend/drilldown تعمل, الأرقام متطابقة مع `ledger/snapshots/expenses`, export parity = Pass.
- **Stop Rules:** ممنوع استخدام read model لا يمر على totals موحدة وموثقة.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-11-T01` | عقود التقارير المتقدمة | `25`, `03` | request/response واضحة للـ compare/trends | ممنوع بناء UI بلا contract |
| `PX-11-T02` | تقارير فترة ومقارنة فترة | `app/api/reports/advanced/*`, `reports page` | month-vs-month صحيح | ممنوع تجاهل expenses في profitability |
| `PX-11-T03` | charts وvisual analytics | `components/dashboard/*`, `recharts` | charts تعمل على الهاتف واللابتوب | ممنوع كسر Device Contract |
| `PX-11-T04` | parity بين الشاشة والتصدير | `lib/reports/export.ts`, `tests/*` | totals في UI = export | ممنوع divergence غير موثق |
| `PX-11-T05` | proof مالي للتقارير المتقدمة | `scripts/*`, `tests/*` | totals تطابق `ledger/snapshots` | لا إغلاق قبل proof مالي صريح |

---

## PX-12 — Data Portability + Backup / Import

### الهدف التنفيذي

إضافة portability مدروسة وrestore drill دون الإضرار بالخصوصية أو سلامة البيئة الأساسية.

### Phase Contract

- **In Scope:** export packages, product import, backup/restore drill, audit portability.
- **Allowed Paths:** `app/api/export*`, `app/api/import*`, `app/api/restore*`, `lib/*`, `scripts/*`, `tests/*`, `18`, `25`, `27`.
- **Required Proofs:** export ناجح, import dry-run/commit آمن, restore drill معزول, audit trail مكتمل.
- **Stop Rules:** ممنوع restore على البيئة الأساسية, وممنوع export غير audited أو غير bounded.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-12-T01` | export JSON/CSV admin-only | `app/api/export/*`, `lib/*` | packages سليمة + auditable | ممنوع direct raw dump غير مضبوط |
| `PX-12-T02` | import products مع dry-run/commit | `app/api/import/products/route.ts`, `tests/*` | dry-run يكتشف الأخطاء قبل commit | ممنوع import destructive |
| `PX-12-T03` | restore drill على بيئة معزولة | `scripts/*`, infra docs | `RTO` و`drift` ضمن الهدف | ممنوع restore على production-like workspace الأساسي |
| `PX-12-T04` | audit + notifications للتصدير/الاستيراد/الاستعادة | `notifications`, `audit` | كل عملية موثقة | ممنوع عمليات portability صامتة |
| `PX-12-T05` | privacy check للحزم المحمولة | `18`, `27`, `tests/*` | لا تسرب PII غير مقصود | لا إغلاق قبل privacy proof |

---

## PX-13 — Performance + Search + Alert Aggregation

### الهدف التنفيذي

تحسين السرعة والبحث وتجميع التنبيهات دون كسر correctness أو التوافق متعدد الأجهزة.

### Phase Contract

- **In Scope:** caching للقراءات, advanced search, alert aggregation, performance proof, device regression.
- **Allowed Paths:** `app/api/search*`, `app/api/alerts*`, `lib/*`, `components/*`, `tests/*`, `17`, `27`.
- **Required Proofs:** p95 targets واضحة, cache safety مثبتة, search quality أفضل, alert noise أقل.
- **Stop Rules:** ممنوع cache على data متغيرة ماليًا بدون invalidation authority موثقة.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-13-T01` | caching آمن للقراءات الشائعة | `lib/*`, server loaders | read pages أسرع دون stale finance | ممنوع cache write routes |
| `PX-13-T02` | advanced search & filters | `app/api/search/global/route.ts`, `components/*` | نتائج أدق وأسرع | ممنوع server search بلا bounds |
| `PX-13-T03` | admin alert aggregation center | `app/api/alerts/*`, `notifications center` | التنبيهات المجمعة تعمل مع dedupe | ممنوع duplicate noisy alerts |
| `PX-13-T04` | قياس `p95` للتقارير والبحث | `tests/e2e/*`, perf scripts | targets موثقة ومجتازة | لا إغلاق بلا أرقام فعلية |
| `PX-13-T05` | multi-device regression بعد optimization | `Playwright`, `device UAT` | الهاتف/التابلت/اللابتوب تبقى سليمة | ممنوع performance fix يكسر device UX |

---

## PX-14 — V2 Release Gate

### الهدف التنفيذي

إعلان جاهزية `V2` فقط بعد اجتياز الأمن والخصوصية والـ restore والـ UAT المضافة فوق `MVP/V1`.

### Phase Contract

- **In Scope:** UAT V2, privacy/security audit, restore drill verification, Go/No-Go.
- **Allowed Paths:** `31`, `17`, `27`, `integrity_report` أو ما يقابله, تقارير الأدلة.
- **Required Proofs:** UAT V2 = Pass, privacy/security = no P0/P1, restore drill = Pass, final Go/No-Go documented.
- **Stop Rules:** ممنوع إعلان `Go` مع public privacy gap أو role/permission escalation gap أو restore drill fail.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-14-T01` | UAT شامل لـ V2 | `17`, `tests/*` | جميع UAT الجديدة = Pass | ممنوع تجاهل السيناريوهات الحرجة |
| `PX-14-T02` | security/privacy/permissions audit | `18`, `27`, `25`, `10` | لا `P0/P1` مفتوح | ممنوع Go مع privacy leak |
| `PX-14-T03` | restore/portability/communication drill | `scripts/*`, `tests/*` | drills مجتازة | ممنوع Go مع restore غير مثبت |
| `PX-14-T04` | قرار `Go/No-Go` لـ V2 | `31` | قرار موثق بالأدلة | ممنوع إغلاق دون phase review مستقل |

---

## Bundle مراجعة V2 / ما بعد `PX-07`

عند مراجعة أي Phase من `PX-08 .. PX-14`، يجب أن يتحقق المراجع من:

1. هل استُهلك carried-forward المناسب قبل البناء فوقه؟
2. هل الشريحة حافظت على:
   - Blind POS
   - API-first
   - Revoke-All-First
   - device contract
3. هل العقود المضافة في `25/18/17/27` كافية قبل التنفيذ؟
4. هل الشريحة أضافت surface تشغيلية كاملة (`DB + API + UI + Proof`) بدل تعديل جزئي؟
5. هل هناك privacy leak أو authority gap جديد؟

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

### Prompt E: Public Receipt Link (V2)
```text
Implement public receipt link flow with strict privacy constraints:
- Token must be opaque, revocable, and expirable.
- Public page is read-only.
- Never expose cost/profit/internal notes/current balances/audit metadata.
- Log generation/revocation in audit trail.
- Keep browser rendering mobile-first and printable.
```

### Prompt F: Permission Expansion (V2)
```text
Design and implement fine-grained permissions in two steps:
1. Contract package first: role model, permission bundles, route matrix, UAT, stop rules.
2. Only after approval, implement DB/API/UI guards.
Constraints:
- Preserve Blind POS.
- Preserve service_role write authority.
- No privilege escalation by default.
- Every override or discount approval must be auditable.
```

### Prompt G: Portability + Restore (V2)
```text
Implement export/import/restore features with safety-first defaults:
- Export packages are admin-only and audited.
- Import supports dry-run before commit.
- Restore drill must run in an isolated environment only.
- Privacy rules from 18_Data_Retention_Privacy.md are mandatory.
- Return machine-readable summaries for proof scripts.
```

### Prompt H: Expense Core Slice (V2)
```text
Implement expenses as the first post-V1 slice.
Constraints:
- First align create_expense with service_role + p_created_by.
- Add validation and API route before UI.
- Post expense must update ledger, snapshots, and profit reports correctly.
- Expense categories must be manageable by admin and safely readable where operationally needed.
- Provide runtime proof that total_expenses and net_profit change correctly.
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

**الإصدار:** 1.2
**تاريخ التحديث:** 10 مارس 2026
**الحالة:** Active Playbook for Build Handoff + Post-V1 Planning
