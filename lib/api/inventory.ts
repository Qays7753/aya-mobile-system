import { getApiErrorMeta } from "@/lib/api/common";

const INVENTORY_ERROR_MAP = {
  ERR_COUNT_NOT_FOUND: {
    status: 404,
    message: "عملية الجرد المطلوبة غير موجودة."
  },
  ERR_COUNT_ALREADY_COMPLETED: {
    status: 409,
    message: "هذه العملية أُغلقت مسبقًا ولا يمكن إكمالها مرة ثانية."
  },
  ERR_VALIDATION_NEGATIVE_QUANTITY: {
    status: 400,
    message: "الكمية الفعلية يجب أن تكون صفرًا أو أكبر."
  },
  ERR_UNAUTHORIZED: {
    status: 403,
    message: "ليس لديك صلاحية لإكمال الجرد."
  }
} as const;

type InventoryErrorCode = keyof typeof INVENTORY_ERROR_MAP;

export function getCompleteInventoryErrorMeta(code: string) {
  if (code in INVENTORY_ERROR_MAP) {
    return INVENTORY_ERROR_MAP[code as InventoryErrorCode];
  }

  return getApiErrorMeta(code);
}
