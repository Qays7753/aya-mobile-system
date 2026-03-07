# آية موبايل - Documentation Governance Remediation Package
## 30) P0 Authority Closure (V-01..V-05)

---

## A) Remediation Report (نهائي)

### Executive Summary

- **قرار المراجعة بعد الإغلاق:** **Go** (جاهز لبدء التنفيذ من ناحية التوثيق).
- **سبب القرار:** تم إغلاق كل مخالفات `P0` (`V-01..V-05`) بقرارات مرجعية واحدة (authoritative) مع توحيد المراجع المتقاطعة وإزالة مسارات "multiple operational truth" من الوثائق.
- **إثبات إضافي:** فحص النزاهة التوثيقية (`doc_integrity_check.py`) عاد بنتيجة `15/15` وحالة `READY` بعد الإغلاق.
- **ما تبقى:** لا توجد مخالفات `P0` مفتوحة توثيقيًا. المخاطر المتبقية تشغيلية طبيعية وتُدار عبر Gate Package.

### جدول P0 Closure Proof

| Violation | Decision (Authoritative) | Updated References | Residual Risk |
|----------|---------------------------|--------------------|---------------|
| `V-01` Backdating | **Strictly forbidden** (`LOCK-NoBackdate`) | `01:236-247, 486, 505` + `04:583, 663-671, 1421-1448` + `08:396, 409, 499, 679` + `10:473-484, 516-526` | `0` |
| `V-02` Drift Authority | Canonical set فقط: `fn_verify_balance_integrity()` + `POST /api/health/balance-check` + `POST /api/cron/balance-check` | `13:431-441` + `25:68-73, 386-389` + `22:140-149` + `15:513` + `05:1731` | `0` |
| `V-03` Suppliers RLS | لا direct table read على `suppliers` من `authenticated` (Admin/POS). Admin عبر `admin_suppliers` View/API وPOS عبر API-only limited fields | `05:631-635, 1694` + `18:73, 75-85` | `0` |
| `V-04` Idempotency | `create_debt_manual` = **Required** key; `create_daily_snapshot` = **Natural-Key** (`UNIQUE(snapshot_date)`) under **Single-Branch** assumption | `05:463-485, 1093-1102` + `13:800-815` + `15:295-307, 351-357` + `16:168` + `25:79-82, 275-294` + `10:465-468, 616` | `0` |
| `V-05` Device/Channel | Contract موحد: phone/tablet/laptop/desktop + browsers latest-2 + installability ضمن MVP | `29:27-34, 53-55` + `01:106-110` + `11:194-205` + `13:59-86` + `22:261-271` + `README:18-20` | `0` |

---

## B) Doc Patch List (Copy-ready)

### DOC-PATCH-001 Backdating

- **PRE (متعارض):**
  - `[04_Core_Flows.md]` قسم Sales History: `line 583` كان يسمح بوسم "أثر رجعي".
  - `[08_SOPs.md]` SOP-26: `line 679` كان يسمح بتعديل التاريخ حتى 7 أيام.
  - `[01_Overview_Assumptions.md]` جدول Audit/Risk: `lines 486, 505` كانت تشير لصياغة تعديل بأثر رجعي.
- **DECISION (Canonical):**
  - `invoice_date / entry_date / snapshot_date = CURRENT_DATE` فقط، وأي تصحيح عبر `adjustment` بتاريخ اليوم.
- **APPLY (تم التعديل):**
  - `01:486,505`، `04:583`، `08:396,499,679`، `10:516` (عنوان ADR-037 متسق مع No Backdating).
- **POST (التحقق):**
  - لا يوجد نص تشغيلي فعال يسمح بتعديل التاريخ اليدوي أو backdating.

### DOC-PATCH-002 Drift Authority

- **PRE (متعارض):**
  - تعدد أسماء function/route/job للفحص (drift authority split).
- **DECISION (Canonical):**
  - Job: `T-10 Balance Integrity Daily`
  - Route (Admin): `POST /api/health/balance-check`
  - Route (Cron): `POST /api/cron/balance-check`
  - RPC: `fn_verify_balance_integrity()`
  - Alert: `notifications.type='reconciliation_difference'`
- **APPLY (تم التعديل):**
  - `13:431-441`، `25:68-73`، `22:140-149`، `15:513`، `05:1731`.
- **POST (التحقق):**
  - الأسماء البديلة موثقة كـ deprecated aliases فقط، وليست authority فعالة.

### DOC-PATCH-003 Suppliers RLS

- **PRE (متعارض):**
  - تضارب حول إمكانية قراءة POS المباشرة لجدول `suppliers`.
- **DECISION (Canonical):**
  - لا direct table read على `suppliers` من المتصفح (`authenticated`) لأي دور.
  - Admin يقرأ عبر `admin_suppliers` View أو API.
  - أي احتياج تشغيلي POS يمر عبر API بحد أدنى للحقول (`id`, `name`, `is_active`).
- **APPLY (تم التعديل):**
  - `05:631-635, 1694` + `18:75-85`.
- **POST (التحقق):**
  - لا يوجد contract يمنح POS direct table read على `suppliers`.

### DOC-PATCH-004 Idempotency

- **PRE (متعارض):**
  - فجوة بين schema/contracts/errors في `create_debt_manual` و`create_daily_snapshot`.
