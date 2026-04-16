"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarPlus,
  ChevronDown,
  Command,
  LogOut,
  Settings,
  UserCircle,
  UserPlus,
  Wrench,
} from "lucide-react";
import { useAppShell } from "@/components/app/app-shell-provider";
import { NotificationBell } from "@/components/app/notification-bell";
import { DashboardThemeToggle } from "@/components/dashboard/dashboard-theme-toggle";
import { Button, buttonVariants } from "@/components/ui/button";
import { clearToken } from "@/lib/auth/token";
import { formatYyyyMmDd, todayLocal } from "@/lib/dateLocal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

function userInitials(email: string | undefined): string {
  if (!email?.trim()) return "?";
  const local = email.split("@")[0] ?? "";
  const clean = local.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length >= 2) {
    return (clean[0] + clean[1]).toUpperCase();
  }
  return email.charAt(0).toUpperCase();
}

export function AppTopBar() {
  const router = useRouter();
  const shell = useAppShell();
  const { user, refreshUser } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!menuOpen) {
      return;
    }
    function onDocClick(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [menuOpen]);

  function logout() {
    clearToken();
    void refreshUser();
    setMenuOpen(false);
    router.replace("/login");
    router.refresh();
  }

  if (!user) {
    return null;
  }

  const todayYmd = formatYyyyMmDd(todayLocal());
  const weekCal = `/calendar?day=${encodeURIComponent(todayYmd)}&view=week`;

  return (
    <header
      className={cn(
        "sticky top-0 z-20 hidden w-full shrink-0 items-center justify-between gap-4 border-b border-zinc-200/90 bg-white/85 px-6 py-3 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/90 md:flex"
      )}
    >
      <Link
        href="/dashboard"
        className="font-heading text-lg font-semibold tracking-tight text-zinc-900 transition-transform duration-200 ease-out hover:scale-[1.02] dark:text-zinc-50"
      >
        Salon Manager{" "}
        <span className="text-xs font-sans font-normal text-zinc-500 dark:text-zinc-400">
          PRO
        </span>
      </Link>

      <div className="mx-4 hidden min-w-0 flex-1 items-center justify-center gap-2 lg:flex">
        <Link
          href={weekCal}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-xl border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm no-underline dark:border-zinc-700 dark:bg-zinc-900/80"
          )}
        >
          <CalendarPlus className="size-3.5" aria-hidden />
          Rezervacija
        </Link>
        <Link
          href="/clients?new=1"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-xl border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm no-underline dark:border-zinc-700 dark:bg-zinc-900/80"
          )}
        >
          <UserPlus className="size-3.5" aria-hidden />
          Klijent
        </Link>
        <Link
          href="/services?new=1"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "rounded-xl border-zinc-200 bg-white/80 shadow-sm backdrop-blur-sm no-underline dark:border-zinc-700 dark:bg-zinc-900/80"
          )}
        >
          <Wrench className="size-3.5" aria-hidden />
          Usluga
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-xl text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
          onClick={() => shell?.openCommandPalette()}
          aria-label="Komandna paleta (Ctrl+K)"
        >
          <Command className="size-4" aria-hidden />
          <span className="hidden xl:inline">Pretraga</span>
          <kbd className="ml-1 hidden rounded border border-zinc-200 bg-zinc-100 px-1 font-mono text-[10px] font-normal text-zinc-500 xl:inline dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
            ⌘K
          </kbd>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <DashboardThemeToggle className="size-10 rounded-xl border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white py-1.5 pl-2 pr-2.5 text-left shadow-sm transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
          >
            <span
              className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-xs font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
              aria-hidden
            >
              {userInitials(user.email)}
            </span>
            <span className="max-w-[10rem] truncate text-xs font-medium text-zinc-700 dark:text-zinc-200">
              {user.email}
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-zinc-400 transition",
                menuOpen && "rotate-180"
              )}
              aria-hidden
            />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-zinc-200/90 bg-white py-1 shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:border-zinc-700 dark:bg-zinc-900"
            >
              <Link
                href="/account"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setMenuOpen(false)}
              >
                <UserCircle className="size-4 opacity-70" aria-hidden />
                Moj nalog
              </Link>
              <Link
                href="/settings"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-800"
                onClick={() => setMenuOpen(false)}
              >
                <Settings className="size-4 opacity-70" aria-hidden />
                Podešavanja
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                onClick={logout}
              >
                <LogOut className="size-4 opacity-70" aria-hidden />
                Odjava
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
