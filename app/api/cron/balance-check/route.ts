import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { errorResponse, getApiErrorMeta, handleRouteError } from "@/lib/api/common";
import { getCronAuthorizationHeader } from "@/lib/env";
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
  const expected = getCronAuthorizationHeader({ allowMissing: true });

  if (!expected || authHeader !== expected) {
    return errorResponse("ERR_UNAUTHORIZED", "غير مصرح بتنفيذ هذا المسار.", 401);
  }

  try {
    const supabase = getSupabaseAdminClient();
    const adminActorId = await resolveFirstAdminActorId(supabase);
    const { data, error } = await supabase.rpc("fn_verify_balance_integrity", {
      p_created_by: adminActorId
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
