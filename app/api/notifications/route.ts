import { NextResponse } from "next/server";
import { authorizeRequest, errorResponse, getApiErrorMeta } from "@/lib/api/common";
import { parseNotificationFilters } from "@/lib/api/notifications";
import type { StandardEnvelope } from "@/lib/pos/types";

type NotificationRow = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  is_read: boolean;
  read_at: string | null;
  reference_type: string | null;
  reference_id: string | null;
  created_at: string;
};

type NotificationsResponseData = {
  items: Array<{
    notification_id: string;
    type: string;
    title: string;
    body: string;
    is_read: boolean;
    read_at: string | null;
    reference_type: string | null;
    reference_id: string | null;
    created_at: string;
  }>;
  unread_count: number;
  total_count: number;
  page: number;
  page_size: number;
};

export async function GET(request: Request) {
  try {
    const authorization = await authorizeRequest(["admin", "pos_staff"]);
    if (!authorization.authorized) {
      return authorization.response;
    }

    const url = new URL(request.url);
    const filters = parseNotificationFilters(url.searchParams);
    const rangeFrom = (filters.page - 1) * filters.pageSize;
    const rangeTo = rangeFrom + filters.pageSize - 1;

    let notificationsQuery = authorization.supabase
      .from("notifications")
      .select("id, user_id, type, title, body, is_read, read_at, reference_type, reference_id, created_at", {
        count: "exact"
      })
      .order("created_at", { ascending: false })
      .range(rangeFrom, rangeTo);

    let unreadQuery = authorization.supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    if (authorization.role !== "admin") {
      notificationsQuery = notificationsQuery.eq("user_id", authorization.userId);
      unreadQuery = unreadQuery.eq("user_id", authorization.userId);
    }

    if (filters.status === "unread") {
      notificationsQuery = notificationsQuery.eq("is_read", false);
    }

    if (filters.type) {
      notificationsQuery = notificationsQuery.eq("type", filters.type);
      unreadQuery = unreadQuery.eq("type", filters.type);
    }

    const [notificationsResult, unreadResult] = await Promise.all([
      notificationsQuery.returns<NotificationRow[]>(),
      unreadQuery
    ]);

    if (notificationsResult.error || unreadResult.error) {
      const meta = getApiErrorMeta("ERR_API_INTERNAL");
      return errorResponse("ERR_API_INTERNAL", meta.message, meta.status, {
        reason: notificationsResult.error?.message ?? unreadResult.error?.message ?? "تعذر قراءة الإشعارات."
      });
    }

    return NextResponse.json<StandardEnvelope<NotificationsResponseData>>(
      {
        success: true,
        data: {
          items: (notificationsResult.data ?? []).map((notification) => ({
            notification_id: notification.id,
            type: notification.type,
            title: notification.title,
            body: notification.body,
            is_read: notification.is_read,
            read_at: notification.read_at,
            reference_type: notification.reference_type,
            reference_id: notification.reference_id,
            created_at: notification.created_at
          })),
          unread_count: unreadResult.count ?? 0,
          total_count: notificationsResult.count ?? (notificationsResult.data ?? []).length,
          page: filters.page,
          page_size: filters.pageSize
        }
      },
      { status: 200 }
    );
  } catch (error) {
    const meta = getApiErrorMeta("ERR_API_INTERNAL");
    return errorResponse("ERR_API_INTERNAL", meta.message, meta.status, {
      reason: (error as Error).message
    });
  }
}
