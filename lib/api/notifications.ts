import { getApiErrorMeta } from "@/lib/api/common";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

const NOTIFICATION_ERROR_MAP = {
  ERR_NOTIFICATION_NOT_FOUND: {
    status: 404,
    message: "الإشعار المطلوب غير موجود ضمن نطاق المستخدم الحالي."
  },
  ERR_API_VALIDATION_FAILED: {
    status: 400,
    message: "بيانات الإشعارات غير صالحة."
  },
  ERR_UNAUTHORIZED: {
    status: 403,
    message: "ليس لديك صلاحية للوصول إلى مركز الإشعارات."
  }
} as const;

type NotificationErrorCode = keyof typeof NOTIFICATION_ERROR_MAP;

export type NotificationFilters = {
  status: "unread" | "all";
  type?: string;
  page: number;
  pageSize: number;
};

function toPositiveInteger(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export function parseNotificationFilters(searchParams: URLSearchParams): NotificationFilters {
  const status = searchParams.get("status") === "unread" ? "unread" : "all";
  const type = searchParams.get("type") || undefined;
  const page = toPositiveInteger(searchParams.get("page"), 1);
  const pageSize = Math.min(toPositiveInteger(searchParams.get("page_size"), 20), 100);

  return {
    status,
    type,
    page,
    pageSize
  };
}

export function getNotificationErrorMeta(code: string) {
  if (code in NOTIFICATION_ERROR_MAP) {
    return NOTIFICATION_ERROR_MAP[code as NotificationErrorCode];
  }

  return getApiErrorMeta(code);
}

type WorkspaceRole = "admin" | "pos_staff";

type SearchParamsInput = Record<string, string | string[] | undefined>;

export type NotificationItem = {
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
  user_name: string | null;
};

type ProfileNameRow = {
  id: string;
  full_name: string | null;
};

function appendSearchParam(target: URLSearchParams, key: string, value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    for (const item of value) {
      target.append(key, item);
    }
    return;
  }

  if (value) {
    target.set(key, value);
  }
}

export function toNotificationSearchParams(searchParams: SearchParamsInput) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    appendSearchParam(params, key, value);
  }

  return params;
}

async function loadProfileNameMap(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  ids: string[]
) {
  const uniqueIds = [...new Set(ids.filter(Boolean))];
  const profileMap = new Map<string, string | null>();

  if (uniqueIds.length === 0) {
    return profileMap;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", uniqueIds)
    .returns<ProfileNameRow[]>();

  if (error) {
    throw error;
  }

  for (const profile of data ?? []) {
    profileMap.set(profile.id, profile.full_name);
  }

  return profileMap;
}

export async function getUnreadNotificationCount(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  viewer: { role: WorkspaceRole; userId: string }
) {
  let query = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (viewer.role !== "admin") {
    query = query.eq("user_id", viewer.userId);
  }

  const { count, error } = await query;
  if (error) {
    throw error;
  }

  return count ?? 0;
}

export async function getNotificationsPageBaseline(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  viewer: { role: WorkspaceRole; userId: string },
  searchParams: SearchParamsInput
) {
  const filters = parseNotificationFilters(toNotificationSearchParams(searchParams));
  const rangeFrom = (filters.page - 1) * filters.pageSize;
  const rangeTo = rangeFrom + filters.pageSize - 1;

  let notificationsQuery = supabase
    .from("notifications")
    .select("id, user_id, type, title, body, is_read, read_at, reference_type, reference_id, created_at", {
      count: "exact"
    })
    .order("created_at", { ascending: false })
    .range(rangeFrom, rangeTo);

  let unreadQuery = supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("is_read", false);

  if (viewer.role !== "admin") {
    notificationsQuery = notificationsQuery.eq("user_id", viewer.userId);
    unreadQuery = unreadQuery.eq("user_id", viewer.userId);
  }

  if (filters.status === "unread") {
    notificationsQuery = notificationsQuery.eq("is_read", false);
  }

  if (filters.type) {
    notificationsQuery = notificationsQuery.eq("type", filters.type);
    unreadQuery = unreadQuery.eq("type", filters.type);
  }

  const [notificationsResult, unreadResult] = await Promise.all([
    notificationsQuery.returns<Omit<NotificationItem, "user_name">[]>(),
    unreadQuery
  ]);

  if (notificationsResult.error) {
    throw notificationsResult.error;
  }

  if (unreadResult.error) {
    throw unreadResult.error;
  }

  const notifications = notificationsResult.data ?? [];
  const profileMap = await loadProfileNameMap(
    supabase,
    notifications.map((notification) => notification.user_id)
  );

  return {
    filters,
    notifications: notifications.map((notification) => ({
      ...notification,
      user_name: profileMap.get(notification.user_id) ?? null
    })) satisfies NotificationItem[],
    unreadCount: unreadResult.count ?? 0,
    totalCount: notificationsResult.count ?? notifications.length
  };
}
