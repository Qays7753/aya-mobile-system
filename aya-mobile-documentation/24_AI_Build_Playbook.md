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

---

## المرحلة 3: ما بعد `PX-14` (Post-V2 Productization / Execution-Ready)

هذا القسم لا يبدأ التنفيذ تلقائيًا.
هو يحوّل نتائج التقارير الثلاثة إلى phases قابلة للتنفيذ بنفس صرامة `PX-01 .. PX-14`.

### قواعد إلزامية خاصة بما بعد V2

1. لا يُعاد فتح authority المالية أو DB contracts إلا إذا كان الإصلاح hardening ضروريًا ومثبتًا.
2. لا تُعامل الأحكام الذوقية وحدها كـ blockers؛ يجب دائمًا ربطها بمشكلة منتج أو استخدام أو هوية بصرية قابلة للقياس.
3. لا تُخلط مشاكل البيئة/التشغيل (`env`, `build`, `Replit`, `cron secrets`) مع مشاكل UX داخل task واحدة.
4. أي تحسين navigation أو IA يجب أن يحافظ على:
   - `Blind POS`
   - role scoping
   - device contract
   - print baseline
5. أي تحسين loading أو retry أو optimistic behavior يجب أن يبقى:
   - API-first
   - non-destructive
   - غير متناقض مع idempotency الحالية
6. لا يتم اعتماد dark mode أو product media أو motion كـ claims تصميمية إلا بعد تنفيذ فعلي واختبار devices.
7. أي hardening أمني جديد يجب أن يُثبت أنه لم يكسر:
   - public receipt links
   - cron flows
   - export/import/restore flows
8. لا يُغلق أي phase في هذا المسار قبل إثبات أن التغيير لم يُدخل regression على الهاتف/التابلت/اللابتوب.

### حزمة التحضير الإلزامية قبل أول Task بعد `PX-14`

1. اقرأ `09_Implementation_Plan.md` — قسم `Post-V2 Productization / Hardening`.
2. افتح `31_Execution_Live_Tracker.md` — قسم `Post-PX-14 Planning Package`.
3. راجع `03_UI_UX_Sitemap.md` — addendum الخاص بـ post-V2 IA.
4. راجع `17_UAT_Scenarios.md` — مجموعة `UAT-52 .. UAT-66`.
5. راجع `27_PreBuild_Verification_Matrix.md` — البوابات `VB-27 .. VB-35`.
6. طبّع أي finding جديد إلى أحد الأنواع قبل التنفيذ:
   - `Confirmed`
   - `Reframed`
   - `External / Deployment`
   - `Optional Product Scope`
   - `Resolved / Obsolete`
7. أنشئ `Task Contract` ثم نفّذ الشريحة عموديًا:
   - `UX / Contract → API/UI state changes → Proof → Review`

---

## PX-15 — User-Facing Cleanup + Product Copy Hygiene

### الهدف التنفيذي

إزالة كل ما يجعل المنتج يبدو أداة داخلية للمطورين بدل منتجًا للمستخدم، مع ضبط copy, metadata, context, وsurface semantics.

### Phase Contract

