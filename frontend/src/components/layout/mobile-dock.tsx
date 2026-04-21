"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  LayoutDashboard,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { sr } from "@/lib/i18n/sr";

const dockItems = [
  { href: "/dashboard", label: sr.nav.dock.home, icon: LayoutDashboard },
  { href: "/calendar", label: sr.nav.dock.calendar, icon: CalendarDays },
  { href: "/clients", label: sr.nav.dock.clients, icon: Users },
  { href: "/settings", label: sr.nav.dock.settings, icon: Settings },
] as const;

export function MobileDock() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200/90 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom,0px))] pt-1 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95 md:hidden"
      aria-label="Brza navigacija"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-between gap-1">
        {dockItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                className={cn(
                  "flex min-h-12 touch-manipulation flex-col items-center justify-center gap-0.5 rounded-xl px-1 py-1 text-[10px] font-medium transition-colors",
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
      </ul>
    </nav>
  );
}
