import { POST } from "@/app/api/invoices/edit/route";
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
const productId = "22222222-2222-2222-8222-222222222222";
const accountId = "33333333-3333-3333-8333-333333333333";
const customerId = "44444444-4444-4444-8444-444444444444";
const idempotencyKey = "55555555-5555-5555-8555-555555555555";

function buildAdminClient(options?: {
  profile?: ProfileRow;
  rpcData?: Record<string, unknown> | null;
  rpcError?: { message: string } | null;
}) {
  const profile = options?.profile ?? { role: "admin", is_active: true };
  const rpcData = options?.rpcData ?? {
    invoice_id: invoiceId,
    invoice_number: "AYA-2026-00080",
    total: 15
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
  return new Request("http://localhost/api/invoices/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/invoices/edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes a sanitized edit payload to edit_invoice", async () => {
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
        items: [
          {
            product_id: productId,
            quantity: 2,
            discount_percentage: 5,
            unit_price: 9999
          }
        ],
        payments: [{ account_id: accountId, amount: 15 }],
        customer_id: customerId,
        edit_reason: "تعديل الفاتورة بعد مراجعة المبلغ",
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect((adminClient.rpc as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({
      p_invoice_id: invoiceId,
      p_items: [
        {
          product_id: productId,
          quantity: 2,
          discount_percentage: 5
        }
      ],
      p_payments: [{ account_id: accountId, amount: 15 }],
      p_debt_customer_id: customerId,
      p_edit_reason: "تعديل الفاتورة بعد مراجعة المبلغ",
      p_idempotency_key: idempotencyKey,
      p_created_by: "admin-1"
    });
  });

  it("returns role forbidden when the current user is not admin", async () => {
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
        items: [{ product_id: productId, quantity: 1, discount_percentage: 0 }],
        payments: [{ account_id: accountId, amount: 10 }],
        edit_reason: "تعديل الفاتورة",
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("ERR_API_ROLE_FORBIDDEN");
  });
});
