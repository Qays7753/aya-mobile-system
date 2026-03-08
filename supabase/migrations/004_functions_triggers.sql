-- ============================================================
-- آية موبايل — المرحلة المنطقية (004_functions_triggers.sql)
-- المرجع: 15_Seed_Data_Functions.md, 04_Core_Flows.md
-- التاريخ: 23 فبراير 2026
-- يعتمد على: 001, 002, 003
-- ============================================================
-- ⚠️ جميع الدوال SECURITY DEFINER (ADR-044)
-- ⚠️ كل دالة = Atomic Transaction (نجاح كامل أو Rollback كامل)
-- ⚠️ الأسعار تُسحب من DB سيرفرياً (ADR-043)
-- ============================================================


-- ┌─────────────────────────────────────────────┐
-- │  دوال مساعدة (Helpers)                       │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION fn_generate_number(p_prefix VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_year   INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  v_seq    INTEGER;
  v_table  TEXT;
  v_col    TEXT;
BEGIN
  -- التحقق من البادئة المدعومة
  CASE p_prefix
    WHEN 'INV' THEN v_table := 'invoices';          v_col := 'invoice_number';
    WHEN 'RET' THEN v_table := 'returns';           v_col := 'return_number';
    WHEN 'PUR' THEN v_table := 'purchase_orders';   v_col := 'purchase_number';
    WHEN 'SPY' THEN v_table := 'supplier_payments'; v_col := 'payment_number';
    WHEN 'DPY' THEN v_table := 'debt_payments';     v_col := 'receipt_number';
    WHEN 'TOP' THEN v_table := 'topups';            v_col := 'topup_number';
    WHEN 'TRF' THEN v_table := 'transfers';         v_col := 'transfer_number';
    WHEN 'MNT' THEN v_table := 'maintenance_jobs';  v_col := 'job_number';
    ELSE RAISE EXCEPTION 'Unknown prefix: %', p_prefix;
  END CASE;

  -- قفل ذري لكل (prefix, year) لمنع التكرار تحت التوازي.
  PERFORM pg_advisory_xact_lock(hashtext(p_prefix || '-' || v_year::TEXT));

  EXECUTE format(
    'SELECT COALESCE(MAX(RIGHT(%I, 5)::INT), 0) + 1
       FROM %I
      WHERE created_at >= date_trunc(''year'', CURRENT_DATE)',
    v_col, v_table
  ) INTO v_seq;

  RETURN 'AYA-' || v_year::TEXT || '-' || LPAD(v_seq::TEXT, 5, '0');
END;
$$;

CREATE OR REPLACE FUNCTION fn_calc_account_ledger_balance(p_account_id UUID)
RETURNS DECIMAL
LANGUAGE sql STABLE AS $$
  SELECT a.opening_balance + COALESCE(SUM(
    CASE
      WHEN le.entry_type = 'income' THEN le.amount
      WHEN le.entry_type = 'expense' THEN -le.amount
      WHEN le.entry_type = 'adjustment' AND le.adjustment_direction = 'increase' THEN le.amount
      WHEN le.entry_type = 'adjustment' AND le.adjustment_direction = 'decrease' THEN -le.amount
      ELSE 0
    END
  ), 0)
  FROM accounts a
  LEFT JOIN ledger_entries le ON le.account_id = a.id
  WHERE a.id = p_account_id
  GROUP BY a.opening_balance;
$$;

CREATE OR REPLACE FUNCTION fn_require_actor(p_created_by UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := COALESCE(p_created_by, auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'ERR_UNAUTHORIZED';
  END IF;

  PERFORM 1
  FROM profiles
  WHERE id = v_user_id
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_UNAUTHORIZED';
  END IF;

  RETURN v_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION fn_require_admin_actor(p_created_by UUID DEFAULT NULL)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := fn_require_actor(p_created_by);

  PERFORM 1
  FROM profiles
  WHERE id = v_user_id
    AND role = 'admin'
    AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_UNAUTHORIZED';
  END IF;

  RETURN v_user_id;
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  1. create_sale() — عملية البيع              │
-- └─────────────────────────────────────────────┘

DROP FUNCTION IF EXISTS create_sale(JSONB, JSONB, VARCHAR, VARCHAR, UUID, UUID, VARCHAR, TEXT, UUID);

CREATE OR REPLACE FUNCTION create_sale(
  p_items           JSONB,
  p_payments        JSONB,
  p_customer_name   VARCHAR DEFAULT NULL,
  p_customer_phone  VARCHAR DEFAULT NULL,
  p_debt_customer_id UUID DEFAULT NULL,
  p_discount_by     UUID DEFAULT NULL,
  p_pos_terminal    VARCHAR DEFAULT NULL,
  p_notes           TEXT DEFAULT NULL,
  p_idempotency_key UUID DEFAULT NULL,
  p_created_by      UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id         UUID;
  v_invoice_id      UUID;
  v_invoice_number  VARCHAR;
  v_item            JSONB;
  v_product         RECORD;
  v_subtotal        DECIMAL(12,3) := 0;
  v_total_discount  DECIMAL(12,3) := 0;
  v_total_amount    DECIMAL(12,3) := 0;
  v_debt_amount     DECIMAL(12,3) := 0;
  v_item_discount_pct  DECIMAL(5,2);
  v_item_discount_amt  DECIMAL(12,3);
  v_item_total      DECIMAL(12,3);
  v_line_subtotal   DECIMAL(12,3);
  v_payment         JSONB;
  v_pay_total       DECIMAL(12,3) := 0;
  v_account         RECORD;
  v_fee             DECIMAL(12,3);
  v_net             DECIMAL(12,3);
  v_max_discount    DECIMAL(5,2);
  v_user_role       VARCHAR;
  v_change          DECIMAL(12,3) := 0;
  v_low_stock_thresh INT;
  v_retry_count     INT := 0;
  v_max_retries     INT := 2;
BEGIN
  v_user_id := fn_require_actor(p_created_by);

  -- ═══ التحقق من Idempotency ═══
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM invoices WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
    END IF;
  END IF;

  -- ═══ جلب إعدادات النظام ═══
  SELECT value::DECIMAL INTO v_max_discount
    FROM system_settings WHERE key = 'max_pos_discount_percentage';
  SELECT value::INT INTO v_low_stock_thresh
    FROM system_settings WHERE key = 'low_stock_threshold';
  SELECT role INTO v_user_role FROM profiles WHERE id = v_user_id;

  -- ═══ توليد رقم الفاتورة ═══
  v_invoice_number := fn_generate_number('INV');
  v_invoice_id := gen_random_uuid();
  -- إنشاء سجل الفاتورة أولاً لتفادي كسر FK عند إدراج invoice_items
  INSERT INTO invoices (
    id, invoice_number, customer_name, customer_phone,
    subtotal, discount_amount, discount_by, total_amount,
    debt_amount, debt_customer_id, status,
    pos_terminal_code, notes, idempotency_key, created_by
  ) VALUES (
    v_invoice_id, v_invoice_number, p_customer_name, p_customer_phone,
    0, 0, p_discount_by, 0,
    0, p_debt_customer_id, 'active',
    p_pos_terminal, p_notes, p_idempotency_key, v_user_id
  );

  -- ═══ معالجة البنود (Server-Authoritative Pricing — ADR-043) ═══
  -- ترتيب ثابت على product_id لتقليل احتمالات deadlock بين نقاط البيع المتزامنة.
  <<sale_items_retry>>
  LOOP
    BEGIN
      v_subtotal := 0;
      v_total_discount := 0;
      DELETE FROM invoice_items WHERE invoice_id = v_invoice_id;

      FOR v_item IN
        SELECT j.item
        FROM jsonb_array_elements(p_items) AS j(item)
        ORDER BY (j.item->>'product_id')::UUID
      LOOP
        -- قفل المنتج لمنع التضارب (SELECT FOR UPDATE)
        SELECT id, name, sale_price, cost_price, stock_quantity, track_stock
          INTO v_product
          FROM products
          WHERE id = (v_item->>'product_id')::UUID
          FOR UPDATE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'ERR_PRODUCT_NOT_FOUND';
        END IF;

        -- التحقق من المخزون
        IF v_product.track_stock AND
           v_product.stock_quantity < (v_item->>'quantity')::INT THEN
          RAISE EXCEPTION 'ERR_STOCK_INSUFFICIENT';
        END IF;

        -- حساب الخصم (ADR-043: السعر من DB وليس من العميل)
        v_item_discount_pct := COALESCE((v_item->>'discount_percentage')::DECIMAL, 0);

        -- التحقق من حد الخصم للموظف
        IF v_user_role = 'pos_staff' AND v_item_discount_pct > v_max_discount THEN
          RAISE EXCEPTION 'ERR_DISCOUNT_EXCEEDED';
        END IF;

        v_line_subtotal := v_product.sale_price * (v_item->>'quantity')::INT;
        v_item_discount_amt := ROUND(v_line_subtotal * v_item_discount_pct / 100, 3);
        v_item_total := v_line_subtotal - v_item_discount_amt;

        -- إدخال بند الفاتورة
        INSERT INTO invoice_items (
          id, invoice_id, product_id, product_name_at_time,
          quantity, unit_price, cost_price_at_time,
          discount_percentage, discount_amount, total_price
        ) VALUES (
          gen_random_uuid(), v_invoice_id, v_product.id, v_product.name,
          (v_item->>'quantity')::INT, v_product.sale_price,
          COALESCE(v_product.cost_price, 0),
          v_item_discount_pct, v_item_discount_amt, v_item_total
        );

        -- خصم المخزون
        IF v_product.track_stock THEN
          UPDATE products
            SET stock_quantity = stock_quantity - (v_item->>'quantity')::INT
            WHERE id = v_product.id;

          -- تنبيه مخزون منخفض
          IF (v_product.stock_quantity - (v_item->>'quantity')::INT) <= v_low_stock_thresh THEN
            INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
            SELECT p.id, 'low_stock',
              'مخزون منخفض: ' || v_product.name,
              'الكمية المتبقية: ' || (v_product.stock_quantity - (v_item->>'quantity')::INT),
              'product', v_product.id
            FROM profiles p WHERE p.role = 'admin';
          END IF;
        END IF;

        v_subtotal := v_subtotal + v_line_subtotal;
        v_total_discount := v_total_discount + v_item_discount_amt;
      END LOOP;

      EXIT sale_items_retry;
    EXCEPTION
      WHEN deadlock_detected OR lock_not_available THEN
        v_retry_count := v_retry_count + 1;
        IF v_retry_count > v_max_retries THEN
          RAISE EXCEPTION 'ERR_CONCURRENT_STOCK_UPDATE';
        END IF;
        PERFORM pg_sleep(0.05 * v_retry_count);
    END;
  END LOOP;

  v_total_amount := v_subtotal - v_total_discount;

  -- ═══ حساب مبلغ الدين ═══
  IF p_debt_customer_id IS NOT NULL THEN
    FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments) LOOP
      v_pay_total := v_pay_total + (v_payment->>'amount')::DECIMAL;
    END LOOP;
    v_debt_amount := v_total_amount - v_pay_total;
    IF v_debt_amount < 0 THEN
      v_change := ABS(v_debt_amount);
      v_debt_amount := 0;
    END IF;
  ELSE
    -- بدون دين: مجموع الدفعات يجب ألا يتجاوز الإجمالي، ولا يقل عنه (الدفع مضبوط)
    FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments) LOOP
      v_pay_total := v_pay_total + (v_payment->>'amount')::DECIMAL;
    END LOOP;
    IF v_pay_total < v_total_amount THEN
      RAISE EXCEPTION 'ERR_PAYMENT_MISMATCH';
    END IF;
    -- Fix #1: منع تسجيل دخل وهمي أكبر من قيمة الفاتورة للصندوق
    v_change := v_pay_total - v_total_amount;
  END IF;

  -- ═══ تحديث الفاتورة بعد احتساب الإجماليات ═══
  UPDATE invoices
    SET subtotal = v_subtotal,
        discount_amount = v_total_discount,
        discount_by = p_discount_by,
        total_amount = v_total_amount,
        debt_amount = v_debt_amount,
        debt_customer_id = p_debt_customer_id,
        customer_name = p_customer_name,
        customer_phone = p_customer_phone,
        pos_terminal_code = p_pos_terminal,
        notes = p_notes
  WHERE id = v_invoice_id;

  -- ═══ إنشاء المدفوعات + قيود محاسبية ═══
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments) LOOP
    SELECT id, fee_percentage INTO v_account
      FROM accounts WHERE id = (v_payment->>'account_id')::UUID;

    -- Fix #1: إذا كان هناك صرف (v_change) يتم خصمه من عملية الدفع الأساسية حتى لا يُسجل Income مبالغ فيه
    -- يفترض غالباً أن الدفع كاش هو من يمتص الـ change في البيع المباشر
    v_net := (v_payment->>'amount')::DECIMAL;
    IF v_change > 0 AND v_net > v_change THEN
      v_net := v_net - v_change;
      v_change := 0; -- صرفنا الباقي
    ELSIF v_change > 0 AND v_net <= v_change THEN
      v_change := v_change - v_net;
      v_net := 0; -- الدفعة كلها ذهبت كباقي (نادر الحدوث عملياً لكن للحماية)
    END IF;

    IF v_net > 0 THEN
      v_fee := ROUND(v_net * v_account.fee_percentage / 100, 3);
      v_net := v_net - v_fee;

      INSERT INTO payments (invoice_id, account_id, amount, fee_amount, net_amount)
      VALUES (v_invoice_id, v_account.id, v_net + v_fee, v_fee, v_net);

      -- قيد محاسبي: income
      INSERT INTO ledger_entries (
        account_id, entry_type, amount, reference_type, reference_id, description, created_by
      ) VALUES (
        v_account.id, 'income', v_net, 'invoice', v_invoice_id,
        'فاتورة بيع ' || v_invoice_number, v_user_id
      );

      -- تحديث رصيد الحساب
      UPDATE accounts SET current_balance = current_balance + v_net
        WHERE id = v_account.id;
    END IF;
  END LOOP;

  -- ═══ إنشاء قيد الدين (إن وجد) ═══
  IF v_debt_amount > 0 AND p_debt_customer_id IS NOT NULL THEN
    INSERT INTO debt_entries (
      debt_customer_id, entry_type, invoice_id, amount,
      due_date, remaining_amount, created_by
    ) VALUES (
      p_debt_customer_id, 'from_invoice', v_invoice_id, v_debt_amount,
      CURRENT_DATE + (SELECT due_date_days FROM debt_customers WHERE id = p_debt_customer_id),
      v_debt_amount, v_user_id
    );

    UPDATE debt_customers
      SET current_balance = current_balance + v_debt_amount
      WHERE id = p_debt_customer_id;

    -- تنبيه تجاوز حد الدين
    IF (
      SELECT COALESCE(SUM(remaining_amount), 0)
      FROM debt_entries
      WHERE debt_customer_id = p_debt_customer_id
        AND is_paid = false
    ) > (SELECT credit_limit FROM debt_customers WHERE id = p_debt_customer_id) THEN
      INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
      SELECT p.id, 'debt_limit_exceeded',
        'تجاوز حد الدين',
        'العميل تجاوز حد الدين المسموح',
        'invoice', v_invoice_id
      FROM profiles p WHERE p.role = 'admin';
    END IF;
  END IF;

  -- ═══ تنبيه خصم كبير ═══
  IF v_total_discount > 0 AND p_discount_by IS NOT NULL
     AND (v_total_discount / NULLIF(v_subtotal, 0) * 100) >= COALESCE(
       (SELECT value::DECIMAL FROM system_settings WHERE key = 'discount_warning_threshold'), 10
     ) THEN
    INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
    SELECT p.id, 'large_discount',
      'خصم في فاتورة ' || v_invoice_number,
      'مبلغ الخصم: ' || v_total_discount || ' د.أ',
      'invoice', v_invoice_id
    FROM profiles p WHERE p.role = 'admin';
  END IF;

  -- ═══ Audit Log ═══
  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'create_sale', 'invoices', v_invoice_id,
    'إنشاء فاتورة ' || v_invoice_number,
    jsonb_build_object('total', v_total_amount, 'items_count', jsonb_array_length(p_items)));

  RETURN jsonb_build_object(
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'total', v_total_amount,
    'change', v_change
  );
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  2. cancel_invoice() — إلغاء فاتورة         │
-- └─────────────────────────────────────────────┘

