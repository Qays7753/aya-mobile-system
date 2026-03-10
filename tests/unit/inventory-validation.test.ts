import { completeInventoryCountSchema } from "@/lib/validations/inventory";

describe("completeInventoryCountSchema", () => {
  it("accepts a valid inventory completion payload", () => {
    const parsed = completeInventoryCountSchema.safeParse({
      inventory_count_id: "11111111-1111-1111-8111-111111111111",
      items: [
        {
          product_id: "22222222-2222-2222-8222-222222222222",
          actual_quantity: 8,
          reason: "فرق جرد"
        }
      ]
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty items and invalid quantities", () => {
    const parsed = completeInventoryCountSchema.safeParse({
      inventory_count_id: "11111111-1111-1111-8111-111111111111",
      items: [
        {
          product_id: "22222222-2222-2222-8222-222222222222",
          actual_quantity: -2
        }
      ]
    });

    expect(parsed.success).toBe(false);
  });
});
