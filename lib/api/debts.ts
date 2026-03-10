import { getApiErrorMeta } from "@/lib/api/common";

const CREATE_DEBT_MANUAL_ERROR_MAP = {
  ERR_IDEMPOTENCY: { status: 409, message: "تم تنفيذ هذه العملية مسبقًا." },
  ERR_VALIDATION_NEGATIVE_AMOUNT: {
    status: 400,
    message: "المبلغ يجب أن يكون أكبر من صفر."
  },
  ERR_CUSTOMER_NOT_FOUND: { status: 404, message: "عميل الدين المطلوب غير موجود." },
  ERR_UNAUTHORIZED: { status: 403, message: "ليس لديك صلاحية لهذه العملية." }
} as const;

const CREATE_DEBT_PAYMENT_ERROR_MAP = {
  ERR_DEBT_OVERPAY: { status: 400, message: "مبلغ التسديد يتجاوز الرصيد المستحق." },
  ERR_DEBT_ENTRY_NOT_FOUND: { status: 404, message: "قيد الدين المحدد غير موجود." },
  ERR_IDEMPOTENCY: { status: 409, message: "تم تنفيذ هذه العملية مسبقًا." },
  ERR_VALIDATION_NEGATIVE_AMOUNT: {
    status: 400,
    message: "المبلغ يجب أن يكون أكبر من صفر."
  },
  ERR_CUSTOMER_NOT_FOUND: { status: 404, message: "عميل الدين المطلوب غير موجود." },
  ERR_UNAUTHORIZED: { status: 403, message: "ليس لديك صلاحية لهذه العملية." }
} as const;

type CreateDebtManualErrorCode = keyof typeof CREATE_DEBT_MANUAL_ERROR_MAP;
type CreateDebtPaymentErrorCode = keyof typeof CREATE_DEBT_PAYMENT_ERROR_MAP;

export function getCreateDebtManualErrorMeta(code: string) {
  if (code in CREATE_DEBT_MANUAL_ERROR_MAP) {
    return CREATE_DEBT_MANUAL_ERROR_MAP[code as CreateDebtManualErrorCode];
  }

  return getApiErrorMeta(code);
}

export function getCreateDebtPaymentErrorMeta(code: string) {
  if (code in CREATE_DEBT_PAYMENT_ERROR_MAP) {
    return CREATE_DEBT_PAYMENT_ERROR_MAP[code as CreateDebtPaymentErrorCode];
  }

  return getApiErrorMeta(code);
}
