# آية موبايل - كتالوج رموز الأخطاء
## 16) Error Codes Catalog

---

## الغرض

مرجع موحّد لجميع رموز الأخطاء في النظام. كل ERR_* مذكور في [04_Core_Flows.md](./04_Core_Flows.md) موثق هنا، بالإضافة لأخطاء عامة (auth, db, rate limit, validation).

> **ملاحظة هامة للمطور:** يوجد أخطاء معرفة في هذا الملف (مثل `ERR_API_INTERNAL` و `ERR_DB_CONNECTION` و `ERR_NETWORK`) لا تظهر صراحة في ملفات التدفقات (Core Flows) وذلك لأنها أخطاء خاصة بطبقات البنية التحتية (Infrastructure, API Route, Database Pool) ويتم تفعيلها تلقائياً على مستوى النظام ككل، وليس كجزء من المنطق المالي المباشر.

---

## تنسيق الرموز

```
ERR_{DOMAIN}_{DESCRIPTION}
```

| المجال | الوصف |
|--------|-------|
| STOCK | عمليات المخزون |
| DISCOUNT | الخصومات |
| IDEMPOTENCY | منع التكرار |

| RETURN | المرتجعات |
| PAYMENT | المدفوعات |
| CANCEL | الإلغاء |
| DEBT | الديون |
| RECONCILIATION | التسوية |
| MAINTENANCE | الصيانة |
| SUPPLIER | الموردين |
| TRANSFER | التحويلات |
| EXPORT | التصدير |
| AUTH | المصادقة والصلاحيات |
| DB | قاعدة البيانات |
| RATE | تحديد المعدل |
| VALIDATION | التحقق من البيانات |
| NETWORK | الشبكة |
| SERVER | الخادم |

---

## أخطاء العمليات (من Core Flows)

