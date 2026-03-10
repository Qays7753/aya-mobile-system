import { reconcileAccountSchema } from "@/lib/validations/reconciliation";

describe("reconcileAccountSchema", () => {
  it("accepts a valid reconciliation payload", () => {
    const parsed = reconcileAccountSchema.safeParse({
      account_id: "11111111-1111-1111-8111-111111111111",
      actual_balance: 120.5,
      notes: "فرق وردية الصباح"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects empty notes and negative balances", () => {
    const parsed = reconcileAccountSchema.safeParse({
      account_id: "11111111-1111-1111-8111-111111111111",
      actual_balance: -1,
      notes: ""
    });

    expect(parsed.success).toBe(false);
  });
});
