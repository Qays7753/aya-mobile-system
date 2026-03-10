import { getWorkspaceAccess } from "@/app/(dashboard)/access";
import { AccessRequired } from "@/components/dashboard/access-required";
import { SettingsOps } from "@/components/dashboard/settings-ops";
import { getSettingsPageBaseline } from "@/lib/api/dashboard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function SettingsPage() {
  const access = await getWorkspaceAccess();

  if (access.state === "unauthenticated") {
    return (
      <AccessRequired
        title="يلزم تسجيل الدخول لفتح الإعدادات التشغيلية"
        description="اللقطة اليومية، التسوية، الجرد، وفحص الأرصدة كلها أدوات تشغيلية محصورة بحساب Admin."
      />
    );
  }

  if (access.state !== "ok" || access.role !== "admin") {
    return (
      <AccessRequired
        title="هذه الشاشة مخصصة للـ Admin فقط"
        description="POS لا يجب أن يرى أو ينفذ اللقطة اليومية أو التسوية أو فحص سلامة الأرصدة."
      />
    );
  }

  const supabase = getSupabaseAdminClient();
  const baseline = await getSettingsPageBaseline(supabase);

  return <SettingsOps {...baseline} />;
}
