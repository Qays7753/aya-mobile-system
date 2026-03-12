import type { Metadata } from "next";
import { getWorkspaceAccess } from "@/app/(dashboard)/access";
import { AccessRequired } from "@/components/dashboard/access-required";
import { ExpensesWorkspace } from "@/components/dashboard/expenses-workspace";
import { getExpensesPageBaseline } from "@/lib/api/expenses";
import { hasPermission } from "@/lib/permissions";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "المصروفات",
  description: "متابعة المصروفات التشغيلية والفئات المرتبطة بها من مساحة عمل واضحة."
};

export default async function ExpensesPage() {
  const access = await getWorkspaceAccess();

  if (access.state === "unauthenticated") {
    return (
      <AccessRequired
        title="يلزم تسجيل الدخول لفتح شاشة المصروفات"
        description="المصروفات التشغيلية محمية بجلسة صالحة وتُدار عبر لوحات التشغيل فقط."
      />
    );
  }

  if (access.state !== "ok" || !hasPermission(access.permissions, "expenses.read")) {
    return (
      <AccessRequired
        title="هذه الشاشة غير متاحة لهذا الحساب"
        description="عرض المصروفات متاح للحسابات المصرح لها فقط، بينما تبقى إدارة الفئات للحسابات الإدارية."
      />
    );
  }

  const supabase = getSupabaseAdminClient();
  const baseline = await getExpensesPageBaseline(supabase, {
    role: access.role,
    userId: access.userId
  });

  return <ExpensesWorkspace role={access.role} {...baseline} />;
}
