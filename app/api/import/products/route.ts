import { NextResponse } from "next/server";
import { authorizeRequest, handleRouteError, parseAndValidate } from "@/lib/api/common";
import {
  commitProductImportJob,
  getImportProductsErrorMeta,
  runProductImportDryRun
} from "@/lib/api/portability";
import type { StandardEnvelope } from "@/lib/pos/types";
import { importProductsSchema } from "@/lib/validations/portability";

type ImportProductsResponse = {
  job_id: string;
  mode: "dry_run" | "commit";
  rows_total: number;
  rows_valid: number;
  rows_invalid: number;
  rows_committed?: number;
  validation_errors?: Array<{ row_number: number; field: string; message: string }>;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, importProductsSchema, getImportProductsErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const result =
      validation.data.mode === "dry_run"
        ? await runProductImportDryRun(authorization.supabase, authorization.userId, validation.data)
        : await commitProductImportJob(
            authorization.supabase,
            authorization.userId,
            validation.data.dry_run_job_id
          );

    return NextResponse.json<StandardEnvelope<ImportProductsResponse>>(
      {
        success: true,
        data: result as ImportProductsResponse
      },
      { status: 200 }
    );
  } catch (error) {
    return handleRouteError(error, getImportProductsErrorMeta);
  }
}
