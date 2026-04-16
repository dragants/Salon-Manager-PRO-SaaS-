const STORAGE_KEY = "salon_cmd_recent_v1";
const MAX = 6;

export type RecentClient = { kind: "client"; id: number; name: string; t: number };
export type RecentCalendar = {
  kind: "calendar";
  href: string;
  label: string;
  t: number;
};
export type RecentEntry = RecentClient | RecentCalendar;

function readAll(): RecentEntry[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const p = JSON.parse(raw) as unknown;
    return Array.isArray(p) ? (p as RecentEntry[]) : [];
  } catch {
    return [];
  }
}

function writeAll(entries: RecentEntry[]) {
  if (typeof window === "undefined") {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.slice(0, MAX)));
}

export function recordRecentClient(id: number, name: string) {
  const t = Date.now();
  const rest = readAll().filter(
    (e) => !(e.kind === "client" && e.id === id)
  );
  writeAll([{ kind: "client", id, name, t }, ...rest]);
}

export function recordRecentCalendar(href: string, label: string) {
  const t = Date.now();
  const rest = readAll().filter(
    (e) => !(e.kind === "calendar" && e.href === href)
  );
  writeAll([{ kind: "calendar", href, label, t }, ...rest]);
}

export function getRecentEntries(): RecentEntry[] {
  return readAll()
    .filter((e) => e && typeof e === "object" && "kind" in e)
    .sort((a, b) => b.t - a.t)
    .slice(0, MAX);
}
