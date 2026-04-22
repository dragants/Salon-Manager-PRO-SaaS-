import type { Client } from "@/types/client";

export type ClientLastVisitFilter = "any" | "never" | "30d" | "90d" | "365d";
export type ClientLoyaltyFilter =
  | "any"
  | "none"
  | "has_stamps"
  | "has_reward";
export type ClientSpentFilter = "any" | "zero" | "low" | "mid" | "high";

export type ClientDirectoryFilters = {
  lastVisit: ClientLastVisitFilter;
  loyalty: ClientLoyaltyFilter;
  totalSpent: ClientSpentFilter;
};

export const defaultClientDirectoryFilters: ClientDirectoryFilters = {
  lastVisit: "any",
  loyalty: "any",
  totalSpent: "any",
};

function numSpent(c: Client): number {
  const v = c.total_spent;
  if (v == null) return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const n = Number.parseFloat(String(v));
  return Number.isFinite(n) ? n : 0;
}

function stampsTotal(c: Client): number {
  const s = c.loyalty_stamps;
  if (s == null) return 0;
  return typeof s === "number" ? s : Number(s) || 0;
}

function rewardsTotal(c: Client): number {
  const s = c.loyalty_rewards;
  if (s == null) return 0;
  return typeof s === "number" ? s : Number(s) || 0;
}

function lastVisitDate(c: Client): Date | null {
  const raw = c.last_visit_at;
  if (raw == null || String(raw).trim() === "") return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function matchesLastVisit(c: Client, f: ClientLastVisitFilter): boolean {
  if (f === "any") return true;
  const last = lastVisitDate(c);
  if (f === "never") return last == null;
  if (last == null) return false;
  const now = startOfDay(new Date());
  const days = (now.getTime() - startOfDay(last).getTime()) / 86_400_000;
  if (f === "30d") return days <= 30;
  if (f === "90d") return days <= 90;
  if (f === "365d") return days <= 365;
  return true;
}

function matchesLoyalty(c: Client, f: ClientLoyaltyFilter): boolean {
  if (f === "any") return true;
  const st = stampsTotal(c);
  const rw = rewardsTotal(c);
  if (f === "none") return st === 0 && rw === 0;
  if (f === "has_stamps") return st > 0;
  if (f === "has_reward") return rw > 0;
  return true;
}

function matchesSpent(c: Client, f: ClientSpentFilter): boolean {
  if (f === "any") return true;
  const n = numSpent(c);
  if (f === "zero") return n <= 0;
  if (f === "low") return n > 0 && n <= 20_000;
  if (f === "mid") return n > 20_000 && n <= 100_000;
  if (f === "high") return n > 100_000;
  return true;
}

export function filterClientsByQuery(rows: Client[], q: string): Client[] {
  const s = q.trim().toLowerCase();
  if (!s) return rows;
  return rows.filter((c) => {
    const name = (c.name ?? "").toLowerCase();
    const phone = (c.phone ?? "").toLowerCase();
    const em = (c.email ?? "").toLowerCase();
    const notes = (c.notes ?? "").toLowerCase();
    return (
      name.includes(s) ||
      phone.includes(s) ||
      em.includes(s) ||
      notes.includes(s)
    );
  });
}

export function applyClientDirectoryFilters(
  rows: Client[],
  filters: ClientDirectoryFilters,
  options: { showFinancial: boolean }
): Client[] {
  return rows.filter((c) => {
    if (!matchesLastVisit(c, filters.lastVisit)) return false;
    if (!matchesLoyalty(c, filters.loyalty)) return false;
    if (options.showFinancial && !matchesSpent(c, filters.totalSpent)) {
      return false;
    }
    return true;
  });
}
