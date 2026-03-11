import { NextResponse } from "next/server";
import { GET } from "@/app/api/notifications/route";
import { POST } from "@/app/api/notifications/read/route";
import { authorizeRequest } from "@/lib/api/common";

vi.mock("@/lib/api/common", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api/common")>("@/lib/api/common");
  return {
    ...actual,
    authorizeRequest: vi.fn()
  };
});

function createThenableResult<T>(result: T) {
  return {
    then: (resolve: (value: T) => unknown) => Promise.resolve(result).then(resolve)
  };
}

describe("notifications routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns scoped notifications for POS on GET", async () => {
    const notificationsQuery = {
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      returns: vi.fn().mockResolvedValue({
        data: [
          {
            id: "11111111-1111-1111-8111-111111111111",
            user_id: "22222222-2222-2222-8222-222222222222",
            type: "maintenance_ready",
            title: "Ready",
            body: "Device ready",
            is_read: false,
            read_at: null,
            reference_type: "maintenance_job",
            reference_id: "33333333-3333-3333-8333-333333333333",
            created_at: "2026-03-10T10:00:00Z"
          }
        ],
        count: 1,
        error: null
      })
    };

    const unreadQuery: {
      eq: ReturnType<typeof vi.fn>;
      then: (resolve: (value: { count: number; error: null }) => unknown) => Promise<unknown>;
    } = {
      eq: vi.fn(),
      ...createThenableResult({
        count: 1,
        error: null
      })
    };
    unreadQuery.eq.mockReturnValue(unreadQuery);

    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: true,
      role: "pos_staff",
      userId: "22222222-2222-2222-8222-222222222222",
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn((_columns: string, options?: { count?: string; head?: boolean }) =>
            options?.head ? unreadQuery : notificationsQuery
          )
        }))
      }
    } as never);

    const response = await GET(new Request("http://localhost/api/notifications?status=unread"));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.items).toHaveLength(1);
    expect(payload.data.unread_count).toBe(1);
    expect(notificationsQuery.eq).toHaveBeenCalledWith("user_id", "22222222-2222-2222-8222-222222222222");
    expect(unreadQuery.eq).toHaveBeenCalledWith("user_id", "22222222-2222-2222-8222-222222222222");
  });

  it("marks notifications as read for the current user", async () => {
    const selectionQuery = {
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      returns: vi.fn().mockResolvedValue({
        data: [{ id: "11111111-1111-1111-8111-111111111111" }],
        error: null
      })
    };

    const updateQuery = {
      in: vi.fn().mockReturnThis(),
      select: vi.fn().mockResolvedValue({
        data: [{ id: "11111111-1111-1111-8111-111111111111" }],
        error: null
      })
    };

    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: true,
      role: "pos_staff",
      userId: "22222222-2222-2222-8222-222222222222",
      supabase: {
        from: vi.fn(() => ({
          select: vi.fn(() => selectionQuery),
          update: vi.fn(() => updateQuery)
        }))
      }
    } as never);

    const response = await POST(
      new Request("http://localhost/api/notifications/read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notification_ids: ["11111111-1111-1111-8111-111111111111"]
        })
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.updated_count).toBe(1);
    expect(selectionQuery.eq).toHaveBeenCalledWith("user_id", "22222222-2222-2222-8222-222222222222");
    expect(updateQuery.in).toHaveBeenCalledWith("id", ["11111111-1111-1111-8111-111111111111"]);
  });

  it("returns the authorization response when blocked on GET", async () => {
    vi.mocked(authorizeRequest).mockResolvedValue({
      authorized: false,
      response: NextResponse.json(
        { success: false, error: { code: "ERR_API_ROLE_FORBIDDEN", message: "forbidden" } },
        { status: 403 }
      )
    });

    const response = await GET(new Request("http://localhost/api/notifications"));
    expect(response.status).toBe(403);
  });
});
