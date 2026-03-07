# آية موبايل - مرجع البناء التنفيذي
## 28) Reference Implementation Guide

---

## 📋 مقدمة

هذا الملف هو **المرجع الإلزامي** لأي مطور أو AI يكتب كوداً لنظام آية موبايل. يحتوي على أمثلة كاملة وقابلة للنسخ توضح **كيف** يُكتب الكود — وليس فقط "ماذا" يُبنى.

**كل API Route وكل مكون واجهة يجب أن يتبع الأنماط الموثقة هنا بالضبط.**

> **المراجع الأساسية:**
> - [13_Tech_Config.md](./13_Tech_Config.md) — القواعد الست الإلزامية + هيكل المجلدات
> - [25_API_Contracts.md](./25_API_Contracts.md) — عقود API
> - [16_Error_Codes.md](./16_Error_Codes.md) — كتالوج رموز الأخطاء
> - [10_ADRs.md](./10_ADRs.md) — ADR-042/043/044
> - [15_Seed_Data_Functions.md](./15_Seed_Data_Functions.md) — توقيعات الدوال

---

## القسم 1: النمط الإلزامي لكل API Route (Canonical API Route Pattern)

> **المبدأ:** كل API Route يتبع نفس التسلسل: **Session → Role → Zod → RPC → StandardEnvelope**
> ([13_Tech_Config.md](./13_Tech_Config.md) سطر 113)

### مثال كامل: `POST /api/sales` — `app/api/sales/route.ts`

