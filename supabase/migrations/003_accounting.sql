-- ============================================================
-- آية موبايل — المرحلة المحاسبية (003_accounting.sql)
-- المرجع: 05_Database_Design.md (الإصدار المُعتمد)
-- التاريخ: 23 فبراير 2026
-- يعتمد على: 001_foundation.sql, 002_operations.sql
-- ============================================================
-- هذا الملف يُنشئ:
--   8 جداول تمثل القلب المحاسبي والتدقيقي للنظام:
--   القيود المحاسبية، الديون، التسديدات، التسويات،
--   اللقطات اليومية، سجل التدقيق، والإشعارات.
--
--   ⚠️ قواعد هندسية حرجة:
--     • APPEND-ONLY: جدولا ledger_entries و audit_logs لا يقبلان
--       UPDATE أو DELETE مطلقاً. التصحيح = قيد عكسي جديد.
--       (سيُقفل هذا بالكامل في 005_rls_security.sql)
--     • POLYMORPHIC FK: ledger_entries.reference_id و audit_logs.record_id
--       بدون FOREIGN KEY مقيد — يشيران لجداول مختلفة.
--       الحماية عبر Soft Delete (ADR-034) وليس FK.
--     • entry_date = CURRENT_DATE دائماً (ADR-034: لا Backdating)
--     • FIFO: في debt_payment_allocations — التسديد يُطبق على الأقدم أولاً
-- ============================================================


-- ┌─────────────────────────────────────────────┐
-- │  القيود المحاسبية (القلب المالي)             │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 22: ledger_entries (القيود المحاسبية)
-- ─────────────────────────────────────────────
-- 🔴 APPEND-ONLY: يُمنع منعاً باتاً تنفيذ UPDATE أو DELETE
--    على هذا الجدول. أي تصحيح لخطأ سابق يتم عبر إدخال
--    قيد عكسي (reversal) جديد بتاريخ اللحظة الحالية.
--    (سيُقفل في 005_rls_security.sql عبر RLS Policies)
--
-- reference_type و reference_id: علاقة متعددة الأشكال
-- (Polymorphic FK) — لا يوجد FOREIGN KEY مقيد عليهما.
-- reference_id قد يشير لـ: invoices, returns, expenses,
-- transfers, topups, purchase_orders, debt_payments,
-- maintenance_jobs, supplier_payments, reconciliation_entries.
-- الحماية: عبر Soft Delete في الجداول المصدرية (لا حذف فعلي).
--
-- entry_date (DATE) = CURRENT_DATE دائماً — لا Backdating.
-- created_at (TIMESTAMPTZ) = لحظة الإدخال الفعلية.
--
-- adjustment_direction: مطلوب فقط إذا entry_type = 'adjustment'.
-- يحدد اتجاه التسوية: 'increase' (إضافة) أو 'decrease' (خصم).

CREATE TABLE ledger_entries (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date            DATE           NOT NULL DEFAULT CURRENT_DATE,
  account_id            UUID           NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  entry_type            ledger_entry_type NOT NULL,
  amount                DECIMAL(12,3)  NOT NULL CHECK (amount > 0),
  adjustment_direction  VARCHAR(10),
  reference_type        VARCHAR(50),
  reference_id          UUID,
  description           VARCHAR(255)   NOT NULL,
  created_at            TIMESTAMPTZ    NOT NULL DEFAULT now(),
  created_by            UUID           NOT NULL REFERENCES profiles(id),

  -- قيد: adjustment_direction إلزامي فقط مع adjustment ومحظور مع غيره
  CONSTRAINT chk_adjustment_direction CHECK (
    (entry_type = 'adjustment' AND adjustment_direction IN ('increase', 'decrease'))
    OR (entry_type <> 'adjustment' AND adjustment_direction IS NULL)
  ),

  -- قيد: reference_type يجب أن يكون من القائمة المعتمدة
  CONSTRAINT chk_reference_type CHECK (
    reference_type IS NULL
    OR reference_type IN (
      'invoice', 'return', 'debt_payment', 'topup', 'transfer',
      'expense', 'reconciliation', 'purchase', 'manual_debt',
      'supplier_payment', 'maintenance_job', 'reversal'
    )
  )
);

