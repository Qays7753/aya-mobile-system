import { NextResponse } from "next/server";
import { authorizeRequest, getApiErrorMeta, handleRouteError, parseAndValidate } from "@/lib/api/common";
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

    const validation = await parseAndValidate(request, createDebtPaymentSchema, getApiErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const { data, error: rpcError } = await authorization.supabase.rpc("create_debt_payment", {
      p_debt_customer_id: validation.data.debt_customer_id,
      p_amount: validation.data.amount,
      p_account_id: validation.data.account_id,
      p_notes: validation.data.notes ?? null,
      p_idempotency_key: validation.data.idempotency_key,
      p_debt_entry_id: validation.data.debt_entry_id ?? null,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
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
    return handleRouteError(error, getCreateDebtPaymentErrorMeta);
  }
}
