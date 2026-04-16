ALTER TABLE permission_bundles
  ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(12,3);

UPDATE permission_bundles
SET max_discount_amount = COALESCE(max_discount_amount, max_discount_percentage)
WHERE max_discount_percentage IS NOT NULL;

INSERT INTO system_settings (key, value, value_type, description)
SELECT
  'max_pos_discount_amount',
  value,
  'number',
  'الحد الأقصى لخصم موظف POS (د.أ)'
FROM system_settings
WHERE key = 'max_pos_discount_percentage'
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    value_type = EXCLUDED.value_type,
    description = EXCLUDED.description,
    updated_at = now();

INSERT INTO system_settings (key, value, value_type, description)
SELECT
  'discount_warning_threshold_amount',
  value,
  'number',
  'حد التنبيه للخصم (د.أ)'
FROM system_settings
WHERE key = 'discount_warning_threshold'
ON CONFLICT (key) DO UPDATE
SET value = EXCLUDED.value,
    value_type = EXCLUDED.value_type,
    description = EXCLUDED.description,
    updated_at = now();

UPDATE system_settings
SET
  value = CASE
    WHEN key IN ('max_pos_discount_percentage', 'discount_warning_threshold') THEN '100'
    ELSE value
  END,
  updated_at = now()
WHERE key IN ('max_pos_discount_percentage', 'discount_warning_threshold');

UPDATE permission_bundles
SET max_discount_percentage = 100
WHERE max_discount_percentage IS NOT NULL;

UPDATE invoice_items
SET discount_amount = ROUND((unit_price * quantity) * (discount_percentage / 100), 3)
WHERE discount_percentage > 0
  AND COALESCE(discount_amount, 0) = 0;

UPDATE invoices
SET invoice_discount_amount = ROUND((subtotal - discount_amount) * (invoice_discount_percentage / 100), 3)
WHERE invoice_discount_percentage > 0
  AND COALESCE(invoice_discount_amount, 0) = 0;

COMMENT ON COLUMN permission_bundles.max_discount_amount IS
  'الحد الجديد للخصم الثابت بالمبلغ. legacy max_discount_percentage يبقى فقط للتوافق الخلفي مع دوال SQL القديمة.';

COMMENT ON COLUMN invoice_items.discount_percentage IS
  'حقل legacy مشتق للتوافق الخلفي. المصدر المعتمد للخصم أصبح discount_amount.';

COMMENT ON COLUMN invoices.invoice_discount_percentage IS
  'حقل legacy مشتق للتوافق الخلفي. المصدر المعتمد لخصم الفاتورة أصبح invoice_discount_amount.';
