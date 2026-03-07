-- ============================================================
-- آية موبايل — المرحلة التشغيلية (002_operations.sql)
-- المرجع: 05_Database_Design.md (الإصدار المُعتمد)
-- التاريخ: 23 فبراير 2026
-- يعتمد على: 001_foundation.sql
-- ============================================================
-- هذا الملف يُنشئ:
--   الجداول التشغيلية الـ 14 التي تمثل العمليات اليومية:
--   المبيعات، المرتجعات، المشتريات، المصروفات،
--   الصيانة، الشحن، التحويلات، والجرد.
--
--   ⚠️ قواعد هندسية:
--     • ON DELETE RESTRICT على كل FK مالي (لمنع حذف حساب مرتبط بحركات)
--     • idempotency_key UNIQUE على كل جدول حركة مالية/تشغيلية
--     • returned_quantity في invoice_items للمرتجعات الجزئية
--     • invoice_date = CURRENT_DATE دائماً (ADR-034: لا Backdating)
--     • لا باركود، لا IMEI — البيع بالحبة (بحث بالاسم/التصنيف)
-- ============================================================


-- ┌─────────────────────────────────────────────┐
-- │  جداول المبيعات والفواتير                    │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 8: invoices (الفواتير)
-- ─────────────────────────────────────────────
-- الفاتورة هي الوثيقة الرسمية لعملية البيع.
-- invoice_date يُعبأ تلقائياً بـ CURRENT_DATE (لا Backdating).
-- الحذف ممنوع — يُستخدم الإلغاء (status = 'cancelled') مع سبب إلزامي.
-- debt_customer_id يُملأ فقط إذا كان جزء من المبلغ بالآجل.

CREATE TABLE invoices (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number    VARCHAR(30)    NOT NULL UNIQUE,
  invoice_date      DATE           NOT NULL DEFAULT CURRENT_DATE,
  customer_name     VARCHAR(100),
  customer_phone    VARCHAR(20),
  subtotal          DECIMAL(12,3)  NOT NULL CHECK (subtotal >= 0),
  discount_amount   DECIMAL(12,3)  NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  discount_by       UUID           REFERENCES profiles(id),
  total_amount      DECIMAL(12,3)  NOT NULL CHECK (total_amount >= 0),
  debt_amount       DECIMAL(12,3)  NOT NULL DEFAULT 0 CHECK (debt_amount >= 0),
  debt_customer_id  UUID           REFERENCES debt_customers(id) ON DELETE RESTRICT,
  status            invoice_status NOT NULL DEFAULT 'active',
  cancel_reason     VARCHAR(500),
  cancelled_by      UUID           REFERENCES profiles(id),
  cancelled_at      TIMESTAMPTZ,
  pos_terminal_code VARCHAR(20),
  notes             TEXT,
  idempotency_key   UUID           UNIQUE,
  created_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
  created_by        UUID           NOT NULL REFERENCES profiles(id)
);

-- الفهارس
CREATE INDEX idx_invoices_date         ON invoices(invoice_date);
CREATE INDEX idx_invoices_status       ON invoices(status);
CREATE INDEX idx_invoices_created_by   ON invoices(created_by);
CREATE INDEX idx_invoices_customer     ON invoices(debt_customer_id);
CREATE INDEX idx_invoices_pos_terminal ON invoices(pos_terminal_code);
CREATE INDEX idx_invoices_created_at   ON invoices(created_at);

-- تحديث updated_at تلقائياً
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

COMMENT ON TABLE invoices IS 'الفواتير. invoice_date = CURRENT_DATE دائماً. Soft Delete عبر status=cancelled. لا حذف فعلي.';


