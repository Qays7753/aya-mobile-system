import { z } from "zod";

const inventoryItemSchema = z.object({
  product_id: z.string().uuid("معرف المنتج غير صالح."),
  actual_quantity: z.coerce
    .number()
    .int("الكمية الفعلية يجب أن تكون عددًا صحيحًا.")
    .min(0, "الكمية الفعلية يجب أن تكون صفرًا أو أكبر."),
  reason: z
    .string()
    .trim()
    .max(255, "سبب الفرق يجب ألا يتجاوز 255 حرفًا.")
    .optional()
});

export const completeInventoryCountSchema = z.object({
  inventory_count_id: z.string().uuid("معرف الجرد غير صالح."),
  items: z.array(inventoryItemSchema).min(1, "يجب إدخال بند واحد على الأقل.")
});
