import { NextResponse } from "next/server";
import { authorizeRequest, getApiErrorMeta, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { getCreateSnapshotErrorMeta } from "@/lib/api/snapshots";
import type { StandardEnvelope } from "@/lib/pos/types";
import { createSnapshotSchema } from "@/lib/validations/snapshots";

type SnapshotResponseData = {
  snapshot_id: string;
  total_sales: number;
  net_sales: number;
  net_profit: number;
  invoice_count: number;
  is_replay: boolean;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, createSnapshotSchema, getApiErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const payload = validation.data;
    const { data, error: rpcError } = await authorization.supabase.rpc("create_daily_snapshot", {
      p_notes: payload.notes ?? null,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json<StandardEnvelope<SnapshotResponseData>>(
      {
        success: true,
        data: {
          snapshot_id: data.snapshot_id,
          total_sales: data.total_sales,
          net_sales: data.net_sales,
          net_profit: data.net_profit ?? 0,
          invoice_count: data.invoice_count,
          is_replay: data.is_replay ?? false
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getCreateSnapshotErrorMeta);
  }
}