| # | Code | HTTP | رسالة المستخدم (AR) | Dev Hint | المعالجة | الحقول المسجّلة |
|---|------|------|---------------------|----------|---------|----------------|
| 1 | `ERR_STOCK_INSUFFICIENT` | 400 | المخزون غير كافٍ لهذا المنتج | `products.stock_quantity < requested_quantity` | تقليل الكمية أو تعديل المخزون عبر الجرد (SOP-17) | product_id, requested_qty, available_qty |
| 2 | `ERR_DISCOUNT_EXCEEDED` | 400 | نسبة الخصم تتجاوز الحد المسموح | `discount_percent > system_settings.max_pos_discount_percentage` | خفض النسبة أو طلب تغيير الحد من Admin | discount_percent, max_allowed, invoice_id |
| 3 | `ERR_IDEMPOTENCY` | 409 | تم تنفيذ هذه العملية مسبقاً | `idempotency_key` already exists in target table | لا إجراء — العملية تمت. Frontend يعرض النتيجة السابقة | idempotency_key, table_name, existing_record_id |
| 4 | `ERR_RETURN_QUANTITY` | 400 | كمية الإرجاع تتجاوز الكمية المباعة | `return_qty > invoice_item.quantity - already_returned` | تقليل كمية الإرجاع | invoice_item_id, requested_qty, max_returnable |
| 4b | `ERR_RETURN_REFUND_ACCOUNT_REQUIRED` | 400 | يجب اختيار حساب إرجاع لأن جزءاً مسدداً سيتم رده نقداً | `cash_refund > 0 AND refund_account_id IS NULL` أثناء مرتجع فاتورة دين | اختيار `refund_account_id` ثم إعادة المحاولة | invoice_id, return_amount, cash_refund |
| 5 | `ERR_PAYMENT_MISMATCH` | 400 | مجموع المدفوعات لا يساوي إجمالي الفاتورة | `SUM(payments.amount) != invoice.total_amount` | تصحيح مبالغ الدفع أو إضافة طريقة دفع | invoice_id, total_amount, payments_sum |
| 6 | `ERR_CANCEL_ALREADY` | 409 | هذه الفاتورة ملغاة مسبقاً | `invoice.status = 'cancelled'` | لا إجراء — الفاتورة ملغاة بالفعل | invoice_id, cancelled_at |
| 7 | `ERR_CANCEL_HAS_RETURN` | 400 | لا يمكن إلغاء فاتورة بها مرتجعات | `returns` exist for this invoice | استخدم الإرجاع بدل الإلغاء للكميات المتبقية | invoice_id, return_count |
| 8 | `ERR_CANCEL_REASON` | 400 | يجب تحديد سبب الإلغاء | `cancellation_reason` is empty/null | إدخال سبب الإلغاء | invoice_id |
| 9 | `ERR_DEBT_OVERPAY` | 400 | مبلغ التسديد يتجاوز الرصيد المستحق | `payment_amount > debt_entry.remaining_amount` | تقليل المبلغ ليساوي الرصيد المستحق | debt_entry_id, remaining, attempted_amount |
| 10 | `ERR_RECONCILIATION_UNRESOLVED` | 400 | التسوية تحتوي فروقات غير محلولة | Attempting to complete reconciliation with `is_resolved = false` entries | حل جميع الفروقات أولاً | reconciliation_id, unresolved_count |
| 11 | `ERR_UNAUTHORIZED` | 403 | ليس لديك صلاحية لهذه العملية | User role doesn't match required permission | تسجيل الدخول بحساب صاحب الصلاحية | user_id, required_role, action |
| 12 | `ERR_MAINTENANCE_INVALID_STATUS` | 400 | لا يمكن تحويل الحالة إلى هذه المرحلة | Invalid status transition (e.g., delivered → new) | اتباع دورة الحالة: new→in_progress→ready→delivered | job_id, current_status, attempted_status |
| 13 | `ERR_SUPPLIER_OVERPAY` | 400 | مبلغ التسديد يتجاوز رصيد المورد | `payment_amount > supplier.current_balance` | تقليل المبلغ ليساوي الرصيد المستحق | supplier_id, balance, attempted_amount |
| 14 | `ERR_TRANSFER_SAME_ACCOUNT` | 400 | لا يمكن التحويل من حساب لنفسه | `from_account_id = to_account_id` | اختيار حساب مختلف للوجهة | from_account_id, to_account_id |
| 15 | `ERR_EXPORT_TOO_LARGE` | 400 | التصدير يتجاوز 10,000 سجل — قلّص الفترة | `export_count > 10000` | تضييق نطاق التاريخ أو الفلاتر | endpoint, filter_params, total_count |
| 16 | `ERR_CONCURRENT_STOCK_UPDATE` | 409 | تغير المخزون أثناء تنفيذ العملية — راجع الكمية وأعد المحاولة | `SELECT FOR UPDATE` detected concurrent modification on `products.stock_quantity` | إعادة المحاولة بـ `idempotency_key` جديد — الكميات تُحدّث تلقائياً | product_id, expected_qty, current_qty |
| 16b | `ERR_CANNOT_CANCEL_PAID_DEBT` | 400 | لا يمكن إلغاء فاتورة سُدد دينها جزئياً | `cancel_invoice()`: debt_entries has paid_amount > 0 for this invoice | استخدم تسديد الدين أولاً ثم الإلغاء | invoice_id, debt_entry_id |
| 16c | `ERR_INVOICE_NOT_FOUND` | 404 | الفاتورة غير موجودة | `invoice_id` not found in invoices table | التأكد من صحة رقم الفاتورة | invoice_id |
| 16d | `ERR_INVOICE_CANCELLED` | 400 | الفاتورة ملغاة — لا يمكن إجراء عملية عليها | `invoice.status != 'active'` in create_return | استخدام فاتورة نشطة | invoice_id, status |
| 16e | `ERR_ITEM_NOT_FOUND` | 404 | بند الفاتورة غير موجود | `invoice_item_id` not found | التأكد من صحة معرف البند | invoice_item_id |
| 16f | `ERR_CUSTOMER_NOT_FOUND` | 404 | العميل غير موجود | `debt_customer_id` not found | التأكد من صحة معرف العميل | customer_id |
| 16g | `ERR_COUNT_NOT_FOUND` | 404 | عملية الجرد غير موجودة | `inventory_count_id` not found | التأكد من صحة معرف الجرد | inventory_count_id |
| 16h | `ERR_APPEND_ONLY_VIOLATION` | 403 | محاولة تعديل/حذف سجل محمي (Append-Only) | Trigger prevents UPDATE/DELETE on ledger_entries, audit_logs, daily_snapshots | لا يمكن تعديل هذه السجلات | table_name |
| 16i | `ERR_VALIDATION_SNAPSHOT_DATE` | 400 | لا يمكن إنشاء لقطة بتاريخ غير اليوم | `p_snapshot_date != CURRENT_DATE` — ADR-034 | استخدم التاريخ الحالي فقط | snapshot_date |
| 16j | `ERR_PRODUCT_NOT_FOUND` | 404 | المنتج غير موجود | `product_id` not found while processing items | التأكد من صحة المنتج أو تحديث قائمة المنتجات قبل الحفظ | product_id |
| 16k | `ERR_DEBT_ENTRY_NOT_FOUND` | 404 | قيد الدين المحدد غير موجود | `debt_entry_id` not found عند الدفع الموجّه | إزالة `debt_entry_id` أو اختيار قيد دين صحيح | debt_entry_id |
| 16l | `ERR_SUPPLIER_NOT_FOUND` | 404 | المورد غير موجود | `supplier_id` not found | التأكد من صحة معرف المورد | supplier_id |
| 16m | `ERR_ACCOUNT_NOT_FOUND` | 404 | الحساب المالي غير موجود | `account_id` not found | التأكد من صحة الحساب قبل العملية | account_id |
| 17 | `ERR_INSUFFICIENT_BALANCE` | 400 | رصيد الحساب غير كافٍ لإتمام التحويل | `accounts.current_balance < amount` | تقليل المبلغ أو تعبئة الحساب أولاً | from_account_id, current_balance, requested_amount |
| 18 | `ERR_NETWORK` | 0 | خطأ في الاتصال بالشبكة | Network request failed | إعادة المحاولة بعد التأكد من الاتصال | - |
| 19 | `ERR_SERVER` | 500 | خطأ في الخادم. حاول لاحقاً | Server returned 5xx | إعادة المحاولة. إذا استمر: تواصل مع المطور | endpoint, status_code |
| 20 | `ERR_PRODUCT_EXISTS` | 409 | هذا المنتج موجود مسبقاً | Duplicate product name/SKU | تغيير الاسم أو SKU | product_name, sku |
| 21 | `ERR_DEBT_LIMIT_WARNING` | 200 | العميل قريب من حد الدين | Warning, not blocking — informational only | لا إجراء — تنبيه فقط | customer_id, current_balance, credit_limit |
| 22 | `ERR_COUNT_ALREADY_COMPLETED` | 400 | عملية الجرد مكتملة مسبقاً | `inventory_count.status = 'completed'` | لا إجراء — الجرد مكتمل بالفعل | inventory_count_id |
| 23 | `ERR_VALIDATION_NEGATIVE_QUANTITY` | 400 | الكمية يجب أن تكون موجبة | `quantity <= 0` | إدخال كمية موجبة | field_name, received_value |
| 24 | `ERR_PRODUCT_HAS_REFERENCES` | 400 | لا يمكن حذف المنتج — مرتبط بفواتير أو مشتريات | `ON DELETE RESTRICT` triggered | أرشفة المنتج بدلاً من حذفه (is_active = false) | product_id, reference_count |
| 25a | `ERR_SETTING_NOT_FOUND` | 404 | المفتاح المطلوب غير موجود في إعدادات النظام | `key` not found in `system_settings` table | التأكد من صحة اسم المفتاح | key |
| 25b | `ERR_VALIDATION_INCORRECT_TYPE` | 400 | نوع القيمة غير صحيح | Value doesn't match `value_type` (e.g., boolean must be 'true'/'false') | تصحيح القيمة لتتوافق مع النوع المتوقع | key, value_type, received_value |
| 25c | `ERR_VALIDATION_OUT_OF_RANGE` | 400 | القيمة خارج النطاق المسموح | Value outside allowed range (e.g., discount 0-100) | إدخال قيمة ضمن النطاق | key, min, max, received_value |

