-- ============================================================
-- آية موبايل — إصلاح تحذيرات Supabase Linter الأمنية (020)
-- التاريخ: 28 مارس 2026
-- يعتمد على: 019
-- ============================================================
-- يعالج:
--   1) SECURITY DEFINER views → security_invoker = true
--   2) function_search_path_mutable → SET search_path = public
--   3) create_sale overload (PGRST203) → حذف النسخة القديمة
--   4) Leaked password protection → يُفعّل من Dashboard فقط
-- ============================================================

BEGIN;

-- ============================================================
-- 1) إصلاح SECURITY DEFINER Views
--    الـ views حالياً تُشغل بصلاحيات owner بدلاً من المستخدم
--    الحل: إعادة إنشائها مع security_invoker = true
-- ============================================================

DROP VIEW IF EXISTS v_pos_products;
CREATE VIEW v_pos_products
WITH (security_invoker = true) AS
SELECT
  id, name, category, sku, description,
  sale_price, stock_quantity, min_stock_level,
  track_stock, is_quick_add, is_active,
  created_at, updated_at, created_by
FROM public.products
WHERE is_active = true;

DROP VIEW IF EXISTS v_pos_accounts;
CREATE VIEW v_pos_accounts
WITH (security_invoker = true) AS
SELECT
  id, name, type, module_scope, fee_percentage,
  is_active, display_order, created_at, updated_at
FROM public.accounts;

DROP VIEW IF EXISTS v_pos_debt_customers;
CREATE VIEW v_pos_debt_customers
WITH (security_invoker = true) AS
SELECT
  id, name, phone, address, current_balance,
  due_date_days, is_active, created_at, updated_at, created_by
FROM public.debt_customers;

DROP VIEW IF EXISTS admin_suppliers;
CREATE VIEW admin_suppliers
WITH (security_invoker = true) AS
SELECT * FROM public.suppliers
WHERE public.fn_is_admin();

-- إعادة ضبط الصلاحيات على Views
REVOKE ALL ON v_pos_products FROM PUBLIC, authenticated, anon;
REVOKE ALL ON v_pos_accounts FROM PUBLIC, authenticated, anon;
REVOKE ALL ON v_pos_debt_customers FROM PUBLIC, authenticated, anon;
REVOKE ALL ON admin_suppliers FROM PUBLIC, authenticated, anon;

GRANT SELECT ON v_pos_products TO authenticated;
GRANT SELECT ON v_pos_accounts TO authenticated;
GRANT SELECT ON v_pos_debt_customers TO authenticated;
GRANT SELECT ON admin_suppliers TO authenticated;

-- ============================================================
-- 2) حذف النسخة القديمة من create_sale (10 params)
--    هذا يحل مشكلة PGRST203 (function overloading)
--    النسخة الجديدة (019) تبقى بـ 11 param + search_path
-- ============================================================

DROP FUNCTION IF EXISTS create_sale(JSONB, JSONB, VARCHAR, VARCHAR, UUID, UUID, VARCHAR, TEXT, UUID, UUID);

-- ============================================================
-- 3) إضافة SET search_path = public لكل الـ functions
--    بدون search_path ثابت، مهاجم يمكنه إنشاء schema وهمي
-- ============================================================

