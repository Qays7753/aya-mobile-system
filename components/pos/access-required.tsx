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
          <p className="eyebrow">يتطلب تسجيل الدخول</p>
          <h1>{title}</h1>
        </div>
      </div>

      <div className="workspace-panel">
        <div className="empty-panel">
          <h2>نقطة البيع متاحة بعد تسجيل الدخول</h2>
          <p>{description}</p>
          <Link href="/" className="secondary-button">
            العودة إلى الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </section>
  );
}
