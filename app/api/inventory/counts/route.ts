import { NextResponse } from "next/server";
import { authorizeRequest, getApiErrorMeta, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { getCreateInventoryCountErrorMeta } from "@/lib/api/inventory";
import type { StandardEnvelope } from "@/lib/pos/types";
import { createInventoryCountSchema } from "@/lib/validations/inventory";

type CreateInventoryCountResponseData = {
  count_id: string;
  count_type: string;
  item_count: number;
  status: string;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"], {
      requiredPermissions: ["inventory.count.start"]
    });
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, createInventoryCountSchema, getApiErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const payload = validation.data;
    const { data, error: rpcError } = await authorization.supabase.rpc("start_inventory_count", {
      p_count_type: payload.count_type,
      p_product_ids: payload.scope === "selected" ? payload.product_ids ?? [] : null,
      p_notes: payload.notes ?? null,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json<StandardEnvelope<CreateInventoryCountResponseData>>(
      {
        success: true,
        data: {
          count_id: data.count_id,
          count_type: data.count_type,
          item_count: data.item_count,
          status: data.status
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getCreateInventoryCountErrorMeta);
  }
}
