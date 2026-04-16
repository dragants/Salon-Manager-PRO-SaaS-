import type { AppointmentRow } from "@/types/appointment";
import type { CalendarRules } from "@/types/organization";
import type { DayId } from "@/components/features/settings/working-hours-editor";
import {
  isoFromYmdAndMinutesInZone,
  minutesSinceMidnightInZone,
  weekdayDayIdFromYmd,
  ymdInTimeZone,
} from "@/components/features/calendar/calendar-utils";
import type { OrgTeamMember } from "@/types/user";

const DAY_IDS: DayId[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

function parseHm(s: string | undefined): number | null {
  if (typeof s !== "string") return null;
  const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/** Isti algoritam kao backend `intervalsForDay`. */
export function intervalsForWorkingDay(
  workingHours: Record<string, unknown> | undefined,
  dayId: DayId
): [number, number][] {
  const raw = workingHours?.[dayId];
  if (!raw || typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return [];
  }
  const o = raw as Record<string, unknown>;
  if (o.enabled === false) {
    return [];
  }
  const openMin = parseHm(typeof o.open === "string" ? o.open : undefined);
  const closeMin = parseHm(typeof o.close === "string" ? o.close : undefined);
  if (openMin == null || closeMin == null || closeMin <= openMin) {
    return [];
  }
  let intervals: [number, number][] = [[openMin, closeMin]];
  const bs = parseHm(
    typeof o.break_start === "string" ? o.break_start : undefined
  );
  const be = parseHm(typeof o.break_end === "string" ? o.break_end : undefined);
  if (bs != null && be != null && be > bs) {
    const next: [number, number][] = [];
    for (const [a, b] of intervals) {
      if (be <= a || bs >= b) {
        next.push([a, b]);
      } else {
        if (bs > a) next.push([a, Math.min(bs, b)]);
        if (be < b) next.push([Math.max(be, a), b]);
      }
    }
    intervals = next.filter(([a, b]) => b > a);
  }
  return intervals;
}

function intersectIntervals(
  a: [number, number][],
  b: [number, number][]
): [number, number][] {
  const out: [number, number][] = [];
  for (const [a1, a2] of a) {
    for (const [b1, b2] of b) {
      const s = Math.max(a1, b1);
      const e = Math.min(a2, b2);
      if (e > s) out.push([s, e]);
    }
  }
  return out;
}

function overlapCountScoped(
  slotStartMin: number,
  blockMinutes: number,
  appointments: AppointmentRow[],
  bufferBetween: number,
  timeZone: string,
  ymd: string,
  /** Ako broj — samo termini tog radnika; ako null — svi termini. */
  staffScope: number | null
): number {
  const slotEnd = slotStartMin + blockMinutes;
  let n = 0;
  for (const a of appointments) {
    if (ymdInTimeZone(a.date, timeZone) !== ymd) {
      continue;
    }
    if (staffScope != null) {
      const sid = a.staff_user_id == null ? null : Number(a.staff_user_id);
      if (sid !== staffScope) {
        continue;
      }
    }
    const apptStart = minutesSinceMidnightInZone(a.date, timeZone);
    const dur = Number(a.service_duration) || 60;
    const buf = 0;
    const apptBlock = dur + buf + bufferBetween;
    const apptEnd = apptStart + apptBlock;
    if (slotStartMin < apptEnd && apptStart < slotEnd) {
      n += 1;
    }
  }
  return n;
}

export type SuggestedSlot = { startIso: string; label: string };

export function computeSuggestedSlots(params: {
  ymd: string;
  timeZone: string;
  orgWorkingHours: Record<string, unknown>;
  worker: OrgTeamMember | null;
  /** Izabrani radnik (broj) ili null = svi / neraspoređeno */
  staffUserId: number | null;
  calendarRules: CalendarRules;
  serviceDuration: number;
  serviceBufferMinutes: number;
  appointments: AppointmentRow[];
  /** Ne vraćaj slotove u prošlosti za današnji dan */
  nowMs?: number;
}): SuggestedSlot[] {
  const {
    ymd,
    timeZone,
    orgWorkingHours,
    worker,
    staffUserId,
    calendarRules,
    serviceDuration,
    serviceBufferMinutes,
    appointments,
    nowMs = Date.now(),
  } = params;

  const dayId = weekdayDayIdFromYmd(ymd, timeZone);
  if (!dayId || !DAY_IDS.includes(dayId)) {
    return [];
  }

  let intervals = intervalsForWorkingDay(orgWorkingHours, dayId);
  if (worker && staffUserId != null) {
    const raw = worker.worker_profile?.working_hours;
    if (raw && typeof raw === "object" && !Array.isArray(raw) && Object.keys(raw).length > 0) {
      const wInt = intervalsForWorkingDay(
        raw as Record<string, unknown>,
        dayId
      );
      if (wInt.length === 0) {
        return [];
      }
      intervals = intersectIntervals(intervals, wInt);
    }
  }

  const step = Math.min(
    Math.max(5, calendarRules.min_gap_minutes || 30),
    120
  );
  const bufferBetween = calendarRules.buffer_between_minutes ?? 0;
  const duration = Math.max(5, serviceDuration || 60);
  const svcBuf = Math.max(0, serviceBufferMinutes || 0);
  const blockMinutes = duration + svcBuf + bufferBetween;
  const maxConcurrent = calendarRules.allow_overlap
    ? Math.max(1, calendarRules.max_clients_per_hour || 4)
    : 1;

  const todayYmd = ymdInTimeZone(new Date(nowMs).toISOString(), timeZone);
  const nowMin =
    todayYmd === ymd
      ? minutesSinceMidnightInZone(new Date(nowMs).toISOString(), timeZone)
      : null;

  const staffScope =
    staffUserId != null && Number.isFinite(staffUserId)
      ? Number(staffUserId)
      : null;

  const slots: SuggestedSlot[] = [];
  const maxSlots = 36;

  for (const [openMin, closeMin] of intervals) {
    for (let m = openMin; m + duration <= closeMin; m += step) {
      if (slots.length >= maxSlots) {
        return slots;
      }
      if (nowMin != null && m <= nowMin) {
        continue;
      }
      const occ = overlapCountScoped(
        m,
        blockMinutes,
        appointments,
        bufferBetween,
        timeZone,
        ymd,
        staffScope
      );
      if (occ >= maxConcurrent) {
        continue;
      }
      const startIso = isoFromYmdAndMinutesInZone(ymd, m, timeZone);
      const label = new Date(startIso).toLocaleTimeString("sr-Latn-RS", {
        timeZone,
        hour: "2-digit",
        minute: "2-digit",
      });
      slots.push({ startIso, label });
    }
  }
  return slots;
}
