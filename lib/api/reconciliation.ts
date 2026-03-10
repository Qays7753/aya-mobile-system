import { getApiErrorMeta } from "@/lib/api/common";

const RECONCILIATION_ERROR_MAP = {
  ERR_ACCOUNT_NOT_FOUND: {
    status: 404,
    message: "الحساب المطلوب غير موجود."
  },
  ERR_RECONCILIATION_UNRESOLVED: {
    status: 400,
    message: "يوجد فرق تسوية مفتوح لهذا الحساب اليوم ويجب حله أولًا."
  },
  ERR_UNAUTHORIZED: {
    status: 403,
    message: "ليس لديك صلاحية لتنفيذ التسوية."
  }
} as const;

type ReconciliationErrorCode = keyof typeof RECONCILIATION_ERROR_MAP;

export function getReconciliationErrorMeta(code: string) {
  if (code in RECONCILIATION_ERROR_MAP) {
    return RECONCILIATION_ERROR_MAP[code as ReconciliationErrorCode];
  }

  return getApiErrorMeta(code);
}
