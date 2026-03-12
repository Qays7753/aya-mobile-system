import {
  createExpenseCategorySchema,
  createExpenseSchema,
  updateExpenseCategorySchema
} from "@/lib/validations/expenses";

describe("expenses validations", () => {
  it("accepts a canonical expense payload", () => {
    const parsed = createExpenseSchema.safeParse({
      amount: 12.5,
      account_id: "11111111-1111-1111-8111-111111111111",
      expense_category_id: "22222222-2222-2222-8222-222222222222",
      description: "Internet bill",
      notes: "March",
      idempotency_key: "33333333-3333-3333-8333-333333333333"
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects zero or negative expense amounts", () => {
    const parsed = createExpenseSchema.safeParse({
      amount: 0,
      account_id: "11111111-1111-1111-8111-111111111111",
      expense_category_id: "22222222-2222-2222-8222-222222222222",
      description: "Internet bill",
      idempotency_key: "33333333-3333-3333-8333-333333333333"
    });

    expect(parsed.success).toBe(false);
  });

  it("requires an expense category type on create", () => {
    const parsed = createExpenseCategorySchema.safeParse({
      name: "Rent"
    });

    expect(parsed.success).toBe(false);
  });

  it("accepts partial category updates", () => {
    const parsed = updateExpenseCategorySchema.safeParse({
      description: "Updated description",
      is_active: false
    });

    expect(parsed.success).toBe(true);
  });
});
