"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Download, Loader2, ShieldCheck, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { StatusBanner } from "@/components/ui/status-banner";
import type {
  PortabilityImportJobOption,
  PortabilityPackageOption,
  PortabilityRestoreDrillOption
} from "@/lib/api/dashboard";
import type { StandardEnvelope } from "@/lib/pos/types";
import { formatCompactNumber, formatDate } from "@/lib/utils/formatters";

type PortabilityWorkspaceProps = {
  packages: PortabilityPackageOption[];
  importJobs: PortabilityImportJobOption[];
  restoreDrills: PortabilityRestoreDrillOption[];
};

type ExportResponse = {
  package_id: string;
  download_url: string;
  expires_at: string;
};

type ImportResponse = {
  job_id: string;
  mode: "dry_run" | "commit";
  rows_total: number;
  rows_valid: number;
  rows_invalid: number;
  rows_committed?: number;
  validation_errors?: Array<{ row_number: number; field: string; message: string }>;
};

type RestoreResponse = {
  drill_id: string;
  status: "completed";
  drift_count: number;
  rto_seconds: number;
};

type RevokeResponse = {
  package_id: string;
  status: "revoked";
  revoked_at: string;
};

type RetryAction = "create-export" | "dry-run-import" | "commit-import" | "restore-drill" | "revoke-package" | null;
type ConfirmAction =
  | { type: "commit-import"; jobId: string }
  | { type: "restore-drill" }
  | { type: "revoke-package"; packageId: string }
  | null;

function getApiMessage<T>(envelope: StandardEnvelope<T>) {
  return envelope.error?.message ?? "تعذرت العملية.";
}

function getStatusLabel(status: string) {
  switch (status) {
    case "ready":
      return "جاهزة";
    case "revoked":
      return "مبطلة";
    case "expired":
      return "منتهية";
    case "dry_run_ready":
      return "الفحص الأولي جاهز";
    case "dry_run_failed":
      return "الفحص الأولي لم يكتمل";
    case "committed":
      return "تم الاستيراد";
    case "started":
      return "قيد التشغيل";
    case "completed":
      return "مكتمل";
    case "failed":
      return "فشل";
    default:
      return status;
  }
}

