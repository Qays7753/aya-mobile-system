import Link from "next/link";

type AccessRequiredProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
};

export function AccessRequired({
  title,
  description,
  actionLabel = "الذهاب إلى تسجيل الدخول",
  actionHref = "/login"
}: AccessRequiredProps) {
  return (
    <section className="workspace-stack">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">Protected Workspace</p>
          <h1>{title}</h1>
          <p className="workspace-lead">{description}</p>
        </div>
      </div>

      <div className="workspace-panel">
        <div className="empty-panel">
          <h2>الوصول يتطلب جلسة وصلاحية مناسبة</h2>
          <p>
            هذه الشاشة تعتمد على جلسة Supabase صالحة، كما أن بعض الأدوات محصورة بحساب
            <code> Admin </code>
            فقط.
          </p>
          <div className="action-row">
            <Link href={actionHref} className="primary-button">
              {actionLabel}
            </Link>
            <Link href="/" className="secondary-button">
              العودة إلى الصفحة الرئيسية
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