```typescript
// app/api/sales/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';

// ============================================================
// 1. عميل service_role — يُستورد من الملف المشترك (09_Implementation_Plan سطر 67)
//    لا إنشاء inline — ملف واحد مشترك لكل API Routes
// ============================================================
import { supabaseAdmin } from '@/lib/supabase/admin';
// 📁 lib/supabase/admin.ts يحتوي:
//   import { createClient } from '@supabase/supabase-js';
//   export const supabaseAdmin = createClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL!,
//     process.env.SUPABASE_SERVICE_ROLE_KEY!
//   );

// ============================================================
// 2. Zod Schema — مطابق لعقد POST /api/sales في 25_API_Contracts.md
//    ملاحظة ADR-043: لا نقبل unit_price أو total_amount من العميل
// ============================================================
const SaleItemSchema = z.object({
  product_id: z.string().uuid('معرف المنتج غير صالح'),
  quantity: z.number().int().min(1, 'الكمية يجب أن تكون 1 على الأقل'),
  discount_percentage: z.number().min(0).max(100).optional().default(0),
});

const PaymentSchema = z.object({
  account_id: z.string().uuid('معرف الحساب غير صالح'),
  amount: z.number().positive('المبلغ يجب أن يكون أكبر من صفر'),
});

const CreateSaleSchema = z.object({
  items: z.array(SaleItemSchema).min(1, 'يجب إضافة منتج واحد على الأقل'),
  payments: z.array(PaymentSchema).min(1, 'يجب تحديد طريقة دفع واحدة على الأقل'),
  customer_id: z.string().uuid().optional(),
  pos_terminal_code: z.string().optional(),
  notes: z.string().max(500).optional(),
  idempotency_key: z.string().uuid('مفتاح التكرار غير صالح'),
});

// ============================================================
// 3. خريطة تحويل أخطاء PostgreSQL إلى HTTP — من 16_Error_Codes.md
// ============================================================
const ERROR_MAP: Record<string, { status: number; message: string }> = {
  ERR_STOCK_INSUFFICIENT:      { status: 400, message: 'المخزون غير كافٍ لهذا المنتج' },
  ERR_DISCOUNT_EXCEEDED:       { status: 400, message: 'نسبة الخصم تتجاوز الحد المسموح' },
  ERR_PAYMENT_MISMATCH:        { status: 400, message: 'مجموع المدفوعات لا يساوي إجمالي الفاتورة' },
  ERR_IDEMPOTENCY:             { status: 409, message: 'تم تنفيذ هذه العملية مسبقاً' },
  ERR_CONCURRENT_STOCK_UPDATE: { status: 409, message: 'تغير المخزون أثناء تنفيذ العملية — راجع الكمية وأعد المحاولة' },
};

// ============================================================
// 4. الدالة الرئيسية — POST handler
// ============================================================
export async function POST(request: NextRequest) {
  try {
    // ──────────────────────────────────────────
    // الخطوة 1: استخراج الجلسة والتحقق منها
    // ──────────────────────────────────────────
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ERR_API_SESSION_INVALID',
            message: 'الجلسة غير صالحة. يرجى تسجيل الدخول مجدداً',
          },
        },
        { status: 401 }
      );
    }

    // ──────────────────────────────────────────
    // الخطوة 2: التحقق من الصلاحيات (role check)
    //   POST /api/sales → مسموح لـ admin + pos_staff
    // ──────────────────────────────────────────
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    const allowedRoles = ['admin', 'pos_staff'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ERR_API_ROLE_FORBIDDEN',
            message: 'ليس لديك صلاحية لهذه العملية',
          },
        },
        { status: 403 }
      );
    }

    // ──────────────────────────────────────────
    // الخطوة 3: Zod Validation
    // ──────────────────────────────────────────
    const body = await request.json();
    const parseResult = CreateSaleSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ERR_API_VALIDATION_FAILED',
            message: 'بيانات الطلب غير صالحة',
            details: parseResult.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const validatedData = parseResult.data;

    // ──────────────────────────────────────────
    // الخطوة 4: استدعاء RPC عبر service_role
    //   الدالة تسحب الأسعار من DB (ADR-043)
    //   الدالة تتحقق من المخزون والخصم والدفع
    // ──────────────────────────────────────────
    // ⚠️ مهم: service_role يتجاوز RLS ولا يملأ auth.uid() تلقائياً.
    // لذلك نُمرر p_created_by صراحةً من الجلسة المُتحقق منها (الخطوة 1).
    const { data, error: rpcError } = await supabaseAdmin.rpc('create_sale', {
      p_items: validatedData.items,
      p_payments: validatedData.payments,
      p_customer_id: validatedData.customer_id ?? null,
      p_pos_terminal_code: validatedData.pos_terminal_code ?? null,
      p_notes: validatedData.notes ?? null,
      p_idempotency_key: validatedData.idempotency_key,
      p_created_by: session.user.id, // ← هوية المستخدم من الجلسة المُوثقة
    });

    // ──────────────────────────────────────────
    // الخطوة 5: معالجة أخطاء RPC
    //   تحويل RAISE EXCEPTION من PostgreSQL إلى StandardEnvelope
    // ──────────────────────────────────────────
    if (rpcError) {
      const errCode = extractErrorCode(rpcError.message);
      const mapped = ERROR_MAP[errCode];

      if (mapped) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: errCode,
              message: mapped.message,
            },
          },
          { status: mapped.status }
        );
      }

      // خطأ غير متوقع — تسجيل في Vercel Logs
      console.error('[POST /api/sales] Unhandled RPC error:', rpcError);
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'ERR_API_INTERNAL',
            message: 'حدث خطأ غير متوقع. حاول مجدداً',
          },
        },
        { status: 500 }
      );
    }

    // ──────────────────────────────────────────
    // الخطوة 6: استجابة النجاح — StandardEnvelope
    // ──────────────────────────────────────────
    return NextResponse.json(
      {
        success: true,
        data: {
          invoice_id: data.invoice_id,
          invoice_number: data.invoice_number,
          total: data.total,
          change: data.change,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    // خطأ غير متوقع تماماً (مثل JSON parsing فاشل)
    console.error('[POST /api/sales] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'ERR_API_INTERNAL',
          message: 'حدث خطأ غير متوقع. حاول مجدداً',
        },
      },
      { status: 500 }
    );
  }
}

// ============================================================
// مساعد: استخراج كود الخطأ من رسالة PostgreSQL
// ============================================================
function extractErrorCode(message: string): string {
  // PostgreSQL RAISE EXCEPTION يُرسل الخطأ بصيغة:
  // "ERR_STOCK_INSUFFICIENT: المخزون غير كافٍ" أو ضمن detail
  const match = message.match(/ERR_[A-Z_]+/);
  return match ? match[0] : 'ERR_API_INTERNAL';
}
```

### ملخص تسلسل API Route

```
Request
  │
  ├─ 1. getSession() → 401 إذا فشل
  ├─ 2. profile.role check → 403 إذا غير مصرح
  ├─ 3. Zod.safeParse() → 400 إذا فشل التحقق
  ├─ 4. supabaseAdmin.rpc() → استدعاء الدالة
  ├─ 5. rpcError? → تحويل ERR_* إلى StandardEnvelope
  └─ 6. success → { success: true, data: {...} }
```

---

## القسم 2: النمط الإلزامي للقراءة (Canonical Read Pattern)

> **المبدأ:** القراءة تتم مباشرة من المتصفح عبر `@supabase/ssr` مع `anon_key`.
> RLS تحمي البيانات تلقائياً. POS لا يرى أعمدة حساسة ([13_Tech_Config.md](./13_Tech_Config.md) سطر 108-116).

### مثال: قراءة قائمة المنتجات النشطة في POS

