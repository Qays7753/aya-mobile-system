import { z } from "zod";

export const returnItemSchema = z.object({
  invoice_item_id: z.string().uuid("معرف بند الفاتورة غير صالح"),
  quantity: z.number().int("الكمية يجب أن تكون عددًا صحيحًا").min(1, "الكمية يجب أن تكون 1 على الأقل")
});

export const createReturnSchema = z.object({
  invoice_id: z.string().uuid("معرف الفاتورة غير صالح"),
  items: z.array(returnItemSchema).min(1, "يجب تحديد بند واحد على الأقل"),
  refund_account_id: z.string().uuid("معرف حساب الإرجاع غير صالح").optional(),
  return_type: z.enum(["full", "partial"], "نوع المرتجع يجب أن يكون full أو partial"),
  reason: z.string().trim().min(1, "سبب الإرجاع مطلوب").max(500, "سبب الإرجاع طويل جدًا"),
  idempotency_key: z.string().uuid("مفتاح منع التكرار غير صالح")
});

export type CreateReturnInput = z.infer<typeof createReturnSchema>;
