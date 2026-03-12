"use client";

import { useMemo, useState, useTransition } from "react";
import { KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { StatusBanner } from "@/components/ui/status-banner";
import type {
  PermissionAssignmentOption,
  PermissionBundleOption,
  PermissionUserOption
} from "@/lib/api/dashboard";
import type { StandardEnvelope } from "@/lib/pos/types";

type BundlePreviewResponse = {
  bundle_key: string;
  base_role: "admin" | "pos_staff";
  permissions: string[];
  max_discount_percentage: number | null;
  discount_requires_approval: boolean;
};

type AssignmentResponse = {
  assignment_id: string;
  bundle_key: string;
  base_role: "admin" | "pos_staff";
  is_active: boolean;
};

type PermissionsPanelProps = {
  permissionBundles: PermissionBundleOption[];
  permissionUsers: PermissionUserOption[];
  activeAssignments: PermissionAssignmentOption[];
};

type RetryAction = "preview-bundle" | "assign-bundle" | "revoke-bundle" | null;
type ConfirmAction = { type: "assign-bundle" | "revoke-bundle" } | null;

function getApiErrorMessage<T>(envelope: StandardEnvelope<T>) {
  return envelope.error?.message ?? "تعذر إتمام العملية.";
}

function getRoleLabel(role: "admin" | "pos_staff") {
  return role === "admin" ? "إداري" : "نقطة بيع";
}

function formatPermissionLabel(permission: string) {
  return permission.replace(/\./g, " / ");
}

export function PermissionsPanel({
  permissionBundles,
  permissionUsers,
  activeAssignments
}: PermissionsPanelProps) {
  const router = useRouter();
  const [selectedBundleKey, setSelectedBundleKey] = useState(permissionBundles[0]?.key ?? "");
  const [selectedUserId, setSelectedUserId] = useState(permissionUsers[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [preview, setPreview] = useState<BundlePreviewResponse | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<RetryAction>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [isPending, startTransition] = useTransition();

  const selectedBundle = useMemo(
    () => permissionBundles.find((bundle) => bundle.key === selectedBundleKey) ?? null,
    [permissionBundles, selectedBundleKey]
  );

  const eligibleUsers = useMemo(() => {
    if (!selectedBundle) {
      return permissionUsers;
    }

    return permissionUsers.filter((user) => user.role === selectedBundle.base_role);
  }, [permissionUsers, selectedBundle]);

  const selectedUser = useMemo(
    () => eligibleUsers.find((user) => user.id === selectedUserId) ?? eligibleUsers[0] ?? null,
    [eligibleUsers, selectedUserId]
  );

  const selectedUserAssignments = useMemo(
    () => activeAssignments.filter((assignment) => assignment.user_id === selectedUser?.id),
    [activeAssignments, selectedUser]
  );

  function clearActionFeedback() {
    setActionErrorMessage(null);
    setRetryAction(null);
  }

  function failAction(message: string, action: RetryAction) {
    setActionErrorMessage(message);
    setRetryAction(action);
    toast.error(message);
  }

  function runPreview() {
    clearActionFeedback();
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/permissions/preview", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bundle_key: selectedBundleKey })
        });

        const envelope = (await response.json()) as StandardEnvelope<BundlePreviewResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          failAction(getApiErrorMessage(envelope), "preview-bundle");
          return;
        }

        setPreview(envelope.data);
        setRetryAction(null);
        toast.success("تم تحميل معاينة الحزمة.");
      })();
    });
  }

  function manageAssignment(method: "POST" | "DELETE") {
    if (!selectedUser || !selectedBundle) {
      failAction("اختر مستخدمًا وحزمة صالحة أولًا.", method === "POST" ? "assign-bundle" : "revoke-bundle");
      return;
    }

    clearActionFeedback();
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/roles/assign", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: selectedUser.id,
            bundle_key: selectedBundle.key,
            notes: notes || undefined
          })
        });

        const envelope = (await response.json()) as StandardEnvelope<AssignmentResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          failAction(getApiErrorMessage(envelope), method === "POST" ? "assign-bundle" : "revoke-bundle");
          return;
        }

        setNotes("");
        setConfirmAction(null);
        setRetryAction(null);
        toast.success(method === "POST" ? "تم إسناد الحزمة بنجاح." : "تم إلغاء الحزمة بنجاح.");
        router.refresh();
      })();
    });
  }

  function retryLastAction() {
    switch (retryAction) {
      case "preview-bundle":
        runPreview();
        break;
      case "assign-bundle":
        manageAssignment("POST");
        break;
      case "revoke-bundle":
        manageAssignment("DELETE");
        break;
      default:
        break;
    }
  }

  return (
    <section className="workspace-panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">الصلاحيات</p>
          <h2>مركز الحِزم والصلاحيات الدقيقة</h2>
        </div>
        <ShieldCheck size={18} />
      </div>

      <p className="workspace-footnote">
        يُحدَّد نطاق عمل كل حساب من خلال الدور الأساسي والحِزم التشغيلية المسندة له من هذه الشاشة.
      </p>

      {isPending ? (
        <StatusBanner
          variant="info"
          title="جارٍ تنفيذ تحديث الصلاحيات"
          message="انتظر حتى يكتمل تحديث الحزمة الحالية قبل تعديل مستخدم أو حزمة أخرى."
        />
      ) : null}

      {actionErrorMessage ? (
        <StatusBanner
          variant="danger"
          title="تعذر إكمال تحديث الصلاحيات"
          message={actionErrorMessage}
          actionLabel={retryAction ? "إعادة المحاولة" : undefined}
          onAction={retryAction ? retryLastAction : undefined}
          onDismiss={clearActionFeedback}
        />
      ) : null}

      <div className="stack-form">
        <label className="stack-field">
          <span>الحزمة</span>
          <select value={selectedBundleKey} onChange={(event) => setSelectedBundleKey(event.target.value)}>
            {permissionBundles.map((bundle) => (
              <option key={bundle.id} value={bundle.key}>
                {bundle.label} ({getRoleLabel(bundle.base_role)})
              </option>
            ))}
          </select>
        </label>

        <label className="stack-field">
          <span>المستخدم</span>
          <select
            value={selectedUser?.id ?? ""}
            onChange={(event) => setSelectedUserId(event.target.value)}
            disabled={eligibleUsers.length === 0}
          >
            {eligibleUsers.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name ?? user.id} ({getRoleLabel(user.role)})
              </option>
            ))}
          </select>
        </label>

        <label className="stack-field">
          <span>ملاحظة التعيين / الإلغاء</span>
          <textarea
            rows={3}
            maxLength={500}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="مثال: صلاحية الجرد لنوبة المساء"
          />
        </label>

        <div className="actions-row">
          <button type="button" className="secondary-button" disabled={isPending || !selectedBundleKey} onClick={runPreview}>
            {isPending ? <Loader2 className="spin" size={16} /> : <KeyRound size={16} />}
            معاينة الحزمة
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={isPending || !selectedUser || !selectedBundle}
            onClick={() => setConfirmAction({ type: "assign-bundle" })}
          >
            إسناد
          </button>
          <button
            type="button"
            className="secondary-button"
            disabled={isPending || !selectedUser || !selectedBundle}
            onClick={() => setConfirmAction({ type: "revoke-bundle" })}
          >
            إلغاء
          </button>
        </div>
      </div>

      {preview ? (
        <div className="result-card">
          <h3>{selectedBundle?.label ?? preview.bundle_key}</h3>
          {selectedBundle?.description ? <p>{selectedBundle.description}</p> : null}
          <p>الدور الأساسي: {getRoleLabel(preview.base_role)}</p>
          <p>الحد الأقصى للخصم: {preview.max_discount_percentage ?? "غير محدد"}</p>
          <p>يتطلب اعتماد خصم: {preview.discount_requires_approval ? "نعم" : "لا"}</p>
          <p>العمليات المتاحة: {preview.permissions.map(formatPermissionLabel).join("، ") || "لا يوجد"}</p>
        </div>
      ) : null}

      {selectedUser ? (
        <div className="workspace-panel workspace-panel--muted">
          <p className="eyebrow">الصلاحيات النشطة</p>
          <h3>{selectedUser.full_name ?? selectedUser.id}</h3>
          {selectedUserAssignments.length > 0 ? (
            <ul className="compact-list">
              {selectedUserAssignments.map((assignment) => (
                <li key={assignment.id}>
                  <strong>{assignment.bundle_label}</strong>
                  {assignment.notes ? <span> - {assignment.notes}</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="workspace-footnote">لا توجد حِزم نشطة لهذا المستخدم.</p>
          )}
        </div>
      ) : null}

      <ConfirmationDialog
        open={confirmAction?.type === "assign-bundle"}
        title="تأكيد إسناد الحزمة"
        description="سيُضاف هذا الإسناد إلى المستخدم المحدد ويُطبق مباشرة على الصلاحيات الممنوحة له."
        confirmLabel="إسناد الحزمة"
        onConfirm={() => manageAssignment("POST")}
        onCancel={() => setConfirmAction(null)}
        isPending={isPending}
      />

      <ConfirmationDialog
        open={confirmAction?.type === "revoke-bundle"}
        title="تأكيد إلغاء الحزمة"
        description="سيُزال هذا الإسناد من المستخدم المحدد. استخدمه فقط بعد التحقق من الأثر التشغيلي على دوره الحالي."
        confirmLabel="إلغاء الحزمة"
        onConfirm={() => manageAssignment("DELETE")}
        onCancel={() => setConfirmAction(null)}
        isPending={isPending}
        tone="danger"
      />
    </section>
  );
}