- **DECISION (Canonical):**
  - `create_debt_manual`: `idempotency_key` **Required**.
  - `create_daily_snapshot`: **Natural-Key Idempotency** عبر `UNIQUE(snapshot_date)`.
- **APPLY (تم التعديل):**
  - Schema: `05:463-485, 1093-1102`
  - ADR/Policy: `10:465-468, 616`, `13:800-815`
  - Functions: `15:295-307, 351-357`
  - API/Errors: `25:79-82, 275-294`, `16:168`
- **POST (التحقق):**
  - لا وجود لـ `ERR_IDEMPOTENCY` ضمن `GenerateDailySnapshot`، والـ authority متسقة بين كل المراجع.

### DOC-PATCH-005 Device Contract

- **PRE (متعارض):**
  - تفاوت في نطاق الأجهزة/القنوات بين المراجع.
- **DECISION (Canonical):**
  - Web App يدعم: phone/tablet/laptop/desktop.
  - Browsers: `Chrome/Edge/Safari/Firefox` (Latest-2).
  - Installability/PWA ضمن نطاق MVP (بدون Offline transactions).
- **APPLY (تم التعديل):**
  - مصدر authority: `29_Device_Browser_Policy.md`
  - Alignment refs: `01`, `11`, `13`, `22`, `README`.
- **POST (التحقق):**
  - لا يوجد نص فعّال يحصر النظام بـ Chrome-only أو Tablet/Desktop only.

---

## C) A-Mobile Locks (A1-style) — Final

| Lock | Rule | What Counts as Regression | Enforced In |
|------|------|---------------------------|-------------|
| `LOCK-NoBackdate` | جميع تواريخ العمليات المالية = `CURRENT_DATE` فقط | أي نص يسمح بتاريخ سابق أو تعديل تاريخ يدوي | `10 (ADR-046/034)`, `01`, `04`, `05`, `08`, `13`, `15` |
| `LOCK-DriftAuthority` | drift check عبر `fn_verify_balance_integrity()` فقط | أي authority بديلة function/route/job | `10`, `13`, `15`, `22`, `25`, `05`, `03` |
| `LOCK-Suppliers-RLS` | لا direct table read على `suppliers` من `authenticated` (Admin/POS) | أي منح direct read على `suppliers` من المتصفح | `10`, `05`, `18`, `13` |
| `LOCK-IdempotencyAuthority` | سياسة idempotency واحدة لكل command | اختلاف policy بين schema/contracts/error-matrix | `10`, `05`, `13`, `15`, `16`, `25` |
| `LOCK-DeviceContract` | دعم phone/tablet/laptop/desktop + installability ضمن MVP | Chrome-only أو إسقاط جهاز/قناة من العقد | `10`, `29`, `01`, `11`, `13`, `22`, `README` |
| `LOCK-SINGLE-BRANCH` | Single-Branch is authoritative for MVP; `daily_snapshots` uses `UNIQUE(snapshot_date)` as natural key | Any `branch_id`/`tenant_id` addition or natural-key change without an ADR expansion decision | `10`, `05`, `13`, `25`, `27` |
---

## D) Gate Package (Pre-Execution)

### Checklist

| Gate Item | Must Pass | Proof Source |
|----------|-----------|--------------|
| `G-01` Backdating lock | Yes | `01/04/08/10/15` |
| `G-02` Drift canonical naming | Yes | `13/22/25/15/05` |
| `G-03` Suppliers RLS unified | Yes | `05/18` |
| `G-04` Idempotency unified | Yes | `05/10/13/15/16/25` |
| `G-05` Device contract unified | Yes | `29/01/11/13/22/README` |
| `G-06` Tracker evidence complete | Yes | `23` (`TRK-037..TRK-042`) |
| `G-07` Verification matrix updated | Yes | `27` (`GP-01..GP-08`) |
| `G-08` Single-Branch lock unified | Yes | `10/05/13/25/27/30` |
### Required Proofs (توثيقية الآن، تنفيذية لاحقًا)

1. Cross-reference scan يثبت غياب أي authority ثانية لكل محور (`V-01..V-05`).
2. Gate matrix محدث مع stop rules مرتبطة بالـ locks.
3. Tracker entries رسمية لكل إغلاق P0 مع ملفات التعديل.
4. Remediation package منشور كوثيقة تسليم قبل بدء الكود.

### Stop Rules (ملزمة)

1. Any failure in `G-01..G-05` = **No-Go**.
2. Any conflicting dual behavior for the same authority point = **No-Go**.
3. Any idempotency mismatch between schema/contracts/errors = **No-Go**.
4. Any direct POS read on `suppliers` or sensitive financial tables = **No-Go**.
5. Any Multi-Branch/Multi-Tenant expansion without an ADR expansion decision = **No-Go**.
6. Missing evidence updates in `23` or `27` = **No-Go**.

---

## Final Review Decision

**Go** — تم إغلاق `V-01..V-05` توثيقيًا مع authority واحدة لكل محور، ولا يوجد تعارض P0 مانع متبقٍ في الوثائق.

---

**الإصدار:** 1.0  
**تاريخ الإصدار:** 5 مارس 2026  
**الحالة:** Final P0 Remediation Package (Documentation-Only)

