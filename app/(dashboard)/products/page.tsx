import type { Metadata } from "next";
import { getWorkspaceAccess } from "@/app/(dashboard)/access";
import { PosAccessRequired } from "@/components/pos/access-required";
import { ProductsBrowser } from "@/components/pos/products-browser";

export const metadata: Metadata = {
  title: "المنتجات",
  description: "عرض المنتجات المتاحة للبيع ومراجعة الأصناف النشطة بسرعة."
};

export default async function ProductsPage() {
  const access = await getWorkspaceAccess();

  if (access.state === "unauthenticated") {
    return (
      <PosAccessRequired
        title="يلزم تسجيل الدخول لقراءة المنتجات"
        description="سجّل الدخول لعرض قائمة المنتجات المتاحة للبيع من الحساب المصرح له."
      />
    );
  }

  if (access.state === "forbidden") {
    return (
      <PosAccessRequired
        title="الحساب الحالي غير مخول لهذا المسار"
        description="هذه الشاشة مخصصة للحسابات التي تعمل على البيع اليومي. استخدم حسابًا مناسبًا أو تواصل مع الإدارة."
      />
    );
  }

  return <ProductsBrowser />;
}
