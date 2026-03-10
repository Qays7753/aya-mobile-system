import { createReturnSchema } from "@/lib/validations/returns";

describe("createReturnSchema", () => {
  it("accepts a valid return payload", () => {
    const parsed = createReturnSchema.safeParse({
      invoice_id: "11111111-1111-1111-8111-111111111111",
      items: [
        {
          invoice_item_id: "22222222-2222-2222-8222-222222222222",
          quantity: 1
        }
      ],
      refund_account_id: "33333333-3333-3333-8333-333333333333",
      return_type: "partial",
      reason: "المنتج لا يعمل كما يجب",
      idempotency_key: "44444444-4444-4444-8444-444444444444"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty items and invalid return type", () => {
    const parsed = createReturnSchema.safeParse({
      invoice_id: "11111111-1111-1111-8111-111111111111",
      items: [],
      return_type: "exchange",
      reason: "",
      idempotency_key: "44444444-4444-4444-8444-444444444444"
    });

    expect(parsed.success).toBe(false);
  });
});
