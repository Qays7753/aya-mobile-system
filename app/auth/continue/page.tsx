import { redirect } from "next/navigation";
import { resolveWorkspaceAccess } from "@/app/(dashboard)/access";
import { AccessRequired } from "@/components/dashboard/access-required";

export const dynamic = "force-dynamic";

const SESSION_SYNC_RETRY_DELAYS_MS = [150, 300, 600] as const;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default async function AuthContinuePage() {
  let access = await resolveWorkspaceAccess();

  for (const delayMs of SESSION_SYNC_RETRY_DELAYS_MS) {
    if (access.state !== "unauthenticated") {
      break;
    }

    await sleep(delayMs);
    access = await resolveWorkspaceAccess();
  }

  if (access.state === "ok") {
    redirect(access.role === "admin" ? "/reports" : "/pos");
  }

  if (access.state === "forbidden") {
    return (
      <AccessRequired
        title="تعذر فتح مساحة العمل لهذا الحساب"
        description="تم تسجيل الدخول بنجاح، لكن هذا الحساب لا يملك صلاحية دخول مساحة العمل المطلوبة أو أن ملف الصلاحيات غير مكتمل."
        actionLabel="العودة إلى تسجيل الدخول"
        actionHref="/"
      />
    );
  }

  return (
    <AccessRequired
      title="تعذر تأكيد الجلسة بعد تسجيل الدخول"
      description="اكتملت المصادقة، لكن الخادم لم يتمكن من تأكيد الجلسة الحالية بعد. أعد المحاولة من شاشة تسجيل الدخول."
      actionLabel="العودة إلى تسجيل الدخول"
      actionHref="/"
    />
  );
}