```typescript
// hooks/use-products.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';

// ============================================================
// 1. عميل المتصفح — anon_key فقط (ليس service_role!)
// ============================================================
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Product {
  id: string;
  name: string;
  category: string;
  sale_price: number;
  stock_quantity: number;
  is_active: boolean;
}

// ============================================================
// 2. Hook بدون مكتبات خارجية — فقط React built-in
//    ملاحظة: لا نستخدم SWR لأنها ليست ضمن المكتبات المعتمدة
//    في 13_Tech_Config.md §المكتبات المعتمدة
// ============================================================
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  const fetchActiveProducts = useCallback(async () => {
    setIsLoading(true);
    setIsError(false);

    const { data, error } = await supabase
      .from('products')
      .select('id, name, category, sale_price, stock_quantity, is_active')
      // ⚠️ لا نطلب cost_price — RLS/Views تمنع POS من رؤيتها
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[useProducts] Fetch error:', error);
      setIsError(true);
    } else {
      setProducts(data ?? []);
    }

    setIsLoading(false);
  }, []);

  // جلب عند التحميل الأول
  useEffect(() => {
    fetchActiveProducts();
  }, [fetchActiveProducts]);

  // إعادة جلب عند عودة الإنترنت
  useEffect(() => {
    const handleOnline = () => fetchActiveProducts();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [fetchActiveProducts]);

  return {
    products,
    isLoading,
    isError,
    refresh: fetchActiveProducts,
  };
}
```

### استخدام في مكون:

```typescript
// components/pos/ProductSearch.tsx
'use client';

import { useProducts } from '@/hooks/use-products';
import { useState } from 'react';

export function ProductSearch({ onSelect }: { onSelect: (product: any) => void }) {
  const { products, isLoading } = useProducts();
  const [query, setQuery] = useState('');

  // البحث محلي — المنتجات محملة مسبقاً (< 500 منتج)
  const filtered = products.filter((p) =>
    p.name.includes(query) && query.length >= 2
  );

  if (isLoading) {
    return <div className="skeleton-grid">{/* Skeleton UI */}</div>;
  }

  return (
    <div>
      <input
        type="text"
        placeholder="ابحث باسم المنتج..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoFocus
      />
      {filtered.map((product) => (
        <button key={product.id} onClick={() => onSelect(product)}>
          {product.name} — {product.sale_price} د.أ
          <span>المخزون: {product.stock_quantity}</span>
        </button>
      ))}
    </div>
  );
}
```

> **قاعدة:** Admin يستخدم نفس النمط لكنه يُضيف `cost_price` في الـ `select` لأن RLS تسمح له بقراءتها.

---

## القسم 3: خريطة تحويل الأخطاء (Complete Error Mapping Table)

> **المرجع الكامل:** [16_Error_Codes.md](./16_Error_Codes.md)

### جدول التحويل الكامل