DROP FUNCTION IF EXISTS cancel_invoice(UUID, VARCHAR);

CREATE OR REPLACE FUNCTION cancel_invoice(
  p_invoice_id   UUID,
  p_cancel_reason VARCHAR,
  p_created_by    UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id  UUID;
  v_invoice  RECORD;
  v_payment  RECORD;
  v_item     RECORD;
  v_debt     RECORD;
BEGIN
  v_user_id := fn_require_admin_actor(p_created_by);

  -- جلب الفاتورة مع قفل
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ERR_INVOICE_NOT_FOUND'; END IF;
  IF v_invoice.status IN ('returned', 'partially_returned')
     OR EXISTS (SELECT 1 FROM returns WHERE original_invoice_id = p_invoice_id) THEN
    RAISE EXCEPTION 'ERR_CANCEL_HAS_RETURN';
  END IF;
  IF v_invoice.status <> 'active' THEN RAISE EXCEPTION 'ERR_CANCEL_ALREADY'; END IF;

  -- Fix #2: منع إلغاء الفاتورة إذا كان دينها مسدد جزئياً لمنع تلف الديون
  IF v_invoice.debt_amount > 0 AND EXISTS (SELECT 1 FROM debt_entries WHERE invoice_id = p_invoice_id AND paid_amount > 0) THEN
    RAISE EXCEPTION 'ERR_CANNOT_CANCEL_PAID_DEBT';
  END IF;

  -- تحديث حالة الفاتورة
  UPDATE invoices SET
    status = 'cancelled', cancel_reason = p_cancel_reason,
    cancelled_by = v_user_id, cancelled_at = now()
  WHERE id = p_invoice_id;

  -- إرجاع المخزون
  FOR v_item IN SELECT ii.*, p.track_stock FROM invoice_items ii
    JOIN products p ON p.id = ii.product_id WHERE ii.invoice_id = p_invoice_id
  LOOP
    IF v_item.track_stock THEN
      UPDATE products SET stock_quantity = stock_quantity + v_item.quantity
        WHERE id = v_item.product_id;
    END IF;
  END LOOP;

  -- عكس المدفوعات (قيود عكسية)
  FOR v_payment IN SELECT * FROM payments WHERE invoice_id = p_invoice_id LOOP
    INSERT INTO ledger_entries (
      account_id, entry_type, amount, reference_type, reference_id, description, created_by
    ) VALUES (
      v_payment.account_id, 'expense', v_payment.net_amount,
      'reversal', p_invoice_id,
      'عكس فاتورة ملغية ' || v_invoice.invoice_number, v_user_id
    );
    UPDATE accounts SET current_balance = current_balance - v_payment.net_amount
      WHERE id = v_payment.account_id;
  END LOOP;

  -- عكس الدين (إن وجد)
  IF v_invoice.debt_amount > 0 AND v_invoice.debt_customer_id IS NOT NULL THEN
    UPDATE debt_customers
      SET current_balance = current_balance - v_invoice.debt_amount
      WHERE id = v_invoice.debt_customer_id;

    UPDATE debt_entries SET is_paid = true, paid_amount = amount, remaining_amount = 0
      WHERE invoice_id = p_invoice_id AND is_paid = false;
  END IF;

  -- إشعار الإلغاء
  INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
  SELECT p.id, 'invoice_cancelled',
    'فاتورة ملغية: ' || v_invoice.invoice_number,
    'السبب: ' || p_cancel_reason || ' — المبلغ: ' || v_invoice.total_amount || ' د.أ',
    'invoice', p_invoice_id
  FROM profiles p WHERE p.role = 'admin';

  -- Audit
  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, old_values)
  VALUES (v_user_id, 'cancel_invoice', 'invoices', p_invoice_id,
    'إلغاء فاتورة ' || v_invoice.invoice_number,
    jsonb_build_object('total', v_invoice.total_amount, 'reason', p_cancel_reason));

  RETURN jsonb_build_object('success', true, 'invoice_number', v_invoice.invoice_number);
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  3. create_return() — عملية المرتجع          │
-- └─────────────────────────────────────────────┘

