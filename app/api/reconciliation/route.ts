import { NextResponse } from "next/server";
import { authorizeRequest, getApiErrorMeta, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { getReconciliationErrorMeta } from "@/lib/api/reconciliation";
import type { StandardEnvelope } from "@/lib/pos/types";
import { reconcileAccountSchema } from "@/lib/validations/reconciliation";

type ReconciliationResponseData = {
  reconciliation_id: string;
  expected: number;
  actual: number;
  difference: number;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, reconcileAccountSchema, getApiErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const { data, error: rpcError } = await authorization.supabase.rpc("reconcile_account", {
      p_account_id: validation.data.account_id,
      p_actual_balance: validation.data.actual_balance,
      p_notes: validation.data.notes,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json<StandardEnvelope<ReconciliationResponseData>>(
      {
        success: true,
        data: {
          reconciliation_id: data.reconciliation_id,
          expected: data.expected,
          actual: data.actual,
          difference: data.difference
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getReconciliationErrorMeta);
  }
}