---

## أخطاء عامة

| # | Code | HTTP | رسالة المستخدم (AR) | Dev Hint | المعالجة | الحقول المسجّلة |
|---|------|------|---------------------|----------|---------|----------------|
| 25 | `ERR_AUTH_INVALID_CREDENTIALS` | 401 | بيانات الدخول غير صحيحة | Email or password mismatch | تصحيح بيانات الدخول. بعد 5 محاولات: lockout 5 دقائق | email (hashed), ip_address |
| 26 | `ERR_AUTH_SESSION_EXPIRED` | 401 | انتهت الجلسة. يرجى تسجيل الدخول مجدداً | JWT expired or refresh token invalid | إعادة تسجيل الدخول | user_id |
| 27 | `ERR_AUTH_ACCOUNT_DISABLED` | 403 | تم تعطيل حسابك. تواصل مع المسؤول | `profiles.is_active = false` | Admin يُعيد تفعيل الحساب | user_id |
| 28 | `ERR_RATE_LIMIT` | 429 | طلبات كثيرة. انتظر قليلاً ثم حاول مجدداً | Rate limit exceeded per 13_Tech_Config §Rate Limiting | الانتظار ثم إعادة المحاولة | user_id, endpoint, request_count |
| 29 | `ERR_DB_CONNECTION` | 503 | خطأ في الاتصال بقاعدة البيانات | Supabase connection pool exhausted or timeout | تلقائي: retry بعد 2 ثانية. إذا استمر: تحقق من لوحة Supabase | - |
| 30 | `ERR_DB_TRANSACTION_FAILED` | 500 | فشل في حفظ البيانات. لم يتم تغيير شيء | Transaction rolled back due to constraint violation or timeout | مراجعة البيانات المُدخلة وإعادة المحاولة | table_name, error_detail |
| 31 | `ERR_VALIDATION_REQUIRED_FIELD` | 400 | حقل مطلوب ناقص | Missing required field in request body | إكمال جميع الحقول الإلزامية | field_name, endpoint |
| 32 | `ERR_VALIDATION_INVALID_FORMAT` | 400 | صيغة البيانات غير صحيحة | Data type/format mismatch (e.g., UUID, decimal) | تصحيح الصيغة حسب المتوقع | field_name, expected_format, received_value |
| 33 | `ERR_VALIDATION_NEGATIVE_AMOUNT` | 400 | المبلغ يجب أن يكون أكبر من صفر | `amount <= 0` in financial operation | إدخال مبلغ موجب | field_name, received_value |
| 34 | `ERR_DB_UNIQUE_VIOLATION` | 409 | هذا السجل موجود مسبقاً | Unique constraint violation on insert | تحقق من عدم التكرار أو استخدم idempotency_key | table_name, constraint_name, conflicting_value |

