import { NextResponse } from "next/server";
import { authorizeRequest, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { getCreateMaintenanceErrorMeta } from "@/lib/api/maintenance";
import type { StandardEnvelope } from "@/lib/pos/types";
import { createMaintenanceJobSchema } from "@/lib/validations/maintenance";

type MaintenanceCreateResponse = {
  job_id: string;
  job_number: string;
  status: string;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"], {
      requiredPermissions: ["maintenance.create"]
    });
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, createMaintenanceJobSchema, getCreateMaintenanceErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const { data, error: rpcError } = await authorization.supabase.rpc("create_maintenance_job", {
      p_customer_name: validation.data.customer_name,
      p_customer_phone: validation.data.customer_phone ?? null,
      p_device_type: validation.data.device_type,
      p_issue_description: validation.data.issue_description,
      p_estimated_cost: validation.data.estimated_cost ?? null,
      p_notes: validation.data.notes ?? null,
      p_idempotency_key: validation.data.idempotency_key,
      p_created_by: authorization.userId
    });

    if (rpcError) {
      throw rpcError;
    }

    return NextResponse.json<StandardEnvelope<MaintenanceCreateResponse>>(
      {
        success: true,
        data: {
          job_id: data.job_id,
          job_number: data.job_number,
          status: data.status
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getCreateMaintenanceErrorMeta);
  }
}