-- الفهارس
CREATE INDEX idx_ledger_entries_date      ON ledger_entries(entry_date);
CREATE INDEX idx_ledger_entries_account   ON ledger_entries(account_id);
CREATE INDEX idx_ledger_entries_type      ON ledger_entries(entry_type);
CREATE INDEX idx_ledger_entries_reference ON ledger_entries(reference_type, reference_id);

COMMENT ON TABLE ledger_entries IS
  '🔴 APPEND-ONLY — يُمنع منعاً باتاً تنفيذ UPDATE أو DELETE. '
  'أي تصحيح = قيد عكسي جديد. reference_type/reference_id: '
  'علاقة Polymorphic بدون FK — الحماية عبر Soft Delete. '
  'entry_date = CURRENT_DATE دائماً (ADR-034).';


-- ┌─────────────────────────────────────────────┐
-- │  جداول الديون والتحصيل                       │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 23: debt_entries (قيود الديون)
-- ─────────────────────────────────────────────
-- يمثل كل قيد ديناً واحداً على عميل (من فاتورة أو يدوي).
-- remaining_amount يتناقص مع كل تسديد عبر debt_payment_allocations.
-- is_paid يتحول إلى true عندما remaining_amount = 0.
-- due_date يُحسب: invoice_date + debt_customer.due_date_days.

CREATE TABLE debt_entries (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_customer_id UUID          NOT NULL REFERENCES debt_customers(id) ON DELETE RESTRICT,
  entry_type       debt_entry_type NOT NULL,
  invoice_id       UUID          REFERENCES invoices(id) ON DELETE SET NULL,
  amount           DECIMAL(12,3) NOT NULL CHECK (amount > 0),
  due_date         DATE          NOT NULL,
  description      VARCHAR(255),
  is_paid          BOOLEAN       NOT NULL DEFAULT false,
  paid_amount      DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (paid_amount >= 0),
  remaining_amount DECIMAL(12,3) NOT NULL,
  idempotency_key  UUID,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_by       UUID          NOT NULL REFERENCES profiles(id),

  -- قيد: paid_amount لا يتجاوز amount
  CONSTRAINT chk_paid_not_exceed CHECK (paid_amount <= amount),
  -- قيد: remaining_amount = amount - paid_amount
  CONSTRAINT chk_remaining_amount CHECK (remaining_amount = amount - paid_amount),
  -- قيد: في الدين اليدوي يجب تمرير idempotency_key
  CONSTRAINT chk_manual_debt_idempotency_required CHECK (
    entry_type <> 'manual' OR idempotency_key IS NOT NULL
  ),
  CONSTRAINT uq_debt_entries_idempotency UNIQUE (idempotency_key)
);

-- الفهارس
CREATE INDEX idx_debt_entries_customer ON debt_entries(debt_customer_id);
CREATE INDEX idx_debt_entries_due_date ON debt_entries(due_date);
CREATE INDEX idx_debt_entries_is_paid  ON debt_entries(is_paid);
CREATE INDEX idx_debt_entries_invoice  ON debt_entries(invoice_id);

-- تحديث updated_at تلقائياً
CREATE TRIGGER trg_debt_entries_updated_at
  BEFORE UPDATE ON debt_entries
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

COMMENT ON TABLE debt_entries IS 'قيود الديون. remaining_amount = amount - paid_amount. يدعم FIFO عبر due_date.';


-- ─────────────────────────────────────────────
-- جدول 24: debt_payments (تسديدات الديون)
-- ─────────────────────────────────────────────
-- يمثل كل صف عملية تسديد واحدة من عميل دين.
-- يُخصم من debt_customer.current_balance.
-- يُوزع على debt_entries عبر debt_payment_allocations (FIFO).
-- receipt_number يُولّد بصيغة AYA-YYYY-NNNNN.
-- whatsapp_sent يَتتبع إن أُرسل إيصال واتساب.

CREATE TABLE debt_payments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  debt_customer_id UUID          NOT NULL REFERENCES debt_customers(id) ON DELETE RESTRICT,
  amount           DECIMAL(12,3) NOT NULL CHECK (amount > 0),
  account_id       UUID          NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  payment_date     DATE          NOT NULL DEFAULT CURRENT_DATE,
  receipt_number   VARCHAR(30)   NOT NULL UNIQUE,
  notes            VARCHAR(255),
  whatsapp_sent    BOOLEAN       NOT NULL DEFAULT false,
  receipt_url      VARCHAR(255),
  idempotency_key  UUID          UNIQUE,
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_by       UUID          NOT NULL REFERENCES profiles(id)
);