DROP FUNCTION IF EXISTS create_return(UUID, JSONB, UUID, VARCHAR, UUID);

CREATE OR REPLACE FUNCTION create_return(
  p_invoice_id      UUID,
  p_items           JSONB,
  p_refund_account_id UUID DEFAULT NULL,
  p_reason          VARCHAR DEFAULT '',
  p_idempotency_key UUID DEFAULT NULL,
  p_created_by      UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id        UUID;
  v_return_id      UUID := gen_random_uuid();
  v_return_number  VARCHAR;
  v_invoice        RECORD;
  v_item           JSONB;
  v_inv_item       RECORD;
  v_return_total   DECIMAL(12,3) := 0;
  v_item_unit_price DECIMAL(12,3);
  v_item_total     DECIMAL(12,3);
  v_return_type    return_type;
  v_all_returned   BOOLEAN := true;
BEGIN
  v_user_id := fn_require_actor(p_created_by);

  -- Idempotency
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM returns WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
    END IF;
  END IF;

  -- Fix #1 (Red Team Audit): قفل الفاتورة الأم لمنع الـ Race Condition في المرتجعات الموازية
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ERR_INVOICE_NOT_FOUND'; END IF;
  IF v_invoice.status <> 'active' THEN RAISE EXCEPTION 'ERR_INVOICE_CANCELLED'; END IF;

  v_return_number := fn_generate_number('RET');
  -- إنشاء سجل المرتجع أولاً لتفادي كسر FK عند إدراج return_items
  INSERT INTO returns (
    id, return_number, original_invoice_id, return_type,
    total_amount, refund_account_id, reason, idempotency_key, created_by
  ) VALUES (
    v_return_id, v_return_number, p_invoice_id, 'partial',
    0, p_refund_account_id, p_reason, p_idempotency_key, v_user_id
  );

  -- معالجة البنود
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT * INTO v_inv_item FROM invoice_items
      WHERE id = (v_item->>'invoice_item_id')::UUID FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_ITEM_NOT_FOUND'; END IF;

    -- التحقق من الكمية المتاحة للإرجاع
    IF (v_item->>'quantity')::INT > (v_inv_item.quantity - v_inv_item.returned_quantity) THEN
      RAISE EXCEPTION 'ERR_RETURN_QUANTITY';
    END IF;

    -- حساب سعر الوحدة الفعلي (بعد الخصم)
    v_item_unit_price := v_inv_item.total_price / v_inv_item.quantity;
    v_item_total := ROUND(v_item_unit_price * (v_item->>'quantity')::INT, 3);

    INSERT INTO return_items (return_id, invoice_item_id, quantity, unit_price, total_price)
    VALUES (v_return_id, v_inv_item.id, (v_item->>'quantity')::INT, v_item_unit_price, v_item_total);

    -- تحديث returned_quantity
    UPDATE invoice_items
      SET returned_quantity = returned_quantity + (v_item->>'quantity')::INT,
          is_returned = CASE
            WHEN returned_quantity + (v_item->>'quantity')::INT >= quantity THEN true
            ELSE is_returned END
      WHERE id = v_inv_item.id;

    -- إرجاع المخزون
    UPDATE products SET stock_quantity = stock_quantity + (v_item->>'quantity')::INT
      WHERE id = v_inv_item.product_id
      AND track_stock = true;

    v_return_total := v_return_total + v_item_total;
  END LOOP;

  -- تحديد نوع المرتجع
  SELECT bool_and(returned_quantity >= quantity) INTO v_all_returned
    FROM invoice_items WHERE invoice_id = p_invoice_id;
  v_return_type := CASE WHEN v_all_returned THEN 'full' ELSE 'partial' END;

  -- تحديث سجل المرتجع بعد احتساب إجمالي المرتجع ونوعه
  UPDATE returns
    SET return_type = v_return_type,
        total_amount = v_return_total,
        refund_account_id = p_refund_account_id,
        reason = p_reason
  WHERE id = v_return_id;

  -- ═══ تحديث حالة الفاتورة (Fix #1) ═══
  IF v_return_type = 'full' THEN
    UPDATE invoices SET status = 'returned' WHERE id = p_invoice_id;
  ELSE
    UPDATE invoices SET status = 'partially_returned' WHERE id = p_invoice_id;
  END IF;

  -- ═══ قيد محاسبي: استرداد مالي أو خصم من الدين (Fix #3) ═══
  IF p_refund_account_id IS NOT NULL THEN
    INSERT INTO ledger_entries (
      account_id, entry_type, amount, reference_type, reference_id, description, created_by
    ) VALUES (
      p_refund_account_id, 'expense', v_return_total, 'return', v_return_id,
      'مرتجع ' || v_return_number || ' من فاتورة ' || v_invoice.invoice_number, v_user_id
    );
    UPDATE accounts SET current_balance = current_balance - v_return_total
      WHERE id = p_refund_account_id;
  ELSIF v_invoice.debt_customer_id IS NOT NULL THEN
    UPDATE debt_customers
      SET current_balance = current_balance - v_return_total
      WHERE id = v_invoice.debt_customer_id;

    -- Fix #3: تحديث سجل الدين التفصيلي حتى لا يبقى معلقاً ويخصم من مدفوعات العميل بغير حق
    UPDATE debt_entries
      SET paid_amount = LEAST(amount, paid_amount + v_return_total),
          remaining_amount = amount - LEAST(amount, paid_amount + v_return_total),
          is_paid = CASE
            WHEN amount - LEAST(amount, paid_amount + v_return_total) = 0 THEN true
            ELSE is_paid
          END
    WHERE invoice_id = p_invoice_id AND entry_type = 'from_invoice';
  ELSE
    -- ⛔ لا حساب استرداد ولا عميل دين — مرتجع بدون أثر مالي ممنوع
    RAISE EXCEPTION 'ERR_RETURN_REFUND_ACCOUNT_REQUIRED';
  END IF;

  -- Audit
  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'create_return', 'returns', v_return_id,
    'مرتجع ' || v_return_number,
    jsonb_build_object('type', v_return_type, 'total', v_return_total));

  RETURN jsonb_build_object(
    'return_id', v_return_id, 'return_number', v_return_number,
    'return_type', v_return_type, 'total', v_return_total
  );
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  4. create_debt_payment() — تسديد دين (FIFO) │
-- └─────────────────────────────────────────────┘

DROP FUNCTION IF EXISTS create_debt_payment(UUID, NUMERIC, UUID, TEXT, UUID, UUID);

CREATE OR REPLACE FUNCTION create_debt_payment(
  p_debt_customer_id UUID,
  p_amount           DECIMAL,
  p_account_id       UUID,
  p_notes            TEXT DEFAULT NULL,
  p_idempotency_key  UUID DEFAULT NULL,
  p_debt_entry_id    UUID DEFAULT NULL,
  p_created_by       UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id         UUID;
  v_payment_id      UUID := gen_random_uuid();
  v_receipt_number  VARCHAR;
  v_remaining       DECIMAL(12,3) := p_amount;
  v_debt            RECORD;
  v_alloc_amount    DECIMAL(12,3);
  v_allocations     JSONB := '[]';
  v_customer        RECORD;
  v_customer_due    DECIMAL(12,3);
BEGIN
  v_user_id := fn_require_actor(p_created_by);

  IF p_amount <= 0 THEN RAISE EXCEPTION 'ERR_VALIDATION_NEGATIVE_AMOUNT'; END IF;

  -- Idempotency
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM debt_payments WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
    END IF;
  END IF;

  -- التحقق من العميل
  SELECT * INTO v_customer FROM debt_customers WHERE id = p_debt_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ERR_CUSTOMER_NOT_FOUND'; END IF;

  -- التحقق (Ledger-derived): لا تسديد أكثر من إجمالي الديون غير المسددة
  SELECT COALESCE(SUM(remaining_amount), 0)
    INTO v_customer_due
    FROM debt_entries
   WHERE debt_customer_id = p_debt_customer_id
     AND is_paid = false;

  IF p_amount > v_customer_due THEN
    RAISE EXCEPTION 'ERR_DEBT_OVERPAY';
  END IF;

  v_receipt_number := fn_generate_number('DPY');

  -- إنشاء سجل التسديد
  INSERT INTO debt_payments (
    id, debt_customer_id, amount, account_id, receipt_number,
    notes, idempotency_key, created_by
  ) VALUES (
    v_payment_id, p_debt_customer_id, p_amount, p_account_id,
    v_receipt_number, p_notes, p_idempotency_key, v_user_id
  );

  -- ═══ FIFO Allocation ═══
  IF p_debt_entry_id IS NOT NULL THEN
    -- تحديد دين معين (تجاوز FIFO)
    SELECT * INTO v_debt FROM debt_entries
      WHERE id = p_debt_entry_id AND debt_customer_id = p_debt_customer_id
      AND is_paid = false FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_DEBT_ENTRY_NOT_FOUND'; END IF;

    v_alloc_amount := LEAST(v_remaining, v_debt.remaining_amount);

    INSERT INTO debt_payment_allocations (payment_id, debt_entry_id, allocated_amount)
    VALUES (v_payment_id, v_debt.id, v_alloc_amount);

    UPDATE debt_entries SET
      paid_amount = paid_amount + v_alloc_amount,
      remaining_amount = remaining_amount - v_alloc_amount,
      is_paid = CASE WHEN remaining_amount - v_alloc_amount = 0 THEN true ELSE false END
    WHERE id = v_debt.id;

    v_remaining := v_remaining - v_alloc_amount;
    v_allocations := v_allocations || jsonb_build_object(
      'debt_entry_id', v_debt.id, 'allocated_amount', v_alloc_amount);
  END IF;

  -- FIFO: توزيع المتبقي على الأقدم
  IF v_remaining > 0 THEN
    FOR v_debt IN
      SELECT * FROM debt_entries
        WHERE debt_customer_id = p_debt_customer_id AND is_paid = false
        AND (p_debt_entry_id IS NULL OR id <> p_debt_entry_id)
        ORDER BY due_date ASC
        FOR UPDATE
    LOOP
      EXIT WHEN v_remaining <= 0;

      v_alloc_amount := LEAST(v_remaining, v_debt.remaining_amount);

      INSERT INTO debt_payment_allocations (payment_id, debt_entry_id, allocated_amount)
      VALUES (v_payment_id, v_debt.id, v_alloc_amount);

      UPDATE debt_entries SET
        paid_amount = paid_amount + v_alloc_amount,
        remaining_amount = remaining_amount - v_alloc_amount,
        is_paid = CASE WHEN remaining_amount - v_alloc_amount = 0 THEN true ELSE false END
      WHERE id = v_debt.id;

      v_remaining := v_remaining - v_alloc_amount;
      v_allocations := v_allocations || jsonb_build_object(
        'debt_entry_id', v_debt.id, 'allocated_amount', v_alloc_amount);
    END LOOP;
  END IF;

  -- تحديث رصيد العميل والحساب المالي
  UPDATE debt_customers SET current_balance = current_balance - p_amount
    WHERE id = p_debt_customer_id;

  UPDATE accounts SET current_balance = current_balance + p_amount
    WHERE id = p_account_id;

  -- قيد محاسبي
  INSERT INTO ledger_entries (
    account_id, entry_type, amount, reference_type, reference_id, description, created_by
  ) VALUES (
    p_account_id, 'income', p_amount, 'debt_payment', v_payment_id,
    'تسديد دين — إيصال ' || v_receipt_number, v_user_id
  );

  -- Audit
  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'create_debt_payment', 'debt_payments', v_payment_id,
    'تسديد دين ' || v_receipt_number,
    jsonb_build_object('amount', p_amount, 'customer_id', p_debt_customer_id));

  RETURN jsonb_build_object(
    'payment_id', v_payment_id,
    'receipt_number', v_receipt_number,
    'remaining_balance', (SELECT current_balance FROM debt_customers WHERE id = p_debt_customer_id),
    'allocations', v_allocations
  );
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  5. create_expense() — تسجيل مصروف           │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION create_expense(
  p_amount        DECIMAL,
  p_account_id    UUID,
  p_category_id   UUID,
  p_description   VARCHAR,
  p_notes         TEXT DEFAULT NULL,
  p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_expense_id UUID := gen_random_uuid();
  v_ledger_id  UUID;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'ERR_VALIDATION_NEGATIVE_AMOUNT'; END IF;

  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM expenses WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
    END IF;
  END IF;

  INSERT INTO expenses (id, account_id, category_id, amount, description, notes, idempotency_key, created_by)
  VALUES (v_expense_id, p_account_id, p_category_id, p_amount, p_description, p_notes, p_idempotency_key, v_user_id);

  v_ledger_id := gen_random_uuid();
  INSERT INTO ledger_entries (id, account_id, entry_type, amount, reference_type, reference_id, description, created_by)
  VALUES (v_ledger_id, p_account_id, 'expense', p_amount, 'expense', v_expense_id, p_description, v_user_id);

  UPDATE accounts SET current_balance = current_balance - p_amount WHERE id = p_account_id;

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'create_expense', 'expenses', v_expense_id, 'مصروف: ' || p_description,
    jsonb_build_object('amount', p_amount));

  RETURN jsonb_build_object('expense_id', v_expense_id, 'ledger_entry_id', v_ledger_id);
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  6. create_purchase() — أمر شراء              │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION create_purchase(
  p_supplier_id      UUID,
  p_items            JSONB,
  p_is_paid          BOOLEAN DEFAULT true,
  p_payment_account_id UUID DEFAULT NULL,
  p_notes            TEXT DEFAULT NULL,
  p_idempotency_key  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id     UUID := auth.uid();
  v_purchase_id UUID := gen_random_uuid();
  v_purchase_num VARCHAR;
  v_item        JSONB;
  v_total       DECIMAL(12,3) := 0;
  v_item_total  DECIMAL(12,3);
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM purchase_orders WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
    END IF;
  END IF;

  IF p_is_paid AND p_payment_account_id IS NULL THEN
    RAISE EXCEPTION 'ERR_VALIDATION_REQUIRED_FIELD';
  END IF;

  v_purchase_num := fn_generate_number('PUR');
  -- إنشاء أمر الشراء أولاً لتفادي كسر FK عند إدراج purchase_items
  INSERT INTO purchase_orders (
    id, purchase_number, supplier_id, total_amount, is_paid,
    payment_account_id, notes, idempotency_key, created_by
  ) VALUES (
    v_purchase_id, v_purchase_num, p_supplier_id, 0, p_is_paid,
    p_payment_account_id, p_notes, p_idempotency_key, v_user_id
  );

  -- معالجة البنود + تحديث المخزون والتكلفة
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_item_total := (v_item->>'quantity')::INT * (v_item->>'unit_cost')::DECIMAL;
    v_total := v_total + v_item_total;

    INSERT INTO purchase_items (purchase_id, product_id, quantity, unit_cost, total_cost)
    VALUES (v_purchase_id, (v_item->>'product_id')::UUID,
      (v_item->>'quantity')::INT, (v_item->>'unit_cost')::DECIMAL, v_item_total);

    -- تحديث المخزون وسعر التكلفة + المتوسط المرجح
    UPDATE products SET
      stock_quantity = stock_quantity + (v_item->>'quantity')::INT,
      cost_price = (v_item->>'unit_cost')::DECIMAL,
      avg_cost_price = CASE
        WHEN COALESCE(stock_quantity, 0) + (v_item->>'quantity')::INT = 0 THEN (v_item->>'unit_cost')::DECIMAL
        ELSE ROUND(
          (COALESCE(avg_cost_price, cost_price, 0) * COALESCE(stock_quantity, 0)
           + (v_item->>'unit_cost')::DECIMAL * (v_item->>'quantity')::INT)
          / (COALESCE(stock_quantity, 0) + (v_item->>'quantity')::INT), 3)
      END
    WHERE id = (v_item->>'product_id')::UUID;
  END LOOP;

  UPDATE purchase_orders
    SET total_amount = v_total,
        is_paid = p_is_paid,
        payment_account_id = p_payment_account_id,
        notes = p_notes
  WHERE id = v_purchase_id;

  -- إذا مدفوع: خصم من الحساب + قيد محاسبي
  IF p_is_paid THEN
    INSERT INTO ledger_entries (account_id, entry_type, amount, reference_type, reference_id, description, created_by)
    VALUES (p_payment_account_id, 'expense', v_total, 'purchase', v_purchase_id,
      'شراء ' || v_purchase_num, v_user_id);
    UPDATE accounts SET current_balance = current_balance - v_total WHERE id = p_payment_account_id;
  ELSE
    -- على الحساب: تحديث رصيد المورد
    UPDATE suppliers SET current_balance = current_balance + v_total WHERE id = p_supplier_id;
  END IF;

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'create_purchase', 'purchase_orders', v_purchase_id,
    'شراء ' || v_purchase_num, jsonb_build_object('total', v_total, 'is_paid', p_is_paid));

  RETURN jsonb_build_object('purchase_order_id', v_purchase_id,
    'purchase_number', v_purchase_num, 'total', v_total);
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  7. create_supplier_payment() — تسديد مورد   │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION create_supplier_payment(
  p_supplier_id     UUID,
  p_account_id      UUID,
  p_amount          DECIMAL,
  p_notes           TEXT DEFAULT NULL,
  p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_payment_id UUID := gen_random_uuid();
  v_pay_num    VARCHAR;
  v_supplier   RECORD;
  v_supplier_due DECIMAL(12,3);
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'ERR_VALIDATION_NEGATIVE_AMOUNT'; END IF;

  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM supplier_payments WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
    END IF;
  END IF;

  SELECT * INTO v_supplier FROM suppliers WHERE id = p_supplier_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ERR_SUPPLIER_NOT_FOUND'; END IF;

  -- التحقق (Ledger-derived): رصيد المورد = مشتريات آجل - تسديدات المورد
  SELECT
    COALESCE(
      (SELECT SUM(total_amount) FROM purchase_orders WHERE supplier_id = p_supplier_id AND is_paid = false),
      0
    )
    - COALESCE(
      (SELECT SUM(amount) FROM supplier_payments WHERE supplier_id = p_supplier_id),
      0
    )
  INTO v_supplier_due;

  IF p_amount > v_supplier_due THEN RAISE EXCEPTION 'ERR_SUPPLIER_OVERPAY'; END IF;

  v_pay_num := fn_generate_number('SPY');

  INSERT INTO supplier_payments (id, payment_number, supplier_id, amount, account_id, notes, idempotency_key, created_by)
  VALUES (v_payment_id, v_pay_num, p_supplier_id, p_amount, p_account_id, p_notes, p_idempotency_key, v_user_id);

  UPDATE suppliers SET current_balance = current_balance - p_amount WHERE id = p_supplier_id;
  UPDATE accounts SET current_balance = current_balance - p_amount WHERE id = p_account_id;

  INSERT INTO ledger_entries (account_id, entry_type, amount, reference_type, reference_id, description, created_by)
  VALUES (p_account_id, 'expense', p_amount, 'supplier_payment', v_payment_id,
    'تسديد مورد: ' || v_supplier.name, v_user_id);

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'create_supplier_payment', 'supplier_payments', v_payment_id,
    'تسديد مورد ' || v_pay_num, jsonb_build_object('amount', p_amount));

  RETURN jsonb_build_object('payment_id', v_payment_id, 'payment_number', v_pay_num,
    'remaining_balance', (SELECT current_balance FROM suppliers WHERE id = p_supplier_id));
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  8. create_topup() — عملية شحن               │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION create_topup(
  p_account_id      UUID,
  p_amount          DECIMAL,
  p_profit_amount   DECIMAL,
  p_supplier_id     UUID DEFAULT NULL,
  p_notes           TEXT DEFAULT NULL,
  p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id     UUID := auth.uid();
  v_topup_id    UUID := gen_random_uuid();
  v_topup_num   VARCHAR;
  v_ledger_income UUID;
  v_ledger_cost   UUID;
  v_cost_amount   DECIMAL(12,3);
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'ERR_VALIDATION_NEGATIVE_AMOUNT'; END IF;
  IF p_profit_amount > p_amount THEN RAISE EXCEPTION 'ERR_API_VALIDATION_FAILED'; END IF;

  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM topups WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
    END IF;
  END IF;

  v_topup_num := fn_generate_number('TOP');
  v_cost_amount := p_amount - p_profit_amount;

  INSERT INTO topups (id, topup_number, amount, profit_amount, account_id, supplier_id, notes, idempotency_key, created_by)
  VALUES (v_topup_id, v_topup_num, p_amount, p_profit_amount, p_account_id, p_supplier_id, p_notes, p_idempotency_key, v_user_id);

  -- قيد 1: income (المبلغ الكامل)
  v_ledger_income := gen_random_uuid();
  INSERT INTO ledger_entries (id, account_id, entry_type, amount, reference_type, reference_id, description, created_by)
  VALUES (v_ledger_income, p_account_id, 'income', p_amount, 'topup', v_topup_id, 'شحن ' || v_topup_num, v_user_id);

  -- قيد 2: expense (تكلفة الشحن)
  v_ledger_cost := gen_random_uuid();
  INSERT INTO ledger_entries (id, account_id, entry_type, amount, reference_type, reference_id, description, created_by)
  VALUES (v_ledger_cost, p_account_id, 'expense', v_cost_amount, 'topup', v_topup_id, 'تكلفة شحن ' || v_topup_num, v_user_id);

  -- تحديث رصيد الحساب (صافي = الربح فقط)
  UPDATE accounts SET current_balance = current_balance + p_profit_amount WHERE id = p_account_id;

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'create_topup', 'topups', v_topup_id, 'شحن ' || v_topup_num,
    jsonb_build_object('amount', p_amount, 'profit', p_profit_amount));

  RETURN jsonb_build_object('topup_id', v_topup_id, 'topup_number', v_topup_num,
    'ledger_entry_ids', jsonb_build_array(v_ledger_income, v_ledger_cost));
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  9. create_transfer() — تحويل داخلي          │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION create_transfer(
  p_from_account_id UUID,
  p_to_account_id   UUID,
  p_amount          DECIMAL,
  p_notes           TEXT DEFAULT NULL,
  p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_transfer_id UUID := gen_random_uuid();
  v_from_balance DECIMAL(12,3);
  v_from_ledger_balance DECIMAL(12,3);
  v_ledger_from UUID;
  v_ledger_to   UUID;
  v_transfer_num VARCHAR;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'ERR_VALIDATION_NEGATIVE_AMOUNT'; END IF;
  IF p_from_account_id = p_to_account_id THEN RAISE EXCEPTION 'ERR_TRANSFER_SAME_ACCOUNT'; END IF;

  SELECT current_balance INTO v_from_balance FROM accounts WHERE id = p_from_account_id FOR UPDATE;
  v_from_ledger_balance := COALESCE(fn_calc_account_ledger_balance(p_from_account_id), 0);
  IF v_from_ledger_balance < p_amount THEN RAISE EXCEPTION 'ERR_INSUFFICIENT_BALANCE'; END IF;

  -- قفل الحساب المستقبل أيضاً
  PERFORM id FROM accounts WHERE id = p_to_account_id FOR UPDATE;

  v_transfer_num := fn_generate_number('TRF');

  BEGIN
    INSERT INTO transfers (
      id, transfer_number, transfer_type, amount, profit_amount,
      from_account_id, to_account_id, notes, idempotency_key, created_by
    ) VALUES (
      v_transfer_id, v_transfer_num, 'internal', p_amount, 0,
      p_from_account_id, p_to_account_id, p_notes, p_idempotency_key, v_user_id
    );
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
  END;

  -- خصم من المصدر
  v_ledger_from := gen_random_uuid();
  INSERT INTO ledger_entries (id, account_id, entry_type, amount, adjustment_direction, reference_type, description, created_by)
  VALUES (v_ledger_from, p_from_account_id, 'adjustment', p_amount, 'decrease', 'transfer',
    'تحويل داخلي إلى حساب آخر — ' || v_transfer_num, v_user_id);
  UPDATE accounts SET current_balance = current_balance - p_amount WHERE id = p_from_account_id;

  -- إضافة للمستقبل
  v_ledger_to := gen_random_uuid();
  INSERT INTO ledger_entries (id, account_id, entry_type, amount, adjustment_direction, reference_type, description, created_by)
  VALUES (v_ledger_to, p_to_account_id, 'adjustment', p_amount, 'increase', 'transfer',
    'تحويل داخلي من حساب آخر — ' || v_transfer_num, v_user_id);
  UPDATE accounts SET current_balance = current_balance + p_amount WHERE id = p_to_account_id;

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'create_transfer', 'transfers', v_transfer_id,
    'تحويل داخلي ' || p_amount || ' د.أ — ' || v_transfer_num,
    jsonb_build_object('from', p_from_account_id, 'to', p_to_account_id, 'amount', p_amount, 'idempotency_key', p_idempotency_key));

  RETURN jsonb_build_object(
    'transfer_id', v_transfer_id,
    'transfer_number', v_transfer_num,
    'ledger_entry_ids', jsonb_build_array(v_ledger_from, v_ledger_to)
  );
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  11. reconcile_account() — تسوية حساب        │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION reconcile_account(
  p_account_id     UUID,
  p_actual_balance DECIMAL,
  p_notes          TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id     UUID := auth.uid();
  v_recon_id    UUID := gen_random_uuid();
  v_expected    DECIMAL(12,3);
  v_difference  DECIMAL(12,3);
BEGIN
  SELECT fn_calc_account_ledger_balance(p_account_id) INTO v_expected;
  IF v_expected IS NULL THEN RAISE EXCEPTION 'ERR_ACCOUNT_NOT_FOUND'; END IF;

  v_difference := p_actual_balance - v_expected;

  INSERT INTO reconciliation_entries (
    id, account_id, expected_balance, actual_balance,
    difference, difference_reason, created_by
  ) VALUES (
    v_recon_id, p_account_id, v_expected, p_actual_balance,
    v_difference, COALESCE(p_notes, 'بدون ملاحظات'), v_user_id
  );

  -- إذا يوجد فرق: تسوية + إشعار
  IF v_difference <> 0 THEN
    INSERT INTO ledger_entries (
      account_id, entry_type, amount, adjustment_direction,
      reference_type, reference_id, description, created_by
    ) VALUES (
      p_account_id, 'adjustment', ABS(v_difference),
      CASE WHEN v_difference > 0 THEN 'increase' ELSE 'decrease' END,
      'reconciliation', v_recon_id,
      'تسوية حساب — الفرق: ' || v_difference, v_user_id
    );

    UPDATE accounts SET current_balance = p_actual_balance WHERE id = p_account_id;

    INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
    SELECT p.id, 'reconciliation_difference',
      'فرق في تسوية حساب', 'الفرق: ' || v_difference || ' د.أ',
      'account', p_account_id
    FROM profiles p WHERE p.role = 'admin';
  END IF;

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'reconcile_account', 'reconciliation_entries', v_recon_id,
    'تسوية حساب', jsonb_build_object('expected', v_expected, 'actual', p_actual_balance, 'diff', v_difference));

  RETURN jsonb_build_object(
    'reconciliation_id', v_recon_id, 'expected', v_expected,
    'actual', p_actual_balance, 'difference', v_difference
  );
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  12. create_daily_snapshot() — لقطة يومية    │
-- └─────────────────────────────────────────────┘

-- Remove legacy overload to keep one canonical command signature.
DROP FUNCTION IF EXISTS create_daily_snapshot(DATE, TEXT);
DROP FUNCTION IF EXISTS create_daily_snapshot(DATE, TEXT, UUID);

CREATE OR REPLACE FUNCTION create_daily_snapshot(
  p_snapshot_date DATE DEFAULT CURRENT_DATE, -- ADR-034: تم تقييد التاريخ بـ CURRENT_DATE فقط
  p_notes         TEXT DEFAULT NULL,
  p_created_by    UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id       UUID;
  v_snapshot_id   UUID := gen_random_uuid();
  v_sales         DECIMAL(12,3);
  v_cost          DECIMAL(12,3);
  v_returns       DECIMAL(12,3);
  v_inv_count     INT;
  v_ret_count     INT;
  v_debt_added    DECIMAL(12,3);
  v_debt_collected DECIMAL(12,3);
  v_expenses      DECIMAL(12,3);
  v_purchases     DECIMAL(12,3);
  v_accounts_snap JSONB;
  v_existing_snapshot RECORD;
BEGIN
  v_user_id := fn_require_admin_actor(p_created_by);

  -- ADR-034: منع اللقطات بأثر رجعي
  IF p_snapshot_date <> CURRENT_DATE THEN
    RAISE EXCEPTION 'ERR_VALIDATION_SNAPSHOT_DATE';
  END IF;

  -- Fix #4: تضمين المرتجعة جزئياً لعدم مسح المبيعات السليمة المتبقية من اللقطة
  SELECT COALESCE(SUM(i.total_amount), 0), COALESCE(COUNT(DISTINCT i.id), 0), COALESCE(SUM(ii.quantity * ii.cost_price_at_time), 0) 
    INTO v_sales, v_inv_count, v_cost
    FROM invoices i
    LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
    WHERE i.invoice_date = p_snapshot_date AND i.status IN ('active', 'partially_returned');

  SELECT COALESCE(SUM(total_amount), 0), COALESCE(COUNT(*), 0) INTO v_returns, v_ret_count
    FROM returns WHERE return_date = p_snapshot_date;

  SELECT COALESCE(SUM(amount), 0) INTO v_debt_added
    FROM debt_entries WHERE due_date >= p_snapshot_date
    AND created_at >= p_snapshot_date AND created_at < p_snapshot_date + INTERVAL '1 day';

  SELECT COALESCE(SUM(amount), 0) INTO v_debt_collected
    FROM debt_payments WHERE payment_date = p_snapshot_date;

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
    FROM expenses WHERE expense_date = p_snapshot_date;

  SELECT COALESCE(SUM(total_amount), 0) INTO v_purchases
    FROM purchase_orders WHERE purchase_date = p_snapshot_date AND is_paid = true;

  -- لقطة أرصدة الحسابات
  SELECT jsonb_object_agg(name, current_balance) INTO v_accounts_snap
    FROM accounts WHERE is_active = true;

  BEGIN
    INSERT INTO daily_snapshots (
      id, snapshot_date, total_sales, total_returns, net_sales,
      total_cost, gross_profit, net_profit,
      invoice_count, return_count, total_debt_added, total_debt_collected,
      total_expenses, total_purchases, accounts_snapshot, notes, created_by
    ) VALUES (
      v_snapshot_id, p_snapshot_date, v_sales, v_returns, v_sales - v_returns,
      v_cost, (v_sales - v_returns) - v_cost, ((v_sales - v_returns) - v_cost) - v_expenses,
      v_inv_count, v_ret_count, v_debt_added, v_debt_collected,
      v_expenses, v_purchases, v_accounts_snap, p_notes, v_user_id
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Natural-key replay: نفس اليوم يعيد نفس اللقطة بدون إنشاء سجل جديد.
      SELECT *
        INTO v_existing_snapshot
        FROM daily_snapshots
       WHERE snapshot_date = p_snapshot_date
       LIMIT 1;

      RETURN jsonb_build_object(
        'snapshot_id', v_existing_snapshot.id,
        'total_sales', v_existing_snapshot.total_sales,
        'net_sales', v_existing_snapshot.net_sales,
        'net_profit', v_existing_snapshot.net_profit,
        'invoice_count', v_existing_snapshot.invoice_count,
        'is_replay', true
      );
  END;

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'create_daily_snapshot', 'daily_snapshots', v_snapshot_id,
    'لقطة يومية ' || p_snapshot_date,
    jsonb_build_object('sales', v_sales, 'net', v_sales - v_returns, 'profit', ((v_sales - v_returns) - v_cost) - v_expenses));

  RETURN jsonb_build_object(
    'snapshot_id', v_snapshot_id, 'total_sales', v_sales,
    'net_sales', v_sales - v_returns, 'net_profit', ((v_sales - v_returns) - v_cost) - v_expenses, 'invoice_count', v_inv_count,
    'is_replay', false
  );
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  13. create_maintenance_job() — أمر صيانة    │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION create_maintenance_job(
  p_customer_name   VARCHAR,
  p_device_type     VARCHAR,
  p_issue_description TEXT,
  p_customer_phone  VARCHAR DEFAULT NULL,
  p_estimated_cost  DECIMAL DEFAULT NULL,
  p_notes           TEXT DEFAULT NULL,
  p_idempotency_key UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id  UUID := auth.uid();
  v_job_id   UUID := gen_random_uuid();
  v_job_num  VARCHAR;
BEGIN
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM maintenance_jobs WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
    END IF;
  END IF;

  v_job_num := fn_generate_number('MNT');

  INSERT INTO maintenance_jobs (
    id, job_number, customer_name, customer_phone, device_type,
    issue_description, estimated_cost, notes, idempotency_key, created_by
  ) VALUES (
    v_job_id, v_job_num, p_customer_name, p_customer_phone, p_device_type,
    p_issue_description, p_estimated_cost, p_notes, p_idempotency_key, v_user_id
  );

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'create_maintenance_job', 'maintenance_jobs', v_job_id,
    'أمر صيانة ' || v_job_num,
    jsonb_build_object('customer', p_customer_name, 'device', p_device_type));

  RETURN jsonb_build_object('job_id', v_job_id, 'job_number', v_job_num, 'status', 'new');
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  14. complete_inventory_count() — إكمال جرد  │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION complete_inventory_count(
  p_inventory_count_id UUID,
  p_items              JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id       UUID := auth.uid();
  v_count         RECORD;
  v_item          JSONB;
  v_adjusted      INT := 0;
  v_total_diff    INT := 0;
  v_sys_qty       INT;
  v_act_qty       INT;
  v_diff          INT;
BEGIN
  SELECT * INTO v_count FROM inventory_counts WHERE id = p_inventory_count_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ERR_COUNT_NOT_FOUND'; END IF;
  IF v_count.status = 'completed' THEN RAISE EXCEPTION 'ERR_COUNT_ALREADY_COMPLETED'; END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_act_qty := (v_item->>'actual_quantity')::INT;
    IF v_act_qty < 0 THEN RAISE EXCEPTION 'ERR_VALIDATION_NEGATIVE_QUANTITY'; END IF;

    -- جلب الكمية الحالية من النظام
    SELECT stock_quantity INTO v_sys_qty FROM products
      WHERE id = (v_item->>'product_id')::UUID FOR UPDATE;

    v_diff := v_act_qty - v_sys_qty;

    -- إدخال/تحديث بند الجرد
    INSERT INTO inventory_count_items (
      inventory_count_id, product_id, system_quantity, actual_quantity,
      difference, reason
    ) VALUES (
      p_inventory_count_id, (v_item->>'product_id')::UUID,
      v_sys_qty, v_act_qty, v_diff,
      COALESCE(v_item->>'reason', NULL)
    )
    ON CONFLICT ON CONSTRAINT uq_count_product DO UPDATE SET
      actual_quantity = EXCLUDED.actual_quantity,
      difference = EXCLUDED.difference,
      reason = EXCLUDED.reason;

    -- تحديث المخزون إذا يوجد فرق
    IF v_diff <> 0 THEN
      UPDATE products SET stock_quantity = v_act_qty
        WHERE id = (v_item->>'product_id')::UUID;
      v_adjusted := v_adjusted + 1;
      v_total_diff := v_total_diff + ABS(v_diff);
    END IF;
  END LOOP;

  -- إكمال الجرد
  UPDATE inventory_counts SET status = 'completed', completed_at = now()
    WHERE id = p_inventory_count_id;

  -- إشعار إذا يوجد فروقات
  IF v_adjusted > 0 THEN
    INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
    SELECT p.id, 'low_stock',
      'فروقات جرد: ' || v_adjusted || ' منتج',
      'إجمالي الفرق: ' || v_total_diff || ' وحدة',
      'inventory_count', p_inventory_count_id
    FROM profiles p WHERE p.role = 'admin';
  END IF;

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'complete_inventory_count', 'inventory_counts', p_inventory_count_id,
    'إكمال جرد', jsonb_build_object('adjusted', v_adjusted, 'total_diff', v_total_diff));

  RETURN jsonb_build_object(
    'count_id', p_inventory_count_id, 'adjusted_products', v_adjusted,
    'total_difference', v_total_diff
  );
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  15. create_debt_manual() — دين يدوي         │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION create_debt_manual(
  p_debt_customer_id UUID,
  p_amount           DECIMAL,
  p_description      VARCHAR DEFAULT NULL,
  p_idempotency_key  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_entry_id UUID := gen_random_uuid();
  v_customer RECORD;
BEGIN
  IF p_amount <= 0 THEN RAISE EXCEPTION 'ERR_VALIDATION_NEGATIVE_AMOUNT'; END IF;

  IF p_idempotency_key IS NULL THEN
    RAISE EXCEPTION 'ERR_VALIDATION_REQUIRED_FIELD';
  END IF;

  IF EXISTS (SELECT 1 FROM debt_entries WHERE idempotency_key = p_idempotency_key) THEN
    RAISE EXCEPTION 'ERR_IDEMPOTENCY';
  END IF;

  SELECT * INTO v_customer FROM debt_customers WHERE id = p_debt_customer_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ERR_CUSTOMER_NOT_FOUND'; END IF;

  BEGIN
    INSERT INTO debt_entries (
      id, debt_customer_id, entry_type, amount, due_date,
      description, remaining_amount, idempotency_key, created_by
    ) VALUES (
      v_entry_id, p_debt_customer_id, 'manual', p_amount,
      CURRENT_DATE + v_customer.due_date_days,
      COALESCE(p_description, 'Manual debt'), p_amount,
      p_idempotency_key, v_user_id
    );
  EXCEPTION
    WHEN unique_violation THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
  END;

  UPDATE debt_customers SET current_balance = current_balance + p_amount
    WHERE id = p_debt_customer_id;

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'create_debt_manual', 'debt_entries', v_entry_id,
    'دين يدوي', jsonb_build_object('amount', p_amount, 'customer_id', p_debt_customer_id));

  RETURN jsonb_build_object('debt_entry_id', v_entry_id);
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  16. edit_invoice() — تعديل فاتورة           │
-- └─────────────────────────────────────────────┘

DROP FUNCTION IF EXISTS edit_invoice(UUID, JSONB, JSONB, UUID, VARCHAR, UUID);

CREATE OR REPLACE FUNCTION edit_invoice(
  p_invoice_id        UUID,
  p_items             JSONB,
  p_payments          JSONB,
  p_debt_customer_id  UUID DEFAULT NULL,
  p_edit_reason       VARCHAR DEFAULT '',
  p_idempotency_key   UUID DEFAULT NULL,
  p_created_by        UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id         UUID;
  v_invoice         RECORD;
  v_item            JSONB;
  v_payment         JSONB;
  v_old_item        RECORD;
  v_old_payment     RECORD;
  v_product         RECORD;
  v_account         RECORD;
  v_subtotal        DECIMAL(12,3) := 0;
  v_total_discount  DECIMAL(12,3) := 0;
  v_total_amount    DECIMAL(12,3) := 0;
  v_debt_amount     DECIMAL(12,3) := 0;
  v_item_discount_pct  DECIMAL(5,2);
  v_item_discount_amt  DECIMAL(12,3);
  v_item_total      DECIMAL(12,3);
  v_line_subtotal   DECIMAL(12,3);
  v_pay_total       DECIMAL(12,3) := 0;
  v_fee             DECIMAL(12,3);
  v_net             DECIMAL(12,3);
  v_change          DECIMAL(12,3) := 0;
  v_max_discount    DECIMAL(5,2);
  v_low_stock_thresh INT;
  v_reason_min_chars INT := 50;
  v_old_values      JSONB;
  v_new_values      JSONB;
BEGIN
  v_user_id := fn_require_admin_actor(p_created_by);

  -- ═══ Authorization (Admin فقط) ═══
  -- ═══ Idempotency ═══
  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM audit_logs
      WHERE action_type = 'edit_invoice'
        AND new_values->>'idempotency_key' = p_idempotency_key::TEXT
    ) THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
    END IF;
  END IF;

  -- ═══ جلب إعدادات النظام ═══
  SELECT value::DECIMAL INTO v_max_discount
    FROM system_settings WHERE key = 'max_pos_discount_percentage';
  SELECT value::INT INTO v_low_stock_thresh
    FROM system_settings WHERE key = 'low_stock_threshold';
  SELECT COALESCE(
    (SELECT value::INT FROM system_settings WHERE key = 'require_reason_min_chars'), 50
  ) INTO v_reason_min_chars;

  -- ═══ التحقق من سبب التعديل ═══
  IF p_edit_reason IS NULL OR length(btrim(p_edit_reason)) < v_reason_min_chars THEN
    RAISE EXCEPTION 'ERR_CANCEL_REASON';
  END IF;

  -- ═══ قفل الفاتورة ═══
  SELECT * INTO v_invoice FROM invoices WHERE id = p_invoice_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'ERR_INVOICE_NOT_FOUND'; END IF;
  IF v_invoice.status <> 'active' THEN RAISE EXCEPTION 'ERR_CANCEL_ALREADY'; END IF;

  -- ═══ لا مرتجعات ═══
  IF EXISTS (SELECT 1 FROM returns WHERE original_invoice_id = p_invoice_id) THEN
    RAISE EXCEPTION 'ERR_CANCEL_HAS_RETURN';
  END IF;

  -- ═══ حماية: منع تعديل فاتورة دينها مسدد جزئياً ═══
  IF v_invoice.debt_amount > 0 AND EXISTS (
    SELECT 1 FROM debt_entries
    WHERE invoice_id = p_invoice_id AND entry_type = 'from_invoice' AND paid_amount > 0
  ) THEN
    RAISE EXCEPTION 'ERR_UNAUTHORIZED';
  END IF;

  -- قفل عملاء الدين
  IF v_invoice.debt_customer_id IS NOT NULL THEN
    PERFORM 1 FROM debt_customers WHERE id = v_invoice.debt_customer_id FOR UPDATE;
  END IF;
  IF p_debt_customer_id IS NOT NULL AND p_debt_customer_id IS DISTINCT FROM v_invoice.debt_customer_id THEN
    PERFORM 1 FROM debt_customers WHERE id = p_debt_customer_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_CUSTOMER_NOT_FOUND'; END IF;
  END IF;

  -- حفظ القيم القديمة
  v_old_values := jsonb_build_object(
    'subtotal', v_invoice.subtotal, 'discount_amount', v_invoice.discount_amount,
    'total_amount', v_invoice.total_amount, 'debt_amount', v_invoice.debt_amount,
    'debt_customer_id', v_invoice.debt_customer_id);

  -- ════════════════════════════════════════════
  -- المرحلة 1: عكس العمليات القديمة
  -- ════════════════════════════════════════════

  -- عكس المدفوعات القديمة
  FOR v_old_payment IN SELECT * FROM payments WHERE invoice_id = p_invoice_id LOOP
    INSERT INTO ledger_entries (
      account_id, entry_type, amount, reference_type, reference_id, description, created_by
    ) VALUES (
      v_old_payment.account_id, 'expense', v_old_payment.net_amount,
      'reversal', p_invoice_id,
      'عكس قيد تعديل فاتورة ' || v_invoice.invoice_number, v_user_id);
    UPDATE accounts SET current_balance = current_balance - v_old_payment.net_amount
      WHERE id = v_old_payment.account_id;
  END LOOP;

  -- إرجاع المخزون القديم
  FOR v_old_item IN
    SELECT ii.product_id, ii.quantity, p.track_stock
    FROM invoice_items ii JOIN products p ON p.id = ii.product_id
    WHERE ii.invoice_id = p_invoice_id FOR UPDATE OF p
  LOOP
    IF v_old_item.track_stock THEN
      UPDATE products SET stock_quantity = stock_quantity + v_old_item.quantity
        WHERE id = v_old_item.product_id;
    END IF;
  END LOOP;

  -- عكس الدين القديم
  IF v_invoice.debt_amount > 0 AND v_invoice.debt_customer_id IS NOT NULL THEN
    UPDATE debt_customers SET current_balance = current_balance - v_invoice.debt_amount
      WHERE id = v_invoice.debt_customer_id;
    UPDATE debt_entries SET is_paid = true, paid_amount = amount, remaining_amount = 0
      WHERE invoice_id = p_invoice_id AND entry_type = 'from_invoice' AND is_paid = false;
  END IF;

  -- ════════════════════════════════════════════
  -- المرحلة 2: تنفيذ العمليات الجديدة
  -- ════════════════════════════════════════════

  DELETE FROM payments WHERE invoice_id = p_invoice_id;
  DELETE FROM invoice_items WHERE invoice_id = p_invoice_id;

  -- إعادة إنشاء البنود (Server-Authoritative Pricing — ADR-043)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    SELECT id, name, sale_price, cost_price, stock_quantity, track_stock
      INTO v_product FROM products WHERE id = (v_item->>'product_id')::UUID FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_PRODUCT_NOT_FOUND'; END IF;

    IF v_product.track_stock AND v_product.stock_quantity < (v_item->>'quantity')::INT THEN
      RAISE EXCEPTION 'ERR_STOCK_INSUFFICIENT';
    END IF;

    v_item_discount_pct := COALESCE((v_item->>'discount_percentage')::DECIMAL, 0);
    v_line_subtotal := v_product.sale_price * (v_item->>'quantity')::INT;
    v_item_discount_amt := ROUND(v_line_subtotal * v_item_discount_pct / 100, 3);
    v_item_total := v_line_subtotal - v_item_discount_amt;

    INSERT INTO invoice_items (
      id, invoice_id, product_id, product_name_at_time,
      quantity, unit_price, cost_price_at_time,
      discount_percentage, discount_amount, total_price
    ) VALUES (
      gen_random_uuid(), p_invoice_id, v_product.id, v_product.name,
      (v_item->>'quantity')::INT, v_product.sale_price,
      COALESCE(v_product.cost_price, 0),
      v_item_discount_pct, v_item_discount_amt, v_item_total);

    IF v_product.track_stock THEN
      UPDATE products SET stock_quantity = stock_quantity - (v_item->>'quantity')::INT
        WHERE id = v_product.id;
      IF (v_product.stock_quantity - (v_item->>'quantity')::INT) <= v_low_stock_thresh THEN
        INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
        SELECT p.id, 'low_stock', 'مخزون منخفض: ' || v_product.name,
          'الكمية المتبقية: ' || (v_product.stock_quantity - (v_item->>'quantity')::INT),
          'product', v_product.id
        FROM profiles p WHERE p.role = 'admin';
      END IF;
    END IF;

    v_subtotal := v_subtotal + v_line_subtotal;
    v_total_discount := v_total_discount + v_item_discount_amt;
  END LOOP;

  v_total_amount := v_subtotal - v_total_discount;

  -- حساب الدين والباقي
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments) LOOP
    v_pay_total := v_pay_total + (v_payment->>'amount')::DECIMAL;
  END LOOP;

  IF p_debt_customer_id IS NOT NULL THEN
    v_debt_amount := v_total_amount - v_pay_total;
    IF v_debt_amount < 0 THEN v_change := ABS(v_debt_amount); v_debt_amount := 0; END IF;
  ELSE
    IF v_pay_total < v_total_amount THEN RAISE EXCEPTION 'ERR_PAYMENT_MISMATCH'; END IF;
    v_change := v_pay_total - v_total_amount;
  END IF;

  -- تحديث الفاتورة
  UPDATE invoices SET
    subtotal = v_subtotal, discount_amount = v_total_discount,
    total_amount = v_total_amount, debt_amount = v_debt_amount,
    debt_customer_id = p_debt_customer_id
  WHERE id = p_invoice_id;

  -- إنشاء المدفوعات + القيود الجديدة
  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments) LOOP
    SELECT id, fee_percentage INTO v_account
      FROM accounts WHERE id = (v_payment->>'account_id')::UUID;
    v_net := (v_payment->>'amount')::DECIMAL;
    IF v_change > 0 AND v_net > v_change THEN
      v_net := v_net - v_change; v_change := 0;
    ELSIF v_change > 0 AND v_net <= v_change THEN
      v_change := v_change - v_net; v_net := 0;
    END IF;
    IF v_net > 0 THEN
      v_fee := ROUND(v_net * v_account.fee_percentage / 100, 3);
      v_net := v_net - v_fee;
      INSERT INTO payments (invoice_id, account_id, amount, fee_amount, net_amount)
      VALUES (p_invoice_id, v_account.id, v_net + v_fee, v_fee, v_net);
      INSERT INTO ledger_entries (
        account_id, entry_type, amount, reference_type, reference_id, description, created_by
      ) VALUES (v_account.id, 'income', v_net, 'invoice', p_invoice_id,
        'تعديل فاتورة بيع ' || v_invoice.invoice_number, v_user_id);
      UPDATE accounts SET current_balance = current_balance + v_net WHERE id = v_account.id;
    END IF;
  END LOOP;

  -- إنشاء دين جديد
  IF v_debt_amount > 0 AND p_debt_customer_id IS NOT NULL THEN
    INSERT INTO debt_entries (
      debt_customer_id, entry_type, invoice_id, amount,
      due_date, remaining_amount, created_by
    ) VALUES (
      p_debt_customer_id, 'from_invoice', p_invoice_id, v_debt_amount,
      CURRENT_DATE + (SELECT due_date_days FROM debt_customers WHERE id = p_debt_customer_id),
      v_debt_amount, v_user_id);
    UPDATE debt_customers SET current_balance = current_balance + v_debt_amount
      WHERE id = p_debt_customer_id;
    IF (
      SELECT COALESCE(SUM(remaining_amount), 0)
      FROM debt_entries
      WHERE debt_customer_id = p_debt_customer_id
        AND is_paid = false
    ) > (SELECT credit_limit FROM debt_customers WHERE id = p_debt_customer_id) THEN
      INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
      SELECT p.id, 'debt_limit_exceeded', 'تجاوز حد الدين',
        'العميل تجاوز حد الدين المسموح (بعد تعديل فاتورة)', 'invoice', p_invoice_id
      FROM profiles p WHERE p.role = 'admin';
    END IF;
  END IF;

  -- ═══ إشعار + سجل تدقيق ═══
  INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
  SELECT p.id, 'retroactive_edit',
    'تعديل فاتورة: ' || v_invoice.invoice_number,
    'تم تعديل الفاتورة. السبب: ' || p_edit_reason ||
    ' | القديم: ' || v_invoice.total_amount || ' | الجديد: ' || v_total_amount,
    'invoice', p_invoice_id
  FROM profiles p WHERE p.role = 'admin';

  v_new_values := jsonb_build_object(
    'subtotal', v_subtotal, 'total_amount', v_total_amount,
    'debt_amount', v_debt_amount, 'edit_reason', p_edit_reason,
    'idempotency_key', p_idempotency_key);

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, old_values, new_values)
  VALUES (v_user_id, 'edit_invoice', 'invoices', p_invoice_id,
    'تعديل فاتورة ' || v_invoice.invoice_number, v_old_values, v_new_values);

  RETURN jsonb_build_object(
    'invoice_id', p_invoice_id, 'invoice_number', v_invoice.invoice_number, 'total', v_total_amount);
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  17. update_settings() — تعديل الإعدادات     │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION update_settings(
  p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id      UUID := auth.uid();
  v_update       JSONB;
  v_setting      RECORD;
  v_updated      INT := 0;
  v_key          VARCHAR;
  v_new_value    TEXT;
  v_old_value    TEXT;
BEGIN
  -- Admin فقط
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'ERR_UNAUTHORIZED';
  END IF;

  FOR v_update IN SELECT * FROM jsonb_array_elements(p_updates) LOOP
    v_key := v_update->>'key';
    v_new_value := v_update->>'value';

    -- التحقق من وجود المفتاح
    SELECT * INTO v_setting FROM system_settings WHERE key = v_key FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'ERR_SETTING_NOT_FOUND'; END IF;

    v_old_value := v_setting.value;

    -- التحقق من نوع القيمة
    IF v_setting.value_type = 'boolean' AND v_new_value NOT IN ('true', 'false') THEN
      RAISE EXCEPTION 'ERR_VALIDATION_INCORRECT_TYPE';
    END IF;
    IF v_setting.value_type = 'number' AND v_new_value !~ '^[0-9]+(\.[0-9]+)?$' THEN
      RAISE EXCEPTION 'ERR_VALIDATION_INCORRECT_TYPE';
    END IF;

    -- التحقق من النطاق
    IF v_setting.value_type = 'number' THEN
      IF v_key = 'max_pos_discount_percentage' AND (v_new_value::DECIMAL < 0 OR v_new_value::DECIMAL > 100) THEN
        RAISE EXCEPTION 'ERR_VALIDATION_OUT_OF_RANGE';
      END IF;
      IF v_key = 'low_stock_threshold' AND v_new_value::DECIMAL < 0 THEN
        RAISE EXCEPTION 'ERR_VALIDATION_OUT_OF_RANGE';
      END IF;
      IF v_key = 'default_credit_limit' AND v_new_value::DECIMAL < 0 THEN
        RAISE EXCEPTION 'ERR_VALIDATION_OUT_OF_RANGE';
      END IF;
      IF v_key = 'default_due_date_days' AND (v_new_value::INT < 1 OR v_new_value::INT > 365) THEN
        RAISE EXCEPTION 'ERR_VALIDATION_OUT_OF_RANGE';
      END IF;
      IF v_key = 'discount_warning_threshold' AND (v_new_value::DECIMAL < 0 OR v_new_value::DECIMAL > 100) THEN
        RAISE EXCEPTION 'ERR_VALIDATION_OUT_OF_RANGE';
      END IF;
    END IF;

    -- التحديث
    UPDATE system_settings SET
      value = v_new_value,
      updated_at = now(),
      updated_by = v_user_id
    WHERE key = v_key;

    -- Audit Log لكل تغيير
    INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, old_values, new_values)
    VALUES (v_user_id, 'update_setting', 'system_settings', v_setting.id,
      'تعديل إعداد ' || v_key || ': ' || v_old_value || ' → ' || v_new_value,
      jsonb_build_object(v_key, v_old_value),
      jsonb_build_object(v_key, v_new_value));

    v_updated := v_updated + 1;
  END LOOP;

  RETURN jsonb_build_object('success', true, 'updated_keys', v_updated);