-- ─────────────────────────────────────────────
-- جدول 9: invoice_items (بنود الفاتورة)
-- ─────────────────────────────────────────────
-- يمثل كل صف منتجاً واحداً في الفاتورة.
-- unit_price يُسحب من products.sale_price سيرفرياً عند البيع (ADR-043).
-- cost_price_at_time يُلتقط لحظة البيع لحساب الأرباح لاحقاً — COALESCE(cost_price, 0) (BP-02).
-- product_name_at_time يُحفظ لحماية اسم المنتج حتى لو تغيّر لاحقاً.
-- returned_quantity يُحدَّث عند كل مرتجع جزئي ليسهل على الواجهة
--   معرفة الكمية المتبقية القابلة للإرجاع (quantity - returned_quantity).

CREATE TABLE invoice_items (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id           UUID           NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  product_id           UUID           NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  product_name_at_time VARCHAR(200)   NOT NULL,
  quantity             INTEGER        NOT NULL CHECK (quantity > 0),
  unit_price           DECIMAL(12,3)  NOT NULL CHECK (unit_price >= 0),
  cost_price_at_time   DECIMAL(12,3)  NOT NULL DEFAULT 0,
  discount_percentage  DECIMAL(5,2)   NOT NULL DEFAULT 0
                         CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount      DECIMAL(12,3)  NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_price          DECIMAL(12,3)  NOT NULL CHECK (total_price >= 0),
  returned_quantity    INTEGER        NOT NULL DEFAULT 0 CHECK (returned_quantity >= 0),
  is_returned          BOOLEAN        NOT NULL DEFAULT false,
  -- قيد: الكمية المُرتجعة لا تتجاوز الكمية المباعة
  CONSTRAINT chk_returned_qty CHECK (returned_quantity <= quantity)
);

-- الفهارس
CREATE INDEX idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX idx_invoice_items_product ON invoice_items(product_id);

COMMENT ON TABLE invoice_items IS 'بنود الفاتورة. returned_quantity يُتابع المرتجعات الجزئية. السعر يُسحب سيرفرياً (ADR-043).';


-- ─────────────────────────────────────────────
-- جدول 10: payments (المدفوعات)
-- ─────────────────────────────────────────────
-- يمثل كل صف دفعة واحدة ضمن فاتورة (البيع قد يكون مختلط الدفع).
-- fee_amount يُحسب سيرفرياً بناءً على accounts.fee_percentage.
-- net_amount = amount - fee_amount.
-- لا idempotency_key هنا — يُنشأ دائماً ضمن create_sale Transaction.

CREATE TABLE payments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID          NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  account_id  UUID          NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  amount      DECIMAL(12,3) NOT NULL CHECK (amount > 0),
  fee_amount  DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  net_amount  DECIMAL(12,3) NOT NULL CHECK (net_amount >= 0),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- الفهارس
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_account ON payments(account_id);

COMMENT ON TABLE payments IS 'مدفوعات الفواتير. تدعم الدفع المختلط. fee_amount يُحسب من accounts.fee_percentage.';


-- ┌─────────────────────────────────────────────┐
-- │  جداول المرتجعات                             │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 11: returns (المرتجعات)
-- ─────────────────────────────────────────────
-- يمثل عملية إرجاع كاملة أو جزئية لفاتورة سابقة.
-- refund_account_id هو الحساب الذي يُسترد منه المبلغ.
-- في حالة البيع بالآجل، قد يكون refund_account_id = NULL ويُخصم من دين العميل.

CREATE TABLE returns (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number       VARCHAR(30)    NOT NULL UNIQUE,
  original_invoice_id UUID           NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
  return_date         DATE           NOT NULL DEFAULT CURRENT_DATE,
  return_type         return_type    NOT NULL,
  total_amount        DECIMAL(12,3)  NOT NULL CHECK (total_amount >= 0),
  refund_account_id   UUID           REFERENCES accounts(id) ON DELETE RESTRICT,
  reason              VARCHAR(500)   NOT NULL,
  idempotency_key     UUID           UNIQUE,
  created_at          TIMESTAMPTZ    NOT NULL DEFAULT now(),
  created_by          UUID           NOT NULL REFERENCES profiles(id)
);

-- الفهارس
CREATE INDEX idx_returns_invoice    ON returns(original_invoice_id);
CREATE INDEX idx_returns_date       ON returns(return_date);
CREATE INDEX idx_returns_created_by ON returns(created_by);

