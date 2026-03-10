import { POST } from "@/app/api/returns/route";
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
const invoiceItemId = "22222222-2222-2222-8222-222222222222";
const refundAccountId = "33333333-3333-3333-8333-333333333333";
const idempotencyKey = "44444444-4444-4444-8444-444444444444";

function buildAdminClient(options?: {
  profile?: ProfileRow;
  rpcData?: Record<string, unknown> | null;
  rpcError?: { message: string } | null;
}) {
  const profile = options?.profile ?? { role: "pos_staff", is_active: true };
  const rpcData = options?.rpcData ?? {
    return_id: "return-1",
    return_number: "AYA-2026-00010",
    refunded_amount: 20,
    total_amount: 20,
    return_type: "partial",
    debt_reduction: 0
  };
  const rpcError = options?.rpcError ?? null;

  return {
    from(table: string) {
      return {
        select() {
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

              return {
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null
                })
              };
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
  return new Request("http://localhost/api/returns", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/returns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when the session is missing", async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: null },
          error: null
        })
      }
    } as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(buildAdminClient() as never);

    const response = await POST(
      createRequest({
        invoice_id: invoiceId,
        items: [{ invoice_item_id: invoiceItemId, quantity: 1 }],
        return_type: "partial",
        reason: "مرتجع جزئي",
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("ERR_API_SESSION_INVALID");
  });

  it("returns 400 when validation fails", async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-1" } } },
          error: null
        })
      }
    } as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(buildAdminClient() as never);

    const response = await POST(
      createRequest({
        invoice_id: invoiceId,
        items: [],
        return_type: "partial",
        reason: "",
        idempotency_key: "bad"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("ERR_API_VALIDATION_FAILED");
  });

  it("passes the request body to create_return and returns success", async () => {
    const adminClient = buildAdminClient();

    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-1" } } },
          error: null
        })
      }
    } as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(adminClient as never);

    const response = await POST(
      createRequest({
        invoice_id: invoiceId,
        items: [{ invoice_item_id: invoiceItemId, quantity: 1 }],
        refund_account_id: refundAccountId,
        return_type: "partial",
        reason: "مرتجع جزئي لبند واحد",
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect((adminClient.rpc as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({
      p_invoice_id: invoiceId,
      p_items: [{ invoice_item_id: invoiceItemId, quantity: 1 }],
      p_refund_account_id: refundAccountId,
      p_return_type: "partial",
      p_reason: "مرتجع جزئي لبند واحد",
      p_idempotency_key: idempotencyKey,
      p_created_by: "user-1"
    });
  });
});
