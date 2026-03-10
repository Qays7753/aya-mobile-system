import { cancelInvoiceSchema, editInvoiceSchema } from "@/lib/validations/invoices";

describe("invoice validation schemas", () => {
  it("accepts valid cancel and edit payloads", () => {
    const cancel = cancelInvoiceSchema.safeParse({
      invoice_id: "11111111-1111-1111-8111-111111111111",
      cancel_reason: "إلغاء بعد اكتشاف خطأ في العملية"
    });
    const edit = editInvoiceSchema.safeParse({
      invoice_id: "11111111-1111-1111-8111-111111111111",
      items: [
        {
          product_id: "22222222-2222-2222-8222-222222222222",
          quantity: 1,
          discount_percentage: 0,
          unit_price: 9999
        }
      ],
      payments: [
        {
          account_id: "33333333-3333-3333-8333-333333333333",
          amount: 10
        }
      ],
      edit_reason: "تعديل الفاتورة بعد مراجعة البند",
      idempotency_key: "44444444-4444-4444-8444-444444444444"
    });

    expect(cancel.success).toBe(true);
    expect(edit.success).toBe(true);

    if (edit.success) {
      expect(edit.data.items[0]).not.toHaveProperty("unit_price");
    }
  });

  it("rejects empty reasons and malformed ids", () => {
    const cancel = cancelInvoiceSchema.safeParse({
      invoice_id: "bad",
      cancel_reason: ""
    });
    const edit = editInvoiceSchema.safeParse({
      invoice_id: "11111111-1111-1111-8111-111111111111",
      items: [],
      payments: [],
      edit_reason: "",
      idempotency_key: "bad"
    });

    expect(cancel.success).toBe(false);
    expect(edit.success).toBe(false);
  });
});
