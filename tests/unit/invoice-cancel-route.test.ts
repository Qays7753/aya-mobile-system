import { POST } from "@/app/api/invoices/cancel/route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: vi.fn()
}));

type ProfileRow = { role: string; is_active: boolean } | null;

const invoiceId = "11111111-1111-1111-8111-111111111111";

function buildAdminClient(options?: {
  profile?: ProfileRow;
  rpcData?: Record<string, unknown> | null;
  rpcError?: { message: string } | null;
  paymentsCount?: number;
}) {
  const profile = options?.profile ?? { role: "admin", is_active: true };
  const rpcData = options?.rpcData ?? { success: true };
  const rpcError = options?.rpcError ?? null;
  const paymentsCount = options?.paymentsCount ?? 2;

  return {
    from(table: string) {
      return {
        select(_columns?: string, optionsArg?: { count?: "exact"; head?: boolean }) {
          return {
            eq() {
              if (table === "profiles") {
                return {
                  maybeSingle: vi.fn().mockResolvedValue({
                    data: profile,
                    error: profile ? null : { message: "missing profile" }
                  })
                };
              }

              if (table === "payments" && optionsArg?.head) {
                return Promise.resolve({
                  count: paymentsCount,
                  error: null
                });
              }

              return Promise.resolve({
                data: null,
                error: null
              });
            }
          };
        }
      };
    },
    rpc: vi.fn().mockResolvedValue({
      data: rpcData,
      error: rpcError
    })
  };
}

function createRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/invoices/cancel", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/invoices/cancel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("blocks non-admin users", async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "pos-1" } } },
          error: null
        })
      }
    } as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      buildAdminClient({ profile: { role: "pos_staff", is_active: true } }) as never
    );

    const response = await POST(
      createRequest({
        invoice_id: invoiceId,
        cancel_reason: "إلغاء إداري"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("ERR_API_ROLE_FORBIDDEN");
  });

  it("returns reversed_entries_count from the contract", async () => {
    const adminClient = buildAdminClient();

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "admin-1" } } },
          error: null
        })
      }
    } as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(adminClient as never);

    const response = await POST(
      createRequest({
        invoice_id: invoiceId,
        cancel_reason: "إلغاء بعد مراجعة العملية"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect(payload.data.reversed_entries_count).toBe(2);
    expect((adminClient.rpc as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({
      p_invoice_id: invoiceId,
      p_cancel_reason: "إلغاء بعد مراجعة العملية",
      p_created_by: "admin-1"
    });
  });
});