-- ─── fn_generate_number ───
-- آخر نسخة في 013_expenses_notifications_v2_alignment.sql
CREATE OR REPLACE FUNCTION fn_generate_number(p_prefix VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year   INTEGER := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  v_seq    INTEGER;
  v_table  TEXT;
  v_col    TEXT;
BEGIN
  CASE p_prefix
    WHEN 'INV' THEN v_table := 'invoices';          v_col := 'invoice_number';
    WHEN 'RET' THEN v_table := 'returns';           v_col := 'return_number';
    WHEN 'PUR' THEN v_table := 'purchase_orders';   v_col := 'purchase_number';
    WHEN 'SPY' THEN v_table := 'supplier_payments'; v_col := 'payment_number';
    WHEN 'DPY' THEN v_table := 'debt_payments';     v_col := 'receipt_number';
    WHEN 'TOP' THEN v_table := 'topups';            v_col := 'topup_number';
    WHEN 'TRF' THEN v_table := 'transfers';         v_col := 'transfer_number';
    WHEN 'MNT' THEN v_table := 'maintenance_jobs';  v_col := 'job_number';
    WHEN 'EXP' THEN v_table := 'expenses';          v_col := 'expense_number';
    ELSE RAISE EXCEPTION 'Unknown prefix: %', p_prefix;
  END CASE;

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

-- ─── fn_calc_account_ledger_balance ───
CREATE OR REPLACE FUNCTION fn_calc_account_ledger_balance(p_account_id UUID)
RETURNS DECIMAL
LANGUAGE sql STABLE
SET search_path = public
AS $$
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

-- ─── fn_update_timestamp ───
CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ─── fn_verify_balance_integrity() — no params ───
ALTER FUNCTION fn_verify_balance_integrity()
  SET search_path = public;

-- ─── fn_verify_balance_integrity(UUID) — with param ───
ALTER FUNCTION fn_verify_balance_integrity(UUID)
  SET search_path = public;

-- ─── prevent_modify_append_only ───
ALTER FUNCTION prevent_modify_append_only()
  SET search_path = public;

-- ─── fn_generate_receipt_token ───
ALTER FUNCTION fn_generate_receipt_token()
  SET search_path = public;

-- ─── create_sale (النسخة الوحيدة — 11 param مع invoice discount) ───
CREATE OR REPLACE FUNCTION create_sale(
  p_items                       JSONB,
  p_payments                    JSONB,
  p_customer_name               VARCHAR DEFAULT NULL,
  p_customer_phone              VARCHAR DEFAULT NULL,
  p_debt_customer_id            UUID DEFAULT NULL,
  p_discount_by                 UUID DEFAULT NULL,
  p_pos_terminal                VARCHAR DEFAULT NULL,
  p_notes                       TEXT DEFAULT NULL,
  p_invoice_discount_percentage DECIMAL DEFAULT 0,
  p_idempotency_key             UUID DEFAULT NULL,
  p_created_by                  UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id                  UUID;
  v_invoice_id               UUID;
  v_invoice_number           VARCHAR;
  v_item                     JSONB;
  v_product                  RECORD;
  v_subtotal                 DECIMAL(12,3) := 0;
  v_total_discount           DECIMAL(12,3) := 0;
  v_total_amount             DECIMAL(12,3) := 0;
  v_debt_amount              DECIMAL(12,3) := 0;
  v_item_discount_pct        DECIMAL(5,2);
  v_item_discount_amt        DECIMAL(12,3);
  v_item_total               DECIMAL(12,3);
  v_line_subtotal            DECIMAL(12,3);
  v_payment                  JSONB;
  v_pay_total                DECIMAL(12,3) := 0;
  v_account                  RECORD;
  v_fee                      DECIMAL(12,3);
  v_net                      DECIMAL(12,3);
  v_max_discount             DECIMAL(5,2);
  v_bundle_discount_cap      DECIMAL(5,2);
  v_bundle_needs_approval    BOOLEAN := false;
  v_effective_discount_cap   DECIMAL(5,2);
  v_user_role                user_role;
  v_change                   DECIMAL(12,3) := 0;
  v_low_stock_thresh         INT;
  v_retry_count              INT := 0;
  v_max_retries              INT := 2;
  v_used_discount_override   BOOLEAN := false;
  v_max_applied_discount_pct DECIMAL(5,2) := 0;
  v_invoice_discount_pct     DECIMAL(5,2) := 0;
  v_invoice_discount_amt     DECIMAL(12,3) := 0;
BEGIN
  v_user_id := fn_require_actor(p_created_by);

  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM invoices WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
    END IF;
  END IF;

  SELECT value::DECIMAL INTO v_max_discount
    FROM system_settings WHERE key = 'max_pos_discount_percentage';
  SELECT value::INT INTO v_low_stock_thresh
    FROM system_settings WHERE key = 'low_stock_threshold';
  SELECT role INTO v_user_role FROM profiles WHERE id = v_user_id;

  SELECT
    policy.max_discount_percentage,
    policy.discount_requires_approval
  INTO
    v_bundle_discount_cap,
    v_bundle_needs_approval
  FROM fn_get_discount_policy(v_user_id, v_user_role) AS policy;

  v_effective_discount_cap := COALESCE(v_bundle_discount_cap, v_max_discount);

  v_invoice_number := fn_generate_number('INV');
  v_invoice_id := gen_random_uuid();

  INSERT INTO invoices (
    id, invoice_number, customer_name, customer_phone,
    subtotal, discount_amount, invoice_discount_percentage, invoice_discount_amount, discount_by, total_amount,
    debt_amount, debt_customer_id, status,
    pos_terminal_code, notes, idempotency_key, created_by
  ) VALUES (
    v_invoice_id, v_invoice_number, p_customer_name, p_customer_phone,
    0, 0, 0, 0, p_discount_by, 0,
    0, p_debt_customer_id, 'active',
    p_pos_terminal, p_notes, p_idempotency_key, v_user_id
  );

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
        SELECT id, name, sale_price, cost_price, stock_quantity, track_stock
          INTO v_product
          FROM products
          WHERE id = (v_item->>'product_id')::UUID
          FOR UPDATE;

        IF NOT FOUND THEN
          RAISE EXCEPTION 'ERR_PRODUCT_NOT_FOUND';
        END IF;

        IF v_product.track_stock AND
           v_product.stock_quantity < (v_item->>'quantity')::INT THEN
          RAISE EXCEPTION 'ERR_STOCK_INSUFFICIENT';
        END IF;

        v_item_discount_pct := COALESCE((v_item->>'discount_percentage')::DECIMAL, 0);
        v_max_applied_discount_pct := GREATEST(v_max_applied_discount_pct, v_item_discount_pct);

        IF v_user_role = 'pos_staff' THEN
          IF v_item_discount_pct > v_effective_discount_cap THEN
            RAISE EXCEPTION 'ERR_DISCOUNT_EXCEEDED';
          END IF;

          IF v_item_discount_pct > v_max_discount AND COALESCE(v_bundle_needs_approval, false) THEN
            RAISE EXCEPTION 'ERR_DISCOUNT_APPROVAL_REQUIRED';
          END IF;

          IF v_item_discount_pct > v_max_discount THEN
            v_used_discount_override := true;
          END IF;
        END IF;

        v_line_subtotal := v_product.sale_price * (v_item->>'quantity')::INT;
        v_item_discount_amt := ROUND(v_line_subtotal * v_item_discount_pct / 100, 3);
        v_item_total := v_line_subtotal - v_item_discount_amt;

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

        IF v_product.track_stock THEN
          UPDATE products
            SET stock_quantity = stock_quantity - (v_item->>'quantity')::INT
            WHERE id = v_product.id;

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
  v_invoice_discount_pct := COALESCE(p_invoice_discount_percentage, 0);

  IF v_invoice_discount_pct < 0 OR v_invoice_discount_pct > 100 THEN
    RAISE EXCEPTION 'ERR_INVALID_INVOICE_DISCOUNT';
  END IF;

  IF v_user_role = 'pos_staff' THEN
    IF v_invoice_discount_pct > v_effective_discount_cap THEN
      RAISE EXCEPTION 'ERR_DISCOUNT_EXCEEDED';
    END IF;

    IF v_invoice_discount_pct > v_max_discount AND COALESCE(v_bundle_needs_approval, false) THEN
      RAISE EXCEPTION 'ERR_DISCOUNT_APPROVAL_REQUIRED';
    END IF;

    IF v_invoice_discount_pct > v_max_discount THEN
      v_used_discount_override := true;
    END IF;
  END IF;

  v_max_applied_discount_pct := GREATEST(v_max_applied_discount_pct, v_invoice_discount_pct);
  v_invoice_discount_amt := ROUND(v_total_amount * v_invoice_discount_pct / 100, 3);
  v_total_amount := v_total_amount - v_invoice_discount_amt;

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
    FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments) LOOP
      v_pay_total := v_pay_total + (v_payment->>'amount')::DECIMAL;
    END LOOP;
    IF v_pay_total < v_total_amount THEN
      RAISE EXCEPTION 'ERR_PAYMENT_MISMATCH';
    END IF;
    v_change := v_pay_total - v_total_amount;
  END IF;

  UPDATE invoices
    SET subtotal = v_subtotal,
        discount_amount = v_total_discount,
        invoice_discount_percentage = v_invoice_discount_pct,
        invoice_discount_amount = v_invoice_discount_amt,
        discount_by = p_discount_by,
        total_amount = v_total_amount,
        debt_amount = v_debt_amount,
        debt_customer_id = p_debt_customer_id,
        customer_name = p_customer_name,
        customer_phone = p_customer_phone,
        pos_terminal_code = p_pos_terminal,
        notes = p_notes
  WHERE id = v_invoice_id;

  FOR v_payment IN SELECT * FROM jsonb_array_elements(p_payments) LOOP
    SELECT id, fee_percentage INTO v_account
      FROM accounts WHERE id = (v_payment->>'account_id')::UUID;

    v_net := (v_payment->>'amount')::DECIMAL;
    IF v_change > 0 AND v_net > v_change THEN
      v_net := v_net - v_change;
      v_change := 0;
    ELSIF v_change > 0 AND v_net <= v_change THEN
      v_change := v_change - v_net;
      v_net := 0;
    END IF;

    IF v_net > 0 THEN
      v_fee := ROUND(v_net * v_account.fee_percentage / 100, 3);
      v_net := v_net - v_fee;

      INSERT INTO payments (invoice_id, account_id, amount, fee_amount, net_amount)
      VALUES (v_invoice_id, v_account.id, v_net + v_fee, v_fee, v_net);

      INSERT INTO ledger_entries (
        account_id, entry_type, amount, reference_type, reference_id, description, created_by
      ) VALUES (
        v_account.id, 'income', v_net, 'invoice', v_invoice_id,
        'فاتورة بيع ' || v_invoice_number, v_user_id
      );

      UPDATE accounts SET current_balance = current_balance + v_net
        WHERE id = v_account.id;
    END IF;
  END LOOP;

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

  IF (v_total_discount + v_invoice_discount_amt) > 0 AND p_discount_by IS NOT NULL
     AND ((v_total_discount + v_invoice_discount_amt) / NULLIF(v_subtotal, 0) * 100) >= COALESCE(
       (SELECT value::DECIMAL FROM system_settings WHERE key = 'discount_warning_threshold'), 10
     ) THEN
    INSERT INTO notifications (user_id, type, title, body, reference_type, reference_id)
    SELECT p.id, 'large_discount',
      'خصم في فاتورة ' || v_invoice_number,
      'مبلغ الخصم: ' || (v_total_discount + v_invoice_discount_amt) || ' د.أ',
      'invoice', v_invoice_id
    FROM profiles p WHERE p.role = 'admin';
  END IF;

  IF v_used_discount_override THEN
    INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
    VALUES (
      v_user_id,
      'discount_override_bundle',
      'invoices',
      v_invoice_id,
      'تجاوز baseline الخصم عبر bundle',
      jsonb_build_object(
        'invoice_number', v_invoice_number,
        'baseline_cap', v_max_discount,
        'bundle_cap', v_bundle_discount_cap,
        'max_applied_discount_percentage', v_max_applied_discount_pct
      )
    );
  END IF;

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (
    v_user_id,
    'create_sale',
    'invoices',
    v_invoice_id,
    'إنشاء فاتورة ' || v_invoice_number,
    jsonb_build_object('total', v_total_amount, 'items_count', jsonb_array_length(p_items))
  );

  RETURN jsonb_build_object(
    'invoice_id', v_invoice_id,
    'invoice_number', v_invoice_number,
    'total', v_total_amount,
    'change', v_change
  );
END;
$$;

REVOKE ALL ON FUNCTION create_sale(JSONB, JSONB, VARCHAR, VARCHAR, UUID, UUID, VARCHAR, TEXT, DECIMAL, UUID, UUID)
  FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION create_sale(JSONB, JSONB, VARCHAR, VARCHAR, UUID, UUID, VARCHAR, TEXT, DECIMAL, UUID, UUID)
  TO service_role;

-- ─── cancel_invoice ───
-- 004: cancel_invoice(UUID, VARCHAR, UUID)
ALTER FUNCTION cancel_invoice(UUID, VARCHAR, UUID)
  SET search_path = public;

-- ─── create_return ───
-- 004: create_return(UUID, JSONB, UUID, return_type, VARCHAR, UUID, UUID)
ALTER FUNCTION create_return(UUID, JSONB, UUID, return_type, VARCHAR, UUID, UUID)
  SET search_path = public;

-- ─── create_debt_payment ───
-- 004: create_debt_payment(UUID, DECIMAL, UUID, TEXT, UUID, UUID, UUID)
ALTER FUNCTION create_debt_payment(UUID, DECIMAL, UUID, TEXT, UUID, UUID, UUID)
  SET search_path = public;

-- ─── create_expense ───
-- 013: create_expense(DECIMAL, UUID, UUID, VARCHAR, TEXT, UUID, UUID)
ALTER FUNCTION create_expense(DECIMAL, UUID, UUID, VARCHAR, TEXT, UUID, UUID)
  SET search_path = public;

-- ─── create_purchase ───
-- 009: create_purchase(UUID, JSONB, BOOLEAN, UUID, TEXT, UUID, UUID)
ALTER FUNCTION create_purchase(UUID, JSONB, BOOLEAN, UUID, TEXT, UUID, UUID)
  SET search_path = public;

-- ─── create_supplier_payment ───
-- 009: create_supplier_payment(UUID, UUID, DECIMAL, TEXT, UUID, UUID)
ALTER FUNCTION create_supplier_payment(UUID, UUID, DECIMAL, TEXT, UUID, UUID)
  SET search_path = public;

-- ─── create_topup ───
-- 018: create_topup(UUID, DECIMAL, DECIMAL, UUID, TEXT, UUID, UUID)
ALTER FUNCTION create_topup(UUID, DECIMAL, DECIMAL, UUID, TEXT, UUID, UUID)
  SET search_path = public;

-- ─── create_transfer ───
-- 010: create_transfer(UUID, UUID, DECIMAL, TEXT, UUID, UUID)
ALTER FUNCTION create_transfer(UUID, UUID, DECIMAL, TEXT, UUID, UUID)
  SET search_path = public;

-- ─── reconcile_account ───
ALTER FUNCTION reconcile_account(UUID, DECIMAL, TEXT, UUID)
  SET search_path = public;

-- ─── create_daily_snapshot ───
-- 004: create_daily_snapshot(DATE, TEXT, UUID)
ALTER FUNCTION create_daily_snapshot(DATE, TEXT, UUID)
  SET search_path = public;

-- ─── create_maintenance_job ───
-- 012: create_maintenance_job(VARCHAR, VARCHAR, TEXT, VARCHAR, DECIMAL, TEXT, UUID, UUID)
ALTER FUNCTION create_maintenance_job(VARCHAR, VARCHAR, TEXT, VARCHAR, DECIMAL, TEXT, UUID, UUID)
  SET search_path = public;

-- ─── update_maintenance_job_status ───
-- 012: update_maintenance_job_status(UUID, maintenance_status, DECIMAL, UUID, TEXT, UUID)
ALTER FUNCTION update_maintenance_job_status(UUID, maintenance_status, DECIMAL, UUID, TEXT, UUID)
  SET search_path = public;

-- ─── start_inventory_count ───
-- 011: start_inventory_count(inventory_count_type, UUID[], TEXT, UUID)
ALTER FUNCTION start_inventory_count(inventory_count_type, UUID[], TEXT, UUID)
  SET search_path = public;

-- ─── complete_inventory_count ───
-- آخر نسخة في 011
ALTER FUNCTION complete_inventory_count(UUID, JSONB, UUID)
  SET search_path = public;

-- ─── create_debt_manual ───
-- 004: create_debt_manual(UUID, DECIMAL, VARCHAR, UUID, UUID)
ALTER FUNCTION create_debt_manual(UUID, DECIMAL, VARCHAR, UUID, UUID)
  SET search_path = public;

-- ─── edit_invoice ───
-- 004: edit_invoice(UUID, JSONB, JSONB, UUID, VARCHAR, UUID, UUID)
ALTER FUNCTION edit_invoice(UUID, JSONB, JSONB, UUID, VARCHAR, UUID, UUID)
  SET search_path = public;

-- ─── update_settings ───
-- 004: update_settings(JSONB) — no p_created_by
ALTER FUNCTION update_settings(JSONB)
  SET search_path = public;

-- ─── check_balance_drift() — no params ───
ALTER FUNCTION check_balance_drift()
  SET search_path = public;

-- ─── check_balance_drift(UUID) — with param ───
ALTER FUNCTION check_balance_drift(UUID)
  SET search_path = public;

-- ─── issue_receipt_link ───
-- 014: issue_receipt_link(UUID, VARCHAR, INTEGER, BOOLEAN, UUID)
ALTER FUNCTION issue_receipt_link(UUID, VARCHAR, INTEGER, BOOLEAN, UUID)
  SET search_path = public;

-- ─── revoke_receipt_link ───
-- 014: revoke_receipt_link(UUID, UUID, UUID)
ALTER FUNCTION revoke_receipt_link(UUID, UUID, UUID)
  SET search_path = public;

-- ─── run_debt_reminder_scheduler ───
-- 014: run_debt_reminder_scheduler(VARCHAR, DATE, UUID)
ALTER FUNCTION run_debt_reminder_scheduler(VARCHAR, DATE, UUID)
  SET search_path = public;

-- ─── create_whatsapp_delivery_log ───
-- 014: create_whatsapp_delivery_log(VARCHAR, VARCHAR, VARCHAR, UUID, UUID, UUID)
ALTER FUNCTION create_whatsapp_delivery_log(VARCHAR, VARCHAR, VARCHAR, UUID, UUID, UUID)
  SET search_path = public;

-- ─── assign_permission_bundle ───
-- 015: assign_permission_bundle(UUID, VARCHAR, TEXT, UUID)
ALTER FUNCTION assign_permission_bundle(UUID, VARCHAR, TEXT, UUID)
  SET search_path = public;

-- ─── revoke_permission_bundle ───
-- 015: revoke_permission_bundle(UUID, VARCHAR, TEXT, UUID)
ALTER FUNCTION revoke_permission_bundle(UUID, VARCHAR, TEXT, UUID)
  SET search_path = public;

-- ─── fn_get_discount_policy ───
ALTER FUNCTION fn_get_discount_policy(UUID, user_role)
  SET search_path = public;

COMMIT;

-- ============================================================
-- ملاحظة: تفعيل Leaked Password Protection
-- يتم من Supabase Dashboard:
-- Authentication → Settings → Password Security
-- ✅ Enable leaked password protection
-- ============================================================
