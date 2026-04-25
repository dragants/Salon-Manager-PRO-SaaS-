"use client";
import { useT } from "@/lib/i18n/locale";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationDropdownPanel } from "@/components/ui/notification-dropdown";
import {
  loadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotifications,
  unreadNotificationCount,
  type AppNotification,
} from "@/lib/notifications-store";

export function NotificationBell() {
  const t = useT();
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
        className="relative size-10 rounded-[var(--smp-radius-md)] border-border bg-card/80 text-foreground shadow-[var(--smp-shadow-soft)] hover:bg-card"
        aria-label="Notifikacije"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-black/35 supports-backdrop-filter:backdrop-blur-sm"
            aria-label={t.notifications.closeNotifications}
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-50 mt-2">
            <NotificationDropdownPanel
              items={items}
              onMarkAllRead={() => {
                markAllNotificationsRead();
                refresh();
              }}
              onItemActivate={(n) => {
                markNotificationRead(n.id);
                refresh();
                setOpen(false);
                if (n.href) {
                  router.push(n.href);
                }
              }}
              footer={{
                href: "/settings?tab=notify",
                label: t.settings.notifications,
                onNavigate: () => setOpen(false),
              }}
              emptyMessage="Još nema obaveštenja. Dodaćemo podsetnike za termine čim podesiš kanale u Podešavanjima."
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