COMMENT ON TABLE returns IS 'المرتجعات (كاملة/جزئية). refund_account_id قد يكون NULL للبيع بالآجل.';


-- ─────────────────────────────────────────────
-- جدول 12: return_items (بنود المرتجع)
-- ─────────────────────────────────────────────
-- يرتبط بـ invoice_items عبر invoice_item_id لمعرفة أي بند تم إرجاعه.
-- unit_price يُحسب مع مراعاة الخصم الأصلي (سعر الوحدة الفعلي بعد الخصم).
-- total_price = quantity × unit_price.

CREATE TABLE return_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id       UUID          NOT NULL REFERENCES returns(id) ON DELETE RESTRICT,
  invoice_item_id UUID          NOT NULL REFERENCES invoice_items(id) ON DELETE RESTRICT,
  quantity        INTEGER       NOT NULL CHECK (quantity > 0),
  unit_price      DECIMAL(12,3) NOT NULL CHECK (unit_price >= 0),
  total_price     DECIMAL(12,3) NOT NULL CHECK (total_price >= 0)
);

-- الفهارس
CREATE INDEX idx_return_items_return       ON return_items(return_id);
CREATE INDEX idx_return_items_invoice_item ON return_items(invoice_item_id);

COMMENT ON TABLE return_items IS 'بنود المرتجع. يرتبط بـ invoice_items لتتبع ما تم إرجاعه بدقة.';


-- ┌─────────────────────────────────────────────┐
-- │  جداول المشتريات والموردين                   │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 13: purchase_orders (أوامر الشراء)
-- ─────────────────────────────────────────────
-- يمثل عملية شراء منتجات من مورد.
-- يمكن أن تكون مدفوعة نقداً أو على الحساب (is_paid).
-- payment_account_id مطلوب فقط إذا كانت مدفوعة (is_paid = true).
-- purchase_date = CURRENT_DATE دائماً (ADR-034).

CREATE TABLE purchase_orders (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_number    VARCHAR(30)   NOT NULL UNIQUE,
  supplier_id        UUID          NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  purchase_date      DATE          NOT NULL DEFAULT CURRENT_DATE,
  total_amount       DECIMAL(12,3) NOT NULL CHECK (total_amount >= 0),
  is_paid            BOOLEAN       NOT NULL DEFAULT false,
  payment_account_id UUID          REFERENCES accounts(id) ON DELETE RESTRICT,
  notes              TEXT,
  idempotency_key    UUID          UNIQUE,
  created_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_by         UUID          NOT NULL REFERENCES profiles(id)
);

-- الفهارس
CREATE INDEX idx_purchases_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchases_date     ON purchase_orders(purchase_date);
CREATE INDEX idx_purchases_is_paid  ON purchase_orders(is_paid);

-- تحديث updated_at تلقائياً
CREATE TRIGGER trg_purchases_updated_at
  BEFORE UPDATE ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

COMMENT ON TABLE purchase_orders IS 'أوامر الشراء من الموردين. is_paid يحدد إذا كانت نقدية أو على الحساب.';


-- ─────────────────────────────────────────────
-- جدول 14: purchase_items (بنود الشراء)
-- ─────────────────────────────────────────────
-- يمثل كل صف منتجاً واحداً في أمر الشراء.
-- unit_cost هو سعر الوحدة من المورد.
-- total_cost = quantity × unit_cost.
-- عند الحفظ، يُحدَّث products.cost_price و products.stock_quantity.

CREATE TABLE purchase_items (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id UUID          NOT NULL REFERENCES purchase_orders(id) ON DELETE RESTRICT,
  product_id  UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity    INTEGER       NOT NULL CHECK (quantity > 0),
  unit_cost   DECIMAL(12,3) NOT NULL CHECK (unit_cost >= 0),
  total_cost  DECIMAL(12,3) NOT NULL CHECK (total_cost >= 0)
);

