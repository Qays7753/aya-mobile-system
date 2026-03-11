import { z } from "zod";

const expenseCategoryTypeSchema = z.enum(["fixed", "variable"], {
  message: "نوع فئة المصروف غير صالح"
});

export const createExpenseSchema = z.object({
  expense_category_id: z.string().uuid("معرف فئة المصروف غير صالح"),
  account_id: z.string().uuid("معرف الحساب غير صالح"),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من صفر"),
  description: z.string().trim().min(1, "وصف المصروف مطلوب").max(500, "وصف المصروف طويل جدًا"),
  notes: z.string().trim().max(1000, "الملاحظات طويلة جدًا").optional(),
  idempotency_key: z.string().uuid("مفتاح منع التكرار غير صالح")
});

export const createExpenseCategorySchema = z.object({
  name: z.string().trim().min(1, "اسم الفئة مطلوب").max(100, "اسم الفئة طويل جدًا"),
  type: expenseCategoryTypeSchema,
  description: z.string().trim().max(1000, "وصف الفئة طويل جدًا").optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int("ترتيب العرض يجب أن يكون عددًا صحيحًا").min(0, "ترتيب العرض يجب أن يكون صفرًا أو أكبر").default(0)
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.partial().superRefine((value, ctx) => {
  if (Object.keys(value).length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "يجب إرسال حقل واحد على الأقل للتعديل."
    });
  }
});

export const markNotificationsReadSchema = z
  .object({
    notification_ids: z.array(z.string().uuid("معرف الإشعار غير صالح")).max(100, "الحد الأقصى 100 إشعار").optional(),
    mark_all: z.boolean().default(false)
  })
  .superRefine((value, ctx) => {
    if (!value.mark_all && (!value.notification_ids || value.notification_ids.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "حدد إشعارًا واحدًا على الأقل أو استخدم mark_all.",
        path: ["notification_ids"]
      });
    }
  });

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>;
export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;
