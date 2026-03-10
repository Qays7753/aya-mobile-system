import { z } from "zod";
import { saleItemSchema, salePaymentSchema } from "@/lib/validations/sales";

export const cancelInvoiceSchema = z.object({
  invoice_id: z.string().uuid("معرف الفاتورة غير صالح"),
  cancel_reason: z.string().trim().min(1, "سبب الإلغاء مطلوب").max(500, "سبب الإلغاء طويل جدًا")
});

export const editInvoiceSchema = z.object({
  invoice_id: z.string().uuid("معرف الفاتورة غير صالح"),
  items: z.array(saleItemSchema).min(1, "يجب إضافة منتج واحد على الأقل"),
  payments: z.array(salePaymentSchema).min(1, "يجب تحديد دفعة واحدة على الأقل"),
  customer_id: z.string().uuid("معرف العميل غير صالح").optional(),
  edit_reason: z.string().trim().min(1, "سبب التعديل مطلوب").max(500, "سبب التعديل طويل جدًا"),
  idempotency_key: z.string().uuid("مفتاح منع التكرار غير صالح")
});

export type CancelInvoiceInput = z.infer<typeof cancelInvoiceSchema>;
export type EditInvoiceInput = z.infer<typeof editInvoiceSchema>;
