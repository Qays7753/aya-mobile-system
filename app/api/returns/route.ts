import { NextResponse } from "next/server";
import {
  authorizeRequest,
  getApiErrorMeta,
  handleRouteError,
  internalErrorResponse,
  parseAndValidate
} from "@/lib/api/common";
import { getCreateReturnErrorMeta } from "@/lib/api/returns";
import type { StandardEnvelope } from "@/lib/pos/types";
import { createReturnSchema } from "@/lib/validations/returns";

type ReturnResponseData = {
  return_id: string;
  return_number: string;
  refunded_amount: number;
  return_type: "full" | "partial";
  total_amount: number;
  debt_reduction: number;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, createReturnSchema, getApiErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const payload = validation.data;
    const { data, error: rpcError } = await authorization.supabase.rpc("create_return", {
      p_invoice_id: payload.invoice_id,
      p_items: payload.items,
      p_refund_account_id: payload.refund_account_id ?? null,
      p_return_type: payload.return_type,
      p_reason: payload.reason,
      p_idempotency_key: payload.idempotency_key,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    if (!data || typeof data.return_id !== "string" || typeof data.return_number !== "string") {
      return internalErrorResponse(new Error("ERR_API_CONTRACT_INVALID"), {
        context: "returns.response-shape"
      });
    }

    const refundedAmount =
      typeof data.refunded_amount === "number"
        ? data.refunded_amount
        : typeof data.total === "number"
          ? data.total
          : null;
    const totalAmount =
      typeof data.total_amount === "number"
        ? data.total_amount
        : typeof data.total === "number"
          ? data.total
          : refundedAmount;

    if (refundedAmount === null || totalAmount === null) {
      return internalErrorResponse(new Error("ERR_API_CONTRACT_INVALID"), {
        context: "returns.response-amounts"
      });
    }

    return NextResponse.json<StandardEnvelope<ReturnResponseData>>(
      {
        success: true,
        data: {
          return_id: data.return_id,
          return_number: data.return_number,
          refunded_amount: refundedAmount,
          return_type:
            data.return_type === "full" || data.return_type === "partial"
              ? data.return_type
              : payload.return_type,
          total_amount: totalAmount,
          debt_reduction: data.debt_reduction ?? 0
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getCreateReturnErrorMeta);
  }
}
