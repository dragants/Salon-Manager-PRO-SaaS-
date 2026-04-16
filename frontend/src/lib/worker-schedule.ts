import {
  minutesSinceMidnightInZone,
  weekdayDayIdFromYmd,
  ymdInTimeZone,
} from "@/components/features/calendar/calendar-utils";
import {
  parseWorkingHoursFromApi,
  type DayId,
} from "@/components/features/settings/working-hours-editor";
import type { OrgTeamMember } from "@/types/user";

/** JS Date.getDay(): 0=ned … 6=sub → mon..sun */
export function jsWeekdayToDayId(d: number): DayId {
  const map: DayId[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return map[d] ?? "mon";
}

function hmToMin(s: string): number {
  const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/**
 * Da li radnik ima uključenu smenu za datim danom (lokalni datum termina).
 * Ako nema podešenog rasporeda (prazan profil), smatra se dostupnim (staro ponašanje).
 */
export function workerAvailableOnLocalDate(
  member: OrgTeamMember,
  date: Date
): boolean {
  const raw = member.worker_profile?.working_hours;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return true;
  }
  const keys = Object.keys(raw as object);
  if (keys.length === 0) {
    return true;
  }
  const rows = parseWorkingHoursFromApi(raw as Record<string, unknown>);
  const dayId = jsWeekdayToDayId(date.getDay());
  const row = rows.find((r) => r.id === dayId);
  if (!row) {
    return true;
  }
  return row.enabled;
}

/**
 * Da li interval termina upada u radno vreme radnika (otvaranje–zatvaranje, bez pauze).
 * Koristi IANA zonu salona za dan i minut.
 */
export function workerAllowsAppointmentWindow(
  member: OrgTeamMember,
  iso: string,
  timeZone: string,
  durationMin: number
): boolean {
  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    return true;
  }
  const raw = member.worker_profile?.working_hours;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return true;
  }
  if (Object.keys(raw as object).length === 0) {
    return true;
  }
  const rows = parseWorkingHoursFromApi(raw as Record<string, unknown>);
  const ymd = ymdInTimeZone(iso, timeZone);
  const dayId = weekdayDayIdFromYmd(ymd, timeZone);
  if (!dayId) {
    return true;
  }
  const row = rows.find((r) => r.id === dayId);
  if (!row || !row.enabled) {
    return false;
  }
  const start = minutesSinceMidnightInZone(iso, timeZone);
  const end = start + durationMin;
  const open = hmToMin(row.open);
  const close = hmToMin(row.close);
  if (close <= open) {
    return false;
  }
  if (start < open || end > close) {
    return false;
  }
  const bs = row.breakStart?.trim();
  const be = row.breakEnd?.trim();
  if (bs && be) {
    const b1 = hmToMin(bs);
    const b2 = hmToMin(be);
    if (b2 > b1 && start < b2 && end > b1) {
      return false;
    }
  }
  return true;
}
