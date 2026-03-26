import { NextRequest, NextResponse } from "next/server";
import {
  authorizeRequest,
  errorResponse,
  extractErrorCode,
  getApiErrorMeta,
  handleRouteError,
  parseAndValidate
} from "@/lib/api/common";
import { getDebtReminderErrorMeta } from "@/lib/api/communication";
import { resolveFirstAdminActorId } from "@/lib/api/reports";
import { getCronAuthorizationHeader } from "@/lib/env";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import type { StandardEnvelope } from "@/lib/pos/types";
import { runDebtReminderSchema } from "@/lib/validations/communication";

type RunDebtReminderResponse = {
  processed_count: number;
  created_count: number;
  suppressed_duplicates: number;
};

async function resolveRouteActor(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = getCronAuthorizationHeader({ allowMissing: true });

  if (expected !== null && authHeader === expected) {
    const supabase = getSupabaseAdminClient();
    const userId = await resolveFirstAdminActorId(supabase);

    return {
      supabase,
      userId
    };
  }

  const authorization = await authorizeRequest(["admin"]);
  if (!authorization.authorized) {
    return {
      response: authorization.response
    };
  }

  return {
    supabase: authorization.supabase,
    userId: authorization.userId
  };
}

export async function POST(request: NextRequest) {
  try {
    const actor = await resolveRouteActor(request);
    if ("response" in actor) {
      return actor.response;
    }

    const validation = await parseAndValidate(request, runDebtReminderSchema, getDebtReminderErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const payload = validation.data;
    const { data, error } = await actor.supabase.rpc("run_debt_reminder_scheduler", {
      p_mode: payload.mode,
      p_as_of_date: payload.as_of_date,
      p_created_by: actor.userId
    });

    if (error) {
      throw error;
    }

    return NextResponse.json<StandardEnvelope<RunDebtReminderResponse>>(
      {
        success: true,
        data: {
          processed_count: data.processed_count,
          created_count: data.created_count,
          suppressed_duplicates: data.suppressed_duplicates
        }
      },
      { status: 200 }
    );
  } catch (error) {
    const code = extractErrorCode((error as Error).message);
    if (code === "ERR_API_RUNTIME_MISCONFIGURED" || code === "ERR_ENV_CRON_SECRET_INVALID") {
      const meta = getApiErrorMeta("ERR_API_RUNTIME_MISCONFIGURED");
      return errorResponse("ERR_API_RUNTIME_MISCONFIGURED", meta.message, meta.status);
    }

    return handleRouteError(error, getDebtReminderErrorMeta);
  }
}