---

## أخطاء طبقة API (ADR-042)

| # | Code | HTTP | رسالة المستخدم (AR) | Dev Hint | المعالجة | الحقول المسجّلة |
|---|------|------|---------------------|----------|---------|----------------|
| 35 | `ERR_API_SESSION_INVALID` | 401 | الجلسة غير صالحة. يرجى تسجيل الدخول مجدداً | `getSession()` returned null or invalid JWT in API Route | إعادة تسجيل الدخول | endpoint |
| 36 | `ERR_API_ROLE_FORBIDDEN` | 403 | ليس لديك صلاحية لهذه العملية | User role doesn't match API Route requirement (e.g., POS calling admin-only endpoint) | تسجيل الدخول بحساب صاحب الصلاحية | user_id, user_role, endpoint, required_role |
| 37 | `ERR_API_VALIDATION_FAILED` | 400 | بيانات الطلب غير صالحة | Zod validation failed in API Route before calling RPC | تصحيح البيانات المُرسلة | endpoint, zod_errors |
| 38 | `ERR_API_INTERNAL` | 500 | حدث خطأ غير متوقع. حاول مجدداً | Unhandled exception in API Route | إعادة المحاولة. إذا استمر: تواصل مع المطور | endpoint, error_message (sanitized) |

> **العدد الإجمالي:** 55 رمز خطأ (41 عمليات + 10 عامة + 4 طبقة API)

