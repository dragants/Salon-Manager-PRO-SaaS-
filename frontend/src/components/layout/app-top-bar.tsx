"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  CalendarPlus,
  ChevronDown,
  LogOut,
  Search,
  Settings,
  UserCircle,
  UserPlus,
  Wrench,
} from "lucide-react";
import { useAppShell } from "@/components/layout/app-shell-provider";
import { NotificationBell } from "@/components/layout/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { clearToken } from "@/lib/auth/token";
import { formatYyyyMmDd, todayLocal } from "@/lib/dateLocal";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

/** Brza akcija u headeru: uvek čitljiv tekst + oštra ikonica, hover preko primary. */
const topBarQuickLinkClass = cn(
  "group inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[var(--lux-radius-md)] border px-3",
  "border-primary/25 bg-background text-sm font-semibold text-foreground shadow-sm",
  "no-underline outline-none transition-all duration-150 ease-out",
  "hover:border-primary hover:bg-primary/10 hover:shadow-md",
  "active:scale-[0.98]",
  "focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
);

const topBarIconClass =
  "size-4 shrink-0 text-primary transition-colors group-hover:text-primary";

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
  const [modKey, setModKey] = useState("Ctrl");
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined") {
      return;
    }
    setModKey(/Mac|iPhone|iPad|iPod/i.test(navigator.platform) ? "⌘" : "Ctrl");
  }, []);

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
        "sticky top-0 z-20 hidden h-[72px] min-h-[72px] w-full shrink-0 items-center justify-between gap-4 border-b border-border bg-card px-6 py-0 text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.06)] backdrop-blur-md dark:bg-card/95 md:flex"
      )}
    >
      <Link
        href="/dashboard"
        className="font-heading text-lg font-semibold tracking-tight text-foreground transition-colors duration-200 hover:text-primary"
      >
        Salon Manager{" "}
        <span className="text-xs font-sans font-normal text-muted-foreground">
          PRO
        </span>
      </Link>

      <div className="mx-4 hidden min-w-0 flex-1 items-center justify-center gap-2 lg:flex">
        <Link href={weekCal} className={topBarQuickLinkClass}>
          <CalendarPlus
            className={topBarIconClass}
            strokeWidth={2.25}
            aria-hidden
          />
          Rezervacija
        </Link>
        <Link href="/clients?new=1" className={topBarQuickLinkClass}>
          <UserPlus
            className={topBarIconClass}
            strokeWidth={2.25}
            aria-hidden
          />
          Klijent
        </Link>
        <Link href="/services?new=1" className={topBarQuickLinkClass}>
          <Wrench
            className={topBarIconClass}
            strokeWidth={2.25}
            aria-hidden
          />
          Usluga
        </Link>
        <button
          type="button"
          onClick={() => shell?.openCommandPalette()}
          title="Brza pretraga: klijenti, usluge, navigacija (Ctrl+K ili Cmd+K)"
          aria-label="Otvori brzu pretragu i komandnu paletu. Prečica: Control+K ili Command+K"
          className={cn(
            "group flex h-10 min-w-[min(100%,240px)] max-w-md flex-1 items-center gap-2.5 rounded-[var(--lux-radius-md)] border border-primary/25 bg-background px-3 text-left text-sm font-medium shadow-sm outline-none transition-all duration-150 ease-out",
            "text-foreground hover:border-primary hover:bg-primary/10 hover:shadow-md",
            "focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          )}
        >
          <Search
            className={topBarIconClass}
            strokeWidth={2.25}
            aria-hidden
          />
          <span className="min-w-0 flex-1 truncate text-foreground">
            Pretraga, klijenti, akcije…
          </span>
          <span
            className="hidden shrink-0 items-center gap-0.5 sm:inline-flex"
            aria-hidden
          >
            <kbd className="rounded border border-primary/20 bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground shadow-sm">
              {modKey}
            </kbd>
            <kbd className="rounded border border-primary/20 bg-muted/80 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-foreground shadow-sm">
              K
            </kbd>
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <NotificationBell />

        <ThemeToggle className="size-10" />

        <div className="relative" ref={menuRef}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-[var(--lux-radius-md)] border border-primary/25 bg-background py-1.5 pl-2 pr-2.5 text-left shadow-sm transition hover:border-primary hover:bg-primary/10 hover:shadow-md"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((o) => !o);
            }}
          >
            <span
              className="flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-semibold text-primary-foreground"
              aria-hidden
            >
              {userInitials(user.email)}
            </span>
            <span className="max-w-[10rem] truncate text-xs font-medium text-foreground">
              {user.email}
            </span>
            <ChevronDown
              className={cn(
                "size-4 shrink-0 text-primary transition-transform",
                menuOpen && "rotate-180"
              )}
              strokeWidth={2.25}
              aria-hidden
            />
          </button>

          {menuOpen ? (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-52 overflow-hidden rounded-[var(--lux-radius-lg)] border border-border bg-card py-1 shadow-[var(--lux-shadow-hover)]"
            >
              <Link
                href="/account"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted/80"
                onClick={() => setMenuOpen(false)}
              >
                <UserCircle
                  className="size-4 text-primary"
                  strokeWidth={2}
                  aria-hidden
                />
                Moj nalog
              </Link>
              <Link
                href="/settings"
                role="menuitem"
                className="flex items-center gap-2 px-3 py-2.5 text-sm text-foreground hover:bg-muted/80"
                onClick={() => setMenuOpen(false)}
              >
                <Settings
                  className="size-4 text-primary"
                  strokeWidth={2}
                  aria-hidden
                />
                Podešavanja
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10"
                onClick={logout}
              >
                <LogOut className="size-4" strokeWidth={2} aria-hidden />
                Odjava
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