- **In Scope:** user-facing copy cleanup, metadata, page titles, role landing copy, empty states, hiding internal IDs/strings, misleading affordances review.
- **Allowed Paths:** `app/*`, `components/*`, `lib/*`, `03`, `17`, `31`, `tests/*`.
- **Required Proofs:** no internal terminology leakage, no visible `idempotency_key`, page titles/context present, empty states actionable.
- **Stop Rules:** ممنوع تغيير business behavior أثناء تنظيف النصوص؛ وممنوع حذف أي internal identifier إذا كان ما زال مطلوبًا لdebug دون إيجاد بديل داخلي آمن.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-15-T01` | إزالة `PX-*`, `baseline`, `SOP`, وdev labels من UI | `app/*`, `components/*` | grep + screenshots بدون أي مصطلح داخلي ظاهر | ممنوع حذف tracker/debug docs |
| `PX-15-T02` | إخفاء `idempotency_key` والمعرفات التشغيلية من الأسطح المرئية | `components/pos/*`, `components/dashboard/*` | لا يظهر أي `idempotency_key` أو raw IDs في UI | ممنوع كسر التدفق الفعلي |
| `PX-15-T03` | page titles + metadata + context headers + breadcrumb model | `app/*`, `metadata`, layout helpers | كل صفحة تحمل عنوانًا واضحًا وغير تقني | ممنوع metadata عامة فقط |
| `PX-15-T04` | تحسين homepage/login/empty states/role summaries | `app/page.tsx`, `app/login/*`, workspace states | surfaces أوضح للمستخدم النهائي | ممنوع لغة تنفيذية داخلية |
| `PX-15-T05` | مراجعة affordances المضللة (`barcode`, raw URLs, hidden technical hints) | `POS`, `invoices`, `notifications` | لا يوجد surface توحي بميزة غير منفذة | ممنوع claim feature غير موجودة |

---

## PX-16 — Navigation + Information Architecture + Role Experience

### الهدف التنفيذي

إعادة بناء navigation وIA لتصبح قابلة للاستخدام فعليًا على الهاتف والتابلت واللابتوب، مع فصل أوضح بين تجربة Admin وPOS.

### Phase Contract

- **In Scope:** sidebar/drawer navigation, grouping, role-aware surfaces, breadcrumbs, IA reduction للشاشات المزدحمة, global search placement.
- **Allowed Paths:** `app/(dashboard)/*`, `components/*`, `03`, `17`, `29`, `tests/e2e/*`.
- **Required Proofs:** mobile navigation usable, role-aware home flows, overcrowded screens reduced, global search discoverable.
- **Stop Rules:** ممنوع كسر access scoping أو إخفاء إجراءات حساسة بلا بديل contextual واضح.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-16-T01` | sidebar/drawer responsive مع icons وgrouping | dashboard layout/navigation components | phone/tablet/laptop navigation pass | ممنوع بقاء 14 flat links كما هي |
| `PX-16-T02` | role-aware home/navigation بين `Admin` و`POS` | dashboard home/access helpers | كل دور يرى surface أبسط وأنسب | ممنوع privilege confusion |
| `PX-16-T03` | breadcrumbs/page hierarchy واضحة | layout + page shells | user context واضح بعد كل تنقل | ممنوع عناوين غامضة |
| `PX-16-T04` | تخفيف ازدحام `invoices/inventory/notifications/reports/settings` | workspace components | lower cognitive load + actions grouped منطقيًا | ممنوع كسر workflows الحالية |
| `PX-16-T05` | global search placement + mobile IA proof | nav + notifications + search surfaces | البحث ليس مدفونًا والـ IA صالحة على 360px | ممنوع search خارج scope الصلاحيات |

---

## PX-17 — Async UX + Feedback + Action Safety

### الهدف التنفيذي

معالجة فجوات التحميل والأخطاء والتأكيدات والانتقالات حتى لا تبدو الأسطح جامدة أو صامتة أو غير آمنة.

### Phase Contract

- **In Scope:** loading skeletons, Suspense fallbacks, persistent error states, retry patterns, confirmation dialogs, router transitions, pending/offline banners.
- **Allowed Paths:** `app/*`, `components/*`, `lib/*`, `tests/*`, `17`, `27`.
- **Required Proofs:** no blank/frozen states, destructive actions confirmed, retriable failures واضحة, login/navigation no full reload.
- **Stop Rules:** ممنوع optimistic mutation على أي path مالي حساس دون proof خاص.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-17-T01` | loading skeletons + Suspense fallbacks | route segments + workspaces | كل screen critical لها loading state واضحة | ممنوع blank SSR feel |
| `PX-17-T02` | persistent error states + retry patterns | API consumers + workspace shells | الخطأ يبقى مفهومًا وقابلًا للإعادة | ممنوع toast-only handling |
| `PX-17-T03` | استبدال full reload flows بـ App Router transitions | auth/navigation flows | no `window.location.assign` in app flows | ممنوع refresh كامل غير لازم |
| `PX-17-T04` | confirmation dialogs للأفعال الحساسة | invoices/settings/portability/... | destructive flows confirmed | ممنوع destructive action بلا confirm |
| `PX-17-T05` | pending/offline/optimistic decision pass | shared async patterns | feedback أثناء التنفيذ والانقطاع واضح | ممنوع تضليل المستخدم عن حالة العملية |

---

## PX-18 — Visual System + Accessibility Refresh

### الهدف التنفيذي

رفع الواجهة من طبقة functional prototype إلى سطح بصري متسق وقابل للاستخدام الطويل، مع accessibility حقيقية.

### Phase Contract

- **In Scope:** typography, design tokens, color/spacing/shadows/radii, reusable UI states, focus-visible, labels, touch targets, dark mode, motion, table states, POS visual hierarchy.
- **Allowed Paths:** `app/globals.css`, `components/*`, `app/*`, `03`, `17`, `29`, `tests/e2e/*`.
- **Required Proofs:** visual consistency pass, accessibility/device pass, no regression on print/installability.
- **Stop Rules:** ممنوع visual refresh يكسر readability أو device contract أو print surfaces.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-18-T01` | typography حديثة + design tokens | global styles/theme helpers | خط وهوية بصرية موحدة | ممنوع مزج tokens عشوائي |
| `PX-18-T02` | reusable primitives + table/list/form states | shared components | اتساق بصري وتفاعلي واضح | ممنوع إعادة تشتت CSS الخام |
| `PX-18-T03` | visual refresh للأسطح الأساسية (`home/login/POS/reports`) | app/components core surfaces | المنتج لم يعد developer-facing بصريًا | ممنوع decorative clutter |
| `PX-18-T04` | accessibility pass | focus/aria/keyboard/touch targets | a11y UAT pass | ممنوع focus traps أو missing labels |
| `PX-18-T05` | dark mode + motion/micro-interactions + final visual proof | theme/motion layers | dark mode usable + motion controlled | ممنوع motion يضر الأداء أو القراءة |

---

## PX-19 — Security / Runtime / Deployment Hardening

### الهدف التنفيذي

إغلاق gaps الأمن والهاردننغ والتشغيل والاعتماديات والاختبار التي لا تخص UX مباشرة لكنها تمنع المنتج من أن يكون production-grade.

### Phase Contract

- **In Scope:** dependency/runtime policy, security headers, rate limiting, env policy, CRON secret hardening, client reuse, cart/runtime state hardening, route response strictness, test expansion.
- **Allowed Paths:** `package.json`, `next.config.*`, `lib/*`, `app/api/*`, `stores/*`, `tests/*`, `13`, `17`, `27`, `31`.
- **Required Proofs:** no security header gaps, rate limit proof, env/deployment policy documented, runtime/cart fixes proven, expanded test matrix.
- **Stop Rules:** ممنوع breaking changes على auth/session/public receipt/cron flows بلا staged proof.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-19-T01` | dependency/runtime audit + upgrade policy | `package.json`, lockfile, runtime docs | update policy واضحة ومختبرة | ممنوع upgrade blind |
| `PX-19-T02` | security headers + rate limiting + error sanitization | `next.config.*`, API helpers | hardening pass دون leakage | ممنوع internal detail leak |
| `PX-19-T03` | env/deployment policy + compatibility | `lib/env.ts`, deployment docs, runtime config | env gaps لا تفشل بصمت + compatibility decision موثق | ممنوع optional production secrets بلا قرار |
| `PX-19-T04` | request/client/cart/runtime hardening | `lib/api/common.ts`, `lib/supabase/*`, `stores/*`, route files | singleton/reuse/state correctness proven | ممنوع stale stock/idempotency window غير معالجة |
| `PX-19-T05` | test coverage expansion | workspace tests, formatter tests, cross-env/browser checks | UI/runtime gaps مغطاة اختباريًا | ممنوع إغلاق hardening بلا tests إضافية |

---

## PX-20 — Productization Release Gate

### الهدف التنفيذي

إعلان جاهزية ما بعد V2 فقط بعد إثبات UX, accessibility, security, deployment, and runtime hardening مجتمعة.

### Phase Contract

- **In Scope:** UX/device UAT, accessibility audit, security/runtime/deployment audit, final Go/No-Go.
- **Allowed Paths:** `31`, `17`, `27`, تقارير الأدلة فقط, وأي bugfix minimal إذا ظهر blocker موثق.
- **Required Proofs:** post-V2 UAT = Pass, accessibility/device = Pass, security/runtime/deployment = no P0/P1, final decision documented.
- **Stop Rules:** ممنوع إعلان `Go` مع technical leakage أو mobile navigation failure أو security/deployment blocker مفتوح.

| Task | الهدف | الملفات المرجحة | اختبار القبول | Stop Rules |
|------|-------|------------------|---------------|------------|
| `PX-20-T01` | UX/content/navigation UAT | `17`, `tests/*` | post-V2 UX scenarios = Pass | ممنوع تجاهل user-facing regressions |
| `PX-20-T02` | accessibility/device/visual audit | `17`, `27`, `29` | phone/tablet/laptop + a11y = Pass | ممنوع Go مع a11y blocker |
| `PX-20-T03` | security/runtime/deployment audit | `27`, `13`, `31` | no `P0/P1` findings | ممنوع Go مع hardening fail |
| `PX-20-T04` | قرار `Go/No-Go` | `31` | decision documented with evidence | ممنوع إغلاق دون phase review مستقل |

---

## Bundle مراجعة ما بعد `PX-14`

عند مراجعة أي Phase من `PX-15 .. PX-20`، يجب أن يتحقق المراجع من:

1. هل كل finding من التقارير الثلاثة تم:
   - استهلاكه
   - أو إعادة صياغته
   - أو عزله كـ external/deployment item
   - أو إغلاقه كـ obsolete؟
2. هل تحسنت الواجهة دون كسر:
   - authority الحالية
   - Device Contract
   - print/installability baselines
3. هل التحسينات البصرية والـ UX مدعومة بأدلة تشغيلية لا بأحكام ذوقية فقط؟
4. هل hardening track منفصل بوضوح عن UX track داخل التنفيذ والأدلة؟
5. هل كل claim جديد للمستخدم النهائي أصبح مدعومًا فعليًا في الكود والاختبارات؟

---

### Prompt I: User-Facing Cleanup
```text
Implement user-facing cleanup without changing business behavior.
Constraints:
- Remove internal terms like PX/baseline/SOP/idempotency_key from visible UI.
- Keep internal identifiers available only in logs/dev tooling, not end-user surfaces.
- Preserve role scoping and existing flows.
- Provide grep proof + screenshots across phone/tablet/laptop.
```

### Prompt J: Navigation + IA Refactor
```text
Refactor dashboard navigation and information architecture.
Constraints:
- Replace flat nav with grouped sidebar/drawer.
- Mobile-first behavior is mandatory.
- Add clear page titles/breadcrumbs/context.
- Reduce overcrowding in invoices/inventory/notifications/reports/settings.
- Do not break role-based visibility or Blind POS.
```

### Prompt K: Async UX + Action Safety
```text
Improve async UX safely.
Constraints:
- Add loading skeletons or Suspense fallbacks for critical workspaces.
- Add persistent error states with retry.
- Replace full reload transitions with App Router navigation.
- Add confirmation dialogs for destructive actions.
- Do not introduce optimistic writes for sensitive financial mutations unless explicitly proven safe.
```

### Prompt L: Visual System + Accessibility
```text
Introduce a coherent visual system and accessibility pass.
Constraints:
- Establish typography and design tokens first.
- Improve tables, forms, cards, and navigation states consistently.
- Add focus-visible, labels, keyboard support, and touch-target guarantees.
- Preserve print/installability/device behavior.
- Dark mode and motion are allowed only if they remain performant and readable.
```

### Prompt M: Security / Runtime / Deployment Hardening
```text
Harden runtime and deployment without reopening business authority.
Constraints:
- Add security headers and rate limiting.
- Sanitize internal errors.
- Clarify production env requirements and cron secret policy.
- Reduce redundant client creation and harden cart/runtime state.
- Expand tests for workspaces, formatters, and cross-environment behavior.
```
