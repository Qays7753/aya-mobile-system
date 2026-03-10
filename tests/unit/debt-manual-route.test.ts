import { POST } from "@/app/api/debts/manual/route";
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
const idempotencyKey = "22222222-2222-2222-8222-222222222222";

function buildAdminClient(options?: {
  profile?: ProfileRow;
  rpcData?: Record<string, unknown> | null;
  rpcError?: { message: string } | null;
  existingDebtEntryId?: string | null;
}) {
  const profile = options?.profile ?? { role: "admin", is_active: true };
  const rpcData = options?.rpcData ?? { debt_entry_id: "debt-entry-1" };
  const rpcError = options?.rpcError ?? null;
  const existingDebtEntryId = options?.existingDebtEntryId ?? null;

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
                  data: existingDebtEntryId ? { id: existingDebtEntryId } : null,
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
  return new Request("http://localhost/api/debts/manual", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(body)
  });
}

describe("POST /api/debts/manual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 403 when the current user is not admin", async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "user-1" } } },
          error: null
        })
      }
    } as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      buildAdminClient({ profile: { role: "pos_staff", is_active: true } }) as never
    );

    const response = await POST(
      createRequest({
        debt_customer_id: customerId,
        amount: 15,
        description: "دين يدوي",
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload.error.code).toBe("ERR_API_ROLE_FORBIDDEN");
  });

  it("passes p_created_by to create_debt_manual", async () => {
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
        debt_customer_id: customerId,
        amount: 15,
        description: "دين يدوي",
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.success).toBe(true);
    expect((adminClient.rpc as ReturnType<typeof vi.fn>).mock.calls[0][1]).toEqual({
      p_debt_customer_id: customerId,
      p_amount: 15,
      p_description: "دين يدوي",
      p_idempotency_key: idempotencyKey,
      p_created_by: "admin-1"
    });
  });

  it("returns existing_result when idempotency is hit", async () => {
    vi.mocked(createSupabaseServerClient).mockReturnValue({
      auth: {
        getSession: vi.fn().mockResolvedValue({
          data: { session: { user: { id: "admin-1" } } },
          error: null
        })
      }
    } as never);
    vi.mocked(getSupabaseAdminClient).mockReturnValue(
      buildAdminClient({
        rpcError: { message: "ERR_IDEMPOTENCY" },
        existingDebtEntryId: "debt-entry-existing"
      }) as never
    );

    const response = await POST(
      createRequest({
        debt_customer_id: customerId,
        amount: 15,
        description: "دين يدوي",
        idempotency_key: idempotencyKey
      })
    );
    const payload = await response.json();

    expect(response.status).toBe(409);
    expect(payload.error.code).toBe("ERR_IDEMPOTENCY");
    expect(payload.error.details.existing_result.debt_entry_id).toBe("debt-entry-existing");
  });
});