export function PortabilityWorkspace({
  packages,
  importJobs,
  restoreDrills
}: PortabilityWorkspaceProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [packageType, setPackageType] = useState<"json" | "csv">("json");
  const [scope, setScope] = useState<"products" | "reports" | "customers" | "backup">("products");
  const [activeOnly, setActiveOnly] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dryRunResult, setDryRunResult] = useState<ImportResponse | null>(null);
  const [selectedBackupId, setSelectedBackupId] = useState("");
  const [lastExport, setLastExport] = useState<ExportResponse | null>(null);
  const [lastRestore, setLastRestore] = useState<RestoreResponse | null>(null);
  const [actionErrorMessage, setActionErrorMessage] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<RetryAction>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);

  const backupPackages = useMemo(
    () => packages.filter((item) => item.scope === "backup" && item.status === "ready" && !item.is_expired),
    [packages]
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

  function handleCreateExport() {
    clearActionFeedback();
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/export/packages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            package_type: scope === "backup" ? "json" : packageType,
            scope,
            filters: {
              active_only: activeOnly,
              from_date: fromDate || undefined,
              to_date: toDate || undefined
            }
          })
        });

        const envelope = (await response.json()) as StandardEnvelope<ExportResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          failAction(getApiMessage(envelope), "create-export");
          return;
        }

        setLastExport(envelope.data);
        setRetryAction(null);
        toast.success("تم إنشاء حزمة التصدير.");
        router.refresh();
      })();
    });
  }

  function handleRevokePackage(packageId: string) {
    clearActionFeedback();
    startTransition(() => {
      void (async () => {
        const response = await fetch(`/api/export/packages/${packageId}`, {
          method: "PATCH"
        });

        const envelope = (await response.json()) as StandardEnvelope<RevokeResponse>;
        if (!response.ok || !envelope.success) {
          failAction(getApiMessage(envelope), "revoke-package");
          return;
        }

        setConfirmAction(null);
        setRetryAction(null);
        toast.success("تم إبطال حزمة التصدير.");
        router.refresh();
      })();
    });
  }

  async function handleDryRunImport() {
    if (!selectedFile) {
      failAction("اختر ملف JSON أو CSV أولًا.", "dry-run-import");
      return;
    }

    clearActionFeedback();
    const sourceContent = await selectedFile.text();
    const lowerName = selectedFile.name.toLowerCase();
    const sourceFormat = lowerName.endsWith(".json") ? "json" : "csv";

    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/import/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "dry_run",
            source_format: sourceFormat,
            source_content: sourceContent,
            file_name: selectedFile.name
          })
        });

        const envelope = (await response.json()) as StandardEnvelope<ImportResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          failAction(getApiMessage(envelope), "dry-run-import");
          return;
        }

        setDryRunResult(envelope.data);
        setRetryAction(null);
        toast.success("تم فحص ملف المنتجات بنجاح.");
        router.refresh();
      })();
    });
  }

  function handleCommitImport(jobId: string) {
    clearActionFeedback();
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/import/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode: "commit",
            dry_run_job_id: jobId
          })
        });

        const envelope = (await response.json()) as StandardEnvelope<ImportResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          failAction(getApiMessage(envelope), "commit-import");
          return;
        }

        setDryRunResult(envelope.data);
        setConfirmAction(null);
        setRetryAction(null);
        toast.success("تم استيراد المنتجات المعتمدة بنجاح.");
        router.refresh();
      })();
    });
  }

  function handleRestoreDrill() {
    if (!selectedBackupId) {
      failAction("اختر حزمة نسخ احتياطي أولًا.", "restore-drill");
      return;
    }

    clearActionFeedback();
    startTransition(() => {
      void (async () => {
        const response = await fetch("/api/restore/drill", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            backup_id: selectedBackupId,
            target_env: "isolated-drill",
            idempotency_key: crypto.randomUUID()
          })
        });

        const envelope = (await response.json()) as StandardEnvelope<RestoreResponse>;
        if (!response.ok || !envelope.success || !envelope.data) {
          failAction(getApiMessage(envelope), "restore-drill");
          return;
        }

        setLastRestore(envelope.data);
        setConfirmAction(null);
        setRetryAction(null);
        toast.success("تم تشغيل الاستعادة التجريبية.");
        router.refresh();
      })();
    });
  }

  function retryLastAction() {
    switch (retryAction) {
      case "create-export":
        handleCreateExport();
        break;
      case "dry-run-import":
        void handleDryRunImport();
        break;
      case "commit-import":
        if (dryRunResult) {
          handleCommitImport(dryRunResult.job_id);
        }
        break;
      case "restore-drill":
        handleRestoreDrill();
        break;
      case "revoke-package":
        if (confirmAction?.type === "revoke-package") {
          handleRevokePackage(confirmAction.packageId);
        }
        break;
      default:
        break;
    }
  }

  return (
    <section className="workspace-stack">
      <div className="workspace-hero">
        <div>
          <p className="eyebrow">النقل والنسخ</p>
          <h1>مركز النقل والنسخ الاحتياطي</h1>
          <p className="workspace-lead">
            إدارة التصدير والاستيراد والاستعادة التجريبية من مكان واحد، مع صلاحيات واضحة وتنبيه دائم بأن
            الاستعادة تعمل داخل بيئة معزولة فقط.
          </p>
        </div>
      </div>

      {isPending ? (
        <StatusBanner
          variant="info"
          title="جارٍ تنفيذ العملية"
          message="انتظر حتى يكتمل الإجراء الحالي قبل بدء عملية نقل أو استعادة جديدة."
        />
      ) : null}

      {actionErrorMessage ? (
        <StatusBanner
          variant="danger"
          title="تعذر إكمال العملية"
          message={actionErrorMessage}
          actionLabel={retryAction ? "إعادة المحاولة" : undefined}
          onAction={retryAction ? retryLastAction : undefined}
          onDismiss={clearActionFeedback}
        />
      ) : null}

      <section className="workspace-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">الخصوصية والتتبع</p>
            <h2>تحذير تشغيلي</h2>
          </div>
          <AlertTriangle size={18} />
        </div>
        <div className="empty-panel">
          <p>
            كل عملية هنا تُسجل في السجل الإداري، وتولد إشعارًا مناسبًا، وتبقى صالحة لفترة محددة فقط.
            لا تُجرى أي استعادة مباشرة على البيئة الأساسية من هذه الشاشة.
          </p>
        </div>
      </section>

      <div className="detail-grid">
        <section className="workspace-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">التصدير</p>
              <h2>إنشاء حزمة تصدير</h2>
            </div>
            <Download size={18} />
          </div>

          <div className="stack-form">
            <label className="stack-field">
              <span>النطاق</span>
              <select value={scope} onChange={(event) => setScope(event.target.value as typeof scope)}>
                <option value="products">المنتجات</option>
                <option value="reports">التقارير</option>
                <option value="customers">العملاء</option>
                <option value="backup">نسخة احتياطية</option>
              </select>
            </label>

            <label className="stack-field">
              <span>النوع</span>
              <select
                value={scope === "backup" ? "json" : packageType}
                onChange={(event) => setPackageType(event.target.value as typeof packageType)}
                disabled={scope === "backup"}
              >
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </label>

            <label className="stack-field">
              <span>
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(event) => setActiveOnly(event.target.checked)}
                />{" "}
                العناصر النشطة فقط
              </span>
            </label>

            {scope === "reports" ? (
              <>
                <label className="stack-field">
                  <span>من تاريخ</span>
                  <input type="date" value={fromDate} onChange={(event) => setFromDate(event.target.value)} />
                </label>
                <label className="stack-field">
                  <span>إلى تاريخ</span>
                  <input type="date" value={toDate} onChange={(event) => setToDate(event.target.value)} />
                </label>
              </>
            ) : null}

            <button type="button" className="primary-button" disabled={isPending} onClick={handleCreateExport}>
              {isPending ? <Loader2 className="spin" size={16} /> : "إنشاء حزمة"}
            </button>
          </div>

          {lastExport ? (
            <div className="result-card">
              <h3>آخر حزمة</h3>
              <p>الحزمة جاهزة للتنزيل من قائمة الحزم الأخيرة.</p>
              <p>تنتهي الصلاحية: {formatDate(lastExport.expires_at)}</p>
            </div>
          ) : null}
        </section>

        <section className="workspace-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">الاستيراد</p>
              <h2>استيراد المنتجات</h2>
            </div>
            <Upload size={18} />
          </div>

          <div className="stack-form">
            <label className="stack-field">
              <span>ملف JSON أو CSV</span>
              <input
                type="file"
                accept=".json,.csv,text/csv,application/json"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
              />
            </label>

            <button
              type="button"
              className="primary-button"
              disabled={isPending || !selectedFile}
              onClick={() => void handleDryRunImport()}
            >
              {isPending ? <Loader2 className="spin" size={16} /> : "تشغيل الفحص الأولي"}
            </button>
          </div>

          {dryRunResult ? (
            <div className="result-card">
              <h3>نتيجة الاستيراد</h3>
              <p>إجمالي الصفوف: {formatCompactNumber(dryRunResult.rows_total)}</p>
              <p>الصفوف السليمة: {formatCompactNumber(dryRunResult.rows_valid)}</p>
              <p>الصفوف غير السليمة: {formatCompactNumber(dryRunResult.rows_invalid)}</p>
              {dryRunResult.mode === "dry_run" && dryRunResult.rows_invalid === 0 ? (
                <button
                  type="button"
                  className="secondary-button"
                  disabled={isPending}
                  onClick={() => setConfirmAction({ type: "commit-import", jobId: dryRunResult.job_id })}
                >
                  تنفيذ الاستيراد
                </button>
              ) : null}
            </div>
          ) : null}
        </section>
      </div>

      <section className="workspace-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">الاستعادة التجريبية</p>
            <h2>استعادة معزولة</h2>
          </div>
          <ShieldCheck size={18} />
        </div>

        <div className="stack-form">
          <label className="stack-field">
            <span>حزمة النسخ الاحتياطي</span>
            <select value={selectedBackupId} onChange={(event) => setSelectedBackupId(event.target.value)}>
              <option value="">اختر حزمة</option>
              {backupPackages.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.file_name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="primary-button"
            disabled={isPending || !selectedBackupId}
            onClick={() => setConfirmAction({ type: "restore-drill" })}
          >
            {isPending ? <Loader2 className="spin" size={16} /> : "تشغيل الاستعادة التجريبية"}
          </button>
        </div>

        {lastRestore ? (
          <div className="result-card">
            <h3>آخر استعادة تجريبية</h3>
            <p>الحالة: {getStatusLabel(lastRestore.status)}</p>
            <p>الفروق: {formatCompactNumber(lastRestore.drift_count)}</p>
            <p>زمن الاستعادة: {formatCompactNumber(lastRestore.rto_seconds)} ث</p>
          </div>
        ) : null}
      </section>

      <div className="detail-grid">
        <section className="workspace-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">الحزم الأخيرة</p>
              <h2>الحزم الأخيرة</h2>
            </div>
            <Download size={18} />
          </div>

          <div className="stack-list">
            {packages.length === 0 ? (
              <div className="empty-panel">
                <p>لا توجد حزم محفوظة بعد. ابدأ بإنشاء حزمة تصدير لتظهر نتائجها هنا.</p>
              </div>
            ) : (
              packages.map((item) => (
                <article key={item.id} className="list-card">
                  <div className="list-card__header">
                    <strong>{item.file_name}</strong>
                    <span>{getStatusLabel(item.is_expired ? "expired" : item.status)}</span>
                  </div>
                  <p className="workspace-footnote">
                    {item.scope === "backup"
                      ? "نسخة احتياطية"
                      : item.scope === "customers"
                        ? "العملاء"
                        : item.scope === "reports"
                          ? "التقارير"
                          : "المنتجات"}{" "}
                    / {item.package_type.toUpperCase()} / {formatCompactNumber(item.row_count)} سجل
                  </p>
                  <p className="workspace-footnote">ينتهي: {formatDate(item.expires_at)}</p>
                  <div className="inline-actions">
                    <a className="secondary-button" href={`/api/export/packages/${item.id}`}>
                      تنزيل
                    </a>
                    {item.status === "ready" && !item.is_expired ? (
                      <button
                        type="button"
                        className="ghost-button"
                        disabled={isPending}
                        onClick={() => setConfirmAction({ type: "revoke-package", packageId: item.id })}
                      >
                        إبطال
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        <section className="workspace-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">آخر عمليات النقل</p>
              <h2>آخر العمليات</h2>
            </div>
            <ShieldCheck size={18} />
          </div>

          <div className="stack-list">
            {importJobs.map((job) => (
              <article key={job.id} className="list-card">
                <div className="list-card__header">
                  <strong>{job.file_name}</strong>
                  <span>{getStatusLabel(job.status)}</span>
                </div>
                <p className="workspace-footnote">
                  سليم: {formatCompactNumber(job.rows_valid)} / غير سليم: {formatCompactNumber(job.rows_invalid)} /
                  مستورد: {formatCompactNumber(job.rows_committed)}
                </p>
              </article>
            ))}

            {restoreDrills.map((drill) => (
              <article key={drill.id} className="list-card">
                <div className="list-card__header">
                  <strong>{drill.package_file_name ?? "نسخة احتياطية غير معروفة"}</strong>
                  <span>{getStatusLabel(drill.status)}</span>
                </div>
                <p className="workspace-footnote">
                  الفروق: {formatCompactNumber(drill.drift_count ?? 0)} / زمن الاستعادة:{" "}
                  {formatCompactNumber(drill.rto_seconds ?? 0)} ث
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>

      <ConfirmationDialog
        open={confirmAction?.type === "revoke-package"}
        title="إبطال حزمة التصدير"
        description="سيُبطل هذا الإجراء الحزمة الحالية ويمنع تنزيلها لاحقًا. استخدمه فقط إذا انتهت الحاجة إليها أو تغير نطاق البيانات."
        confirmLabel="إبطال الحزمة"
        onConfirm={() => {
          if (confirmAction?.type === "revoke-package") {
            handleRevokePackage(confirmAction.packageId);
          }
        }}
        onCancel={() => setConfirmAction(null)}
        isPending={isPending}
        tone="danger"
      />

      <ConfirmationDialog
        open={confirmAction?.type === "commit-import"}
        title="تأكيد استيراد المنتجات"
        description="سيتحول الفحص الأولي الحالي إلى استيراد فعلي للصفوف السليمة فقط. أكمل العملية بعد مراجعة نتيجة الفحص."
        confirmLabel="تنفيذ الاستيراد"
        onConfirm={() => {
          if (confirmAction?.type === "commit-import") {
            handleCommitImport(confirmAction.jobId);
          }
        }}
        onCancel={() => setConfirmAction(null)}
        isPending={isPending}
      />

      <ConfirmationDialog
        open={confirmAction?.type === "restore-drill"}
        title="تأكيد الاستعادة التجريبية"
        description="سيُشغّل هذا الإجراء استعادة معزولة باستخدام حزمة النسخ الاحتياطي المحددة دون التأثير على البيئة الأساسية."
        confirmLabel="تشغيل الاستعادة"
        onConfirm={handleRestoreDrill}
        onCancel={() => setConfirmAction(null)}
        isPending={isPending}
      />
    </section>
  );
}