---

## امتدادات مخططة لما بعد `PX-07` (Reserved V2 Codes)

> هذه الأكواد **محجوزة تعاقديًا** لخطة `PX-08 .. PX-14` كي تبقى عقود `V2` self-consistent قبل التنفيذ.
> لا تُعد جزءًا من العدّاد التشغيلي الحالي أعلاه حتى يبدأ تنفيذ الشرائح المقابلة فعليًا.

| Code | HTTP | الاستخدام المخطط | المرحلة المرجحة |
|------|------|------------------|-----------------|
| `ERR_EXPENSE_CATEGORY_NOT_FOUND` | 404 | تسجيل مصروف أو إدارة فئة على `expense_category_id` غير موجود | `PX-08` |
| `ERR_EXPENSE_CATEGORY_INACTIVE` | 400 | محاولة استخدام فئة مصروف غير نشطة | `PX-08` |
| `ERR_EXPENSE_CATEGORY_HAS_REFERENCES` | 400 | محاولة حذف/تعطيل فئة مرتبطة بمصروفات قائمة دون مسار صحيح | `PX-08` |
| `ERR_NOTIFICATION_NOT_FOUND` | 404 | محاولة تعليم إشعار غير موجود كمقروء | `PX-08` |
| `ERR_RECEIPT_LINK_INVALID` | 404 | token غير صالح أو غير معروف | `PX-09` |
| `ERR_RECEIPT_LINK_REVOKED` | 410 | token ألغي صراحة من النظام | `PX-09` |
| `ERR_RECEIPT_LINK_EXPIRED` | 410 | token منتهي الصلاحية | `PX-09` |
| `ERR_WHATSAPP_DELIVERY_FAILED` | 502 | فشل موفر واتساب في قبول/تسليم الرسالة | `PX-09` |
| `ERR_ROLE_ASSIGNMENT_INVALID` | 400 | محاولة إسناد role/bundle غير مسموح | `PX-10` |
| `ERR_PERMISSION_BUNDLE_NOT_FOUND` | 404 | bundle غير موجود أو غير مفعّل | `PX-10` |
| `ERR_DISCOUNT_APPROVAL_REQUIRED` | 403 | الخصم يحتاج موافقة role أعلى أو approval token | `PX-10` |
| `ERR_EXPORT_PACKAGE_EXPIRED` | 410 | محاولة تنزيل package تصدير منتهية | `PX-12` |
| `ERR_IMPORT_DRY_RUN_REQUIRED` | 400 | محاولة commit import قبل dry-run valid | `PX-12` |
| `ERR_RESTORE_ENV_FORBIDDEN` | 403 | restore drill على بيئة غير معزولة أو غير مصرح بها | `PX-12` |
| `ERR_SEARCH_QUERY_TOO_SHORT` | 400 | استعلام بحث أقل من الحد الأدنى | `PX-13` |

---

## دليل استخدام الرموز (للمطوّر)

### WHERE: أين تُرمى الأخطاء
- **RPC Functions (PostgreSQL):** `RAISE EXCEPTION` مع `error_code` في `detail`
- **API Routes (Next.js):** `NextResponse.json({ error: ... }, { status: ... })`
- **Frontend:** عرض `user_message_ar` في Toast/Alert

### HOW: كيف يُسجّل الخطأ

```
-- pseudo-code
INSERT INTO audit_logs (
  action_type,       -- 'error'
  table_name,        -- الجدول المتأثر
  description,       -- ERR_CODE + context
  old_values,        -- null
  new_values,        -- { error_code, logged_fields }
  user_id            -- الذي سبّب الخطأ
);
```

