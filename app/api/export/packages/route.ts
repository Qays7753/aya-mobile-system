import { NextResponse } from "next/server";
import { authorizeRequest, handleRouteError, parseAndValidate } from "@/lib/api/common";
import {
  createExportPackage,
  getExportPackageErrorMeta,
  type CreateExportPackageResult
} from "@/lib/api/portability";
import type { StandardEnvelope } from "@/lib/pos/types";
import { createExportPackageSchema } from "@/lib/validations/portability";

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, createExportPackageSchema, getExportPackageErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const result = await createExportPackage(
      authorization.supabase,
      authorization.userId,
      validation.data
    );

    return NextResponse.json<StandardEnvelope<CreateExportPackageResult>>(
      {
        success: true,
        data: result
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getExportPackageErrorMeta);
  }
}
