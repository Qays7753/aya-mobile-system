import { getApiErrorMeta } from "@/lib/api/common";

const CREATE_RETURN_ERROR_MAP = {
  ERR_INVOICE_NOT_FOUND: { status: 404, message: "الفاتورة غير موجودة." },
  ERR_INVOICE_CANCELLED: { status: 400, message: "الفاتورة غير نشطة ولا يمكن إنشاء مرتجع عليها." },
  ERR_ITEM_NOT_FOUND: { status: 404, message: "بند الفاتورة المطلوب غير موجود." },
  ERR_RETURN_QUANTITY: { status: 400, message: "كمية الإرجاع تتجاوز الكمية المباعة." },
  ERR_CANCEL_ALREADY: { status: 409, message: "هذه العملية أُغلقت مسبقًا ولا تقبل مرتجعًا جديدًا." },
  ERR_IDEMPOTENCY: { status: 409, message: "تم تنفيذ هذه العملية مسبقًا." },
  ERR_RETURN_REFUND_ACCOUNT_REQUIRED: {
    status: 400,
    message: "يجب اختيار حساب إرجاع عندما ينتج عن المرتجع مبلغ نقدي مسترد."
  },
  ERR_UNAUTHORIZED: { status: 403, message: "ليس لديك صلاحية لهذه العملية." }
} as const;

type CreateReturnErrorCode = keyof typeof CREATE_RETURN_ERROR_MAP;

export function getCreateReturnErrorMeta(code: string) {
  if (code in CREATE_RETURN_ERROR_MAP) {
    return CREATE_RETURN_ERROR_MAP[code as CreateReturnErrorCode];
  }

  return getApiErrorMeta(code);
}
