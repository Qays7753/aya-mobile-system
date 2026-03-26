import { NextResponse } from "next/server";
import { authorizeRequest, getApiErrorMeta, handleRouteError, parseAndValidate } from "@/lib/api/common";
import { getPermissionsErrorMeta } from "@/lib/api/permissions";
import type { StandardEnvelope } from "@/lib/pos/types";
import { previewPermissionBundleSchema } from "@/lib/validations/permissions";

type BundlePreviewResponse = {
  bundle_key: string;
  base_role: "admin" | "pos_staff";
  permissions: string[];
  max_discount_percentage: number | null;
  discount_requires_approval: boolean;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, previewPermissionBundleSchema, getApiErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const { data, error } = await authorization.supabase
      .from("permission_bundles")
      .select("key, base_role, permissions, max_discount_percentage, discount_requires_approval")
      .eq("key", validation.data.bundle_key)
      .eq("is_active", true)
      .maybeSingle<{
        key: string;
        base_role: "admin" | "pos_staff";
        permissions: string[] | null;
        max_discount_percentage: number | null;
        discount_requires_approval: boolean;
      }>();

    if (error || !data) {
      throw new Error("ERR_PERMISSION_BUNDLE_NOT_FOUND");
    }

    return NextResponse.json<StandardEnvelope<BundlePreviewResponse>>(
      {
        success: true,
        data: {
          bundle_key: data.key,
          base_role: data.base_role,
          permissions: data.permissions ?? [],
          max_discount_percentage: data.max_discount_percentage,
          discount_requires_approval: data.discount_requires_approval
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getPermissionsErrorMeta);
  }
}
