import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { errorResponse, extractErrorCode, getApiErrorMeta } from "@/lib/api/common";
import { resolveFirstAdminActorId } from "@/lib/api/reports";
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

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET
    ? `Bearer ${process.env.CRON_SECRET}`
    : "";

  if (!expected || authHeader !== expected) {
    return NextResponse.json(
      { success: false, error: "ERR_UNAUTHORIZED" },
      { status: 401 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const adminActorId = await resolveFirstAdminActorId(supabase);
    const { data, error } = await supabase.rpc("fn_verify_balance_integrity", {
      p_created_by: adminActorId
    });

    if (error) {
      const code = extractErrorCode(error.message);
      const meta = getApiErrorMeta(code);
      return errorResponse(code, meta.message, meta.status);
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
    const meta = getApiErrorMeta("ERR_API_INTERNAL");
    return errorResponse("ERR_API_INTERNAL", meta.message, meta.status, {
      reason: (error as Error).message
    });
  }
}
