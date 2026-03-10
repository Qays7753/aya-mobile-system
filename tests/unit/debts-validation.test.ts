import { createDebtManualSchema, createDebtPaymentSchema } from "@/lib/validations/debts";

describe("debt validation schemas", () => {
  it("accepts valid manual debt and debt payment payloads", () => {
    const manual = createDebtManualSchema.safeParse({
      debt_customer_id: "11111111-1111-1111-8111-111111111111",
      amount: 25,
      description: "دين يدوي لملحقات",
      idempotency_key: "22222222-2222-2222-8222-222222222222"
    });
    const payment = createDebtPaymentSchema.safeParse({
      debt_customer_id: "11111111-1111-1111-8111-111111111111",
      amount: 10,
      account_id: "33333333-3333-3333-8333-333333333333",
      notes: "دفعة أولى",
      idempotency_key: "44444444-4444-4444-8444-444444444444"
    });

    expect(manual.success).toBe(true);
    expect(payment.success).toBe(true);
  });

  it("rejects negative amounts and invalid identifiers", () => {
    const manual = createDebtManualSchema.safeParse({
      debt_customer_id: "invalid",
      amount: -5,
      idempotency_key: "bad"
    });
    const payment = createDebtPaymentSchema.safeParse({
      debt_customer_id: "11111111-1111-1111-8111-111111111111",
      amount: 0,
      account_id: "bad",
      idempotency_key: "bad"
    });

    expect(manual.success).toBe(false);
    expect(payment.success).toBe(false);
  });
});
