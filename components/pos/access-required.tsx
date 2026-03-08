import Link from "next/link";

type PosAccessRequiredProps = {
  title: string;
  description: string;
};

export function PosAccessRequired({ title, description }: PosAccessRequiredProps) {
  return (
    <section className="workspace-stack">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">POS Access Guard</p>
          <h1>{title}</h1>
          <p className="workspace-lead">{description}</p>
        </div>
      </div>

      <div className="workspace-panel">
        <div className="empty-panel">
          <h2>الوصول يتطلب جلسة صالحة</h2>
          <p>
            شاشة نقطة البيع وقائمة المنتجات الآمنة تعملان فقط بعد تسجيل الدخول بحساب
            <code> Admin </code>
            أو
            <code> POS </code>
            نشط.
          </p>
          <Link href="/" className="secondary-button">
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </section>
  );
}
