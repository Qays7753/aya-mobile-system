import { NextResponse } from "next/server";
import { authorizeRequest, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { getCreateTransferErrorMeta } from "@/lib/api/operations";
import type { StandardEnvelope } from "@/lib/pos/types";
import { createTransferSchema } from "@/lib/validations/operations";

type TransferResponse = {
  transfer_id: string;
  transfer_number: string;
  ledger_entry_ids: string[];
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, createTransferSchema, getCreateTransferErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const { data, error: rpcError } = await authorization.supabase.rpc("create_transfer", {
      p_from_account_id: validation.data.from_account_id,
      p_to_account_id: validation.data.to_account_id,
      p_amount: validation.data.amount,
      p_notes: validation.data.notes ?? null,
      p_idempotency_key: validation.data.idempotency_key,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json<StandardEnvelope<TransferResponse>>(
      {
        success: true,
        data: {
          transfer_id: data.transfer_id,
          transfer_number: data.transfer_number,
          ledger_entry_ids: data.ledger_entry_ids
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getCreateTransferErrorMeta);
  }
}
