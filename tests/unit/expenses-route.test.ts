import { NextResponse } from "next/server";
import { POST } from "@/app/api/expenses/route";
import { authorizeRequest } from "@/lib/api/common";

vi.mock("@/lib/api/common", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/common")>("@/lib/api/common");
  return {
    ...actual,
    authorizeRequest: vi.fn()
  };
});

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/expenses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/expenses", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authorization response when blocked", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: false,
      response: NextResponse.json(
        { success: false, error: { code: "ERR_API_ROLE_FORBIDDEN", message: "forbidden" } },
        { status: 403 }
      )
    });

    const response = await POST(createRequest({}));
    expect(response.status).toBe(403);
  });

  it("passes the canonical payload to create_expense()", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        expense_id: "expense-1",
        expense_number: "AYA-2026-00090",
        ledger_entry_id: "ledger-1"
      },
      error: null
    });

    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: true,
      role: "pos_staff",
      userId: "pos-1",
      supabase: { rpc }
    } as never);

    const response = await POST(
      createRequest({
        amount: 12,
        account_id: "11111111-1111-1111-8111-111111111111",
        expense_category_id: "22222222-2222-2222-8222-222222222222",
        description: "Fuel",
        notes: "Trip",
        idempotency_key: "33333333-3333-3333-8333-333333333333"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.expense_number).toBe("AYA-2026-00090");
    expect(rpc).toHaveBeenCalledWith("create_expense", {
      p_amount: 12,
      p_account_id: "11111111-1111-1111-8111-111111111111",
      p_category_id: "22222222-2222-2222-8222-222222222222",
      p_description: "Fuel",
      p_notes: "Trip",
      p_idempotency_key: "33333333-3333-3333-8333-333333333333",
      p_created_by: "pos-1"
    });
  });

  it("maps expense category not found errors from RPC", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: true,
      role: "admin",
      userId: "admin-1",
      supabase: {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "ERR_EXPENSE_CATEGORY_NOT_FOUND" }
        })
      }
    } as never);

    const response = await POST(
      createRequest({
        amount: 12,
        account_id: "11111111-1111-1111-8111-111111111111",
        expense_category_id: "22222222-2222-2222-8222-222222222222",
        description: "Fuel",
        idempotency_key: "33333333-3333-3333-8333-333333333333"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.error.code).toBe("ERR_EXPENSE_CATEGORY_NOT_FOUND");
  });
});
