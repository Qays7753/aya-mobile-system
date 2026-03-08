import Link from "next/link";
import type { ReactNode } from "react";

const navigation = [
  { href: "/pos", label: "POS" },
  { href: "/products", label: "المنتجات" },
  { href: "/", label: "الصفحة الرئيسية" }
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">PX-03 / Sales Core Slice</p>
          <h1>Aya Mobile Workspace</h1>
        </div>

        <nav className="dashboard-nav" aria-label="workspace navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href} className="dashboard-nav__link">
              {item.label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="dashboard-main">{children}</main>
    </div>
  );
}
