import type { Metadata } from "next";
import { getWorkspaceAccess } from "@/app/(dashboard)/access";
import { AccessRequired } from "@/components/dashboard/access-required";
import { SettingsOps } from "@/components/dashboard/settings-ops";
import { getSettingsPageBaseline } from "@/lib/api/dashboard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "الإعدادات",
  description: "متابعة الإعدادات التشغيلية واللقطات اليومية والصلاحيات من مساحة إدارية واحدة."
};

export default async function SettingsPage() {
  const access = await getWorkspaceAccess();

  if (access.state === "unauthenticated") {
    return (
      <AccessRequired
        title="يلزم تسجيل الدخول لفتح الإعدادات التشغيلية"
        description="سجّل الدخول بحساب إداري لإدارة الإعدادات اليومية ومتابعة أدوات التشغيل."
      />
    );
  }

  if (access.state !== "ok" || access.role !== "admin") {
    return (
      <AccessRequired
        title="هذه الشاشة مخصصة للإدارة فقط"
        description="هذه المساحة مخصصة لإدارة الإعدادات والمهام التشغيلية الحساسة."
      />
    );
  }

  const supabase = getSupabaseAdminClient();
  const baseline = await getSettingsPageBaseline(supabase);

  return <SettingsOps {...baseline} />;
}
