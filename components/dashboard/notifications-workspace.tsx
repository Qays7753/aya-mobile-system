"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { BellRing, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { StatusBanner } from "@/components/ui/status-banner";
import type { NotificationFilters, NotificationItem } from "@/lib/api/notifications";
import type { AlertsSummary, GlobalSearchBaseline, GlobalSearchItem } from "@/lib/api/search";
import type { StandardEnvelope } from "@/lib/pos/types";
import { formatCompactNumber, formatDateTime } from "@/lib/utils/formatters";

type NotificationsWorkspaceProps = {
  role: "admin" | "pos_staff";
  alertsSummary: AlertsSummary | null;
  filters: NotificationFilters;
  notifications: NotificationItem[];
  searchBaseline: GlobalSearchBaseline;
  unreadCount: number;
  totalCount: number;
};

type MarkReadResponse = {
  updated_count: number;
};

type SendWhatsAppResponse = {
  delivery_log_id: string;
  status: "queued";
  wa_url: string;
};

type NotificationsSection = "inbox" | "alerts" | "search";
type NotificationsRetryAction = "mark-all" | "mark-single" | "whatsapp";

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

function getSearchResultHref(item: GlobalSearchItem) {
  switch (item.entity) {
    case "product":
      return "/products";
    case "invoice":
      return "/invoices";
    case "debt_customer":
      return "/debts";
    case "maintenance_job":
      return "/maintenance";
  }
}

function getAlertHref(key: keyof AlertsSummary) {
  switch (key) {
    case "low_stock":
      return "/products";
    case "overdue_debts":
      return "/debts";
    case "reconciliation_drift":
      return "/inventory";
    case "maintenance_ready":
      return "/maintenance";
    case "unread_notifications":
      return "/notifications?status=unread";
  }
}

function getAlertLabel(key: keyof AlertsSummary) {
  switch (key) {
    case "low_stock":
      return "مخزون منخفض";
    case "overdue_debts":
      return "ديون متأخرة";
    case "reconciliation_drift":
      return "فروقات تسوية";
    case "maintenance_ready":
      return "صيانة جاهزة";
    case "unread_notifications":
      return "إشعارات غير مقروءة";
  }
}

function getRoleLabel(role: "admin" | "pos_staff") {
  return role === "admin" ? "إداري" : "نقطة بيع";
}

function getNotificationTypeLabel(type: string) {
  const labels: Record<string, string> = {
    low_stock: "مخزون منخفض",
    overdue_debt: "دين متأخر",
    maintenance_ready: "صيانة جاهزة",
    large_discount: "خصم كبير",
    portability_event: "عملية نقل أو نسخ",
    reconciliation_drift: "فروقات تسوية",
    unread_notifications: "إشعارات غير مقروءة"
  };

  return labels[type] ?? type.replace(/_/g, " ");
}

