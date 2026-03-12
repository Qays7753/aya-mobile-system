import { z } from "zod";

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

export type MarkNotificationsReadInput = z.infer<typeof markNotificationsReadSchema>;