| كود الخطأ | HTTP Status | رسالة المستخدم (AR) | ملاحظة للواجهة |
|-----------|-------------|---------------------|----------------|
| `ERR_STOCK_INSUFFICIENT` | 400 | المخزون غير كافٍ لهذا المنتج | تقليل الكمية |
| `ERR_DISCOUNT_EXCEEDED` | 400 | نسبة الخصم تتجاوز الحد المسموح | خفض النسبة |
| `ERR_PAYMENT_MISMATCH` | 400 | مجموع المدفوعات لا يساوي إجمالي الفاتورة | تصحيح المبالغ |
| `ERR_IDEMPOTENCY` | 409 | تم تنفيذ هذه العملية مسبقاً | عرض النتيجة السابقة |
| `ERR_CONCURRENT_STOCK_UPDATE` | 409 | تغير المخزون أثناء تنفيذ العملية — راجع الكمية وأعد المحاولة | زر "أعد المحاولة" بمفتاح جديد |
| `ERR_RETURN_QUANTITY` | 400 | كمية الإرجاع تتجاوز الكمية المباعة | تقليل الكمية |
| `ERR_RETURN_REFUND_ACCOUNT_REQUIRED` | 400 | يجب اختيار حساب إرجاع لأن جزءاً مسدداً سيتم رده نقداً | اختيار حساب الإرجاع |
| `ERR_CANCEL_ALREADY` | 409 | هذه الفاتورة ملغاة مسبقاً | لا إجراء |
| `ERR_CANCEL_HAS_RETURN` | 400 | لا يمكن إلغاء فاتورة بها مرتجعات | استخدام الإرجاع بدلاً |
| `ERR_CANCEL_REASON` | 400 | يجب تحديد سبب الإلغاء | إدخال السبب |
| `ERR_DEBT_OVERPAY` | 400 | مبلغ التسديد يتجاوز الرصيد المستحق | تقليل المبلغ |
| `ERR_RECONCILIATION_UNRESOLVED` | 400 | التسوية تحتوي فروقات غير محلولة | حل الفروقات أولاً |
| `ERR_UNAUTHORIZED` | 403 | ليس لديك صلاحية لهذه العملية | تسجيل بصاحب الصلاحية |
| `ERR_MAINTENANCE_INVALID_STATUS` | 400 | لا يمكن تحويل الحالة إلى هذه المرحلة | اتباع دورة الحالة |
| `ERR_SUPPLIER_OVERPAY` | 400 | مبلغ التسديد يتجاوز رصيد المورد | تقليل المبلغ |
| `ERR_TRANSFER_SAME_ACCOUNT` | 400 | لا يمكن التحويل من حساب لنفسه | اختيار حساب آخر |
| `ERR_INSUFFICIENT_BALANCE` | 400 | رصيد الحساب غير كافٍ لإتمام التحويل | تقليل المبلغ أو تعبئة الحساب |
| `ERR_EXPORT_TOO_LARGE` | 400 | التصدير يتجاوز 10,000 سجل — قلّص الفترة | تضييق الفلاتر |
| `ERR_CANNOT_CANCEL_PAID_DEBT` | 400 | لا يمكن إلغاء فاتورة سُدد دينها جزئياً | تسديد الدين أولاً |
| `ERR_INVOICE_NOT_FOUND` | 404 | الفاتورة غير موجودة | التأكد من الرقم |
| `ERR_INVOICE_CANCELLED` | 400 | الفاتورة ملغاة — لا يمكن إجراء عملية عليها | استخدام فاتورة نشطة |
| `ERR_ITEM_NOT_FOUND` | 404 | بند الفاتورة غير موجود | التأكد من المعرف |
| `ERR_CUSTOMER_NOT_FOUND` | 404 | العميل غير موجود | التأكد من المعرف |
| `ERR_PRODUCT_NOT_FOUND` | 404 | المنتج غير موجود | تحديث/مزامنة قائمة المنتجات ثم إعادة المحاولة |
| `ERR_DEBT_ENTRY_NOT_FOUND` | 404 | قيد الدين المحدد غير موجود | إزالة `debt_entry_id` أو اختيار قيد صحيح |
| `ERR_SUPPLIER_NOT_FOUND` | 404 | المورد غير موجود | التأكد من معرف المورد |
| `ERR_ACCOUNT_NOT_FOUND` | 404 | الحساب المالي غير موجود | التأكد من معرف الحساب |
| `ERR_COUNT_NOT_FOUND` | 404 | عملية الجرد غير موجودة | التأكد من المعرف |
| `ERR_COUNT_ALREADY_COMPLETED` | 400 | عملية الجرد مكتملة مسبقاً | لا إجراء |
| `ERR_APPEND_ONLY_VIOLATION` | 403 | محاولة تعديل/حذف سجل محمي (Append-Only) | لا يمكن التعديل |
| `ERR_VALIDATION_SNAPSHOT_DATE` | 400 | لا يمكن إنشاء لقطة بتاريخ غير اليوم | استخدم اليوم الحالي |
| `ERR_PRODUCT_EXISTS` | 409 | هذا المنتج موجود مسبقاً | تغيير الاسم/SKU |
| `ERR_PRODUCT_HAS_REFERENCES` | 400 | لا يمكن حذف المنتج — مرتبط بفواتير | أرشفة بدلاً من حذف |
| `ERR_VALIDATION_NEGATIVE_AMOUNT` | 400 | المبلغ يجب أن يكون أكبر من صفر | إدخال مبلغ موجب |
| `ERR_VALIDATION_NEGATIVE_QUANTITY` | 400 | الكمية يجب أن تكون موجبة | إدخال كمية موجبة |
| `ERR_VALIDATION_REQUIRED_FIELD` | 400 | حقل مطلوب ناقص | إكمال الحقول |
| `ERR_VALIDATION_INVALID_FORMAT` | 400 | صيغة البيانات غير صحيحة | تصحيح الصيغة |
| `ERR_SETTING_NOT_FOUND` | 404 | المفتاح المطلوب غير موجود في إعدادات النظام | التأكد من المفتاح |
| `ERR_VALIDATION_INCORRECT_TYPE` | 400 | نوع القيمة غير صحيح | تصحيح النوع |
| `ERR_VALIDATION_OUT_OF_RANGE` | 400 | القيمة خارج النطاق المسموح | إدخال ضمن النطاق |
| `ERR_DEBT_LIMIT_WARNING` | 200 | العميل قريب من حد الدين | تنبيه فقط — لا إيقاف |
| `ERR_AUTH_INVALID_CREDENTIALS` | 401 | بيانات الدخول غير صحيحة | تصحيح البيانات |
| `ERR_AUTH_SESSION_EXPIRED` | 401 | انتهت الجلسة. يرجى تسجيل الدخول مجدداً | إعادة تسجيل الدخول |
| `ERR_AUTH_ACCOUNT_DISABLED` | 403 | تم تعطيل حسابك. تواصل مع المسؤول | التواصل مع Admin |
| `ERR_RATE_LIMIT` | 429 | طلبات كثيرة. انتظر قليلاً ثم حاول مجدداً | الانتظار |
| `ERR_DB_CONNECTION` | 503 | خطأ في الاتصال بقاعدة البيانات | إعادة المحاولة |
| `ERR_DB_TRANSACTION_FAILED` | 500 | فشل في حفظ البيانات. لم يتم تغيير شيء | مراجعة البيانات |
| `ERR_DB_UNIQUE_VIOLATION` | 409 | هذا السجل موجود مسبقاً | التحقق من عدم التكرار |
| `ERR_NETWORK` | 0 | خطأ في الاتصال بالشبكة | إعادة المحاولة |
| `ERR_SERVER` | 500 | خطأ في الخادم. حاول لاحقاً | إعادة المحاولة |
| `ERR_API_SESSION_INVALID` | 401 | الجلسة غير صالحة. يرجى تسجيل الدخول مجدداً | إعادة تسجيل الدخول |
| `ERR_API_ROLE_FORBIDDEN` | 403 | ليس لديك صلاحية لهذه العملية | تسجيل بحساب آخر |
| `ERR_API_VALIDATION_FAILED` | 400 | بيانات الطلب غير صالحة | تصحيح البيانات |
| `ERR_API_INTERNAL` | 500 | حدث خطأ غير متوقع. حاول مجدداً | إعادة المحاولة |

