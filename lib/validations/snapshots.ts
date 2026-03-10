import { z } from "zod";

export const createSnapshotSchema = z.object({
  notes: z
    .string()
    .trim()
    .max(500, "الملاحظات يجب ألا تتجاوز 500 حرف.")
    .optional()
});
