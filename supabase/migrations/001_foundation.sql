-- ============================================================
-- آية موبايل — المرحلة التأسيسية (001_foundation.sql)
-- المرجع: 05_Database_Design.md (الإصدار المُعتمد)
-- التاريخ: 22 فبراير 2026
-- ============================================================
-- هذا الملف يُنشئ:
--   1. أنواع ENUM المشتركة
--   2. دالة تحديث updated_at التلقائية
--   3. الجداول التأسيسية السبعة (لا تعتمد على جداول أخرى)
--   4. Trigger مزامنة auth.users → profiles
--   5. البيانات الأولية (Seed Data)
-- ============================================================


-- ┌─────────────────────────────────────────────┐
-- │  1. أنواع ENUM المشتركة                      │
-- └─────────────────────────────────────────────┘

-- أدوار المستخدمين
CREATE TYPE user_role AS ENUM ('admin', 'pos_staff');

-- تصنيفات المنتجات
CREATE TYPE product_category AS ENUM (
  'device',           -- أجهزة (موبايلات، تابلت)
  'accessory',        -- إكسسوارات (سماعات، شواحن، كفرات)
  'sim',              -- شرائح (خطوط جوال)
  'service_repair',   -- خدمات صيانة (إصلاح شاشة، برمجة — قسم الصيانة)
  'service_general'   -- خدمات عامة (تركيب حماية — بدون مخزون)
);

-- أنواع الحسابات المالية
CREATE TYPE account_type AS ENUM ('cash', 'visa', 'wallet', 'bank');

-- نطاق الحساب (أساسي أو صيانة)
CREATE TYPE account_scope AS ENUM ('core', 'maintenance');

-- أنواع القيود المحاسبية
CREATE TYPE ledger_entry_type AS ENUM ('income', 'expense', 'adjustment');

-- اتجاه التسوية
CREATE TYPE adjustment_direction_type AS ENUM ('increase', 'decrease');

-- حالة الفاتورة
CREATE TYPE invoice_status AS ENUM ('active', 'returned', 'partially_returned', 'cancelled');

-- نوع المرتجع
CREATE TYPE return_type AS ENUM ('full', 'partial');

-- نوع قيد الدين
CREATE TYPE debt_entry_type AS ENUM ('from_invoice', 'manual');

-- حالة أمر الصيانة
CREATE TYPE maintenance_status AS ENUM ('new', 'in_progress', 'ready', 'delivered', 'cancelled');

-- نوع الجرد
CREATE TYPE inventory_count_type AS ENUM ('daily', 'weekly', 'monthly');

-- حالة الجرد
CREATE TYPE inventory_count_status AS ENUM ('in_progress', 'completed');

-- نوع فئة المصروفات
CREATE TYPE expense_category_type AS ENUM ('fixed', 'variable');

-- نوع قيمة الإعداد
CREATE TYPE setting_value_type AS ENUM ('string', 'number', 'boolean');


-- ┌─────────────────────────────────────────────┐
-- │  2. دالة تحديث updated_at التلقائية          │
-- └─────────────────────────────────────────────┘
-- تُستخدم في Trigger على كل جدول يحتوي على updated_at
-- لضمان تحديث الطابع الزمني تلقائياً عند أي تعديل

CREATE OR REPLACE FUNCTION fn_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ┌─────────────────────────────────────────────┐
-- │  3. الجداول التأسيسية (7 جداول)              │
-- └─────────────────────────────────────────────┘


-- ─────────────────────────────────────────────
-- جدول 1: profiles (ملفات المستخدمين)
-- ─────────────────────────────────────────────
-- امتداد لجدول auth.users الافتراضي في Supabase.
-- يحتوي على بيانات الملف الشخصي والدور (admin / pos_staff).
-- يتم إنشاء سجل تلقائياً عند تسجيل مستخدم جديد عبر Trigger.

CREATE TABLE profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name     VARCHAR(100)  NOT NULL,
  role          user_role     NOT NULL DEFAULT 'pos_staff',
  phone         VARCHAR(20),
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- الفهارس
CREATE INDEX idx_profiles_role      ON profiles(role);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- تحديث updated_at تلقائياً
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