-- الفهارس
CREATE INDEX idx_debt_payments_customer ON debt_payments(debt_customer_id);
CREATE INDEX idx_debt_payments_date     ON debt_payments(payment_date);
CREATE INDEX idx_debt_payments_account  ON debt_payments(account_id);

COMMENT ON TABLE debt_payments IS 'تسديدات ديون العملاء. يُوزع على debt_entries عبر FIFO. receipt_number بصيغة AYA-YYYY-NNNNN.';


-- ─────────────────────────────────────────────
-- جدول 25: debt_payment_allocations (توزيع التسديد)
-- ─────────────────────────────────────────────
-- يُحدد أي دين بالتحديد سُدّد من كل دفعة.
-- يدعم سياسة FIFO: التسديد يُطبّق على الدين الأقدم (MIN(due_date))
-- حتى يصفر ثم يُوزّع على الدين التالي.
-- SUM(allocated_amount) لكل payment_id يجب أن يساوي debt_payments.amount.

CREATE TABLE debt_payment_allocations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id       UUID          NOT NULL REFERENCES debt_payments(id) ON DELETE CASCADE,
  debt_entry_id    UUID          NOT NULL REFERENCES debt_entries(id) ON DELETE RESTRICT,
  allocated_amount DECIMAL(12,3) NOT NULL CHECK (allocated_amount > 0)
);

-- الفهارس
CREATE INDEX idx_dpa_payment    ON debt_payment_allocations(payment_id);
CREATE INDEX idx_dpa_debt_entry ON debt_payment_allocations(debt_entry_id);

COMMENT ON TABLE debt_payment_allocations IS 'توزيع التسديد على الديون بسياسة FIFO (الأقدم أولاً).';


-- ┌─────────────────────────────────────────────┐
-- │  التسويات والمراجعة                          │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 26: reconciliation_entries (تسويات الحسابات)
-- ─────────────────────────────────────────────
-- يمثل عملية مطابقة بين الرصيد النظامي والفعلي لحساب.
-- expected_balance يُحسب: accounts.opening_balance + SUM(ledger_entries).
-- actual_balance يُدخله المستخدم بالعد المادي.
-- difference = actual_balance - expected_balance.
-- is_resolved = true إذا تم تفسير/حل الفرق.

CREATE TABLE reconciliation_entries (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reconciliation_date  DATE          NOT NULL DEFAULT CURRENT_DATE,
  account_id           UUID          NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  expected_balance     DECIMAL(12,3) NOT NULL,
  actual_balance       DECIMAL(12,3) NOT NULL CHECK (actual_balance >= 0),
  difference           DECIMAL(12,3) NOT NULL,
  difference_reason    VARCHAR(255)  NOT NULL,
  is_resolved          BOOLEAN       NOT NULL DEFAULT false,
  created_at           TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_by           UUID          NOT NULL REFERENCES profiles(id),

  -- قيد: difference يُحسب تلقائياً
  CONSTRAINT chk_difference CHECK (difference = actual_balance - expected_balance)
);

-- الفهارس
CREATE INDEX idx_reconciliation_date    ON reconciliation_entries(reconciliation_date);
CREATE INDEX idx_reconciliation_account ON reconciliation_entries(account_id);

COMMENT ON TABLE reconciliation_entries IS 'تسويات الحسابات. difference = actual - expected. is_resolved يُتتبع حالة الفرق.';


-- ─────────────────────────────────────────────
-- جدول 27: daily_snapshots (اللقطات اليومية)
-- ─────────────────────────────────────────────
-- ملخص مالي يومي يُحفظ عند الطلب (OP-24: Soft Close).
-- لقطة واحدة فقط لكل يوم في MVP (Natural-Key Idempotency).
-- accounts_snapshot يحفظ أرصدة جميع الحسابات لحظة اللقطة.
-- لا يمنع التعديل على العمليات بعد اللقطة (Soft Close فقط).