END;
$$;


-- ┌─────────────────────────────────────────────┐
-- │  18. check_balance_drift() — فحص الأرصدة     │
-- └─────────────────────────────────────────────┘

CREATE OR REPLACE FUNCTION check_balance_drift()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id  UUID := auth.uid();
  v_drift    JSONB := '[]'::jsonb;
  v_acc      RECORD;
  v_calc     DECIMAL(12,3);
  v_diff     DECIMAL(12,3);
BEGIN
  -- التأكد من الصلاحيات (Admin فقط)
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = v_user_id AND role = 'admin') THEN
    RAISE EXCEPTION 'ERR_UNAUTHORIZED';
  END IF;

  FOR v_acc IN SELECT id, name, opening_balance, current_balance FROM accounts LOOP
    -- حساب الرصيد المدرج دفترياً
    SELECT COALESCE(SUM(
      CASE 
        WHEN entry_type = 'income' THEN amount
        WHEN entry_type = 'expense' THEN -amount
        WHEN entry_type = 'adjustment' AND adjustment_direction = 'increase' THEN amount
        WHEN entry_type = 'adjustment' AND adjustment_direction = 'decrease' THEN -amount
        ELSE 0
      END), 0) INTO v_calc
    FROM ledger_entries WHERE account_id = v_acc.id;

    v_calc := v_calc + v_acc.opening_balance;
    v_diff := v_acc.current_balance - v_calc;

    -- إذا كان هناك انحراف
    IF v_diff <> 0 THEN
      v_drift := v_drift || jsonb_build_object(
        'account_id', v_acc.id,
        'account_name', v_acc.name,
        'current_balance', v_acc.current_balance,
        'calculated_balance', v_calc,
        'drift', v_diff
      );

      -- تنبيه الإدارة فوراً عن الاختراق المحاسبي
      INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
      SELECT p.id, 'reconciliation_difference',
        'انحراف محاسبي في ' || v_acc.name,
        'الرصيد الفعلي: ' || v_acc.current_balance || ' — المحسوب: ' || v_calc || ' الفرق: ' || v_diff,
        'account', v_acc.id
      FROM profiles p WHERE p.role = 'admin';
    END IF;
  END LOOP;

  -- Audit Log للفحص (تأكيد إجراء الفحص)
  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (v_user_id, 'check_balance_drift', 'accounts', gen_random_uuid(),
    'تشغيل فحص انحراف الأرصدة (Balance Drift Check)', jsonb_build_object('drift_count', jsonb_array_length(v_drift), 'details', v_drift));

  RETURN jsonb_build_object('success', true, 'drift_count', jsonb_array_length(v_drift), 'drifts', v_drift);
