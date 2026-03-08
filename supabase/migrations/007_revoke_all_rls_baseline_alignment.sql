-- ============================================================
-- آية موبايل — مواءمة Revoke-All-First و RLS baseline (007)
-- المرجع: 10_ADRs.md (ADR-042, ADR-044), 05_Database_Design.md, 18_Data_Retention_Privacy.md
-- التاريخ: 08 مارس 2026
-- يعتمد على: 001_foundation.sql .. 006_system_settings_seed_alignment.sql
-- ============================================================
-- الهدف:
--   1. إعادة تثبيت نموذج Revoke-All-First بشكل متوافق مع العقد المرجعي.
--   2. تطبيق Blind POS عبر Views آمنة (`v_pos_*`) بدل direct table read.
--   3. منع direct table read على `suppliers` حتى للـ Admin، مع إبقاء `admin_suppliers` view فقط.
--   4. تضييق سياسات SELECT على الجداول التي تتطلب own/self scope.
-- ============================================================

-- ============================================================
-- 1) إعادة ضبط الصلاحيات الأساسية
-- ============================================================

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, authenticated, anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, authenticated, anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM PUBLIC, authenticated, anon;

-- إزالة views قديمة خارج العقد قبل إعادة البناء.
DROP VIEW IF EXISTS admin_products;
DROP VIEW IF EXISTS admin_accounts;
DROP VIEW IF EXISTS admin_suppliers;
DROP VIEW IF EXISTS v_pos_products;
DROP VIEW IF EXISTS v_pos_accounts;
DROP VIEW IF EXISTS v_pos_debt_customers;

-- authenticated يحصل فقط على SELECT على الجداول التي يسمح لها بالقراءة المباشرة
-- ثم تُقيّد النتيجة فعليًا عبر RLS.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- suppliers خارج direct table read بالكامل (Admin/POS) حسب العقد.
REVOKE SELECT ON public.suppliers FROM authenticated;

-- لا استدعاء RPC مباشرة من المتصفح.
REVOKE EXECUTE ON ALL ROUTINES IN SCHEMA public FROM authenticated, anon;

-- ============================================================
-- 2) دالة مساعدة لتحديد Admin بدون الاعتماد على direct table read
-- ============================================================

CREATE OR REPLACE FUNCTION public.fn_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.fn_is_admin() FROM PUBLIC, authenticated, anon;
GRANT EXECUTE ON FUNCTION public.fn_is_admin() TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================
-- 3) Blind POS Views + Admin Suppliers View
-- ============================================================

CREATE VIEW v_pos_products
WITH (security_barrier) AS
SELECT
  id,
  name,
  category,
  sku,
  description,
  sale_price,
  stock_quantity,
  min_stock_level,
  track_stock,
  is_quick_add,
  is_active,
  created_at,
  updated_at,
  created_by
FROM public.products
WHERE is_active = true;

CREATE VIEW v_pos_accounts
WITH (security_barrier) AS
SELECT
  id,
  name,
  type,
  module_scope,
  fee_percentage,
  is_active,
  display_order,
  created_at,
  updated_at
FROM public.accounts;

CREATE VIEW v_pos_debt_customers
WITH (security_barrier) AS
SELECT
  id,
  name,
  phone,
  address,
  current_balance,
  due_date_days,
  is_active,
  created_at,
  updated_at,
  created_by
FROM public.debt_customers;

CREATE VIEW admin_suppliers
WITH (security_barrier) AS
SELECT *
FROM public.suppliers
WHERE public.fn_is_admin();

REVOKE ALL ON public.v_pos_products FROM PUBLIC, authenticated, anon;
REVOKE ALL ON public.v_pos_accounts FROM PUBLIC, authenticated, anon;
REVOKE ALL ON public.v_pos_debt_customers FROM PUBLIC, authenticated, anon;
REVOKE ALL ON public.admin_suppliers FROM PUBLIC, authenticated, anon;

GRANT SELECT ON public.v_pos_products TO authenticated;
GRANT SELECT ON public.v_pos_accounts TO authenticated;
GRANT SELECT ON public.v_pos_debt_customers TO authenticated;
GRANT SELECT ON public.admin_suppliers TO authenticated;

-- ============================================================
-- 4) تفعيل RLS على كل جداول public
-- ============================================================

DO $$
DECLARE
  t_name text;
BEGIN
  FOR t_name IN
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
  END LOOP;
END $$;

-- حذف السياسات القديمة قبل بناء baseline الجديد.
DO $$
DECLARE
  p record;
BEGIN
  FOR p IN
    SELECT tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, p.tablename);
  END LOOP;
END $$;

-- ============================================================
-- 5) سياسات SELECT المرجعية
-- ============================================================

