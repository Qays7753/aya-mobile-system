"use client";

import React from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function DashboardError({
  error: _error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="aya-shell">
      <section className="baseline-shell">
        <section className="workspace-panel">
          <div className="empty-panel empty-panel--danger">
            <AlertTriangle size={20} />
            <h2>تعذر تحميل مساحة التشغيل</h2>
            <p>حدث خطأ غير متوقع أثناء تحميل الشاشة الحالية. حاول مجددًا.</p>
            <button type="button" className="primary-button" onClick={() => reset()}>
              <RefreshCcw size={16} />
              إعادة المحاولة
            </button>
          </div>
        </section>
      </section>
    </main>
  );
}
