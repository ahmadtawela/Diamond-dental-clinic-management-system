import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Users, CalendarDays, BarChart3, UserCog, LogOut, Menu, X, Languages } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useLocale } from "../context/LocaleContext";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: BarChart3, roles: ["receptionist"] },
  { to: "/patients", label: "Patients", icon: Users, roles: ["admin", "doctor", "receptionist"] },
  { to: "/appointments", label: "Appointments", icon: CalendarDays, roles: ["admin", "doctor", "receptionist"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["admin"] },
  { to: "/users", label: "Users", icon: UserCog, roles: ["admin"] },
];

export default function Layout() {
  const { user, role, logout } = useAuth();
  const { language, t, toggleLanguage } = useLocale();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 1024px)").matches
  );

  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      setSidebarOpen(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    function closeOnMobileResize() {
      if (!window.matchMedia("(min-width: 1024px)").matches) {
        setSidebarOpen(false);
      }
    }

    window.addEventListener("resize", closeOnMobileResize);
    return () => window.removeEventListener("resize", closeOnMobileResize);
  }, []);

  useEffect(() => {
    if (!sidebarOpen) return undefined;

    function closeOnEscape(event) {
      if (event.key === "Escape") setSidebarOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [sidebarOpen]);

  return (
    <div className="flex h-dvh overflow-hidden bg-bg">
      {sidebarOpen && (
        <button
          type="button"
          aria-label={t("Close navigation")}
          className="fixed inset-0 z-30 bg-ink/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        id="primary-navigation"
        className={`app-sidebar fixed inset-y-0 z-40 flex w-60 flex-col bg-sidebar transition-transform duration-200 lg:relative lg:inset-auto lg:shrink-0 lg:translate-x-0 lg:transition-[width] ${
          sidebarOpen ? "sidebar-open lg:w-60" : "sidebar-closed lg:w-0 lg:overflow-hidden"
        }`}
        aria-hidden={!sidebarOpen}
      >
        <div className="flex w-60 items-center gap-2 px-5 py-5">
          <span className="h-3 w-3 rotate-45 shrink-0 bg-sidebar-accent" />
          <span className="font-display text-lg font-semibold tracking-tight text-white">Diamond</span>
        </div>
        <nav className="w-60 flex-1 space-y-1 px-3" aria-label={t("Primary navigation")}>
          {NAV.filter((item) => item.roles.includes(role)).map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              tabIndex={sidebarOpen ? undefined : -1}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-active text-white"
                    : "text-sidebar-text hover:bg-sidebar-active/60 hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {t(label)}
            </NavLink>
          ))}
        </nav>
        <div className="mx-3 border-t border-white/10 px-3 pb-4 pt-2">
          <div className="px-0 py-3">
            <p className="truncate text-sm font-medium text-white">{user?.full_name}</p>
            <p className="text-xs capitalize text-sidebar-text">{t(role)}</p>
          </div>
          <button
            onClick={logout}
            tabIndex={sidebarOpen ? undefined : -1}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-sidebar-text transition-colors hover:bg-sidebar-active/60 hover:text-white"
          >
            <LogOut className="h-4 w-4" strokeWidth={1.75} />
            {t("Log out")}
          </button>
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
        <header className="sticky top-0 z-20 flex min-h-14 items-center gap-3 border-b border-border bg-white/95 px-4 py-2 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? t("Hide navigation") : t("Show navigation")}
            aria-controls="primary-navigation"
            aria-expanded={sidebarOpen}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded text-ink-secondary transition-colors hover:bg-bg hover:text-ink"
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <span className="font-display text-sm font-semibold text-ink sm:text-base">{t("Diamond Clinic")}</span>
          <button
            type="button"
            onClick={toggleLanguage}
            className="ms-auto inline-flex h-10 items-center gap-2 rounded px-3 text-sm font-medium text-ink-secondary transition-colors hover:bg-bg hover:text-ink"
            aria-label={language === "ar" ? "Switch language to English" : "التبديل إلى العربية"}
          >
            <Languages className="h-4 w-4" />
            {language === "ar" ? "English" : "العربية"}
          </button>
        </header>
        <div className="mx-auto w-full max-w-5xl px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
