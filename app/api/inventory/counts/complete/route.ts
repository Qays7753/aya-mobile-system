import { NextResponse } from "next/server";
import { authorizeRequest, getApiErrorMeta, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { getCompleteInventoryErrorMeta } from "@/lib/api/inventory";
import type { StandardEnvelope } from "@/lib/pos/types";
import { completeInventoryCountSchema } from "@/lib/validations/inventory";

type CompleteInventoryResponseData = {
  count_id: string;
  adjusted_products: number;
  total_difference: number;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"], {
      requiredPermissions: ["inventory.count.complete"]
    });
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, completeInventoryCountSchema, getApiErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const payload = validation.data;
    const { data, error: rpcError } = await authorization.supabase.rpc("complete_inventory_count", {
      p_inventory_count_id: payload.inventory_count_id,
      p_items: payload.items,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json<StandardEnvelope<CompleteInventoryResponseData>>(
      {
        success: true,
        data: {
          count_id: data.count_id,
          adjusted_products: data.adjusted_products,
          total_difference: data.total_difference
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getCompleteInventoryErrorMeta);
  }
}