export function NotificationsWorkspace({
  role,
  alertsSummary,
  filters,
  notifications,
  searchBaseline,
  unreadCount,
  totalCount
}: NotificationsWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeSection, setActiveSection] = useState<NotificationsSection>(searchBaseline.filters.q ? "search" : "inbox");
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<NotificationsRetryAction | null>(null);
  const [retryNotificationId, setRetryNotificationId] = useState<string | null>(null);

  useEffect(() => {
    setActiveSection(searchBaseline.filters.q ? "search" : "inbox");
  }, [searchBaseline.filters.q]);

  function clearActionFeedback() {
    setActionErrorMessage(null);
    setRetryAction(null);
    setRetryNotificationId(null);
  }

  function failAction(message: string, action: NotificationsRetryAction, notificationId?: string) {
    setActionErrorMessage(message);
    setRetryAction(action);
    setRetryNotificationId(notificationId ?? null);
    toast.error(message);
  }

  async function postRead(
    body: { notification_ids?: string[]; mark_all?: boolean },
    action: NotificationsRetryAction,
    notificationId?: string
  ) {
    const response = await fetch("/api/notifications/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const envelope = (await response.json()) as StandardEnvelope<MarkReadResponse>;
    if (!response.ok || !envelope.success || !envelope.data) {
      failAction(getApiErrorMessage(envelope), action, notificationId);
      return;
    }

    clearActionFeedback();
    toast.success(`تم تحديث ${envelope.data.updated_count} إشعار.`);
    router.refresh();
  }

  function handleMarkSingle(notificationId: string) {
    clearActionFeedback();
    startTransition(() => {
      void postRead({ notification_ids: [notificationId] }, "mark-single", notificationId);
    });
  }

  function handleMarkAll() {
    clearActionFeedback();
    startTransition(() => {
      void postRead({ mark_all: true }, "mark-all");
    });
  }

  function handleWhatsAppSend(notification: NotificationItem) {
    if (!notification.contact_phone || !notification.whatsapp_template_key || !notification.reference_type || !notification.reference_id) {
      failAction("تعذر تجهيز محاولة الإرسال لهذه الإشعارة.", "whatsapp", notification.id);
      return;
    }

    clearActionFeedback();
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/messages/whatsapp/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            template_key: notification.whatsapp_template_key,
            target_phone: notification.contact_phone,
            reference_type: notification.reference_type,
            reference_id: notification.reference_id,
            payload: {},
            idempotency_key: crypto.randomUUID()
          })
        });

        const envelope = (await response.json()) as StandardEnvelope<SendWhatsAppResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          failAction(getApiErrorMessage(envelope), "whatsapp", notification.id);
          return;
        }

        clearActionFeedback();
        window.open(envelope.data.wa_url, "_blank", "noopener,noreferrer");
        toast.success("تم تجهيز رابط واتساب وتسجيل المحاولة.");
      })();
    });
  }

  function retryLastAction() {
    switch (retryAction) {
      case "mark-all":
        handleMarkAll();
        break;
      case "mark-single":
        if (retryNotificationId) {
          handleMarkSingle(retryNotificationId);
        }
        break;
      case "whatsapp": {
        const notification = notifications.find((item) => item.id === retryNotificationId);
        if (notification) {
          handleWhatsAppSend(notification);
        }
        break;
      }
      default:
        break;
    }
  }

  const alertKeys = alertsSummary
    ? (["low_stock", "overdue_debts", "reconciliation_drift", "maintenance_ready", "unread_notifications"] as const)
    : [];

  return (
    <section className="workspace-stack">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">الإشعارات</p>
          <h1>مركز التنبيهات والمتابعة</h1>
          <p className="workspace-lead">
            افتح صندوق الإشعارات، راجع التنبيهات المجمعة، وانتقل سريعًا إلى نتائج البحث الشامل من نفس المساحة.
          </p>
        </div>

        <div className="action-row">
          <Link href="/notifications" className="secondary-button">
            إعادة ضبط المركز
          </Link>
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

      <div className="chip-row workspace-section-nav">
        <button
          type="button"
          className={activeSection === "inbox" ? "chip-button is-selected" : "chip-button"}
          onClick={() => setActiveSection("inbox")}
        >
          صندوق الإشعارات
        </button>
        {alertsSummary ? (
          <button
            type="button"
            className={activeSection === "alerts" ? "chip-button is-selected" : "chip-button"}
            onClick={() => setActiveSection("alerts")}
          >
            التنبيهات المجمعة
          </button>
        ) : null}
        <button
          type="button"
          className={activeSection === "search" ? "chip-button is-selected" : "chip-button"}
          onClick={() => setActiveSection("search")}
        >
          البحث الشامل
        </button>
      </div>

      {isPending ? (
        <StatusBanner
          variant="info"
          title="جاري تنفيذ الإجراء"
          message="انتظر حتى يكتمل تحديث مركز الإشعارات الحالي قبل بدء إجراء جديد."
        />
      ) : null}

      {actionErrorMessage ? (
        <StatusBanner
          variant="danger"
          title="تعذر إكمال الإجراء"
          message={actionErrorMessage}
          actionLabel={retryAction ? "إعادة المحاولة" : undefined}
          onAction={retryAction ? retryLastAction : undefined}
          onDismiss={clearActionFeedback}
        />
      ) : null}

      {activeSection === "alerts" && alertsSummary ? (
        <section className="summary-grid">
          {alertKeys.map((key) => (
            <article key={key} className="workspace-panel">
              <p className="eyebrow">{getAlertLabel(key)}</p>
              <h2>{formatCompactNumber(alertsSummary[key])}</h2>
              <p className="workspace-footnote">يعرض هذا الرقم مرة واحدة لكل مجموعة تشغيلية بدل الضوضاء المتكررة.</p>
              <div className="action-row">
                <Link href={getAlertHref(key)} className="secondary-button">
                  فتح المسار
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : null}

      {activeSection === "search" ? (
        <section className="workspace-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">البحث الشامل</p>
              <h2>نتائج البحث الحالية</h2>
            </div>
            <Search size={18} />
          </div>

          <p className="workspace-footnote">
            يمكنك بدء البحث من الشريط العلوي في أي شاشة، أو تعديل نفس الاستعلام من هذه اللوحة عند الحاجة.
          </p>

          <form className="filters-grid" method="GET">
            <input type="hidden" name="status" value={filters.status} />
            <input type="hidden" name="type" value={filters.type ?? ""} />
            <input type="hidden" name="page" value={String(filters.page)} />
            <input type="hidden" name="page_size" value={String(filters.pageSize)} />

            <label className="stack-field">
              <span>الاستعلام</span>
              <input
                name="q"
                defaultValue={searchBaseline.filters.q}
                placeholder="اسم منتج، رقم فاتورة، عميل أو رقم صيانة"
              />
            </label>

            <label className="stack-field">
              <span>الكيان</span>
              <select name="entity" defaultValue={searchBaseline.filters.entity}>
                <option value="all">الكل</option>
                {searchBaseline.allowedEntities.includes("product") ? <option value="product">المنتجات</option> : null}
                {searchBaseline.allowedEntities.includes("invoice") ? <option value="invoice">الفواتير</option> : null}
                {searchBaseline.allowedEntities.includes("debt_customer") ? <option value="debt_customer">الديون</option> : null}
                {searchBaseline.allowedEntities.includes("maintenance_job") ? (
                  <option value="maintenance_job">الصيانة</option>
                ) : null}
              </select>
            </label>

            <label className="stack-field">
              <span>حد النتائج</span>
              <input type="number" name="limit" min={1} max={20} defaultValue={String(searchBaseline.filters.limit)} />
            </label>

            <div className="action-row action-row--end">
              <button type="submit" className="primary-button">
                تنفيذ البحث
              </button>
            </div>
          </form>

          {searchBaseline.errorMessage ? (
            <div className="empty-panel">
              <p>{searchBaseline.errorMessage}</p>
            </div>
          ) : searchBaseline.filters.q ? (
            <>
              <p className="workspace-footnote">
                النتائج الحالية: {formatCompactNumber(searchBaseline.totalCount)} ضمن الحدود المسموح بها للدور الحالي.
              </p>

              <div className="detail-grid">
                {searchBaseline.groups.length > 0 ? (
                  searchBaseline.groups.map((group) => (
                    <section key={group.entity} className="workspace-panel">
                      <div className="section-heading">
                        <div>
                          <p className="eyebrow">{group.title}</p>
                          <h2>{group.title}</h2>
                        </div>
                      </div>

                      <div className="stack-list">
                        {group.items.map((item) => (
                          <article key={item.id} className="list-card">
                            <div className="list-card__header">
                              <strong>{item.label}</strong>
                              <span>{group.title}</span>
                            </div>
                            <p>{item.secondary}</p>
                            <div className="action-row">
                              <Link href={getSearchResultHref(item)} className="secondary-button">
                                فتح المسار
                              </Link>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>
                  ))
                ) : (
                  <div className="empty-panel">
                    <p>لا توجد نتائج مطابقة ضمن حدود الدور الحالي. جرّب عبارة أخرى أو افتح الشاشة المرتبطة مباشرة.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="empty-panel">
              <p>ابدأ بحثًا جديدًا من الشريط العلوي أو أدخل استعلامًا من حرفين على الأقل لعرض النتائج هنا.</p>
            </div>
          )}
        </section>
      ) : null}

      {activeSection === "inbox" ? (
        <>
          <section className="summary-grid">
            <article className="workspace-panel">
              <p className="eyebrow">غير المقروء</p>
              <h2>{formatCompactNumber(unreadCount)}</h2>
              <p className="workspace-footnote">الإشعارات التي ما زالت تحتاج متابعة من الحساب الحالي.</p>
            </article>

            <article className="workspace-panel">
              <p className="eyebrow">الإجمالي الظاهر</p>
              <h2>{formatCompactNumber(totalCount)}</h2>
              <p className="workspace-footnote">إجمالي السجل المعروض بعد تطبيق الفلاتر الحالية.</p>
            </article>

            <article className="workspace-panel">
              <p className="eyebrow">نطاق الحساب</p>
              <h2>{getRoleLabel(role)}</h2>
              <p className="workspace-footnote">
                {role === "admin"
                  ? "يعرض الحساب الإداري التنبيهات العامة والملخصات المجمعة."
                  : "يعرض الحساب التشغيلي التنبيهات الخاصة بالمستخدم الحالي فقط."}
              </p>
            </article>
          </section>

          <section className="workspace-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">صندوق الإشعارات</p>
                <h2>الإشعارات الحالية</h2>
              </div>
              <BellRing size={18} />
            </div>

            <form className="filters-grid" method="GET">
              <input type="hidden" name="q" value={searchBaseline.filters.q} />
              <input type="hidden" name="entity" value={searchBaseline.filters.entity} />
              <input type="hidden" name="limit" value={String(searchBaseline.filters.limit)} />

              <label className="stack-field">
                <span>الحالة</span>
                <select name="status" defaultValue={filters.status}>
                  <option value="all">الكل</option>
                  <option value="unread">غير مقروء</option>
                  <option value="read">مقروء</option>
                </select>
              </label>

              <label className="stack-field">
                <span>النوع</span>
                <input name="type" defaultValue={filters.type ?? ""} placeholder="اختياري" />
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
                <button type="submit" className="secondary-button">
                  تطبيق الفلاتر
                </button>
              </div>
            </form>

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
                        النوع: {getNotificationTypeLabel(notification.type)} — {formatDateTime(notification.created_at)}
                      </p>
                      {role === "admin" ? (
                        <p className="workspace-footnote">المستخدم: {notification.user_name ?? "غير معروف"}</p>
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

                        {role === "admin" && notification.contact_phone && notification.whatsapp_template_key ? (
                          <button
                            type="button"
                            className="secondary-button"
                            disabled={isPending}
                            onClick={() => handleWhatsAppSend(notification)}
                          >
                            إرسال واتساب
                          </button>
                        ) : null}

                        {referenceHref ? (
                          <Link href={referenceHref} className="secondary-button">
                            فتح المرجع
                          </Link>
                        ) : null}
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="empty-panel">
                  <p>لا توجد إشعارات مطابقة للفلاتر الحالية. جرّب فلاتر أخرى أو افتح التنبيهات المجمعة بدلًا من ذلك.</p>
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}
    </section>
  );
}
