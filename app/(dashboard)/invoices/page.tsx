import type { Metadata } from "next";
import { getWorkspaceAccess } from "@/app/(dashboard)/access";
import { AccessRequired } from "@/components/dashboard/access-required";
import { InvoicesWorkspace } from "@/components/dashboard/invoices-workspace";
import { getInvoicesPageBaseline } from "@/lib/api/dashboard";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "الفواتير",
  description: "مراجعة الفواتير والطباعة والإرجاع ومشاركة الإيصالات من شاشة واحدة."
};

export default async function InvoicesPage() {
  const access = await getWorkspaceAccess();

  if (access.state === "unauthenticated") {
    return (
      <AccessRequired
        title="يلزم تسجيل الدخول لفتح شاشة الفواتير"
        description="سجّل الدخول لمراجعة الفواتير والطباعة ومتابعة الإرجاع من الحساب المصرح له."
      />
    );
  }

  if (access.state !== "ok") {
    return (
      <AccessRequired
        title="الحساب الحالي غير مخول لهذا المسار"
        description="هذه الشاشة مخصصة للحسابات التي تدير البيع اليومي، بينما تبقى بعض الإجراءات الحساسة للإدارة."
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
