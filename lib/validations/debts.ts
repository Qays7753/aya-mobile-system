import { z } from "zod";

export const createDebtManualSchema = z.object({
  debt_customer_id: z.string().uuid("معرف عميل الدين غير صالح"),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  description: z.string().trim().max(255, "الوصف طويل جدًا").optional(),
  idempotency_key: z.string().uuid("مفتاح منع التكرار غير صالح")
});

export const createDebtPaymentSchema = z.object({
  debt_customer_id: z.string().uuid("معرف عميل الدين غير صالح"),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  account_id: z.string().uuid("معرف الحساب غير صالح"),
  notes: z.string().trim().max(255, "الملاحظات طويلة جدًا").optional(),
  idempotency_key: z.string().uuid("مفتاح منع التكرار غير صالح"),
  debt_entry_id: z.string().uuid("معرف قيد الدين غير صالح").optional()
});

export type CreateDebtManualInput = z.infer<typeof createDebtManualSchema>;
export type CreateDebtPaymentInput = z.infer<typeof createDebtPaymentSchema>;
