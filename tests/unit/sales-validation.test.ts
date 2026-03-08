import { createSaleSchema } from "@/lib/validations/sales";

const productId = "11111111-1111-1111-8111-111111111111";
const accountId = "22222222-2222-2222-8222-222222222222";
const idempotencyKey = "33333333-3333-3333-8333-333333333333";

describe("createSaleSchema", () => {
  it("accepts a minimal valid sale request", () => {
    const parsed = createSaleSchema.safeParse({
      items: [{ product_id: productId, quantity: 2 }],
      payments: [{ account_id: accountId, amount: 15 }],
      idempotency_key: idempotencyKey
    });

    expect(parsed.success).toBe(true);
  });

  it("strips any client-provided unit_price field to preserve server pricing authority", () => {
    const parsed = createSaleSchema.parse({
      items: [
        {
          product_id: productId,
          quantity: 1,
          discount_percentage: 5,
          unit_price: 99999
        }
      ],
      payments: [{ account_id: accountId, amount: 10 }],
      idempotency_key: idempotencyKey
    });

    expect(parsed.items[0]).not.toHaveProperty("unit_price");
  });

  it("rejects empty payment arrays", () => {
    const parsed = createSaleSchema.safeParse({
      items: [{ product_id: productId, quantity: 1 }],
      payments: [],
      idempotency_key: idempotencyKey
    });

    expect(parsed.success).toBe(false);
  });
});