### كود TypeScript لتحويل الأخطاء (Helper مشترك)

```typescript
// lib/utils/error-handler.ts

interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

interface StandardEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

/**
 * خريطة الأخطاء الكاملة — مطابقة لـ 16_Error_Codes.md
 */
const ERROR_MAP: Record<string, { status: number; message: string }> = {
  // أخطاء العمليات
  ERR_STOCK_INSUFFICIENT:            { status: 400, message: 'المخزون غير كافٍ لهذا المنتج' },
  ERR_DISCOUNT_EXCEEDED:             { status: 400, message: 'نسبة الخصم تتجاوز الحد المسموح' },
  ERR_PAYMENT_MISMATCH:              { status: 400, message: 'مجموع المدفوعات لا يساوي إجمالي الفاتورة' },
  ERR_IDEMPOTENCY:                   { status: 409, message: 'تم تنفيذ هذه العملية مسبقاً' },
  ERR_CONCURRENT_STOCK_UPDATE:       { status: 409, message: 'تغير المخزون أثناء تنفيذ العملية — راجع الكمية وأعد المحاولة' },
  ERR_RETURN_QUANTITY:               { status: 400, message: 'كمية الإرجاع تتجاوز الكمية المباعة' },
  ERR_RETURN_REFUND_ACCOUNT_REQUIRED:{ status: 400, message: 'يجب اختيار حساب إرجاع لأن جزءاً مسدداً سيتم رده نقداً' },
  ERR_CANCEL_ALREADY:                { status: 409, message: 'هذه الفاتورة ملغاة مسبقاً' },
  ERR_CANCEL_HAS_RETURN:             { status: 400, message: 'لا يمكن إلغاء فاتورة بها مرتجعات' },
  ERR_CANCEL_REASON:                 { status: 400, message: 'يجب تحديد سبب الإلغاء' },
  ERR_DEBT_OVERPAY:                  { status: 400, message: 'مبلغ التسديد يتجاوز الرصيد المستحق' },
  ERR_RECONCILIATION_UNRESOLVED:     { status: 400, message: 'التسوية تحتوي فروقات غير محلولة' },
  ERR_UNAUTHORIZED:                  { status: 403, message: 'ليس لديك صلاحية لهذه العملية' },
  ERR_MAINTENANCE_INVALID_STATUS:    { status: 400, message: 'لا يمكن تحويل الحالة إلى هذه المرحلة' },
  ERR_SUPPLIER_OVERPAY:              { status: 400, message: 'مبلغ التسديد يتجاوز رصيد المورد' },
  ERR_TRANSFER_SAME_ACCOUNT:         { status: 400, message: 'لا يمكن التحويل من حساب لنفسه' },
  ERR_INSUFFICIENT_BALANCE:          { status: 400, message: 'رصيد الحساب غير كافٍ لإتمام التحويل' },
  ERR_CANNOT_CANCEL_PAID_DEBT:       { status: 400, message: 'لا يمكن إلغاء فاتورة سُدد دينها جزئياً' },
  ERR_INVOICE_NOT_FOUND:             { status: 404, message: 'الفاتورة غير موجودة' },
  ERR_INVOICE_CANCELLED:             { status: 400, message: 'الفاتورة ملغاة — لا يمكن إجراء عملية عليها' },
  ERR_ITEM_NOT_FOUND:                { status: 404, message: 'بند الفاتورة غير موجود' },
  ERR_CUSTOMER_NOT_FOUND:            { status: 404, message: 'العميل غير موجود' },
  ERR_PRODUCT_NOT_FOUND:             { status: 404, message: 'المنتج غير موجود' },
  ERR_DEBT_ENTRY_NOT_FOUND:          { status: 404, message: 'قيد الدين المحدد غير موجود' },
  ERR_SUPPLIER_NOT_FOUND:            { status: 404, message: 'المورد غير موجود' },
  ERR_ACCOUNT_NOT_FOUND:             { status: 404, message: 'الحساب المالي غير موجود' },
  ERR_COUNT_NOT_FOUND:               { status: 404, message: 'عملية الجرد غير موجودة' },
  ERR_COUNT_ALREADY_COMPLETED:       { status: 400, message: 'عملية الجرد مكتملة مسبقاً' },
  ERR_APPEND_ONLY_VIOLATION:         { status: 403, message: 'محاولة تعديل/حذف سجل محمي (Append-Only)' },
  ERR_PRODUCT_EXISTS:                { status: 409, message: 'هذا المنتج موجود مسبقاً' },
  ERR_PRODUCT_HAS_REFERENCES:        { status: 400, message: 'لا يمكن حذف المنتج — مرتبط بفواتير أو مشتريات' },
  // أخطاء عامة
  ERR_AUTH_INVALID_CREDENTIALS:      { status: 401, message: 'بيانات الدخول غير صحيحة' },
  ERR_AUTH_SESSION_EXPIRED:          { status: 401, message: 'انتهت الجلسة. يرجى تسجيل الدخول مجدداً' },
  ERR_AUTH_ACCOUNT_DISABLED:         { status: 403, message: 'تم تعطيل حسابك. تواصل مع المسؤول' },
  ERR_RATE_LIMIT:                    { status: 429, message: 'طلبات كثيرة. انتظر قليلاً ثم حاول مجدداً' },
  ERR_DB_CONNECTION:                 { status: 503, message: 'خطأ في الاتصال بقاعدة البيانات' },
  ERR_DB_TRANSACTION_FAILED:         { status: 500, message: 'فشل في حفظ البيانات. لم يتم تغيير شيء' },
  ERR_VALIDATION_REQUIRED_FIELD:     { status: 400, message: 'حقل مطلوب ناقص' },
  ERR_VALIDATION_INVALID_FORMAT:     { status: 400, message: 'صيغة البيانات غير صحيحة' },
  ERR_VALIDATION_NEGATIVE_AMOUNT:    { status: 400, message: 'المبلغ يجب أن يكون أكبر من صفر' },
  ERR_VALIDATION_NEGATIVE_QUANTITY:  { status: 400, message: 'الكمية يجب أن تكون موجبة' },
  ERR_DB_UNIQUE_VIOLATION:           { status: 409, message: 'هذا السجل موجود مسبقاً' },
  // أخطاء طبقة API
  ERR_API_SESSION_INVALID:           { status: 401, message: 'الجلسة غير صالحة. يرجى تسجيل الدخول مجدداً' },
  ERR_API_ROLE_FORBIDDEN:            { status: 403, message: 'ليس لديك صلاحية لهذه العملية' },
  ERR_API_VALIDATION_FAILED:         { status: 400, message: 'بيانات الطلب غير صالحة' },
  ERR_API_INTERNAL:                  { status: 500, message: 'حدث خطأ غير متوقع. حاول مجدداً' },
};

/**
 * استخراج كود الخطأ من رسالة PostgreSQL RAISE EXCEPTION
 */
export function extractErrorCode(message: string): string {
  const match = message.match(/ERR_[A-Z_]+/);
  return match ? match[0] : 'ERR_API_INTERNAL';
}

/**
 * بناء StandardEnvelope من خطأ RPC
 * يُستخدم في كل API Route
 */
export function buildErrorResponse(rpcErrorMessage: string): {
  body: StandardEnvelope;
  status: number;
} {
  const errCode = extractErrorCode(rpcErrorMessage);
  const mapped = ERROR_MAP[errCode] ?? {
    status: 500,
    message: 'حدث خطأ غير متوقع. حاول مجدداً',
  };

  return {
    body: {
      success: false,
      error: {
        code: errCode,
        message: mapped.message,
      },
    },
    status: mapped.status,
  };
}
```

