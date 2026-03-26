import { NextResponse } from "next/server";
import { authorizeRequest, getApiErrorMeta, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { getCreateSupplierPaymentErrorMeta } from "@/lib/api/purchases";
import type { StandardEnvelope } from "@/lib/pos/types";
import { createSupplierPaymentSchema } from "@/lib/validations/purchases";

type SupplierPaymentResponseData = {
  payment_id: string;
  payment_number: string;
  remaining_balance: number;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, createSupplierPaymentSchema, getApiErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const { data, error: rpcError } = await authorization.supabase.rpc("create_supplier_payment", {
      p_supplier_id: validation.data.supplier_id,
      p_account_id: validation.data.account_id,
      p_amount: validation.data.amount,
      p_notes: validation.data.notes ?? null,
      p_idempotency_key: validation.data.idempotency_key,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json<StandardEnvelope<SupplierPaymentResponseData>>(
      {
        success: true,
        data: {
          payment_id: data.payment_id,
          payment_number: data.payment_number,
          remaining_balance: data.remaining_balance
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getCreateSupplierPaymentErrorMeta);
  }
}
