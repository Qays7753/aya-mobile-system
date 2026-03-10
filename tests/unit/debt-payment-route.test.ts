import { POST } from "@/app/api/payments/debt/route";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn()
}));

vi.mock("@/lib/supabase/admin", () => ({
  getSupabaseAdminClient: vi.fn()
}));

type ProfileRow = { role: string; is_active: boolean } | null;

const customerId = "11111111-1111-1111-8111-111111111111";
const accountId = "22222222-2222-2222-8222-222222222222";
const entryId = "33333333-3333-3333-8333-333333333333";
const idempotencyKey = "44444444-4444-4444-8444-444444444444";

function buildAdminClient(options?: {
  profile?: ProfileRow;
  rpcData?: Record<string, unknown> | null;
  rpcError?: { message: string } | null;
}) {
  const profile = options?.profile ?? { role: "pos_staff", is_active: true };
  const rpcData = options?.rpcData ?? {
    payment_id: "payment-1",
    receipt_number: "AYA-2026-00020",
    remaining_balance: 30,
    allocations: [{ debt_entry_id: entryId, allocated_amount: 10 }]
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
  return new Request("http://localhost/api/payments/debt", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/payments/debt", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("passes the payment payload to create_debt_payment", async () => {
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
        debt_customer_id: customerId,
        amount: 10,
        account_id: accountId,
        notes: "دفعة أولى",
        debt_entry_id: entryId,
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect((adminClient.rpc as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({
      p_debt_customer_id: customerId,
      p_amount: 10,
      p_account_id: accountId,
      p_notes: "دفعة أولى",
      p_idempotency_key: idempotencyKey,
      p_debt_entry_id: entryId,
      p_created_by: "user-1"
    });
  });

  it("maps overpay errors from the RPC layer", async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-1" } } },
          error: null
        })
      }
    } as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      buildAdminClient({ rpcError: { message: "ERR_DEBT_OVERPAY" } }) as never
    );

    const response = await POST(
      createRequest({
        debt_customer_id: customerId,
        amount: 1000,
        account_id: accountId,
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error.code).toBe("ERR_DEBT_OVERPAY");
  });
});