COMMENT ON TABLE profiles IS 'ملفات المستخدمين — امتداد لـ auth.users. يحتوي على الاسم والدور والحالة.';


-- ─────────────────────────────────────────────
-- جدول 2: accounts (الحسابات المالية)
-- ─────────────────────────────────────────────
-- النواة المالية للنظام. يمثل كل حساب صندوقاً أو بوابة دفع.
-- كل حركة مالية (بيع، مصروف، تحويل) ترتبط بحساب واحد على الأقل.
-- module_scope يفصل حسابات المحل الأساسي عن حسابات قسم الصيانة.

CREATE TABLE accounts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(50)    NOT NULL UNIQUE,
  type            account_type   NOT NULL,
  module_scope    account_scope  NOT NULL DEFAULT 'core',
  fee_percentage  DECIMAL(5,2)   NOT NULL DEFAULT 0
                    CHECK (fee_percentage >= 0 AND fee_percentage <= 100),
  opening_balance DECIMAL(12,3)  NOT NULL DEFAULT 0,
  current_balance DECIMAL(12,3)  NOT NULL DEFAULT 0,
  is_active       BOOLEAN        NOT NULL DEFAULT true,
  display_order   INTEGER        NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ    NOT NULL DEFAULT now()
);

-- الفهارس
CREATE INDEX idx_accounts_type          ON accounts(type);
CREATE INDEX idx_accounts_scope         ON accounts(module_scope);
CREATE INDEX idx_accounts_is_active     ON accounts(is_active);
CREATE INDEX idx_accounts_display_order ON accounts(display_order);

-- تحديث updated_at تلقائياً
CREATE TRIGGER trg_accounts_updated_at
  BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

COMMENT ON TABLE accounts IS 'الحسابات المالية (صندوق، فيزا، محافظ إلكترونية). كل حركة مالية تمر عبر حساب.';


-- ─────────────────────────────────────────────
-- جدول 3: products (المنتجات)
-- ─────────────────────────────────────────────
-- يخزن جميع المنتجات والخدمات القابلة للبيع.
-- البيع يتم بالحبة (لا باركود، لا IMEI) عبر البحث بالاسم أو التصنيف.
-- cost_price اختياري (قد يكون NULL لبعض المنتجات) — يُعالج بـ COALESCE(cost_price, 0) عند البيع.
-- track_stock = false للخدمات التي لا تحتاج تتبع مخزون.

CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(200)      NOT NULL,
  category        product_category  NOT NULL,
  sku             VARCHAR(50),
  description     TEXT,
  sale_price      DECIMAL(12,3)     NOT NULL CHECK (sale_price >= 0),
  cost_price      DECIMAL(12,3),    -- اختياري: قد يكون NULL (BP-02)
  avg_cost_price  DECIMAL(12,3),    -- متوسط التكلفة (للتقارير)
  stock_quantity  INTEGER           NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  min_stock_level INTEGER           NOT NULL DEFAULT 5 CHECK (min_stock_level >= 0),
  track_stock     BOOLEAN           NOT NULL DEFAULT true,
  is_quick_add    BOOLEAN           NOT NULL DEFAULT false,
  is_active       BOOLEAN           NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ       NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ       NOT NULL DEFAULT now(),
  created_by      UUID              NOT NULL REFERENCES profiles(id)
);

-- الفهارس
CREATE INDEX idx_products_name           ON products(name);
CREATE INDEX idx_products_category       ON products(category);
CREATE INDEX idx_products_is_active      ON products(is_active);
CREATE INDEX idx_products_stock_quantity ON products(stock_quantity);
CREATE INDEX idx_products_quick_add      ON products(id) WHERE is_quick_add = true AND is_active = true;

-- قيد فريد مشروط: SKU فريد فقط إذا لم يكن NULL
CREATE UNIQUE INDEX idx_products_sku_unique ON products(sku) WHERE sku IS NOT NULL;

-- تحديث updated_at تلقائياً
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

