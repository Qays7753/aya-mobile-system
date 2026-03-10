import { getApiErrorMeta } from "@/lib/api/common";

const SNAPSHOT_ERROR_MAP = {
  ERR_VALIDATION_SNAPSHOT_DATE: {
    status: 400,
    message: "لا يمكن إنشاء لقطة يومية إلا بتاريخ اليوم الحالي."
  },
  ERR_UNAUTHORIZED: {
    status: 403,
    message: "ليس لديك صلاحية لحفظ اللقطة اليومية."
  },
  ERR_DB_TRANSACTION_FAILED: {
    status: 500,
    message: "تعذر حفظ اللقطة اليومية. حاول مجددًا."
  }
} as const;

type SnapshotErrorCode = keyof typeof SNAPSHOT_ERROR_MAP;

export function getCreateSnapshotErrorMeta(code: string) {
  if (code in SNAPSHOT_ERROR_MAP) {
    return SNAPSHOT_ERROR_MAP[code as SnapshotErrorCode];
  }

  return getApiErrorMeta(code);
}
