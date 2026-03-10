import { getWorkspaceAccess } from "@/app/(dashboard)/access";
import { AccessRequired } from "@/components/dashboard/access-required";
import { InvoicesWorkspace } from "@/components/dashboard/invoices-workspace";
import { getInvoicesPageBaseline } from "@/lib/api/dashboard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export default async function InvoicesPage() {
  const access = await getWorkspaceAccess();

  if (access.state === "unauthenticated") {
    return (
      <AccessRequired
        title="يلزم تسجيل الدخول لفتح شاشة الفواتير"
        description="سجل الفواتير، المرتجع، والطباعة التشغيلية تعتمد على جلسة صالحة وربط المسار بالمستخدم الحالي."
      />
    );
  }

  if (access.state !== "ok") {
    return (
      <AccessRequired
        title="الحساب الحالي غير مخول لهذا المسار"
        description="هذه الشاشة متاحة فقط لحسابات Admin وPOS النشطة، مع بقاء الإلغاء الإداري محصورًا بالـ Admin."
      />
    );
  }

  const supabase = getSupabaseAdminClient();
  const baseline = await getInvoicesPageBaseline(supabase, {
    role: access.role,
    userId: access.userId
  });

  return <InvoicesWorkspace role={access.role} {...baseline} />;
}
