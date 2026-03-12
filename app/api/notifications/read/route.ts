import { NextResponse } from "next/server";
import { authorizeRequest, errorResponse, getApiErrorMeta, internalErrorResponse } from "@/lib/api/common";
import { getNotificationErrorMeta } from "@/lib/api/notifications";
import type { StandardEnvelope } from "@/lib/pos/types";
import { markNotificationsReadSchema } from "@/lib/validations/notifications";

type UpdatedNotificationsResponse = {
  updated_count: number;
};

type NotificationIdRow = {
  id: string;
};

export async function POST(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      const meta = getNotificationErrorMeta("ERR_API_VALIDATION_FAILED");
      return errorResponse("ERR_API_VALIDATION_FAILED", meta.message, meta.status, {
        body: ["تعذر قراءة JSON من الطلب."]
      });
    }

    const parsedBody = markNotificationsReadSchema.safeParse(body);
    if (!parsedBody.success) {
      const meta = getNotificationErrorMeta("ERR_API_VALIDATION_FAILED");
      return errorResponse("ERR_API_VALIDATION_FAILED", meta.message, meta.status, {
        field_errors: parsedBody.error.flatten().fieldErrors
      });
    }

    const payload = parsedBody.data;
    let idsToUpdate: string[] = [];

    if (payload.mark_all) {
      let query = authorization.supabase
        .from("notifications")
        .select("id")
        .eq("is_read", false)
        .order("created_at", { ascending: false });

      if (authorization.role !== "admin") {
        query = query.eq("user_id", authorization.userId);
      }

      const { data, error } = await query.returns<NotificationIdRow[]>();
      if (error) {
        return internalErrorResponse(error, { context: "notifications.read.lookup-all" });
      }

      idsToUpdate = (data ?? []).map((row) => row.id);
    } else {
      const requestedIds = payload.notification_ids ?? [];
      let query = authorization.supabase
        .from("notifications")
        .select("id")
        .in("id", requestedIds);

      if (authorization.role !== "admin") {
        query = query.eq("user_id", authorization.userId);
      }

      const { data, error } = await query.returns<NotificationIdRow[]>();
      if (error) {
        return internalErrorResponse(error, { context: "notifications.read.lookup-selection" });
      }

      idsToUpdate = (data ?? []).map((row) => row.id);
      if (idsToUpdate.length !== requestedIds.length) {
        const meta = getNotificationErrorMeta("ERR_NOTIFICATION_NOT_FOUND");
        return errorResponse("ERR_NOTIFICATION_NOT_FOUND", meta.message, meta.status);
      }
    }

    if (idsToUpdate.length === 0) {
      return NextResponse.json<StandardEnvelope<UpdatedNotificationsResponse>>(
        {
          success: true,
          data: {
            updated_count: 0
          }
        },
        { status: 200 }
      );
    }

    const { data: updatedRows, error } = await authorization.supabase
      .from("notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString()
      })
      .in("id", idsToUpdate)
      .select("id");

    if (error) {
      return internalErrorResponse(error, { context: "notifications.read.update" });
    }

    return NextResponse.json<StandardEnvelope<UpdatedNotificationsResponse>>(
      {
        success: true,
        data: {
          updated_count: updatedRows?.length ?? 0
        }
      },
      { status: 200 }
    );
  } catch (error) {
    return internalErrorResponse(error, { context: "notifications.read.unhandled" });
  }
}
