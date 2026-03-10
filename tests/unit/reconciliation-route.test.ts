import { NextResponse } from "next/server";
import { POST } from "@/app/api/reconciliation/route";
import { authorizeRequest } from "@/lib/api/common";

vi.mock("@/lib/api/common", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/common")>("@/lib/api/common");
  return {
    ...actual,
    authorizeRequest: vi.fn()
  };
});

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/reconciliation", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 400 when validation fails", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: true,
      role: "admin",
      userId: "admin-1",
      supabase: { rpc: vi.fn() }
    } as never);

    const response = await POST(
      createRequest({
        account_id: "bad-id",
        actual_balance: -10,
        notes: ""
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("ERR_API_VALIDATION_FAILED");
  });

  it("passes the canonical payload to reconcile_account()", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        reconciliation_id: "recon-1",
        expected: 120,
        actual: 100,
        difference: -20
      },
      error: null
    });

    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: true,
      role: "admin",
      userId: "admin-1",
      supabase: { rpc }
    } as never);

    const response = await POST(
      createRequest({
        account_id: "11111111-1111-1111-8111-111111111111",
        actual_balance: 100,
        notes: "عجز وردية"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.reconciliation_id).toBe("recon-1");
    expect(rpc).toHaveBeenCalledWith("reconcile_account", {
      p_account_id: "11111111-1111-1111-8111-111111111111",
      p_actual_balance: 100,
      p_notes: "عجز وردية",
      p_created_by: "admin-1"
    });
  });

  it("maps ERR_RECONCILIATION_UNRESOLVED to a blocking response", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: true,
      role: "admin",
      userId: "admin-1",
      supabase: {
        rpc: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "ERR_RECONCILIATION_UNRESOLVED" }
        })
      }
    } as never);

    const response = await POST(
      createRequest({
        account_id: "11111111-1111-1111-8111-111111111111",
        actual_balance: 100,
        notes: "عجز وردية"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("ERR_RECONCILIATION_UNRESOLVED");
  });
});
