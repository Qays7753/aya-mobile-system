import { NextResponse } from "next/server";
import { authorizeRequest, errorResponse, extractErrorCode, getApiErrorMeta } from "@/lib/api/common";
import { getCreateDebtPaymentErrorMeta } from "@/lib/api/debts";
import type { StandardEnvelope } from "@/lib/pos/types";
import { createDebtPaymentSchema } from "@/lib/validations/debts";

type DebtPaymentAllocation = {
  debt_entry_id: string;
  allocated_amount: number;
};

type DebtPaymentResponseData = {
  payment_id: string;
  receipt_number: string;
  remaining_balance: number;
  allocations: DebtPaymentAllocation[];
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"]);
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

    const parsedBody = createDebtPaymentSchema.safeParse(body);
    if (!parsedBody.success) {
      const meta = getApiErrorMeta("ERR_API_VALIDATION_FAILED");
      return errorResponse("ERR_API_VALIDATION_FAILED", meta.message, meta.status, {
        field_errors: parsedBody.error.flatten().fieldErrors
      });
    }

    const payload = parsedBody.data;
    const { data, error: rpcError } = await authorization.supabase.rpc("create_debt_payment", {
      p_debt_customer_id: payload.debt_customer_id,
      p_amount: payload.amount,
      p_account_id: payload.account_id,
      p_notes: payload.notes ?? null,
      p_idempotency_key: payload.idempotency_key,
      p_debt_entry_id: payload.debt_entry_id ?? null,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      const code = extractErrorCode(rpcError.message);
      const meta = getCreateDebtPaymentErrorMeta(code);
      return errorResponse(code, meta.message, meta.status);
    }

    return NextResponse.json<StandardEnvelope<DebtPaymentResponseData>>(
      {
        success: true,
        data: {
          payment_id: data.payment_id,
          receipt_number: data.receipt_number,
          remaining_balance: data.remaining_balance,
          allocations: (data.allocations ?? []) as DebtPaymentAllocation[]
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
