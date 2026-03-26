import { NextResponse } from "next/server";
import { authorizeRequest, getApiErrorMeta, handleRouteError, parseAndValidate } from "@/lib/api/common";
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

    const validation = await parseAndValidate(request, markNotificationsReadSchema, getApiErrorMeta);
    if (!validation.success) {
      return validation.response;
    }

    const payload = validation.data;
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
        throw error;
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
        throw error;
      }

      idsToUpdate = (data ?? []).map((row) => row.id);
      if (idsToUpdate.length !== requestedIds.length) {
        throw new Error("ERR_NOTIFICATION_NOT_FOUND");
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
      throw error;
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
    return handleRouteError(error, getNotificationErrorMeta);
  }
}
