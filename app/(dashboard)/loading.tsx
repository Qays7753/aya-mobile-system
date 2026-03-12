import React from "react";

export default function DashboardLoading() {
  return (
    <main className="aya-shell">
      <section className="baseline-shell">
        <div className="dashboard-loading">
          <aside className="dashboard-loading__sidebar workspace-panel">
            <div className="skeleton-line skeleton-line--lg" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
            <div className="skeleton-line" />
          </aside>

          <div className="dashboard-loading__content">
            <section className="workspace-panel">
              <div className="skeleton-line skeleton-line--xl" />
              <div className="skeleton-line skeleton-line--lg" />
              <div className="skeleton-line" />
            </section>

            <section className="workspace-panel">
              <div className="skeleton-grid">
                <div className="skeleton-card" />
                <div className="skeleton-card" />
                <div className="skeleton-card" />
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
