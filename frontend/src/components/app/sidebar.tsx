"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  CreditCard,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { SpaIcon } from "@/components/icons/spa-icon";
import { cn } from "@/lib/utils";
import { clearToken } from "@/lib/auth/token";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import { Button } from "@/components/ui/button";

const allNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Kalendar", icon: CalendarDays },
  { href: "/shifts", label: "Smena", icon: CalendarClock },
  { href: "/clients", label: "Klijenti", icon: Users },
  { href: "/services", label: "Usluge", icon: SpaIcon },
  { href: "/analytics", label: "Analitika", icon: BarChart3 },
  { href: "/finances", label: "Finansije", icon: CreditCard },
  { href: "/account", label: "Moj nalog", icon: UserCircle },
  { href: "/settings", label: "Podešavanja", icon: Settings },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { settings } = useOrganization();
  const [mobileOpen, setMobileOpen] = useState(false);

  const nav = useMemo(() => {
    if (user?.role === "worker") {
      return allNav.filter(
        (item) => item.href !== "/finances" && item.href !== "/shifts"
      );
    }
    return [...allNav];
  }, [user?.role]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function logout() {
    clearToken();
    void refreshUser();
    router.replace("/login");
    router.refresh();
  }

  const initial = user?.email?.trim()?.charAt(0)?.toUpperCase() ?? "?";

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center gap-3 border-b border-sky-100 bg-white px-4 pt-[env(safe-area-inset-top,0px)] md:hidden">
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          className="shrink-0 touch-manipulation"
          onClick={() => setMobileOpen(true)}
          aria-expanded={mobileOpen}
          aria-controls="app-sidebar"
          aria-label="Otvori meni"
        >
          <Menu className="size-5" aria-hidden />
        </Button>
        <Link
          href="/dashboard"
          className="min-w-0 truncate text-base font-semibold text-sky-900"
          onClick={closeMobile}
        >
          Salon Manager{" "}
          <span className="text-xs font-normal text-sky-600">PRO</span>
        </Link>
      </header>

      {mobileOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] md:hidden"
          aria-label="Zatvori meni"
          onClick={closeMobile}
        />
      ) : null}

      <aside
        id="app-sidebar"
        className={cn(
          "flex min-h-0 w-[min(18rem,88vw)] shrink-0 flex-col border-r border-sky-100 bg-white md:relative md:z-auto md:min-h-screen md:w-56",
          "fixed inset-y-0 left-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-transform duration-200 ease-out md:translate-x-0 md:pt-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-start justify-between gap-2 border-b border-sky-100 px-4 py-4 md:block md:py-5">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="text-lg font-semibold text-sky-900"
              onClick={closeMobile}
            >
              Salon Manager
            </Link>
            <p className="text-xs text-sky-600/80">PRO</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-lg"
            className="shrink-0 touch-manipulation md:hidden"
            onClick={closeMobile}
            aria-label="Zatvori meni"
          >
            <X className="size-5" aria-hidden />
          </Button>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto overscroll-contain p-2">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeMobile}
                className={cn(
                  "flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 touch-manipulation md:min-h-0 md:py-2",
                  active
                    ? "bg-blue-100 font-semibold text-blue-700 dark:bg-blue-950/70 dark:text-blue-200"
                    : "text-sky-800/80 hover:bg-gray-100 hover:text-sky-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" aria-hidden />
                {label}
              </Link>
            );
          })}
          {settings?.booking_slug ? (
            <a
              href={`/book/${encodeURIComponent(settings.booking_slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobile}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-sky-800/80 transition-colors duration-200 hover:bg-gray-100 hover:text-sky-950 touch-manipulation md:min-h-0 md:py-2 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
              )}
            >
              <ExternalLink className="size-4 shrink-0 opacity-80" aria-hidden />
              Online rezervacije
            </a>
          ) : null}
        </nav>
        <div className="relative z-10 mt-auto shrink-0 border-t border-sky-100 bg-white pb-[env(safe-area-inset-bottom,0px)]">
          {user ? (
            <div className="flex items-start gap-2 border-b border-sky-50 px-3 py-2">
              <span
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-sky-200 text-xs font-semibold text-sky-900"
                aria-hidden
              >
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-medium uppercase tracking-wide text-sky-600/90">
                  Nalog
                </p>
                <p className="truncate text-xs text-sky-900" title={user.email}>
                  {user.email}
                </p>
              </div>
            </div>
          ) : null}
          <div className="p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-11 w-full touch-manipulation justify-start gap-2 px-3 text-sky-800 hover:bg-sky-50 hover:text-sky-900 md:h-9"
              onClick={logout}
            >
              <LogOut className="size-4 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">Odjava</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
