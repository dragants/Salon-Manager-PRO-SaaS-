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
  Package,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { SpaIcon } from "@/components/icons/spa-icon";
import { LanguageSwitcher } from "@/components/features/settings/LanguageSwitcher";
import { cn } from "@/lib/utils";
import { clearToken } from "@/lib/auth/token";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import { Button } from "@/components/ui/button";
import type React from "react";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{
    className?: string;
    strokeWidth?: number;
    "aria-hidden"?: boolean;
  }>;
  /** Sakrij od radnika (worker). */
  workerHidden?: boolean;
};

const NAV_GROUPS: {
  id: "manage" | "finance" | "settings";
  label: string;
  items: NavItem[];
}[] = [
  {
    id: "manage",
    label: "Upravljanje",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/calendar", label: "Termini", icon: CalendarDays },
      {
        href: "/shifts",
        label: "Smena",
        icon: CalendarClock,
        workerHidden: true,
      },
      { href: "/clients", label: "Klijenti", icon: Users },
      { href: "/services", label: "Usluge", icon: SpaIcon },
      {
        href: "/supplies",
        label: "Materijal",
        icon: Package,
        workerHidden: true,
      },
    ],
  },
  {
    id: "finance",
    label: "Finansije",
    items: [
      {
        href: "/finances",
        label: "Kasa",
        icon: CreditCard,
        workerHidden: true,
      },
      { href: "/analytics", label: "Analitika", icon: BarChart3 },
    ],
  },
  {
    id: "settings",
    label: "Podešavanja",
    items: [
      { href: "/account", label: "Moj nalog", icon: UserCircle },
      { href: "/settings", label: "Podešavanja", icon: Settings },
    ],
  },
] as const;

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const { settings } = useOrganization();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navGroups = useMemo(() => {
    if (user?.role !== "worker") {
      return NAV_GROUPS;
    }
    return NAV_GROUPS.map((g) => ({
      ...g,
      items: g.items.filter((it) => !it.workerHidden),
    }));
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
  const displayName = user?.display_name || user?.email?.split("@")[0] || "";

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* ── Mobile top bar ── */}
      <header className="sticky top-0 z-30 flex min-h-14 shrink-0 items-center gap-3 border-b border-sidebar-border bg-[var(--smp-sidebar)] px-4 pt-[env(safe-area-inset-top,0px)] text-[rgb(var(--sidebar-fg))] md:hidden">
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
          className="font-heading flex min-w-0 items-center gap-2 truncate text-lg font-semibold text-[rgb(var(--sidebar-fg))]"
          onClick={closeMobile}
        >
          <SpaIcon className="size-5 shrink-0 text-[rgb(var(--sidebar-item-active-fg))]" aria-hidden />
          <span className="truncate">
            Salon Manager{" "}
            <span className="font-sans text-xs font-semibold uppercase tracking-wide text-[rgb(var(--sidebar-muted-fg))]">
              PRO
            </span>
          </span>
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

      {/* ── Sidebar ── */}
      <aside
        id="app-sidebar"
        className={cn(
          "flex min-h-0 w-[min(19.5rem,92vw)] shrink-0 flex-col border-r border-sidebar-border bg-[var(--smp-sidebar)] text-sidebar-foreground shadow-[var(--smp-shadow-soft)] md:relative md:z-auto md:min-h-screen md:w-[248px]",
          "fixed inset-y-0 left-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-transform duration-200 ease-out md:translate-x-0 md:pt-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-start justify-between gap-2 border-b border-sidebar-border px-4 py-4 md:block md:py-5">
          <div className="min-w-0">
            <Link
              href="/dashboard"
              className="font-heading flex items-center gap-2 text-xl font-semibold leading-tight text-[rgb(var(--sidebar-fg))]"
              onClick={closeMobile}
            >
              <SpaIcon className="size-6 shrink-0 text-[rgb(var(--sidebar-item-active-fg))]" aria-hidden />
              <span className="truncate">Salon Manager</span>
            </Link>
            <p className="font-sans text-[11px] font-bold uppercase tracking-wider text-[rgb(var(--sidebar-muted-fg))]">
              PRO
            </p>
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
        <nav className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-2 py-3">
          {navGroups.map((group, gi) => (
            <div key={group.id} className="space-y-1.5">
              <p className="px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[rgb(var(--sidebar-muted-fg))]">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ href, label, icon: Icon }) => {
                  const active =
                    pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={href}
                      href={href}
                      onClick={closeMobile}
                      className={cn(
                        "relative flex min-h-11 items-center gap-2.5 rounded-none px-2.5 py-2 font-sans text-sm font-semibold leading-snug tracking-tight transition-colors duration-150 touch-manipulation md:min-h-12 md:rounded-[10px] md:text-base",
                        active
                          ? "font-bold shadow-none before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2.5px] before:rounded-r-sm before:bg-[rgb(var(--sidebar-item-active-fg))] bg-[rgb(var(--sidebar-item-active-bg))] text-[rgb(var(--sidebar-item-active-fg))] dark:before:bg-indigo-400/90"
                          : "text-[rgb(var(--sidebar-fg))] hover:bg-[rgb(var(--sidebar-active)/0.08)] hover:text-[rgb(var(--sidebar-hover-fg))]"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-[1.125rem] shrink-0 md:size-5",
                          active ? "opacity-100" : "opacity-70"
                        )}
                        strokeWidth={active ? 2.25 : 2}
                        aria-hidden
                      />
                      {label}
                    </Link>
                  );
                })}
              </div>
              {gi < navGroups.length - 1 ? (
                <div
                  className="mx-2.5 h-px bg-[rgb(var(--sidebar-border))] opacity-70"
                  aria-hidden
                />
              ) : null}
            </div>
          ))}
          {settings?.booking_slug ? (
            <a
              href={`/book/${encodeURIComponent(settings.booking_slug)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={closeMobile}
              className={cn(
                "mt-1.5 flex min-h-11 items-center gap-2.5 rounded-[10px] px-2.5 py-2 font-sans text-sm font-semibold leading-snug tracking-tight text-[rgb(var(--sidebar-fg))] opacity-90 transition-colors duration-150 hover:bg-[rgb(var(--sidebar-active)/0.07)] hover:text-[rgb(var(--sidebar-hover-fg))] touch-manipulation md:min-h-12 md:text-base"
              )}
            >
              <ExternalLink
                className="size-[1.125rem] shrink-0 opacity-85 md:size-5"
                strokeWidth={2}
                aria-hidden
              />
              Online rezervacije
            </a>
          ) : null}
        </nav>
        <div className="relative z-10 mt-auto shrink-0 border-t border-sidebar-border bg-[var(--smp-sidebar)] pb-[env(safe-area-inset-bottom,0px)]">
          {user ? (
            <div className="flex items-start gap-2 border-b border-sidebar-border px-3 py-2">
              <span
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground"
                aria-hidden
              >
                {initial}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[rgb(var(--sidebar-muted-fg))]">
                  Nalog
                </p>
                {displayName ? (
                  <p className="truncate text-xs font-semibold text-[rgb(var(--sidebar-fg))]">
                    {displayName}
                  </p>
                ) : null}
                <p
                  className="truncate text-[11px] text-[rgb(var(--sidebar-muted-fg))]"
                  title={user.email}
                >
                  {user.email}
                </p>
              </div>
              <LanguageSwitcher
                compact
                className="shrink-0 text-[rgb(var(--sidebar-fg))]"
              />
            </div>
          ) : null}
          <div className="p-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="min-h-10 w-full touch-manipulation justify-start gap-2.5 px-2.5 font-sans text-sm font-semibold text-[rgb(var(--sidebar-fg))] hover:bg-[rgb(var(--sidebar-active)/0.07)] hover:text-[rgb(var(--sidebar-hover-fg))] md:text-[0.9rem]"
              onClick={logout}
            >
              <LogOut
                className="size-[1.125rem] shrink-0 opacity-85 md:size-[1.15rem]"
                strokeWidth={2}
                aria-hidden
              />
              <span className="truncate">Odjava</span>
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
