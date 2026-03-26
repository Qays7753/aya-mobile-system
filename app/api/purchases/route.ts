import { NextResponse } from "next/server";
import { authorizeRequest, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { getCreatePurchaseErrorMeta } from "@/lib/api/purchases";
import type { StandardEnvelope } from "@/lib/pos/types";
import { createPurchaseSchema } from "@/lib/validations/purchases";

type PurchaseResponseData = {
  purchase_order_id: string;
  purchase_number: string;
  total: number;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, createPurchaseSchema, getCreatePurchaseErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const { data, error: rpcError } = await authorization.supabase.rpc("create_purchase", {
      p_supplier_id: validation.data.supplier_id ?? null,
      p_items: validation.data.items,
      p_is_paid: validation.data.is_paid,
      p_payment_account_id: validation.data.payment_account_id ?? null,
      p_notes: validation.data.notes ?? null,
      p_idempotency_key: validation.data.idempotency_key,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json<StandardEnvelope<PurchaseResponseData>>(
      {
        success: true,
        data: {
          purchase_order_id: data.purchase_order_id,
          purchase_number: data.purchase_number,
          total: data.total
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getCreatePurchaseErrorMeta);
  }
}
