ALTER TABLE expense_categories
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

DROP TRIGGER IF EXISTS trg_expense_categories_updated_at ON expense_categories;
CREATE TRIGGER trg_expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

UPDATE notifications
SET read_at = COALESCE(read_at, updated_at)
WHERE is_read = true
  AND read_at IS NULL;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS expense_number VARCHAR(20);

CREATE OR REPLACE FUNCTION fn_generate_number(p_prefix VARCHAR)
RETURNS VARCHAR
LANGUAGE plpgsql SECURITY DEFINER AS $$
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

WITH numbered_expenses AS (
  SELECT
    id,
    EXTRACT(YEAR FROM created_at)::INT AS expense_year,
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(YEAR FROM created_at)::INT
      ORDER BY created_at ASC, id ASC
    ) AS seq
  FROM expenses
  WHERE expense_number IS NULL
)
UPDATE expenses AS expense
SET expense_number = 'AYA-' || numbered_expenses.expense_year::TEXT || '-' || LPAD(numbered_expenses.seq::TEXT, 5, '0')
FROM numbered_expenses
WHERE numbered_expenses.id = expense.id;

ALTER TABLE expenses
  ALTER COLUMN expense_number SET NOT NULL;

ALTER TABLE expenses
  DROP CONSTRAINT IF EXISTS expenses_expense_number_key;

ALTER TABLE expenses
  ADD CONSTRAINT expenses_expense_number_key UNIQUE (expense_number);

DROP POLICY IF EXISTS authenticated_select ON public.expenses;
DROP POLICY IF EXISTS expenses_select_own_or_admin ON public.expenses;
CREATE POLICY expenses_select_own_or_admin
ON public.expenses
FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR public.fn_is_admin());

DROP FUNCTION IF EXISTS create_expense(NUMERIC, UUID, UUID, VARCHAR, TEXT, UUID);
DROP FUNCTION IF EXISTS create_expense(NUMERIC, UUID, UUID, VARCHAR, TEXT, UUID, UUID);

CREATE OR REPLACE FUNCTION create_expense(
  p_amount          DECIMAL,
  p_account_id      UUID,
  p_category_id     UUID,
  p_description     VARCHAR,
  p_notes           TEXT DEFAULT NULL,
  p_idempotency_key UUID DEFAULT NULL,
  p_created_by      UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id      UUID;
  v_expense_id   UUID := gen_random_uuid();
  v_expense_num  VARCHAR;
  v_ledger_id    UUID := gen_random_uuid();
  v_category     RECORD;
  v_account      RECORD;
BEGIN
  v_user_id := fn_require_actor(p_created_by);

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'ERR_VALIDATION_NEGATIVE_AMOUNT';
  END IF;

  IF p_description IS NULL OR btrim(p_description) = '' THEN
    RAISE EXCEPTION 'ERR_VALIDATION_REQUIRED_FIELD';
  END IF;

  IF p_idempotency_key IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM expenses WHERE idempotency_key = p_idempotency_key) THEN
      RAISE EXCEPTION 'ERR_IDEMPOTENCY';
    END IF;
  END IF;

  SELECT id, is_active
  INTO v_category
  FROM expense_categories
  WHERE id = p_category_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_EXPENSE_CATEGORY_NOT_FOUND';
  END IF;

  IF v_category.is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'ERR_EXPENSE_CATEGORY_INACTIVE';
  END IF;

  SELECT id
  INTO v_account
  FROM accounts
  WHERE id = p_account_id
    AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'ERR_ACCOUNT_NOT_FOUND';
  END IF;

  v_expense_num := fn_generate_number('EXP');

  INSERT INTO expenses (
    id,
    expense_number,
    account_id,
    category_id,
    amount,
    description,
    notes,
    idempotency_key,
    created_by
  ) VALUES (
    v_expense_id,
    v_expense_num,
    p_account_id,
    p_category_id,
    p_amount,
    btrim(p_description),
    NULLIF(btrim(COALESCE(p_notes, '')), ''),
    p_idempotency_key,
    v_user_id
  );

  INSERT INTO ledger_entries (
    id,
    account_id,
    entry_type,
    amount,
    reference_type,
    reference_id,
    description,
    created_by
  ) VALUES (
    v_ledger_id,
    p_account_id,
    'expense',
    p_amount,
    'expense',
    v_expense_id,
    'مصروف ' || v_expense_num || ' — ' || btrim(p_description),
    v_user_id
  );

  UPDATE accounts
  SET current_balance = current_balance - p_amount
  WHERE id = p_account_id;

  INSERT INTO audit_logs (user_id, action_type, table_name, record_id, description, new_values)
  VALUES (
    v_user_id,
    'create_expense',
    'expenses',
    v_expense_id,
    'مصروف ' || v_expense_num,
    jsonb_build_object(
      'expense_number', v_expense_num,
      'amount', p_amount,
      'account_id', p_account_id,
      'category_id', p_category_id
    )
  );

  RETURN jsonb_build_object(
    'expense_id', v_expense_id,
    'expense_number', v_expense_num,
    'ledger_entry_id', v_ledger_id
  );
END;
$$;

REVOKE ALL ON FUNCTION create_expense(DECIMAL, UUID, UUID, VARCHAR, TEXT, UUID, UUID) FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION create_expense(DECIMAL, UUID, UUID, VARCHAR, TEXT, UUID, UUID) TO service_role;
