-- ============================================================
-- آية موبايل — المرحلة الأمنية (005_rls_security.sql)
-- المرجع: 10_ADRs.md (ADR-039, ADR-042, ADR-044), 05_Database_Design.md
-- التاريخ: 23 فبراير 2026
-- يعتمد على: 001, 002, 003, 004
-- ============================================================

-- ============================================================
-- 🔐 1. نظام (Revoke-All-First) - ADR-044
-- تطبيق مبدأ الثقة المعدومة (Zero Trust) لمنع الكتابة المباشرة
-- ============================================================

-- سحب جميع الصلاحيات من الأدوار العامة والموثقة (PUBLIC, authenticated, anon)
-- لجميع الجداول في الـ schema 'public'.
-- العمليات ستتم حصراً عبر دوال الـ RPC المستدعاة بصلاحيات (service_role) من طبقة سيرفر الـ Next.js (ADR-042).

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, authenticated, anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC, authenticated, anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM PUBLIC, authenticated, anon;

-- منح حق القراءة (SELECT) كإعداد مبدئي للكل
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;

-- ============================================================
-- 🔒 1.1 إغلاق ثغرة الـ Blind POS (Column-Level Security & Secure Views)
-- ============================================================
-- سحب الصلاحية العامة لقراءة الجداول التي تحتوي بيانات مالية لعملها كمغلق
REVOKE SELECT ON products FROM authenticated;
REVOKE SELECT ON accounts FROM authenticated;
REVOKE SELECT ON suppliers FROM authenticated;

-- منح موظف المبيعات (والكل عامةً) حق قراءة الأعمدة الضرورية للعمل فقط، مع حجب (التكلفة والأرصدة)
GRANT SELECT (id, name, category, sku, description, sale_price, stock_quantity, min_stock_level, track_stock, is_quick_add, is_active, created_at, updated_at, created_by) ON products TO authenticated;
GRANT SELECT (id, name, type, module_scope, fee_percentage, is_active, display_order, created_at, updated_at) ON accounts TO authenticated;
-- suppliers: no direct table SELECT for authenticated (POS/Admin read through admin_suppliers view or API).

-- إنشاء واجهات آمنة (Secure Views) تستعرض جميع الأعمدة ولكن محمية بشرط صارم على مستوى النظام
CREATE OR REPLACE VIEW admin_products WITH (security_barrier) AS
SELECT * FROM products WHERE EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');

CREATE OR REPLACE VIEW admin_accounts WITH (security_barrier) AS
SELECT * FROM accounts WHERE EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');

CREATE OR REPLACE VIEW admin_suppliers WITH (security_barrier) AS
SELECT * FROM suppliers WHERE EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin');

-- تفعيل الـ SELECT للـ Views (من لن يتحقق فيه الشرط سيرى 0 rows)
GRANT SELECT ON admin_products TO authenticated;
GRANT SELECT ON admin_accounts TO authenticated;
GRANT SELECT ON admin_suppliers TO authenticated;

-- منع استدعاء RPC مباشرة من المتصفح (ADR-042/044):
-- التنفيذ يتم حصراً عبر API باستخدام service_role.
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM authenticated, anon;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- ============================================================
-- 🛡️ 2. تفعيل سياسات Row Level Security (RLS)
-- ============================================================

DO $$ 
DECLARE 
  t_name text; 
BEGIN 
  FOR t_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
  LOOP 
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t_name);
  END LOOP; 
END $$;

-- ============================================================
-- 🔒 3. سياسات القراءة العامة للواجهة (Read-Only)
-- بما أن كل التعديلات تتم عبر دوال SECURITY DEFINER، فنحن نحتاج
-- فقط لسياسة SELECT للسماح للواجهة بعرض البيانات للمستخدمين
-- ============================================================

DO $$ 
DECLARE 
  t_name text; 
BEGIN 
  FOR t_name IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') 
  LOOP 
    -- التأكد من عدم وجود السياسات مسبقاً
    EXECUTE format('DROP POLICY IF EXISTS "Allow SELECT for authenticated users" ON public.%I', t_name);
    EXECUTE format('DROP POLICY IF EXISTS "Allow SELECT for admin only" ON public.%I', t_name);
    
    -- تطبيق السياسة بناءً على اسم الجدول
    IF t_name IN (
      'daily_snapshots',
      'expenses',
      'ledger_entries',
      'reconciliation_entries',
      'suppliers',
      'purchase_orders',
      'purchase_items',
      'supplier_payments',
      'topups',
      'transfers',
      'audit_logs',
      'system_settings'
    ) THEN
      -- الجداول المالية الحساسة: Admin فقط
      EXECUTE format('CREATE POLICY "Allow SELECT for admin only" ON public.%I FOR SELECT TO authenticated USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin'')
      )', t_name);
    ELSE
      -- باقي الجداول (مثل products, invoices, profiles): كل الموظفين
      EXECUTE format('CREATE POLICY "Allow SELECT for authenticated users" ON public.%I FOR SELECT TO authenticated USING (auth.uid() IS NOT NULL)', t_name);
    END IF;
  END LOOP; 
