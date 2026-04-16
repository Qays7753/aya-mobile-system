import { NextResponse } from "next/server";
import { POST } from "@/app/api/invoices/cancel/route";
import { authorizeRequest } from "@/lib/api/common";

vi.mock("@/lib/api/common", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/common")>("@/lib/api/common");
  return {
    ...actual,
    authorizeRequest: vi.fn()
  };
});

const invoiceId = "11111111-1111-1111-8111-111111111111";

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/invoices/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

function buildAuthorization(options?: {
  rpcData?: Record<string, unknown> | null;
  rpcError?: { message: string } | null;
}) {
  const rpcData = options && "rpcData" in options
    ? options.rpcData
    : {
        success: true,
        reversed_entries_count: 2
      };

  return {
    authorized: true,
    role: "admin",
    userId: "admin-1",
    permissions: ["invoices.cancel"],
    bundleKeys: [],
    maxDiscountAmount: null,
    discountRequiresApproval: false,
    supabase: {
      rpc: vi.fn().mockResolvedValue({
        data: rpcData,
        error: options?.rpcError ?? null
      })
    }
  };
}

describe("POST /api/invoices/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks non-admin users", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: false,
      response: NextResponse.json(
        { success: false, error: { code: "ERR_API_ROLE_FORBIDDEN", message: "forbidden" } },
        { status: 403 }
      )
    });

    const response = await POST(
      createRequest({
        invoice_id: invoiceId,
        cancel_reason: "خطأ"
      })
    );

    expect(response.status).toBe(403);
  });

  it("returns reversed_entries_count from the RPC contract", async () => {
    const authorization = buildAuthorization();
    vi.mocked(authorizeRequest).mockResolvedValue(authorization as never);

    const response = await POST(
      createRequest({
        invoice_id: invoiceId,
        cancel_reason: "خطأ"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.reversed_entries_count).toBe(2);
    expect(authorization.supabase.rpc).toHaveBeenCalledWith("cancel_invoice", {
      p_invoice_id: invoiceId,
      p_cancel_reason: "خطأ",
      p_created_by: "admin-1"
    });
  });

  it("fails safely when the RPC response shape is invalid", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue(buildAuthorization({ rpcData: null }) as never);

    const response = await POST(
      createRequest({
        invoice_id: invoiceId,
        cancel_reason: "خطأ"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload.error.code).toBe("ERR_API_INTERNAL");
  });
});