### WHEN: متى يُسجّل في audit_logs
| النوع | يُسجّل؟ | السبب |
|-------|---------|-------|
| أخطاء مالية (ERR_STOCK/PAYMENT/DEBT/CANCEL) | ✅ دائماً | تتبع المحاولات |
| أخطاء المصادقة (ERR_AUTH) | ✅ دائماً | أمن |
| أخطاء التحقق (ERR_VALIDATION) | ❌ لا | ضوضاء — أخطاء مستخدم عادية |
| أخطاء Rate Limit | ✅ warn فقط | كشف سوء استخدام |
| أخطاء DB | ✅ دائماً | تشخيص |

---

## 🧩 مصفوفة التغطية: عمليات DB ↔ Error Codes

> **المرجع:** عمليات الكتابة الـ 15 في [05_Database_Design.md](./05_Database_Design.md) + توقيعات الدوال في [15_Seed_Data_Functions.md](./15_Seed_Data_Functions.md).

| عملية DB | الدالة | أكواد الخطأ المغطية |
|----------|--------|----------------------|
| 1. CreateSale | `create_sale()` | `ERR_PRODUCT_NOT_FOUND`, `ERR_STOCK_INSUFFICIENT`, `ERR_DISCOUNT_EXCEEDED`, `ERR_PAYMENT_MISMATCH`, `ERR_IDEMPOTENCY`, `ERR_CONCURRENT_STOCK_UPDATE` |
| 2. CreateReturn | `create_return()` | `ERR_INVOICE_NOT_FOUND`, `ERR_INVOICE_CANCELLED`, `ERR_ITEM_NOT_FOUND`, `ERR_RETURN_QUANTITY`, `ERR_CANCEL_ALREADY`, `ERR_IDEMPOTENCY`, `ERR_RETURN_REFUND_ACCOUNT_REQUIRED`, `ERR_UNAUTHORIZED` |
| 3. CreateDebtManual | `create_debt_manual()` | `ERR_IDEMPOTENCY`, `ERR_VALIDATION_NEGATIVE_AMOUNT`, `ERR_CUSTOMER_NOT_FOUND`, `ERR_UNAUTHORIZED` |
| 4. RecordDebtPayment | `create_debt_payment()` | `ERR_DEBT_OVERPAY`, `ERR_DEBT_ENTRY_NOT_FOUND`, `ERR_IDEMPOTENCY`, `ERR_VALIDATION_NEGATIVE_AMOUNT`, `ERR_CUSTOMER_NOT_FOUND`, `ERR_UNAUTHORIZED` |
| 5. CreateTopUp | `create_topup()` | `ERR_IDEMPOTENCY`, `ERR_VALIDATION_NEGATIVE_AMOUNT`, `ERR_API_VALIDATION_FAILED` |
| 6. CreateTransfer | `create_transfer()` | `ERR_TRANSFER_SAME_ACCOUNT`, `ERR_INSUFFICIENT_BALANCE`, `ERR_IDEMPOTENCY`, `ERR_VALIDATION_NEGATIVE_AMOUNT` |
| 7. CreatePurchase | `create_purchase()` | `ERR_IDEMPOTENCY`, `ERR_VALIDATION_REQUIRED_FIELD`, `ERR_UNAUTHORIZED` |
| 8. CreateReconciliation | `reconcile_account()` | `ERR_ACCOUNT_NOT_FOUND`, `ERR_UNAUTHORIZED` |
| 9. RecordSupplierPayment | `create_supplier_payment()` | `ERR_SUPPLIER_NOT_FOUND`, `ERR_SUPPLIER_OVERPAY`, `ERR_IDEMPOTENCY`, `ERR_VALIDATION_NEGATIVE_AMOUNT`, `ERR_UNAUTHORIZED` |
| 10. GenerateDailySnapshot | `create_daily_snapshot()` | `ERR_VALIDATION_SNAPSHOT_DATE`, `ERR_UNAUTHORIZED`, `ERR_DB_TRANSACTION_FAILED` |
| 11. CreateMaintenanceJob | `create_maintenance_job()` | `ERR_IDEMPOTENCY`, `ERR_VALIDATION_REQUIRED_FIELD`, `ERR_API_VALIDATION_FAILED` |
| 12. CancelInvoice | `cancel_invoice()` | `ERR_CANCEL_ALREADY`, `ERR_CANCEL_HAS_RETURN`, `ERR_CANCEL_REASON`, `ERR_CANNOT_CANCEL_PAID_DEBT`, `ERR_UNAUTHORIZED` |
| 13. EditInvoice | `edit_invoice()` | `ERR_CANCEL_ALREADY`, `ERR_CANCEL_HAS_RETURN`, `ERR_CANCEL_REASON`, `ERR_INVOICE_NOT_FOUND`, `ERR_IDEMPOTENCY`, `ERR_PRODUCT_NOT_FOUND`, `ERR_CUSTOMER_NOT_FOUND`, `ERR_STOCK_INSUFFICIENT`, `ERR_PAYMENT_MISMATCH`, `ERR_UNAUTHORIZED` |
| 14. CreatePartialReturn | `create_return()` (`return_type='partial'`) | `ERR_RETURN_QUANTITY`, `ERR_CANCEL_ALREADY`, `ERR_IDEMPOTENCY`, `ERR_RETURN_REFUND_ACCOUNT_REQUIRED`, `ERR_UNAUTHORIZED` |
| 15. CompleteInventoryCount | `complete_inventory_count()` | `ERR_COUNT_NOT_FOUND`, `ERR_COUNT_ALREADY_COMPLETED`, `ERR_VALIDATION_NEGATIVE_QUANTITY`, `ERR_UNAUTHORIZED` |

