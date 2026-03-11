"use client";

import { useTransition } from "react";
import { BellRing, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { NotificationFilters, NotificationItem } from "@/lib/api/notifications";
import type { StandardEnvelope } from "@/lib/pos/types";
import { formatCompactNumber, formatDateTime } from "@/lib/utils/formatters";

type NotificationsWorkspaceProps = {
  role: "admin" | "pos_staff";
  filters: NotificationFilters;
  notifications: NotificationItem[];
  unreadCount: number;
  totalCount: number;
};

type MarkReadResponse = {
  updated_count: number;
};

function getApiErrorMessage<T>(envelope: StandardEnvelope<T>) {
  return envelope.error?.message ?? "تعذر إتمام العملية.";
}

function getReferenceHref(notification: NotificationItem) {
  switch (notification.reference_type) {
    case "invoice":
      return "/invoices";
    case "debt_customer":
    case "debt_entry":
    case "debt_payment":
      return "/debts";
    case "maintenance_job":
      return "/maintenance";
    case "inventory_count":
      return "/inventory";
    default:
      return null;
  }
}

export function NotificationsWorkspace({
  role,
  filters,
  notifications,
  unreadCount,
  totalCount
}: NotificationsWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function postRead(body: { notification_ids?: string[]; mark_all?: boolean }) {
    const response = await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const envelope = (await response.json()) as StandardEnvelope<MarkReadResponse>;
    if (!response.ok || !envelope.success || !envelope.data) {
      toast.error(getApiErrorMessage(envelope));
      return;
    }

    toast.success(`تم تحديث ${envelope.data.updated_count} إشعار.`);
    router.refresh();
  }

  function handleMarkSingle(notificationId: string) {
    startTransition(() => {
      void postRead({ notification_ids: [notificationId] });
    });
  }

  function handleMarkAll() {
    startTransition(() => {
      void postRead({ mark_all: true });
    });
  }

  return (
    <section className="workspace-stack">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">PX-08 / Notification Inbox</p>
          <h1>مركز الإشعارات</h1>
          <p className="workspace-lead">
            عرض الإشعارات التشغيلية ضمن نطاق المستخدم الحالي مع القدرة على تعليم المفرد أو الكل
            كمقروء دون فتح read-all path لمستخدم POS.
          </p>
        </div>

        <div className="action-row">
          <button
            type="button"
            className="primary-button"
            disabled={isPending || unreadCount === 0}
            onClick={() => void handleMarkAll()}
          >
            {isPending ? <Loader2 className="spin" size={16} /> : "تعليم الكل كمقروء"}
          </button>
        </div>
      </div>

      <section className="summary-grid">
        <article className="workspace-panel">
          <p className="eyebrow">Unread</p>
          <h2>{formatCompactNumber(unreadCount)}</h2>
          <p className="workspace-footnote">الإشعارات غير المقروءة ضمن النطاق الحالي.</p>
        </article>

        <article className="workspace-panel">
          <p className="eyebrow">Visible Total</p>
          <h2>{formatCompactNumber(totalCount)}</h2>
          <p className="workspace-footnote">إجمالي الإشعارات بعد الفلاتر الحالية.</p>
        </article>

        <article className="workspace-panel">
          <p className="eyebrow">Role Scope</p>
          <h2>{role === "admin" ? "Admin" : "POS"}</h2>
          <p className="workspace-footnote">
            {role === "admin"
              ? "يعرض كل الإشعارات التشغيلية."
              : "يعرض الإشعارات الخاصة بالمستخدم الحالي فقط."}
          </p>
        </article>
      </section>

      <section className="workspace-panel">
        <form className="filters-grid" method="GET">
          <label className="stack-field">
            <span>الحالة</span>
            <select name="status" defaultValue={filters.status}>
              <option value="all">الكل</option>
              <option value="unread">غير مقروء</option>
            </select>
          </label>

          <label className="stack-field">
            <span>النوع</span>
            <input name="type" defaultValue={filters.type ?? ""} placeholder="maintenance_ready" />
          </label>

          <label className="stack-field">
            <span>رقم الصفحة</span>
            <input type="number" min={1} name="page" defaultValue={String(filters.page)} />
          </label>

          <label className="stack-field">
            <span>حجم الصفحة</span>
            <input type="number" min={1} max={100} name="page_size" defaultValue={String(filters.pageSize)} />
          </label>

          <div className="action-row action-row--end">
            <button type="submit" className="primary-button">
              تطبيق الفلاتر
            </button>
          </div>
        </form>
      </section>

      <section className="workspace-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Inbox</p>
            <h2>الإشعارات الحالية</h2>
          </div>
          <BellRing size={18} />
        </div>

        <div className="stack-list">
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const referenceHref = getReferenceHref(notification);

              return (
                <article key={notification.id} className="list-card">
                  <div className="list-card__header">
                    <strong>{notification.title}</strong>
                    <span>{notification.is_read ? "مقروء" : "غير مقروء"}</span>
                  </div>
                  <p>{notification.body}</p>
                  <p className="workspace-footnote">
                    النوع: {notification.type} — {formatDateTime(notification.created_at)}
                  </p>
                  {role === "admin" ? (
                    <p className="workspace-footnote">
                      المستخدم: {notification.user_name ?? "غير معروف"}
                    </p>
                  ) : null}
                  <div className="action-row">
                    {!notification.is_read ? (
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={isPending}
                        onClick={() => void handleMarkSingle(notification.id)}
                      >
                        تعليم كمقروء
                      </button>
                    ) : null}
                    {referenceHref ? (
                      <a href={referenceHref} className="secondary-button">
                        فتح المرجع
                      </a>
                    ) : null}
                  </div>
                </article>
              );
            })
          ) : (
            <div className="empty-panel">
              <p>لا توجد إشعارات مطابقة للفلاتر الحالية.</p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