-- 5.1 self / own scope
CREATE POLICY profiles_select_self_or_admin
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid() OR public.fn_is_admin());

CREATE POLICY invoices_select_own_or_admin
ON public.invoices
FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR public.fn_is_admin());

CREATE POLICY notifications_select_own_or_admin
ON public.notifications
FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR public.fn_is_admin());

-- 5.2 invoice details تبع invoice visibility
CREATE POLICY invoice_items_select_by_invoice_scope
ON public.invoice_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.invoices i
    WHERE i.id = invoice_items.invoice_id
      AND (i.created_by = auth.uid() OR public.fn_is_admin())
  )
);

CREATE POLICY payments_select_by_invoice_scope
ON public.payments
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.invoices i
    WHERE i.id = payments.invoice_id
      AND (i.created_by = auth.uid() OR public.fn_is_admin())
  )
);

-- 5.3 returns details تبع return ownership
CREATE POLICY returns_select_own_or_admin
ON public.returns
FOR SELECT
TO authenticated
USING (created_by = auth.uid() OR public.fn_is_admin());

CREATE POLICY return_items_select_by_return_scope
ON public.return_items
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.returns r
    WHERE r.id = return_items.return_id
      AND (r.created_by = auth.uid() OR public.fn_is_admin())
  )
);

-- 5.4 POS sees active expense categories only; Admin sees all.
CREATE POLICY expense_categories_select_active_or_admin
ON public.expense_categories
FOR SELECT
TO authenticated
USING (is_active = true OR public.fn_is_admin());

-- 5.5 Direct SELECT Admin-only tables
DO $$
DECLARE
  t_name text;
BEGIN
  FOREACH t_name IN ARRAY ARRAY[
    'products',
    'accounts',
    'debt_customers',
    'ledger_entries',
    'debt_payment_allocations',
    'purchase_orders',
    'purchase_items',
    'supplier_payments',
    'transfers',
    'reconciliation_entries',
    'daily_snapshots',
    'audit_logs',
    'system_settings'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY admin_only_direct_select ON public.%I FOR SELECT TO authenticated USING (public.fn_is_admin())',
      t_name
    );
  END LOOP;
END $$;

-- 5.6 General authenticated SELECT tables
DO $$
DECLARE
  t_name text;
BEGIN
  FOREACH t_name IN ARRAY ARRAY[
    'debt_entries',
    'debt_payments',
    'topups',
    'expenses',
    'maintenance_jobs',
    'inventory_counts',
    'inventory_count_items'
  ]
  LOOP
    EXECUTE format(
      'CREATE POLICY authenticated_select ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)',
      t_name
    );
  END LOOP;
END $$;

-- suppliers: no direct SELECT policy intentionally.

-- ============================================================
-- 6) Append-Only protections remain explicit
-- ============================================================

DROP POLICY IF EXISTS ledger_entries_no_update ON public.ledger_entries;
CREATE POLICY ledger_entries_no_update
ON public.ledger_entries
FOR UPDATE
TO authenticated, anon
USING (false);

DROP POLICY IF EXISTS ledger_entries_no_delete ON public.ledger_entries;
CREATE POLICY ledger_entries_no_delete
ON public.ledger_entries
FOR DELETE
TO authenticated, anon
USING (false);

DROP POLICY IF EXISTS audit_logs_no_update ON public.audit_logs;
CREATE POLICY audit_logs_no_update
ON public.audit_logs
FOR UPDATE
TO authenticated, anon
USING (false);

DROP POLICY IF EXISTS audit_logs_no_delete ON public.audit_logs;
CREATE POLICY audit_logs_no_delete
ON public.audit_logs
FOR DELETE
TO authenticated, anon
USING (false);

DROP POLICY IF EXISTS daily_snapshots_no_update ON public.daily_snapshots;
CREATE POLICY daily_snapshots_no_update
ON public.daily_snapshots
FOR UPDATE
TO authenticated, anon
USING (false);

DROP POLICY IF EXISTS daily_snapshots_no_delete ON public.daily_snapshots;
CREATE POLICY daily_snapshots_no_delete
ON public.daily_snapshots
FOR DELETE
TO authenticated, anon
USING (false);

-- ============================================================
-- ✅ نهاية 007
-- ============================================================
-- 1. direct table read على `suppliers` مغلق بالكامل.
-- 2. Blind POS على `products/accounts/debt_customers` صار عبر `v_pos_*` فقط.
-- 3. `profiles/invoices/notifications` لم تعد مكشوفة بقراءة مفتوحة لكل authenticated.
-- 4. authenticated لا يملك EXECUTE على RPC functions، باستثناء helper policy function.
-- ============================================================
