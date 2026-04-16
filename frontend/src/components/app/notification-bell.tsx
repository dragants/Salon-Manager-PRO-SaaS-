"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
  unreadNotificationCount,
  type AppNotification,
} from "@/lib/notifications-store";

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);

  function refresh() {
    setItems(loadNotifications());
  }

  useEffect(() => {
    queueMicrotask(() => refresh());
    return subscribeNotifications(() => queueMicrotask(() => refresh()));
  }, []);

  const unread = unreadNotificationCount();

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative size-10 rounded-xl border-zinc-200 bg-white text-zinc-700 shadow-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
        aria-label="Notifikacije"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default"
            aria-label="Zatvori notifikacije"
            onClick={() => setOpen(false)}
          />
          <div
            className={cn(
              "absolute right-0 z-50 mt-2 w-[min(calc(100vw-2rem),22rem)] overflow-hidden rounded-xl border border-zinc-200/90 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.12)] dark:border-zinc-700 dark:bg-zinc-900"
            )}
          >
            <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Obaveštenja
              </p>
              {items.some((i) => !i.read) ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-sky-700 hover:underline dark:text-sky-400"
                  onClick={() => {
                    markAllNotificationsRead();
                    refresh();
                  }}
                >
                  <CheckCheck className="size-3.5" aria-hidden />
                  Označi sve
                </button>
              ) : null}
            </div>
            <ul className="max-h-[min(70vh,320px)] overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  Još nema obaveštenja. Dodaćemo podsetnike za termine čim
                  podesiš kanale u Podešavanjima.
                </li>
              ) : (
                items.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "border-b border-zinc-50 last:border-0 dark:border-zinc-800/80",
                      !n.read && "bg-sky-50/50 dark:bg-sky-950/20"
                    )}
                  >
                    <button
                      type="button"
                      className="flex w-full flex-col gap-0.5 px-3 py-2.5 text-left text-sm transition hover:bg-zinc-50 dark:hover:bg-zinc-800/80"
                      onClick={() => {
                        markNotificationRead(n.id);
                        refresh();
                        setOpen(false);
                        if (n.href) {
                          router.push(n.href);
                        }
                      }}
                    >
                      <span className="font-medium text-zinc-900 dark:text-zinc-50">
                        {n.title}
                      </span>
                      <span className="text-xs text-zinc-600 dark:text-zinc-400">
                        {n.body}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {new Intl.DateTimeFormat("sr-Latn-RS", {
                          dateStyle: "short",
                          timeStyle: "short",
                        }).format(new Date(n.at))}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
            <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-800">
              <Link
                href="/settings?tab=notify"
                className="text-xs font-medium text-sky-700 hover:underline dark:text-sky-400"
                onClick={() => setOpen(false)}
              >
                Podešavanja obaveštenja →
              </Link>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
