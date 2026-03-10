import { z } from "zod";

export const reconcileAccountSchema = z.object({
  account_id: z.string().uuid("الحساب المطلوب غير صالح."),
  actual_balance: z.coerce.number().min(0, "الرصيد الفعلي يجب أن يكون صفرًا أو أكبر."),
  notes: z
    .string()
    .trim()
    .min(1, "سبب التسوية مطلوب.")
    .max(255, "سبب التسوية يجب ألا يتجاوز 255 حرفًا.")
});