-- الفهارس
CREATE INDEX idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX idx_purchase_items_product  ON purchase_items(product_id);

COMMENT ON TABLE purchase_items IS 'بنود الشراء. عند الحفظ يُحدَّث cost_price و stock_quantity في products.';


-- ─────────────────────────────────────────────
-- جدول 15: supplier_payments (تسديدات الموردين)
-- ─────────────────────────────────────────────
-- يمثل دفعة لتسديد رصيد مستحق لمورد.
-- يُخصم من suppliers.current_balance ومن accounts.current_balance.

CREATE TABLE supplier_payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_number  VARCHAR(30)   NOT NULL UNIQUE,
  supplier_id     UUID          NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  payment_date    DATE          NOT NULL DEFAULT CURRENT_DATE,
  amount          DECIMAL(12,3) NOT NULL CHECK (amount > 0),
  account_id      UUID          NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  notes           TEXT,
  idempotency_key UUID          UNIQUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_by      UUID          NOT NULL REFERENCES profiles(id)
);

-- الفهارس
CREATE INDEX idx_supplier_payments_supplier ON supplier_payments(supplier_id);
CREATE INDEX idx_supplier_payments_date     ON supplier_payments(payment_date);
CREATE INDEX idx_supplier_payments_account  ON supplier_payments(account_id);

COMMENT ON TABLE supplier_payments IS 'تسديدات الموردين. يُخصم من المورد والحساب المالي.';


-- ┌─────────────────────────────────────────────┐
-- │  جداول الشحن والتحويلات                      │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 16: topups (الشحن)
-- ─────────────────────────────────────────────
-- عملية شحن رصيد (خطوط هاتف).
-- لا تؤثر على المخزون (ليست منتجاً مادياً).
-- profit_amount هو ربح الشحن (نسبة ثابتة أو مبلغ).

CREATE TABLE topups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topup_number    VARCHAR(30)   NOT NULL UNIQUE,
  topup_date      DATE          NOT NULL DEFAULT CURRENT_DATE,
  amount          DECIMAL(12,3) NOT NULL CHECK (amount > 0),
  profit_amount   DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (profit_amount >= 0),
  account_id      UUID          NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  supplier_id     UUID          REFERENCES suppliers(id) ON DELETE RESTRICT,
  notes           TEXT,
  idempotency_key UUID          UNIQUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_by      UUID          NOT NULL REFERENCES profiles(id)
);

-- الفهارس
CREATE INDEX idx_topups_date     ON topups(topup_date);
CREATE INDEX idx_topups_account  ON topups(account_id);
CREATE INDEX idx_topups_supplier ON topups(supplier_id);

COMMENT ON TABLE topups IS 'عمليات الشحن. لا تؤثر على المخزون. profit_amount = ربح الشحن.';


-- ─────────────────────────────────────────────
-- جدول 17: transfers (التحويلات الخارجية)
-- ─────────────────────────────────────────────
-- جدول موحد للتحويلات:
--   - internal: تحويل داخلي بين حسابين (بدون ربح)
--   - external: تحويل خارجي لعميل مع ربح اختياري
-- create_transfer() يستخدم internal.
-- external محفوظ للتوسعة اللاحقة عند إضافة مسار تحويل خارجي مستقل.