COMMENT ON TABLE products IS 'المنتجات والخدمات. البيع بالحبة (لا باركود). cost_price اختياري ويُعالج بـ COALESCE عند البيع.';


-- ─────────────────────────────────────────────
-- جدول 4: suppliers (الموردين)
-- ─────────────────────────────────────────────
-- بيانات الموردين الذين يتم الشراء منهم.
-- current_balance يمثل المبلغ المستحق عليك للمورد (دين المحل للمورد).
-- لا يوجد قيد CHECK >= 0 على current_balance — للسماح بتصحيح الأخطاء المحاسبية (L-03 Fix).
-- الحذف يتم عبر Soft Delete (is_active = false) لحماية الترابط مع المشتريات السابقة.

CREATE TABLE suppliers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100)  NOT NULL UNIQUE,
  phone           VARCHAR(20),
  address         TEXT,
  current_balance DECIMAL(12,3) NOT NULL DEFAULT 0,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- الفهارس
CREATE INDEX idx_suppliers_name ON suppliers(name);

-- تحديث updated_at تلقائياً
CREATE TRIGGER trg_suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

COMMENT ON TABLE suppliers IS 'الموردين. current_balance = دين المحل للمورد. بدون قيد >= 0 للسماح بتصحيح الأخطاء (L-03).';


-- ─────────────────────────────────────────────
-- جدول 5: debt_customers (عملاء الدين)
-- ─────────────────────────────────────────────
-- عملاء موثوقون يُسمح لهم بالشراء بالآجل (الدين).
-- credit_limit هو حد تنبيهي فقط — تجاوزه لا يمنع العملية بل يُرسل إشعاراً لأحمد.
-- الحذف يتم عبر Soft Delete (is_active = false) لحماية سجلات الديون المرتبطة.

CREATE TABLE debt_customers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            VARCHAR(100)  NOT NULL,
  phone           VARCHAR(20)   NOT NULL UNIQUE,
  national_id     VARCHAR(20),
  address         TEXT,
  credit_limit    DECIMAL(12,3) NOT NULL DEFAULT 10 CHECK (credit_limit >= 0),
  current_balance DECIMAL(12,3) NOT NULL DEFAULT 0,
  due_date_days   INTEGER       NOT NULL DEFAULT 30 CHECK (due_date_days > 0),
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
  created_by      UUID          NOT NULL REFERENCES profiles(id)
);

-- الفهارس
CREATE INDEX idx_debt_customers_name    ON debt_customers(name);
CREATE INDEX idx_debt_customers_phone   ON debt_customers(phone);
CREATE INDEX idx_debt_customers_balance ON debt_customers(current_balance);

-- تحديث updated_at تلقائياً
CREATE TRIGGER trg_debt_customers_updated_at
  BEFORE UPDATE ON debt_customers
  FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

COMMENT ON TABLE debt_customers IS 'عملاء الدين. credit_limit = حد تنبيهي فقط (لا يمنع العملية). Soft Delete عبر is_active.';


-- ─────────────────────────────────────────────
-- جدول 6: expense_categories (فئات المصروفات)
-- ─────────────────────────────────────────────
-- تصنيف المصروفات إلى ثابتة (إيجار، رواتب) ومتغيرة (مواصلات، مستلزمات).
-- يُستخدم كـ FK في جدول expenses.
-- Soft Delete عبر is_active للحفاظ على سلامة المصروفات المسجلة سابقاً.

CREATE TABLE expense_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100)         NOT NULL UNIQUE,
  type        expense_category_type NOT NULL,
  is_active   BOOLEAN              NOT NULL DEFAULT true,
  sort_order  INTEGER              NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ          NOT NULL DEFAULT now()
);

-- الفهارس
CREATE INDEX idx_expense_categories_type ON expense_categories(type);

COMMENT ON TABLE expense_categories IS 'فئات المصروفات (ثابتة/متغيرة). Soft Delete عبر is_active.';


-- ─────────────────────────────────────────────
-- جدول 7: system_settings (إعدادات النظام)
-- ─────────────────────────────────────────────
-- إعدادات قابلة للتعديل من قبل Admin فقط.
-- تُقرأ داخل الـ Transaction (X-02 Fix) لتفادي Race Condition عند التحقق من حد الخصم.
-- لا يوجد created_at لأن هذه بيانات ثابتة تُحدَّث فقط.

