import { getWorkspaceAccess } from "@/app/(dashboard)/access";
import { AccessRequired } from "@/components/dashboard/access-required";
import { DebtsWorkspace } from "@/components/dashboard/debts-workspace";
import { getDebtsPageBaseline } from "@/lib/api/dashboard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function DebtsPage() {
  const access = await getWorkspaceAccess();

  if (access.state === "unauthenticated") {
    return (
      <AccessRequired
        title="يلزم تسجيل الدخول لفتح شاشة الديون"
        description="تسديد الدين والدين اليدوي يعتمدان على جلسة صالحة وربط مباشر بالمستخدم الحالي."
      />
    );
  }

  if (access.state !== "ok") {
    return (
      <AccessRequired
        title="الحساب الحالي غير مخول لهذا المسار"
        description="هذه الشاشة متاحة فقط لحسابات Admin وPOS النشطة."
      />
    );
  }

  const supabase = getSupabaseAdminClient();
  const baseline = await getDebtsPageBaseline(supabase, {
    role: access.role,
    userId: access.userId
  });

  return <DebtsWorkspace role={access.role} {...baseline} />;
}
