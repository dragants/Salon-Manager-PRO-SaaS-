export type AppNotification = {
  id: string;
  title: string;
  body: string;
  at: number;
  read: boolean;
  href?: string;
};

const STORAGE_KEY = "salon_inapp_notifications_v1";
const MAX_ITEMS = 30;
const CHANGE_EVENT = "salon-app-notifications";

function readAll(): AppNotification[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as AppNotification[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: AppNotification[]) {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function subscribeNotifications(cb: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }
  window.addEventListener(CHANGE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(CHANGE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

export function loadNotifications(): AppNotification[] {
  return readAll().sort((a, b) => b.at - a.at);
}

export function unreadNotificationCount(): number {
  return loadNotifications().filter((n) => !n.read).length;
}

export function notifyApp(payload: {
  title: string;
  body: string;
  href?: string;
}): void {
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  const next: AppNotification = {
    id,
    title: payload.title,
    body: payload.body,
    href: payload.href,
    at: Date.now(),
    read: false,
  };
  writeAll([next, ...readAll()]);
}

export function markNotificationRead(id: string): void {
  writeAll(
    readAll().map((n) => (n.id === id ? { ...n, read: true } : n))
  );
}

export function markAllNotificationsRead(): void {
  writeAll(readAll().map((n) => ({ ...n, read: true })));
}
