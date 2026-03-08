import { getWorkspaceAccess } from "@/app/(dashboard)/access";
import { PosAccessRequired } from "@/components/pos/access-required";
import { PosWorkspace } from "@/components/pos/pos-workspace";

export default async function PosPage() {
  const access = await getWorkspaceAccess();

  if (access.state === "unauthenticated") {
    return (
      <PosAccessRequired
        title="يلزم تسجيل الدخول لفتح نقطة البيع"
        description="السلة المحلية والبيع عبر POST /api/sales يعتمدان على جلسة Supabase صالحة حتى يمكن تمرير p_created_by وربط العملية بالمستخدم الحالي."
      />
    );
  }

  if (access.state === "forbidden") {
    return (
      <PosAccessRequired
        title="هذا الحساب لا يملك صلاحية نقطة البيع"
        description="فتح شاشة البيع محصور بحساب Admin أو POS نشط. الحسابات الأخرى يجب ألا ترى هذا المسار أو تحاول القراءة منه."
      />
    );
  }

  return <PosWorkspace />;
}
