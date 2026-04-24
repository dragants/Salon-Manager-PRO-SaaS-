"use client";

import type React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  CalendarClock,
  CalendarDays,
  CreditCard,
  LayoutDashboard,
  MoreHorizontal,
  Package,
  Settings,
  UserCircle,
  Users,
} from "lucide-react";
import { SpaIcon } from "@/components/icons/spa-icon";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale";

type DockLabelKey = keyof (typeof import("@/lib/i18n/sr"))["sr"]["nav"]["dock"];

type DockItem = {
  href: string;
  labelKey: DockLabelKey;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const primaryDockDef: DockItem[] = [
  { href: "/dashboard", labelKey: "dashboard", icon: LayoutDashboard },
  { href: "/calendar", labelKey: "calendar", icon: CalendarDays },
  { href: "/clients", labelKey: "clients", icon: Users },
  { href: "/services", labelKey: "services", icon: SpaIcon },
];

type MoreItem = {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

const moreRoutesDef: MoreItem[] = [
  { href: "/shifts", labelKey: "shifts", icon: CalendarClock },
  { href: "/supplies", labelKey: "supplies", icon: Package },
  { href: "/analytics", labelKey: "analytics", icon: BarChart3 },
  { href: "/finances", labelKey: "finances", icon: CreditCard },
  { href: "/account", labelKey: "account", icon: UserCircle },
  { href: "/settings", labelKey: "settings", icon: Settings },
];

const moreHrefs = moreRoutesDef.map((r) => r.href);

function pathMatchesDock(href: string, pathname: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileDock() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const t = useT();

  const moreActive = moreHrefs.some((href) => pathMatchesDock(href, pathname));

  const primaryDock = primaryDockDef.map((item) => ({
    ...item,
    label: t.nav.dock[item.labelKey] ?? String(item.labelKey),
  }));

  const moreRoutes = moreRoutesDef.map((item) => ({
    ...item,
    label:
      (t.nav.more as Record<string, string>)[item.labelKey] ?? item.labelKey,
  }));

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 px-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md md:hidden"
        aria-label={t.nav.more.quickNav}
      >
        <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-0.5">
          {primaryDock.map(({ href, label, icon: Icon }) => {
            const active = pathMatchesDock(href, pathname);
            return (
              <li key={href} className="min-w-0 flex-1">
                <Link
                  href={href}
                  className={cn(
                    "flex min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground active:bg-muted"
                  )}
                >
                  <Icon
                    className={cn(
                      "size-5 shrink-0",
                      active ? "text-primary-foreground" : "text-muted-foreground"
                    )}
                    aria-hidden
                  />
                  <span className="truncate">{label}</span>
                </Link>
              </li>
            );
          })}
          <li className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex min-h-12 w-full touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl px-0.5 py-1 text-[10px] font-medium transition-colors",
                moreOpen || moreActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground active:bg-muted"
              )}
              aria-expanded={moreOpen}
              aria-controls="mobile-dock-more-panel"
            >
              <MoreHorizontal
                className={cn(
                  "size-5 shrink-0",
                  moreOpen || moreActive
                    ? "text-primary-foreground"
                    : "text-muted-foreground"
                )}
                aria-hidden
              />
              <span className="truncate">{t.nav.dock.more}</span>
            </button>
          </li>
        </ul>
      </nav>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent
          id="mobile-dock-more-panel"
          showCloseButton
          overlayClassName="z-[100] bg-black/40"
          className={cn(
            "fixed right-0 bottom-0 left-0 top-auto z-[100] max-h-[min(85dvh,520px)] w-full max-w-full translate-x-0 translate-y-0 gap-0 overflow-hidden rounded-t-2xl rounded-b-none border-t p-0 sm:max-w-full",
            "data-closed:slide-out-to-bottom-2 data-open:slide-in-from-bottom-2"
          )}
        >
          <DialogHeader className="border-b border-border px-4 py-3">
            <DialogTitle className="text-base">
              {t.nav.more.moreInApp}
            </DialogTitle>
          </DialogHeader>
          <nav
            className="max-h-[min(60dvh,420px)] overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))] pt-1"
            aria-label={t.nav.more.morePages}
          >
            <ul className="space-y-0.5">
              {moreRoutes.map(({ href, label, icon: Icon }) => {
                const active = pathMatchesDock(href, pathname);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      onClick={() => setMoreOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium no-underline transition-colors",
                        active
                          ? "bg-primary/12 text-primary"
                          : "text-foreground hover:bg-muted/80"
                      )}
                    >
                      <Icon
                        className={cn(
                          "size-5 shrink-0",
                          active ? "text-primary" : "text-muted-foreground"
                        )}
                        aria-hidden
                      />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </DialogContent>
      </Dialog>
    </>
  );
}
