import { NextResponse } from "next/server";
import { POST } from "@/app/api/snapshots/route";
import { authorizeRequest } from "@/lib/api/common";

vi.mock("@/lib/api/common", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/common")>("@/lib/api/common");
  return {
    ...actual,
    authorizeRequest: vi.fn()
  };
});

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/snapshots", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
}

describe("POST /api/snapshots", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authorization response when the user is blocked", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: false,
      response: NextResponse.json(
        { success: false, error: { code: "ERR_API_ROLE_FORBIDDEN", message: "forbidden" } },
        { status: 403 }
      )
    });

    const response = await POST(createRequest({ notes: "test" }));
    expect(response.status).toBe(403);
  });

  it("returns 400 when the payload is invalid", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: true,
      role: "admin",
      userId: "admin-1",
      supabase: { rpc: vi.fn() }
    } as never);

    const response = await POST(createRequest({ notes: "أ".repeat(501) }));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("ERR_API_VALIDATION_FAILED");
  });

  it("maps notes and created_by to create_daily_snapshot()", async () => {
    const rpc = vi.fn().mockResolvedValue({
      data: {
        snapshot_id: "snapshot-1",
        total_sales: 120,
        net_sales: 100,
        net_profit: 60,
        invoice_count: 3,
        is_replay: false
      },
      error: null
    });

    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: true,
      role: "admin",
      userId: "admin-1",
      supabase: { rpc }
    } as never);

    const response = await POST(createRequest({ notes: "إقفال اليوم" }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(rpc).toHaveBeenCalledWith("create_daily_snapshot", {
      p_notes: "إقفال اليوم",
      p_created_by: "admin-1"
    });
  });
});