---

## القسم 4: قواعد إلزامية لكل مطور/AI

### ✅ يجب (MUST)

| # | القاعدة | المرجع |
|---|---------|--------|
| 1 | كل API Route يتبع نفس النمط: **Session → Role → Zod → RPC → Response** | [13_Tech_Config.md](./13_Tech_Config.md) سطر 113 |
| 2 | كل كتابة تمر عبر API Route — لا `INSERT` مباشر من المتصفح | ADR-042 |
| 3 | السعر يُسحب من DB (`products.sale_price`) وليس من المتصفح | ADR-043 |
| 4 | `idempotency_key` يُولّد في الواجهة كـ UUID v4 قبل إرسال الطلب | ADR-033 |
| 5 | كل خطأ يُرجع بصيغة `StandardEnvelope` مع كود `ERR_*` | [16_Error_Codes.md](./16_Error_Codes.md) |
| 6 | رسائل الخطأ للمستخدم بالعربية — من عمود "رسالة المستخدم (AR)" | [16_Error_Codes.md](./16_Error_Codes.md) |
| 7 | كل عملية حساسة تُسجل في `audit_logs` | ADR-039 |
| 8 | استخدام `@supabase/ssr` في المتصفح (ليس `@supabase/supabase-js` مباشرة) | [13_Tech_Config.md](./13_Tech_Config.md) سطر 111 |
| 9 | `Zod Schema` يتحقق من البيانات **قبل** استدعاء RPC | القسم 1 من هذا الملف |
| 10 | `invoice_date = CURRENT_DATE` دائماً — لا Backdating | ADR-034 |

