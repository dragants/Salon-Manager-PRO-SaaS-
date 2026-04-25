/**
 * Dashboard page utilities — pure functions, no React.
 * Extracted from dashboard/page.tsx for reuse and testability.
 */

import type { AppointmentRow } from "@/types/appointment";
import type { Service } from "@/types/service";

export const DEFAULT_TZ = "Europe/Belgrade";

export function orgTimeZone(settingsTz: string | null | undefined): string {
  return settingsTz?.trim() ? settingsTz.trim() : DEFAULT_TZ;
}

export function todayYmdInTz(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function todayHeadingInTz(timeZone: string): string {
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function greeting(t: {
  morning: string;
  afternoon: string;
  evening: string;
}): string {
  const h = new Date().getHours();
  if (h < 12) return t.morning;
  if (h < 18) return t.afternoon;
  return t.evening;
}

export function displayNameFromEmail(email: string | undefined): string {
  if (!email?.trim()) return "";
  const local = email.split("@")[0] ?? "";
  const part = local.split(/[._-]/)[0] ?? local;
  if (!part) return email;
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

export function emailLocalPart(email: string | undefined): string {
  if (!email) return "";
  return email.split("@")[0] ?? "";
}

export function cumulativeSeries(values: number[]): number[] {
  const out: number[] = [];
  let sum = 0;
  for (const v of values) {
    sum += v;
    out.push(sum);
  }
  return out;
}

export function formatApptTimeRange(
  dateStr: string,
  durationMin: number | null | undefined,
  timeZone: string
): string {
  try {
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "—";
    const fmt = new Intl.DateTimeFormat("sr-Latn-RS", {
      timeZone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const start = fmt.format(d);
    if (!durationMin || durationMin <= 0) return start;
    const end = fmt.format(new Date(d.getTime() + durationMin * 60_000));
    return `${start} – ${end}`;
  } catch {
    return "—";
  }
}

export function statusLabel(
  status: AppointmentRow["status"]
): string {
  const m: Record<string, string> = {
    scheduled: "Zakazano",
    completed: "Završeno",
    no_show: "Nije došao",
    cancelled: "Otkazano",
  };
  return m[status] ?? status;
}

export function statusStyles(
  status: AppointmentRow["status"]
): string {
  switch (status) {
    case "completed":
      return "bg-emerald-600/20 text-emerald-400 border-emerald-700/40";
    case "no_show":
      return "bg-red-600/20 text-red-300 border-red-700/40";
    case "cancelled":
      return "bg-slate-600/15 text-slate-400 border-slate-700/40";
    default:
      return "bg-primary/15 text-primary border-primary/30";
  }
}

/** Average opening minutes per working day (from working hours settings). */
export function averageOpenMinutesPerDay(
  workingHours: Record<string, unknown> | undefined
): number | null {
  if (!workingHours || typeof workingHours !== "object") return null;
  let totalMin = 0;
  let openDays = 0;
  const days = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  for (const d of days) {
    const entry = (workingHours as Record<string, { open?: boolean; from?: string; to?: string }>)[d];
    if (!entry || entry.open === false || !entry.from || !entry.to) continue;
    const [fh, fm] = entry.from.split(":").map(Number);
    const [th, tm] = entry.to.split(":").map(Number);
    if (
      !Number.isFinite(fh) || !Number.isFinite(fm) ||
      !Number.isFinite(th) || !Number.isFinite(tm)
    ) continue;
    const diff = (th * 60 + tm) - (fh * 60 + fm);
    if (diff <= 0) continue;
    totalMin += diff;
    openDays += 1;
  }
  if (openDays === 0) return null;
  return Math.round(totalMin / openDays);
}

/** Average service duration across all services. */
export function averageServiceDurationMinutes(
  services: Service[] | undefined
): number | null {
  if (!services || services.length === 0) return null;
  const total = services.reduce((s, svc) => s + (svc.duration || 60), 0);
  return Math.round(total / services.length);
}

/** Estimated maximum appointment slots per day. */
export function estimatedSlotsPerDay(
  openMin: number | null,
  avgDuration: number | null
): number | null {
  if (openMin == null || avgDuration == null || avgDuration <= 0) return null;
  return Math.floor(openMin / avgDuration);
}
