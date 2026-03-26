import { NextResponse } from "next/server";
import { authorizeRequest, getApiErrorMeta, handleRouteError } from "@/lib/api/common";
import type { StandardEnvelope } from "@/lib/pos/types";

type BalanceIntegrityDrift = {
  account_id: string;
  account_name: string;
  current_balance: number;
  calculated_balance: number;
  drift: number;
};

type BalanceIntegrityResponseData = {
  success: boolean;
  drift_count: number;
  drifts: BalanceIntegrityDrift[];
};

export async function POST() {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const { data, error } = await authorization.supabase.rpc("fn_verify_balance_integrity", {
      p_created_by: authorization.userId
    });

    if (error) {
      throw error;
    }

    return NextResponse.json<StandardEnvelope<BalanceIntegrityResponseData>>(
      {
        success: true,
        data: {
          success: data.success,
          drift_count: data.drift_count,
          drifts: data.drifts ?? []
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getApiErrorMeta);
  }
}
