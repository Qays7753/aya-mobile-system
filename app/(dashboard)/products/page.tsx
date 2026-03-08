import { getWorkspaceAccess } from "@/app/(dashboard)/access";
import { PosAccessRequired } from "@/components/pos/access-required";
import { ProductsBrowser } from "@/components/pos/products-browser";

export default async function ProductsPage() {
  const access = await getWorkspaceAccess();

  if (access.state === "unauthenticated") {
    return (
      <PosAccessRequired
        title="يلزم تسجيل الدخول لقراءة المنتجات"
        description="قراءة v_pos_products متاحة فقط داخل جلسة POS/Admin صالحة، لذلك لن نحاول أي طلبات قراءة قبل التأكد من الجلسة."
      />
    );
  }

  if (access.state === "forbidden") {
    return (
      <PosAccessRequired
        title="الحساب الحالي غير مخول لهذا المسار"
        description="هذا المسار مخصص لمستخدمي نقطة البيع أو الـ Admin فقط. إذا كان الحساب غير نشط أو بدور مختلف فلن تُفتح القراءة الآمنة."
      />
    );
  }

  return <ProductsBrowser />;
}