**أخطاء طبقة API المشتركة على جميع العمليات:**  
`ERR_API_SESSION_INVALID`, `ERR_API_ROLE_FORBIDDEN`, `ERR_API_VALIDATION_FAILED`, `ERR_API_INTERNAL`.

---

## 🔗 الملفات المرتبطة

- [04_Core_Flows.md](./04_Core_Flows.md) - مصدر أخطاء العمليات (ERR_*)
- [13_Tech_Config.md](./13_Tech_Config.md) - Rate Limiting + Logging Strategy
- [07_Definitions_Glossary.md](./07_Definitions_Glossary.md) - المصطلحات
- [10_ADRs.md](./10_ADRs.md) - قرارات التصميم المتعلقة (ADR-032/033/039)

---

**الإصدار:** 1.9
**تاريخ التحديث:** 10 مارس 2026
**التغييرات:** v1.9 — حجز امتدادات أخطاء مخططة لـ `PX-08 .. PX-14` (`expense`, `notifications`, `receipt links`, `permissions`, `portability`, `search`) دون إدخالها في العدّاد التشغيلي الحالي. v1.8 — إضافة 12 رمز خطأ من SQL: `ERR_CANNOT_CANCEL_PAID_DEBT`, `ERR_INVOICE_NOT_FOUND`, `ERR_INVOICE_CANCELLED`, `ERR_ITEM_NOT_FOUND`, `ERR_CUSTOMER_NOT_FOUND`, `ERR_COUNT_NOT_FOUND`, `ERR_APPEND_ONLY_VIOLATION`, `ERR_VALIDATION_SNAPSHOT_DATE`, `ERR_PRODUCT_NOT_FOUND`, `ERR_DEBT_ENTRY_NOT_FOUND`, `ERR_SUPPLIER_NOT_FOUND`, `ERR_ACCOUNT_NOT_FOUND`; تحديث مصفوفة التغطية لتطابق SQL الحالي; العدد الإجمالي 55. v1.7 — إضافة `ERR_RETURN_REFUND_ACCOUNT_REQUIRED` وتحديث العدد الإجمالي إلى 42 رمز خطأ. v1.6 — تصحيح العدد الإجمالي: 41 رمز خطأ (27 عمليات + 10 عامة + 4 طبقة API). v1.5 — إضافة ERR_PRODUCT_HAS_REFERENCES، إعادة الترقيم.