END;
$$;

CREATE OR REPLACE FUNCTION fn_verify_balance_integrity()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN check_balance_drift();
END;
$$;

COMMENT ON FUNCTION check_balance_drift() IS
  'DEPRECATED alias. Canonical authority is fn_verify_balance_integrity().';

COMMENT ON FUNCTION fn_verify_balance_integrity() IS
  'Canonical financial integrity drift check (LOCK-DriftAuthority).';


-- ============================================================
-- ✅ نهاية المرحلة الرابعة
-- ============================================================
-- الملف يحتوي على:
--   • 1 دالة مساعدة (fn_generate_number)
--   • 17 دالة RPC (SECURITY DEFINER) للعمليات التشغيلية
--   • جميع الدوال Atomic — تنجح بالكامل أو Rollback
--   • SELECT FOR UPDATE لمنع التضارب المتزامن
--   • FIFO في create_debt_payment()
--   • Server-Authoritative pricing في create_sale() (ADR-043)
--
-- اختبار المرحلة:
--   1. استدعاء create_sale() ببيانات وهمية
--   2. التأكد من أن المخزون نقص والقيود سُجلت
--   3. استدعاء create_return() جزئي والتأكد من returned_quantity
--   4. استدعاء create_debt_payment() والتأكد من FIFO allocation
--   5. استدعاء cancel_invoice() والتأكد من العكس الكامل
--   6. استدعاء create_topup() والتأكد من القيدين (income + expense)
--   7. استدعاء create_transfer() والتأكد من التوازن
--   8. استدعاء reconcile_account() والتأكد من قيد التسوية
--   9. استدعاء complete_inventory_count() مع فروقات
--  10. التأكد من idempotency_key يمنع التكرار في كل الدوال
-- ============================================================