CREATE TABLE daily_snapshots (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date         DATE          NOT NULL DEFAULT CURRENT_DATE,
  idempotency_key       UUID,
  total_sales           DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (total_sales >= 0),
  total_returns         DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (total_returns >= 0),
  total_cost            DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (total_cost >= 0),
  gross_profit          DECIMAL(12,3) NOT NULL DEFAULT 0,
  net_sales             DECIMAL(12,3) NOT NULL DEFAULT 0,
  invoice_count         INTEGER       NOT NULL DEFAULT 0 CHECK (invoice_count >= 0),
  return_count          INTEGER       NOT NULL DEFAULT 0 CHECK (return_count >= 0),
  total_debt_added      DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (total_debt_added >= 0),
  total_debt_collected  DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (total_debt_collected >= 0),
  total_expenses        DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (total_expenses >= 0),
  total_purchases       DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (total_purchases >= 0),
  net_profit            DECIMAL(12,3) NOT NULL DEFAULT 0,
  accounts_snapshot     JSONB,
  notes                 TEXT,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_by            UUID          NOT NULL REFERENCES profiles(id),

  -- قيد: snapshot_date لا يكون مستقبلياً
  CONSTRAINT chk_snapshot_date CHECK (snapshot_date <= CURRENT_DATE),
  CONSTRAINT uq_daily_snapshots_snapshot_date UNIQUE (snapshot_date),
  -- قيد: net_sales = total_sales - total_returns
  CONSTRAINT chk_net_sales CHECK (net_sales = total_sales - total_returns),
  -- قيد: الأرباح التشغيلية والصافية
  CONSTRAINT chk_gross_profit CHECK (gross_profit = net_sales - total_cost),
  CONSTRAINT chk_net_profit CHECK (net_profit = gross_profit - total_expenses)
);

-- الفهارس
CREATE INDEX idx_daily_snapshots_date       ON daily_snapshots(snapshot_date);
CREATE INDEX idx_daily_snapshots_created_at ON daily_snapshots(created_at);

COMMENT ON TABLE daily_snapshots IS 'اللقطات اليومية (Soft Close). لقطة واحدة لكل يوم في MVP (Natural-Key على snapshot_date). accounts_snapshot = JSONB بأرصدة الحسابات.';


-- ┌─────────────────────────────────────────────┐
-- │  التدقيق والإشعارات                          │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 28: audit_logs (سجل التدقيق)
-- ─────────────────────────────────────────────
-- 🔴 APPEND-ONLY: يُمنع منعاً باتاً تنفيذ UPDATE أو DELETE
--    على هذا الجدول. هذا هو السجل الرقابي النهائي الذي لا يُمس.
--    أي محاولة UPDATE أو DELETE ستُرفض عبر RLS Policies
--    (سيُقفل في 005_rls_security.sql).
--
-- record_id: علاقة Polymorphic — بدون FK مقيد.
-- table_name + record_id معاً يحددان السجل المتأثر.
-- old_values و new_values: JSONB يحتوي القيم قبل/بعد التعديل.
--
-- INSERT يتم حصراً عبر SECURITY DEFINER functions/triggers.
-- لا يمكن لأي مستخدم INSERT مباشرة (C-03 Fix).

CREATE TABLE audit_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_timestamp  TIMESTAMPTZ    NOT NULL DEFAULT now(),
  user_id           UUID           REFERENCES profiles(id) ON DELETE SET NULL,
  action_type       VARCHAR(50)    NOT NULL,
  table_name        VARCHAR(50)    NOT NULL,
  record_id         UUID           NOT NULL,
  old_values        JSONB,
  new_values        JSONB,
  description       VARCHAR(255)   NOT NULL,
  ip_address        VARCHAR(45),
  user_agent        VARCHAR(255),
  session_id        UUID
);

-- الفهارس
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(action_timestamp);
CREATE INDEX idx_audit_logs_user      ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action    ON audit_logs(action_type);
CREATE INDEX idx_audit_logs_table     ON audit_logs(table_name, record_id);

COMMENT ON TABLE audit_logs IS
  '🔴 APPEND-ONLY — يُمنع منعاً باتاً تنفيذ UPDATE أو DELETE. '
  'هذا السجل الرقابي النهائي ولا يُمس. INSERT عبر SECURITY DEFINER فقط. '
  'record_id: Polymorphic بدون FK — table_name + record_id يحددان السجل.';


