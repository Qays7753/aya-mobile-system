import { GET } from "@/app/api/sales/history/route";
import { authorizeRequest } from "@/lib/api/common";
import { getSalesHistory } from "@/lib/api/reports";

vi.mock("@/lib/api/common", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/common")>("@/lib/api/common");
  return {
    ...actual,
    authorizeRequest: vi.fn()
  };
});

vi.mock("@/lib/api/reports", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/reports")>("@/lib/api/reports");
  return {
    ...actual,
    getSalesHistory: vi.fn()
  };
});

describe("GET /api/sales/history", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the session is missing", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: false,
      response: Response.json(
        { success: false, error: { code: "ERR_API_SESSION_INVALID", message: "invalid" } },
        { status: 401 }
      ) as never
    });

    const response = await GET(new Request("http://localhost/api/sales/history"));
    expect(response.status).toBe(401);
  });

  it("parses filters and returns the history payload", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: true,
      role: "admin",
      userId: "admin-1",
      supabase: {}
    } as never);

    vi.mocked(getSalesHistory).mockResolvedValue({
      data: [
        {
          invoice_id: "invoice-1",
          invoice_number: "AYA-2026-00001",
          invoice_date: "2026-03-10",
          created_at: "2026-03-10T10:00:00Z",
          created_by: "admin-1",
          created_by_name: "أحمد",
          pos_terminal_code: "POS-01",
          total: 50,
          status: "active"
        }
      ],
      total_count: 1,
      page: 2,
      page_size: 10
    });

    const response = await GET(
      new Request(
        "http://localhost/api/sales/history?from_date=2026-03-01&to_date=2026-03-10&page=2&page_size=10&status=active"
      )
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(vi.mocked(getSalesHistory)).toHaveBeenCalledWith(
      {},
      expect.objectContaining({
        fromDate: "2026-03-01",
        toDate: "2026-03-10",
        page: 2,
        pageSize: 10,
        status: "active"
      }),
      {
        role: "admin",
        userId: "admin-1"
      }
    );
  });
});