END $$;

-- ============================================================
-- 🚫 4. الإغلاق الفولاذي للجداول الحساسة (Append-Only)
-- تطبيق قرارات التنظيم المحاسبي والتدقيق (ADR-039)
-- يمنع بشكل قاطع أي عملية UPDATE أو DELETE على جداول القيود والتدقيق
-- ============================================================

-- 4.1 قيود السجل المحاسبي (ledger_entries)
DROP POLICY IF EXISTS "ledger_entries_no_update" ON ledger_entries;
CREATE POLICY "ledger_entries_no_update" ON ledger_entries FOR UPDATE TO authenticated, anon USING (false);

DROP POLICY IF EXISTS "ledger_entries_no_delete" ON ledger_entries;
CREATE POLICY "ledger_entries_no_delete" ON ledger_entries FOR DELETE TO authenticated, anon USING (false);

-- 4.2 سجلات التدقيق والحماية (audit_logs)
DROP POLICY IF EXISTS "audit_logs_no_update" ON audit_logs;
CREATE POLICY "audit_logs_no_update" ON audit_logs FOR UPDATE TO authenticated, anon USING (false);

DROP POLICY IF EXISTS "audit_logs_no_delete" ON audit_logs;
CREATE POLICY "audit_logs_no_delete" ON audit_logs FOR DELETE TO authenticated, anon USING (false);

-- 4.3 جدول لقطات الأرصدة اليومية (daily_snapshots)
DROP POLICY IF EXISTS "daily_snapshots_no_update" ON daily_snapshots;
CREATE POLICY "daily_snapshots_no_update" ON daily_snapshots FOR UPDATE TO authenticated, anon USING (false);

DROP POLICY IF EXISTS "daily_snapshots_no_delete" ON daily_snapshots;
CREATE POLICY "daily_snapshots_no_delete" ON daily_snapshots FOR DELETE TO authenticated, anon USING (false);

-- ============================================================
-- 🛡️ 5. تفعيل حماية الأمان القصوى (Append-Only Triggers)
-- تجاوز RLS: مفتاح service_role يمتلك BYPASSRLS افتراضياً.
-- لضمان عدم قيام أي كود برمجي مستقبلاً بتعديل السجلات الحساسة،
-- نستخدم Database Triggers لإيقاف الـ UPDATE/DELETE تماماً.
-- ============================================================

CREATE OR REPLACE FUNCTION prevent_modify_append_only()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RAISE EXCEPTION 'ERR_APPEND_ONLY_VIOLATION';
END;
$$;

-- حماية القيود المحاسبية
DROP TRIGGER IF EXISTS enforce_append_only_ledger ON ledger_entries;
CREATE TRIGGER enforce_append_only_ledger
  BEFORE UPDATE OR DELETE ON ledger_entries
  FOR EACH ROW EXECUTE FUNCTION prevent_modify_append_only();

-- حماية سجلات التدقيق
DROP TRIGGER IF EXISTS enforce_append_only_audit ON audit_logs;
CREATE TRIGGER enforce_append_only_audit
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW EXECUTE FUNCTION prevent_modify_append_only();

-- حماية اللقطات اليومية
DROP TRIGGER IF EXISTS enforce_append_only_snapshots ON daily_snapshots;
CREATE TRIGGER enforce_append_only_snapshots
  BEFORE UPDATE OR DELETE ON daily_snapshots
  FOR EACH ROW EXECUTE FUNCTION prevent_modify_append_only();


-- ============================================================
-- ✅ نهاية المرحلة الخامسة والمخطط الهندسي
-- ============================================================
-- 1. تم سحب جميع صلاحيات (INSERT, UPDATE, DELETE) من الـ Client (REVOKE ALL).
-- 2. تم منح صلاحية SELECT فقط لقراءة البيانات إلى authenticated.
-- 3. الواجهة ستنفذ العمليات حصراً عبر استدعاء دوال RPC (SECURITY DEFINER).
-- 4. إغلاق RLS على الجداول المحاسبية للواجهة (USING false للـ UPDATE/DELETE).
-- 5. إغلاق Triggers على الجداول المحاسبية لمنع service_role من تجاوز RLS.
--
-- النظام الآن محكم أمنياً ومالياً (Zero Trust + Append-Only).
-- ============================================================
