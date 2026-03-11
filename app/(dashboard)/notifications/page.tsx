import { getWorkspaceAccess } from "@/app/(dashboard)/access";
import { AccessRequired } from "@/components/dashboard/access-required";
import { NotificationsWorkspace } from "@/components/dashboard/notifications-workspace";
import { getNotificationsPageBaseline } from "@/lib/api/notifications";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

type NotificationsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default async function NotificationsPage({ searchParams = {} }: NotificationsPageProps) {
  const access = await getWorkspaceAccess();

  if (access.state === "unauthenticated") {
    return (
      <AccessRequired
        title="يلزم تسجيل الدخول لفتح مركز الإشعارات"
        description="مركز الإشعارات محصور بحسابات التشغيل المرتبطة بجلسة Supabase صالحة."
      />
    );
  }

  if (access.state !== "ok" || !["admin", "pos_staff"].includes(access.role)) {
    return (
      <AccessRequired
        title="لا تملك صلاحية الوصول إلى مركز الإشعارات"
        description="السطح الحالي متاح فقط لحسابات التشغيل Admin وPOS."
      />
    );
  }

  const supabase = getSupabaseAdminClient();
  const baseline = await getNotificationsPageBaseline(
    supabase,
    {
      role: access.role,
      userId: access.userId
    },
    searchParams
  );

  return (
    <NotificationsWorkspace
      role={access.role}
      filters={baseline.filters}
      notifications={baseline.notifications}
      unreadCount={baseline.unreadCount}
      totalCount={baseline.totalCount}
    />
  );
}