### 🚫 يُمنع (MUST NOT)

| # | الممنوع | السبب | المرجع |
|---|---------|-------|--------|
| 1 | استخدام `service_role` في أي كود يعمل في المتصفح | تسريب أمني خطير — المفتاح يمنح وصولاً كاملاً | ADR-042/044 |
| 2 | قراءة `cost_price` أو `current_balance` من POS مباشرة | Blind POS — المعلومات الحساسة محمية | [13_Tech_Config.md](./13_Tech_Config.md) سطر 115-116 |
| 3 | قبول `unit_price` أو `total_amount` من الواجهة في البيع | السعر يُحسب سيرفرياً فقط — منع التلاعب | ADR-043 |
| 4 | تعديل أو حذف `ledger_entries` أو `audit_logs` | جداول Append-Only — أي تصحيح = قيد عكسي جديد | ADR-032/039 |
| 5 | استخدام Pages Router (Next.js) | النظام يستخدم App Router حصرياً | [13_Tech_Config.md](./13_Tech_Config.md) |
| 6 | إضافة مكتبات غير معتمدة بدون مراجعة | فقط المكتبات في [13_Tech_Config.md](./13_Tech_Config.md) §المكتبات المعتمدة | [13_Tech_Config.md](./13_Tech_Config.md) سطر 19-31 |
| 7 | وضع `SUPABASE_SERVICE_ROLE_KEY` في متغير يبدأ بـ `NEXT_PUBLIC_` | يكشفه تلقائياً للمتصفح | [13_Tech_Config.md](./13_Tech_Config.md) سطر 137 |
| 8 | إنشاء Offline Queue أو تخزين مالي محلي | النظام Online-only نهائياً | ADR-021 |

---

## القسم 5: أنماط الواجهة (UI Patterns)

> **المرجع:** [13_Tech_Config.md](./13_Tech_Config.md) سطر 200-270 (Optimistic UI + Post-Sale + Loading States)

### مثال كامل: زر "إتمام البيع" مع معالجة كل الحالات

```typescript
// components/pos/CompleteSaleButton.tsx
'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useCartStore } from '@/stores/cart-store';

// ============================================================
// crypto.randomUUID() — مدمج في المتصفح (Web Crypto API)
// لا حاجة لمكتبة uuid خارجية
// ============================================================

interface CompleteSaleProps {
  onSuccess: (data: { invoice_id: string; invoice_number: string; total: number; change: number }) => void;
}

export function CompleteSaleButton({ onSuccess }: CompleteSaleProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { items, payments, customerId, posTerminalCode, notes, clearCart } = useCartStore();

  // ============================================================
  // idempotency_key — يُولّد مرة واحدة عند فتح الشاشة
  // لا يتغير عند إعادة المحاولة (إلا ERR_CONCURRENT_STOCK_UPDATE)
  // ============================================================
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  async function handleCompleteSale() {
    if (items.length === 0) {
      toast.error('السلة فارغة — أضف منتجاً أولاً');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            discount_percentage: item.discount_percentage ?? 0,
          })),
          payments,
          customer_id: customerId ?? undefined,
          pos_terminal_code: posTerminalCode,
          notes,
          idempotency_key: idempotencyKey,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // ──────────────────────────────
        // نجاح — Toast أخضر + تنظيف
        // ──────────────────────────────
        toast.success(`تم البيع بنجاح — فاتورة ${result.data.invoice_number}`);

        // تشغيل صوت إتمام البيع
        const audio = new Audio('/sounds/sale-complete.mp3');
        audio.play().catch(() => {}); // تجاهل خطأ التشغيل التلقائي

        clearCart();
        setIdempotencyKey(crypto.randomUUID()); // مفتاح جديد للفاتورة التالية
        onSuccess(result.data);
      } else {
        // ──────────────────────────────
        // خطأ — Toast أحمر عربي
        // ──────────────────────────────
        const errCode = result.error?.code ?? 'ERR_API_INTERNAL';
        const errMessage = result.error?.message ?? 'حدث خطأ غير متوقع. حاول مجدداً';

        toast.error(errMessage);

        // حالة خاصة: تزامن المخزون — مفتاح جديد
        if (errCode === 'ERR_CONCURRENT_STOCK_UPDATE') {
          setIdempotencyKey(crypto.randomUUID());
        }

        // حالة خاصة: انتهاء الجلسة — إعادة توجيه
        if (errCode === 'ERR_API_SESSION_INVALID' || errCode === 'ERR_AUTH_SESSION_EXPIRED') {
          window.location.href = '/login';
        }
      }
    } catch (error) {
      // ──────────────────────────────
      // خطأ شبكة — Toast انقطاع
      // ──────────────────────────────
      toast.error('خطأ في الاتصال بالشبكة — تأكد من الإنترنت وأعد المحاولة');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <button
      onClick={handleCompleteSale}
      disabled={isSubmitting || items.length === 0}
      className="btn-primary"
    >
      {isSubmitting ? '⏳ جارٍ التنفيذ...' : '✅ إتمام البيع'}
    </button>
  );
}
```

