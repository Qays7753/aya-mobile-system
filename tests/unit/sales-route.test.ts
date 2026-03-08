import { POST } from "@/app/api/sales/route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: vi.fn()
}));

type ProfileRow = { role: string; is_active: boolean } | null;
type InvoiceRow = { id: string; invoice_number: string; total_amount: number } | null;

const productId = "11111111-1111-1111-8111-111111111111";
const accountId = "22222222-2222-2222-8222-222222222222";
const customerId = "44444444-4444-4444-8444-444444444444";
const idempotencyKey = "33333333-3333-3333-8333-333333333333";

function buildAdminClient(options?: {
  profile?: ProfileRow;
  rpcData?: Record<string, unknown> | null;
  rpcError?: { message: string } | null;
  invoice?: InvoiceRow;
}) {
  const profile = options?.profile ?? { role: "pos_staff", is_active: true };
  const rpcData = options?.rpcData ?? {
    invoice_id: "invoice-1",
    invoice_number: "INV-0001",
    total: 12,
    change: 0
  };
  const rpcError = options?.rpcError ?? null;
  const invoice = options?.invoice ?? null;

  return {
    from(table: string) {
      return {
        select() {
          return {
            eq() {
              if (table === "profiles") {
                return {
                  single: vi.fn().mockResolvedValue({
                    data: profile,
                    error: profile ? null : { message: "missing profile" }
                  })
                };
              }

              return {
                maybeSingle: vi.fn().mockResolvedValue({
                  data: invoice,
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
  return new Request("http://localhost/api/sales", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/sales", () => {
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
        items: [{ product_id: productId, quantity: 1 }],
        payments: [{ account_id: accountId, amount: 10 }],
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.error.code).toBe("ERR_API_SESSION_INVALID");
  });

  it("returns 403 when the user role is not allowed", async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-1" } } },
          error: null
        })
      }
    } as never);

    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      buildAdminClient({ profile: { role: "viewer", is_active: true } }) as never
    );

    const response = await POST(
      createRequest({
        items: [{ product_id: productId, quantity: 1 }],
        payments: [{ account_id: accountId, amount: 10 }],
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("ERR_API_ROLE_FORBIDDEN");
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
        items: [],
        payments: [],
        idempotency_key: "not-a-uuid"
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("ERR_API_VALIDATION_FAILED");
  });

  it("translates the request body to the RPC contract and returns success", async () => {
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
        items: [
          {
            product_id: productId,
            quantity: 2,
            discount_percentage: 5,
            unit_price: 9999
          }
        ],
        payments: [{ account_id: accountId, amount: 12 }],
        customer_id: customerId,
        pos_terminal_code: "POS-01",
        notes: "cash sale",
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect((adminClient.rpc as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({
      p_items: [
        {
          product_id: productId,
          quantity: 2,
          discount_percentage: 5
        }
      ],
      p_payments: [{ account_id: accountId, amount: 12 }],
      p_debt_customer_id: customerId,
      p_pos_terminal: "POS-01",
      p_notes: "cash sale",
      p_idempotency_key: idempotencyKey,
      p_created_by: "user-1"
    });
  });

  it("returns replay metadata when the idempotency key already exists", async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-1" } } },
          error: null
        })
      }
    } as never);

    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      buildAdminClient({
        rpcError: { message: "ERR_IDEMPOTENCY" },
        invoice: {
          id: "invoice-1",
          invoice_number: "INV-0001",
          total_amount: 12
        }
      }) as never
    );

    const response = await POST(
      createRequest({
        items: [{ product_id: productId, quantity: 1 }],
        payments: [{ account_id: accountId, amount: 12 }],
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("ERR_IDEMPOTENCY");
    expect(payload.error.details.existing_result.invoice_number).toBe("INV-0001");
  });
});
