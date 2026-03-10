import { NextResponse } from "next/server";
import { authorizeRequest, errorResponse, getApiErrorMeta } from "@/lib/api/common";
import { getSalesHistory, parseSalesHistoryFilters } from "@/lib/api/reports";
import type { StandardEnvelope } from "@/lib/pos/types";

type SalesHistoryResponseData = Awaited<ReturnType<typeof getSalesHistory>>;

export async function GET(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const url = new URL(request.url);
    const filters = parseSalesHistoryFilters(url.searchParams);
    const data = await getSalesHistory(authorization.supabase, filters, {
      role: authorization.role,
      userId: authorization.userId
    });

    return NextResponse.json<StandardEnvelope<SalesHistoryResponseData>>(
      {
        success: true,
        data
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
