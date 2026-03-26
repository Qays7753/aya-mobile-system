import { NextResponse } from "next/server";
import { authorizeRequest, getApiErrorMeta, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { getPermissionsErrorMeta } from "@/lib/api/permissions";
import type { StandardEnvelope } from "@/lib/pos/types";
import { manageRoleAssignmentSchema } from "@/lib/validations/permissions";

type AssignmentResponse = {
  assignment_id: string;
  bundle_key: string;
  base_role: "admin" | "pos_staff";
  is_active: boolean;
};

async function handleAssignmentAction(
  request: Request,
  rpcName: "assign_permission_bundle" | "revoke_permission_bundle"
) {
  const authorization = await authorizeRequest(["admin"]);
  if (!authorization.authorized) {
    return authorization.response;
  }

  const validation = await parseAndValidate(request, manageRoleAssignmentSchema, getApiErrorMeta);
  if (!validation.success) {
    return validation.response;
  }

  const payload = validation.data;
  const { data, error: rpcError } = await authorization.supabase.rpc(rpcName, {
    p_user_id: payload.user_id,
    p_bundle_key: payload.bundle_key,
    p_notes: payload.notes ?? null,
    p_created_by: authorization.userId
  });

  if (rpcError) {
    throw rpcError;
  }

  return NextResponse.json<StandardEnvelope<AssignmentResponse>>(
    {
      success: true,
      data: {
        assignment_id: data.assignment_id,
        bundle_key: data.bundle_key,
        base_role: data.base_role,
        is_active: data.is_active
      }
    },
    { status: 200 }
  );
}

export async function POST(request: Request) {
  try {
    return await handleAssignmentAction(request, "assign_permission_bundle");
  } catch (error) {
    return handleRouteError(error, getPermissionsErrorMeta);
  }
}

export async function DELETE(request: Request) {
  try {
    return await handleAssignmentAction(request, "revoke_permission_bundle");
  } catch (error) {
    return handleRouteError(error, getPermissionsErrorMeta);
  }
}
