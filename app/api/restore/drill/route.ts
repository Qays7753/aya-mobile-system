import { NextResponse } from "next/server";
import {
  authorizeRequest,
  errorResponse,
  extractErrorCode,
  getApiErrorMeta,
  handleRouteError,
  parseAndValidate
} from "@/lib/api/common";
import { getRestoreDrillErrorMeta, runRestoreDrill } from "@/lib/api/portability";
import { resolveFirstAdminActorId } from "@/lib/api/reports";
import { getCronAuthorizationHeader } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StandardEnvelope } from "@/lib/pos/types";
import { restoreDrillSchema } from "@/lib/validations/portability";

type RestoreResponse = {
  drill_id: string;
  status: "completed";
  drift_count: number;
  rto_seconds: number;
};

async function authorizeRestoreDrill(request: Request) {
  const bearer = request.headers.get("authorization");
  const expected = getCronAuthorizationHeader({ allowMissing: true });

  if (expected !== null && bearer === expected) {
    const supabase = getSupabaseAdminClient();
    const userId = await resolveFirstAdminActorId(supabase);

    return {
      authorized: true as const,
      supabase,
      userId
    };
  }

  const authorization = await authorizeRequest(["admin"]);
  if (!authorization.authorized) {
    return authorization;
  }

  return {
    authorized: true as const,
    supabase: authorization.supabase,
    userId: authorization.userId
  };
}

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRestoreDrill(request);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const validation = await parseAndValidate(request, restoreDrillSchema, getRestoreDrillErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const result = await runRestoreDrill(authorization.supabase, authorization.userId, validation.data);

    return NextResponse.json<StandardEnvelope<RestoreResponse>>(
      {
        success: true,
        data: result
      },
      { status: 200 }
    );
  } catch (error) {
    const code = extractErrorCode((error as Error).message);
    if (code === "ERR_API_RUNTIME_MISCONFIGURED" || code === "ERR_ENV_CRON_SECRET_INVALID") {
      const meta = getApiErrorMeta("ERR_API_RUNTIME_MISCONFIGURED");
      return errorResponse("ERR_API_RUNTIME_MISCONFIGURED", meta.message, meta.status);
    }

    return handleRouteError(error, getRestoreDrillErrorMeta);
  }
}
