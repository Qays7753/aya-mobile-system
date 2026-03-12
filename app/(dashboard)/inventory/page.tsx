import type { Metadata } from "next";
import { getWorkspaceAccess } from "@/app/(dashboard)/access";
import { AccessRequired } from "@/components/dashboard/access-required";
import { InventoryWorkspace } from "@/components/dashboard/inventory-workspace";
import { getInventoryPageBaseline } from "@/lib/api/dashboard";
import { hasPermission } from "@/lib/permissions";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = {
  title: "الجرد والتسوية",
  description: "بدء الجرد، مراجعة الفروقات، وتسجيل التسويات من مساحة إدارية واضحة."
};

export default async function InventoryPage() {
  const access = await getWorkspaceAccess();

  if (access.state === "unauthenticated") {
    return (
      <AccessRequired
        title="يلزم تسجيل الدخول لفتح الجرد والتسوية"
        description="سجّل الدخول لبدء الجرد ومراجعة الفروقات من الحساب المصرح له."
      />
    );
  }

  if (access.state !== "ok" || !hasPermission(access.permissions, "inventory.read")) {
    return (
      <AccessRequired
        title="هذه الشاشة غير متاحة لهذا الحساب"
        description="تحتاج إلى صلاحية عرض الجرد، بينما تبقى التسويات المالية للحسابات الإدارية فقط."
      />
    );
  }

  const supabase = getSupabaseAdminClient();
  const baseline = await getInventoryPageBaseline(supabase, {
    role: access.role
  });

  return <InventoryWorkspace {...baseline} canReconcile={access.role === "admin"} />;
}
