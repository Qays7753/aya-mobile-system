-- ============================================================
-- آية موبايل — مواءمة seed baseline للإعدادات (006)
-- المرجع: 05_Database_Design.md, 15_Seed_Data_Functions.md
-- التاريخ: 07 مارس 2026
-- يعتمد على: 001_foundation.sql .. 005_rls_security.sql
-- ============================================================
-- الهدف:
--   1. إضافة مفاتيح system_settings الموثقة والمفقودة من baseline.
--   2. تصحيح default_credit_limit من seed القديم (10) إلى العقد الحالي (100)
--      بشرط أن يكون السجل ما زال bootstrap ولم يعدله مستخدم.
-- ============================================================

INSERT INTO system_settings (key, value, value_type, description)
VALUES
  ('allow_negative_stock', 'false', 'boolean', 'السماح بالبيع عند نفاد المخزون'),
  ('prevent_sale_below_cost', 'true', 'boolean', 'منع البيع بأقل من التكلفة (POS فقط — Admin مستثنى)'),
  ('invoice_edit_window_hours', '24', 'number', 'ساعات السماح بتعديل الفاتورة بعد إصدارها'),
  ('pos_idle_timeout_minutes', '240', 'number', 'تسجيل خروج تلقائي بعد 4 ساعات عدم نشاط (Frontend) — قرار المستخدم: الخروج يتم يدوياً غالباً'),
  ('hide_cost_prices_pos', 'true', 'boolean', 'إخفاء أسعار التكلفة والأرباح عن شاشة POS'),
  ('require_reason_min_chars', '50', 'number', 'الحد الأدنى لأحرف سبب الإلغاء/التعديل'),
  ('max_login_attempts', '5', 'number', 'عدد المحاولات قبل قفل الحساب مؤقتاً'),
  ('receipt_footer_text', '', 'string', 'نص أسفل الفاتورة (شروط الإرجاع)')
ON CONFLICT (key) DO NOTHING;

UPDATE system_settings
SET
  value = '100',
  value_type = 'number',
  description = 'سقف الدين الافتراضي للعميل الجديد (د.أ)',
  updated_at = now()
WHERE key = 'default_credit_limit'
  AND value = '10'
  AND updated_by IS NULL;
