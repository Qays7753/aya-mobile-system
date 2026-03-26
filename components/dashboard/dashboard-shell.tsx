"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  BriefcaseBusiness,
  ChartColumn,
  ChevronLeft,
  FileArchive,
  HandCoins,
  Home,
  LayoutDashboard,
  Menu,
  Package,
  PackageSearch,
  ReceiptText,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Wrench,
  X
} from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

type DashboardNavGroup = "daily" | "operations" | "management";

type DashboardNavItem = {
  href: string;
  label: string;
  description: string;
  icon: string;
  group: DashboardNavGroup;
};

type DashboardShellProps = {
  accountLabel: string;
  homeHref: string;
  isAuthenticated: boolean;
  navigation: DashboardNavItem[];
  unreadNotifications: number;
  children: ReactNode;
  roleLabel: string;
};

const GROUP_LABELS: Record<DashboardNavGroup, string> = {
  daily: "التشغيل اليومي",
  operations: "المخزون والخدمات",
  management: "المتابعة والإدارة"
};

const ICONS = {
  pos: ShoppingCart,
  products: Package,
  expenses: HandCoins,
  inventory: PackageSearch,
  suppliers: Store,
  operations: HandCoins,
  maintenance: Wrench,
  invoices: ReceiptText,
  debts: BriefcaseBusiness,
  reports: ChartColumn,
  portability: FileArchive,
  notifications: Bell,
  settings: Settings
} as const;

function getIcon(icon: DashboardNavItem["icon"]) {
  return ICONS[icon as keyof typeof ICONS] ?? LayoutDashboard;
}

function getPageContext(pathname: string, navigation: DashboardNavItem[]) {
  const item = [...navigation]
    .sort((left, right) => right.href.length - left.href.length)
    .find((entry) => entry.href !== "/" && (pathname === entry.href || pathname.startsWith(`${entry.href}/`)));

  if (!item) {
    return {
      title: "مساحات التشغيل",
      groupLabel: "لوحة العمل"
    };
  }

  return {
    title: item.label,
    groupLabel: GROUP_LABELS[item.group]
  };
}

export function DashboardShell({
  accountLabel,
  homeHref,
  isAuthenticated,
  navigation,
  unreadNotifications,
  children,
  roleLabel
}: DashboardShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const groupedNavigation = useMemo(() => {
    return navigation.reduce<Record<DashboardNavGroup, DashboardNavItem[]>>(
      (current, item) => {
        current[item.group].push(item);
        return current;
      },
      { daily: [], operations: [], management: [] }
    );
  }, [navigation]);

  const pageContext = useMemo(() => getPageContext(pathname, navigation), [navigation, pathname]);

  function closeMenu() {
    setIsMenuOpen(false);
  }

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      router.push("/notifications");
      closeMenu();
      setIsSearchOpen(false);
      return;
    }

    const params = new URLSearchParams({
      q: trimmed,
      entity: "all",
      limit: "8",
      status: "all",
      page: "1",
      page_size: "20"
    });

    router.push(`/notifications?${params.toString()}`);
    closeMenu();
    setIsSearchOpen(false);
  }

  return (
    <div className="dashboard-shell dashboard-shell--sidebar">
      <div
        className={isMenuOpen ? "dashboard-mobile-backdrop is-open" : "dashboard-mobile-backdrop"}
        onClick={closeMenu}
        aria-hidden="true"
      />

      <aside className={isMenuOpen ? "dashboard-sidebar is-open" : "dashboard-sidebar"}>
        <div className="dashboard-sidebar__brand">
          <Link href={homeHref} className="dashboard-brandmark" onClick={closeMenu}>
            <span className="dashboard-brandmark__logo">Aya</span>
            <span className="dashboard-brandmark__copy">
              <strong>Aya Mobile</strong>
              <small>{roleLabel}</small>
            </span>
          </Link>

          <button type="button" className="icon-button dashboard-menu-close" onClick={closeMenu} aria-label="إغلاق القائمة">
            <X size={18} />
          </button>
        </div>

        <nav className="dashboard-sidebar__nav" aria-label="التنقل داخل مساحات التشغيل">
          {(Object.keys(groupedNavigation) as DashboardNavGroup[]).map((groupKey) =>
            groupedNavigation[groupKey].length > 0 ? (
              <section key={groupKey} className="dashboard-nav-group">
                <div className="dashboard-nav-group__header">
                  <p className="dashboard-nav-group__title">{GROUP_LABELS[groupKey]}</p>
                </div>

                <div className="dashboard-nav-group__items">
                  {groupedNavigation[groupKey].map((item) => {
                    const isActive =
                      item.href === "/notifications"
                        ? pathname === item.href || pathname.startsWith("/notifications")
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    const Icon = getIcon(item.icon);

                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={isActive ? "dashboard-nav__item is-active" : "dashboard-nav__item"}
                        aria-current={isActive ? "page" : undefined}
                        onClick={closeMenu}
                      >
                        <span className="dashboard-nav__icon">
                          <Icon size={18} />
                        </span>

                        <span className="dashboard-nav__content">
                          <strong>
                            {item.label}
                            {item.href === "/notifications" && unreadNotifications > 0 ? (
                              <span className="dashboard-nav__badge">{unreadNotifications}</span>
                            ) : null}
                          </strong>
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            ) : null
          )}
        </nav>

        <div className="dashboard-sidebar__footer">
          {isAuthenticated ? (
            <LogoutButton />
          ) : (
            <Link href="/" className="secondary-button" onClick={closeMenu}>
              تسجيل الدخول
            </Link>
          )}
        </div>
      </aside>

      <div className="dashboard-content">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar__context">
            <button
              type="button"
              className="icon-button dashboard-menu-toggle"
              onClick={() => setIsMenuOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu size={18} />
            </button>

            <div className="dashboard-header-title">
              <h1>{pageContext.title}</h1>
              {pageContext.groupLabel !== "لوحة العمل" && (
                 <span className="status-pill status-pill--neutral dashboard-header-badge">{pageContext.groupLabel}</span>
              )}
            </div>
          </div>

          <div className="dashboard-topbar__actions">
             {isSearchOpen ? (
                 <form className="dashboard-quick-search-minimal" onSubmit={handleSearchSubmit}>
                    <Search size={16} className="search-icon" />
                    <input
                      type="search"
                      placeholder="بحث..."
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      autoFocus
                      onBlur={() => !searchQuery && setIsSearchOpen(false)}
                    />
                 </form>
             ) : (
                 <button
                    type="button"
                    className="icon-button ghost-button search-toggle"
                    onClick={() => setIsSearchOpen(true)}
                    aria-label="بحث"
                 >
                    <Search size={18} />
                 </button>
             )}
          </div>
        </header>

        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