CREATE TABLE system_settings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         VARCHAR(50)      NOT NULL UNIQUE,
  value       TEXT             NOT NULL,
  value_type  setting_value_type NOT NULL DEFAULT 'string',
  description VARCHAR(255)     NOT NULL,
  updated_at  TIMESTAMPTZ      NOT NULL DEFAULT now(),
  updated_by  UUID             REFERENCES profiles(id)
);

-- الفهارس (key هو UNIQUE بالفعل أعلاه)

COMMENT ON TABLE system_settings IS 'إعدادات النظام (حد الخصم، حد الدين الافتراضي، إلخ). Admin فقط يُعدّل.';


-- ┌─────────────────────────────────────────────┐
-- │  4. Trigger مزامنة auth.users → profiles     │
-- └─────────────────────────────────────────────┘
-- عند إنشاء مستخدم جديد في Supabase Auth، يتم إنشاء سجل
-- مطابق في profiles تلقائياً. هذا يضمن أن كل مستخدم
-- لديه ملف شخصي فوراً دون تدخل يدوي.

CREATE OR REPLACE FUNCTION fn_handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'مستخدم جديد'),
    COALESCE(
      (NEW.raw_user_meta_data->>'role')::user_role,
      'pos_staff'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION fn_handle_new_user();

COMMENT ON FUNCTION fn_handle_new_user() IS 'ينشئ سجل profiles تلقائياً عند تسجيل مستخدم جديد في auth.users.';


-- ┌─────────────────────────────────────────────┐
-- │  5. البيانات الأولية (Seed Data)              │
-- └─────────────────────────────────────────────┘


-- ── الحسابات المالية الافتراضية ──
INSERT INTO accounts (name, type, module_scope, fee_percentage, display_order) VALUES
  ('الصندوق',       'cash',   'core',        0,   1),
  ('فيزا',          'visa',   'core',        2,   2),
  ('Orange Money',  'wallet', 'core',        0,   3),
  ('صندوق الصيانة', 'cash',   'maintenance', 0,   4);


-- ── فئات المصروفات الافتراضية ──
INSERT INTO expense_categories (name, type, sort_order) VALUES
  ('إيجار',       'fixed',    1),
  ('رواتب',       'fixed',    2),
  ('إنترنت',      'fixed',    3),
  ('كهرباء',      'fixed',    4),
  ('مواصلات',     'variable', 5),
  ('صيانة محل',   'variable', 6),
  ('مستلزمات',    'variable', 7),
  ('أخرى',        'variable', 8);


-- ── إعدادات النظام الافتراضية ──
INSERT INTO system_settings (key, value, value_type, description) VALUES
  ('max_pos_discount_percentage', '10',         'number',  'الحد الأقصى لخصم موظف POS (%)'),
  ('default_credit_limit',       '10',         'number',  'حد الدين الافتراضي (د.أ)'),
  ('default_due_date_days',      '30',         'number',  'أيام الاستحقاق الافتراضية'),
  ('discount_warning_threshold', '10',         'number',  'حد التنبيه للخصم (%)'),
  ('low_stock_threshold',        '2',          'number',  'حد المخزون المنخفض (عدد القطع)'),
  ('store_name',                 'آية موبايل', 'string',  'اسم المتجر'),
  ('store_phone',                '',           'string',  'رقم المتجر'),
  ('currency_symbol',            'د.أ',        'string',  'رمز العملة');


-- ============================================================
-- ✅ نهاية المرحلة التأسيسية
-- ============================================================
-- اختبار هذه المرحلة:
--   1. التأكد من إنشاء جميع الجداول السبعة بنجاح
--   2. التحقق من وجود 4 حسابات في accounts
--   3. التحقق من وجود 8 فئات في expense_categories
--   4. التحقق من وجود 8 إعدادات في system_settings
--   5. إنشاء مستخدم في Supabase Auth والتأكد من ظهوره في profiles
-- ============================================================
