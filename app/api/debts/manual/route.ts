import { NextResponse } from "next/server";
import { authorizeRequest, errorResponse, extractErrorCode, getApiErrorMeta } from "@/lib/api/common";
import { getCreateDebtManualErrorMeta } from "@/lib/api/debts";
import type { StandardEnvelope } from "@/lib/pos/types";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { createDebtManualSchema } from "@/lib/validations/debts";

type DebtManualResponseData = {
  debt_entry_id: string;
};

type ExistingDebtEntryRow = {
  id: string;
};

async function findExistingDebtEntryByIdempotencyKey(idempotencyKey: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("debt_entries")
    .select("id")
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle<ExistingDebtEntryRow>();

  if (error || !data) {
    return null;
  }

  return {
    debt_entry_id: data.id
  } satisfies DebtManualResponseData;
}

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const meta = getApiErrorMeta("ERR_API_VALIDATION_FAILED");
      return errorResponse("ERR_API_VALIDATION_FAILED", meta.message, meta.status, {
        body: ["تعذر قراءة JSON من الطلب."]
      });
    }

    const parsedBody = createDebtManualSchema.safeParse(body);
    if (!parsedBody.success) {
      const meta = getApiErrorMeta("ERR_API_VALIDATION_FAILED");
      return errorResponse("ERR_API_VALIDATION_FAILED", meta.message, meta.status, {
        field_errors: parsedBody.error.flatten().fieldErrors
      });
    }

    const payload = parsedBody.data;
    const { data, error: rpcError } = await authorization.supabase.rpc("create_debt_manual", {
      p_debt_customer_id: payload.debt_customer_id,
      p_amount: payload.amount,
      p_description: payload.description ?? null,
      p_idempotency_key: payload.idempotency_key,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      const code = extractErrorCode(rpcError.message);
      const meta = getCreateDebtManualErrorMeta(code);

      if (code === "ERR_IDEMPOTENCY") {
        const existingEntry = await findExistingDebtEntryByIdempotencyKey(payload.idempotency_key);
        return errorResponse(code, meta.message, meta.status, existingEntry ? { existing_result: existingEntry } : undefined);
      }

      return errorResponse(code, meta.message, meta.status);
    }

    return NextResponse.json<StandardEnvelope<DebtManualResponseData>>(
      {
        success: true,
        data: {
          debt_entry_id: data.debt_entry_id
        }
      },
      { status: 200 }
    );
  } catch (error) {
    const meta = getApiErrorMeta("ERR_API_INTERNAL");
    return errorResponse("ERR_API_INTERNAL", meta.message, meta.status, {
      reason: (error as Error).message
    });
  }
}