CREATE TABLE transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transfer_number VARCHAR(30)   NOT NULL UNIQUE,
  transfer_type   VARCHAR(20)   NOT NULL DEFAULT 'internal'
    CHECK (transfer_type IN ('internal', 'external')),
  transfer_date   DATE          NOT NULL DEFAULT CURRENT_DATE,
  amount          DECIMAL(12,3) NOT NULL CHECK (amount > 0),
  profit_amount   DECIMAL(12,3) NOT NULL DEFAULT 0 CHECK (profit_amount >= 0),
  from_account_id UUID          REFERENCES accounts(id) ON DELETE RESTRICT,
  to_account_id   UUID          REFERENCES accounts(id) ON DELETE RESTRICT,
  account_id      UUID          REFERENCES accounts(id) ON DELETE RESTRICT,
  customer_name   VARCHAR(100),
  customer_phone  VARCHAR(20),
  notes           TEXT,
  idempotency_key UUID          UNIQUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_by      UUID          NOT NULL REFERENCES profiles(id),
  CONSTRAINT ck_transfers_shape CHECK (
    (
      transfer_type = 'internal'
      AND from_account_id IS NOT NULL
      AND to_account_id IS NOT NULL
      AND from_account_id <> to_account_id
      AND account_id IS NULL
      AND profit_amount = 0
    )
    OR
    (
      transfer_type = 'external'
      AND account_id IS NOT NULL
      AND from_account_id IS NULL
      AND to_account_id IS NULL
    )
  )
);

-- الفهارس
CREATE INDEX idx_transfers_date    ON transfers(transfer_date);
CREATE INDEX idx_transfers_type    ON transfers(transfer_type);
CREATE INDEX idx_transfers_from    ON transfers(from_account_id);
CREATE INDEX idx_transfers_to      ON transfers(to_account_id);
CREATE INDEX idx_transfers_account ON transfers(account_id);

COMMENT ON TABLE transfers IS 'جدول تحويلات موحد: internal بين حسابين، external لعميل مع ربح اختياري.';


-- ┌─────────────────────────────────────────────┐
-- │  جداول المصروفات                             │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 18: expenses (المصروفات)
-- ─────────────────────────────────────────────
-- يمثل مصروفاً واحداً (إيجار، كهرباء، رواتب، إلخ).
-- category_id يرتبط بـ expense_categories (ثابتة/متغيرة).
-- expense_date = CURRENT_DATE دائماً (ADR-034).

CREATE TABLE expenses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_date    DATE          NOT NULL DEFAULT CURRENT_DATE,
  account_id      UUID          NOT NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  category_id     UUID          NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  amount          DECIMAL(12,3) NOT NULL CHECK (amount > 0),
  description     VARCHAR(500)  NOT NULL,
  notes           TEXT,
  idempotency_key UUID          UNIQUE,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_by      UUID          NOT NULL REFERENCES profiles(id)
);

-- الفهارس
CREATE INDEX idx_expenses_date     ON expenses(expense_date);
CREATE INDEX idx_expenses_account  ON expenses(account_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);

COMMENT ON TABLE expenses IS 'المصروفات. expense_date = CURRENT_DATE دائماً. مرتبطة بفئة مصروفات.';


-- ┌─────────────────────────────────────────────┐
-- │  جدول الصيانة                                │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 19: maintenance_jobs (أوامر الصيانة)
-- ─────────────────────────────────────────────
-- يمثل طلب صيانة لجهاز عميل.
-- دورة الحالة: new → in_progress → ready → delivered (أو cancelled).
-- payment_account_id يُملأ عند التسليم (status = 'delivered') لتسجيل الإيراد.
-- يستخدم module_scope = 'maintenance' في accounts.

CREATE TABLE maintenance_jobs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_number         VARCHAR(30)        NOT NULL UNIQUE,
  job_date           DATE               NOT NULL DEFAULT CURRENT_DATE,
  customer_name      VARCHAR(100)       NOT NULL,
  customer_phone     VARCHAR(20),
  device_type        VARCHAR(100)       NOT NULL,
  issue_description  TEXT               NOT NULL,
  estimated_cost     DECIMAL(12,3),
  final_amount       DECIMAL(12,3),
  payment_account_id UUID               REFERENCES accounts(id) ON DELETE RESTRICT,
  status             maintenance_status NOT NULL DEFAULT 'new',
  notes              TEXT,
  idempotency_key    UUID               UNIQUE,
  delivered_at       TIMESTAMPTZ,
  created_at         TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ        NOT NULL DEFAULT now(),
  created_by         UUID               NOT NULL REFERENCES profiles(id)
);