-- ─────────────────────────────────────────────
-- جدول 29: notifications (الإشعارات الداخلية)
-- ─────────────────────────────────────────────
-- إشعارات داخلية تُرسل للمستخدمين (Admin أو POS).
-- reference_type + reference_id: علاقة Polymorphic
-- للربط بالسجل المسبب للإشعار.
-- is_read يُحدّث عند قراءة الإشعار.
-- user_id ON DELETE CASCADE: إذا حُذف المستخدم تُحذف إشعاراته.

CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID           NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type            VARCHAR(50)    NOT NULL,
  title           VARCHAR(255)   NOT NULL,
  body            TEXT           NOT NULL,
  is_read         BOOLEAN        NOT NULL DEFAULT false,
  reference_type  VARCHAR(50),
  reference_id    UUID,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),

  -- قيد: type يجب أن يكون من القائمة المعتمدة
  CONSTRAINT chk_notification_type CHECK (
    type IN (
      'debt_limit_exceeded',
      'large_discount',
      'retroactive_edit',
      'reconciliation_difference',
      'low_stock',
      'invoice_cancelled',
      'daily_snapshot',
      'debt_due_reminder',
      'debt_overdue'
    )
  )
);

-- الفهارس
CREATE INDEX idx_notifications_user    ON notifications(user_id);
CREATE INDEX idx_notifications_read    ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type    ON notifications(type);
CREATE INDEX idx_notifications_created ON notifications(created_at);

-- تحديث updated_at تلقائياً
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

COMMENT ON TABLE notifications IS 'إشعارات داخلية. 9 أنواع (تجاوز حد دين، خصم كبير، مخزون منخفض...). reference Polymorphic.';


-- ============================================================
-- ✅ نهاية المرحلة المحاسبية
-- ============================================================
-- اختبار هذه المرحلة:
--   1. التأكد من إنشاء جميع الجداول الـ 8 بنجاح
--   2. إدخال قيد محاسبي يدوي في ledger_entries والتأكد من:
--      a. entry_date = CURRENT_DATE تلقائياً
--      b. adjustment_direction مطلوب مع adjustment فقط
--      c. reference_type من القائمة المعتمدة
--   3. محاولة UPDATE على ledger_entries → يجب أن يُرفض (بعد RLS)
--   4. إدخال دين ومحاولة تسديد جزئي:
--      a. debt_entry.remaining_amount ينقص
--      b. debt_payment_allocations ينجح
--      c. chk_remaining_amount يُنفّذ
--   5. إنشاء لقطة يومية والتأكد من chk_net_sales
--   6. إنشاء تسوية والتأكد من chk_difference
--   7. إدخال audit_log والتأكد من أن UPDATE يُرفض (بعد RLS)
--   8. إنشاء إشعار والتأكد من chk_notification_type
-- ============================================================

-- ============================================================
-- Upgrade Compatibility (existing databases)
-- ============================================================
DO $$
BEGIN
  -- debt_entries: keep a single unique idempotency constraint with canonical name.
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'debt_entries'
      AND c.conname = 'debt_entries_idempotency_key_key'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'debt_entries'
      AND c.conname = 'uq_debt_entries_idempotency'
  ) THEN
    ALTER TABLE debt_entries
      RENAME CONSTRAINT debt_entries_idempotency_key_key TO uq_debt_entries_idempotency;
  END IF;

  -- debt_entries: manual debt command requires idempotency_key.
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'debt_entries'
      AND c.conname = 'chk_manual_debt_idempotency_required'
  ) THEN
    ALTER TABLE debt_entries
      ADD CONSTRAINT chk_manual_debt_idempotency_required CHECK (
        entry_type <> 'manual' OR idempotency_key IS NOT NULL
      );
  END IF;

  -- daily_snapshots: drop legacy idempotency unique and enforce one snapshot per day.
  IF EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'daily_snapshots'
      AND c.conname = 'daily_snapshots_idempotency_key_key'
  ) THEN
    ALTER TABLE daily_snapshots
      DROP CONSTRAINT daily_snapshots_idempotency_key_key;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'daily_snapshots'
      AND c.conname = 'uq_daily_snapshots_snapshot_date'
  ) THEN
    ALTER TABLE daily_snapshots
      ADD CONSTRAINT uq_daily_snapshots_snapshot_date UNIQUE (snapshot_date);
  END IF;
END $$;