### مخزن السلة (Cart Store) مع Persist

```typescript
// stores/cart-store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  product_id: string;
  name: string;
  sale_price: number;
  quantity: number;
  discount_percentage: number;
}

interface Payment {
  account_id: string;
  amount: number;
}

interface CartState {
  items: CartItem[];
  payments: Payment[];
  customerId: string | null;
  posTerminalCode: string;
  notes: string;
  addItem: (product: Omit<CartItem, 'quantity' | 'discount_percentage'>) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  updateDiscount: (productId: string, discount: number) => void;
  setPayments: (payments: Payment[]) => void;
  setCustomerId: (id: string | null) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;
  getTotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      payments: [],
      customerId: null,
      posTerminalCode: process.env.NEXT_PUBLIC_POS_TERMINAL_CODE ?? 'POS-01',
      notes: '',

      addItem: (product) =>
        set((state) => {
          const existing = state.items.find((i) => i.product_id === product.product_id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product_id === product.product_id
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            };
          }
          return {
            items: [...state.items, { ...product, quantity: 1, discount_percentage: 0 }],
          };
        }),

      removeItem: (productId) =>
        set((state) => ({
          items: state.items.filter((i) => i.product_id !== productId),
        })),

      updateQuantity: (productId, quantity) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId ? { ...i, quantity: Math.max(1, quantity) } : i
          ),
        })),

      updateDiscount: (productId, discount) =>
        set((state) => ({
          items: state.items.map((i) =>
            i.product_id === productId ? { ...i, discount_percentage: discount } : i
          ),
        })),

      setPayments: (payments) => set({ payments }),
      setCustomerId: (id) => set({ customerId: id }),
      setNotes: (notes) => set({ notes }),

      clearCart: () =>
        set({
          items: [],
          payments: [],
          customerId: null,
          notes: '',
        }),

      getTotal: () => {
        const state = get();
        return state.items.reduce(
          (sum, item) =>
            sum + item.sale_price * item.quantity * (1 - item.discount_percentage / 100),
          0
        );
      },
    }),
    {
      name: 'aya-mobile-cart', // مفتاح التخزين في localStorage
      // GAP-02 Fix: السلة تبقى محفوظة عند انقطاع الكهرباء/إغلاق المتصفح
    }
  )
);
```

---

## 🔗 الملفات المرتبطة

- [13_Tech_Config.md](./13_Tech_Config.md) — القواعد الإلزامية + هيكل المجلدات
- [25_API_Contracts.md](./25_API_Contracts.md) — عقود API التفصيلية
- [16_Error_Codes.md](./16_Error_Codes.md) — كتالوج رموز الأخطاء (51 رمز)
- [10_ADRs.md](./10_ADRs.md) — قرارات التصميم (ADR-042/043/044)
- [15_Seed_Data_Functions.md](./15_Seed_Data_Functions.md) — توقيعات الدوال
- [24_AI_Build_Playbook.md](./24_AI_Build_Playbook.md) — دليل البناء للـ AI

---

**الإصدار:** 1.0
**تاريخ التحديث:** 5 مارس 2026
**التغييرات:** v1.0 — إنشاء أولي: النمط الإلزامي لـ API Routes، القراءة، خريطة الأخطاء الكاملة، قواعد المطور، أنماط الواجهة.