-- الفهارس
CREATE INDEX idx_maintenance_date   ON maintenance_jobs(job_date);
CREATE INDEX idx_maintenance_status ON maintenance_jobs(status);
CREATE INDEX idx_maintenance_phone  ON maintenance_jobs(customer_phone);

-- تحديث updated_at تلقائياً
CREATE TRIGGER trg_maintenance_updated_at
  BEFORE UPDATE ON maintenance_jobs
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

COMMENT ON TABLE maintenance_jobs IS 'أوامر الصيانة. الدورة: new→in_progress→ready→delivered. يستخدم حسابات maintenance.';


-- ┌─────────────────────────────────────────────┐
-- │  جداول الجرد (المخزون)                       │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 20: inventory_counts (الجرد)
-- ─────────────────────────────────────────────
-- يمثل عملية جرد واحدة (يومية/أسبوعية/شهرية).
-- status = in_progress حتى يُكمل المستخدم الجرد.
-- completed_at يُملأ عند تغيير status إلى 'completed'.

CREATE TABLE inventory_counts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  count_date   DATE                   NOT NULL DEFAULT CURRENT_DATE,
  count_type   inventory_count_type   NOT NULL,
  status       inventory_count_status NOT NULL DEFAULT 'in_progress',
  notes        TEXT,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ            NOT NULL DEFAULT now(),
  created_by   UUID                   NOT NULL REFERENCES profiles(id)
);

-- الفهارس
CREATE INDEX idx_inventory_counts_date   ON inventory_counts(count_date);
CREATE INDEX idx_inventory_counts_status ON inventory_counts(status);

COMMENT ON TABLE inventory_counts IS 'عمليات الجرد. status = in_progress حتى الإتمام. يومي/أسبوعي/شهري.';


-- ─────────────────────────────────────────────
-- جدول 21: inventory_count_items (بنود الجرد)
-- ─────────────────────────────────────────────
-- يمثل كل صف منتجاً واحداً في عملية الجرد.
-- system_quantity يُسحب تلقائياً من products.stock_quantity عند بدء الجرد.
-- actual_quantity يُدخله المستخدم بعد العد الفعلي.
-- difference = actual_quantity - system_quantity (يُحسب تلقائياً أو سيرفرياً).

CREATE TABLE inventory_count_items (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_count_id UUID          NOT NULL REFERENCES inventory_counts(id) ON DELETE RESTRICT,
  product_id         UUID          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  system_quantity    INTEGER       NOT NULL,
  actual_quantity    INTEGER       NOT NULL CHECK (actual_quantity >= 0),
  difference         INTEGER       NOT NULL,
  reason             VARCHAR(255),
  -- قيد فريد: كل منتج يظهر مرة واحدة فقط في كل جرد
  CONSTRAINT uq_count_product UNIQUE (inventory_count_id, product_id)
);

-- الفهارس
CREATE INDEX idx_inventory_count_items_count   ON inventory_count_items(inventory_count_id);
CREATE INDEX idx_inventory_count_items_product ON inventory_count_items(product_id);

COMMENT ON TABLE inventory_count_items IS 'بنود الجرد. difference = actual - system. كل منتج يظهر مرة واحدة في كل جرد.';


-- ============================================================
-- ✅ نهاية المرحلة التشغيلية
-- ============================================================
-- اختبار هذه المرحلة:
--   1. التأكد من إنشاء جميع الجداول الـ 14 بنجاح
--   2. محاولة حذف حساب مالي مرتبط بـ payment → يجب أن يُرفض (ON DELETE RESTRICT)
--   3. إنشاء فاتورة يدوية بسيطة مع بنود ومدفوعات
--   4. إنشاء مرتجع جزئي والتأكد من أن returned_quantity يُحدَّث
--   5. محاولة إدخال idempotency_key مكرر → يجب أن يُرفض (UNIQUE)
--   6. التأكد من أن invoice_date يُعبأ تلقائياً بـ CURRENT_DATE
--   7. التأكد من أن الـ Constraints (CHECK) تعمل (مبالغ سالبة، كميات صفرية)
-- ============================================================
