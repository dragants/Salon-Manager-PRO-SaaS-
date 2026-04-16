import {
  GRID_END_HOUR,
  GRID_START_HOUR,
  PX_PER_HOUR,
} from "@/components/features/calendar/calendar-constants";
import {
  minutesSinceMidnightInZone,
  weekdayDayIdFromYmd,
  ymdInTimeZone,
} from "@/components/features/calendar/calendar-utils";
import type { DayId } from "@/components/features/settings/working-hours-editor";
import { intervalsForWorkingDay } from "@/lib/admin-slot-suggestions";
import type { AppointmentRow } from "@/types/appointment";

const PAD_MIN = 45;

/** Sat početka i kraja (kraj ekskluzivan, kao GRID_END_HOUR) za nedeljni prikaz. */
export function weekTimeGridHours(params: {
  weekDaysYmd: string[];
  timeZone: string;
  workingHours: Record<string, unknown> | undefined;
  appointments: AppointmentRow[];
}): { gridStartHour: number; gridEndHour: number } {
  const { weekDaysYmd, timeZone, workingHours, appointments } = params;

  let minMin = Number.POSITIVE_INFINITY;
  let maxMin = Number.NEGATIVE_INFINITY;
  let any = false;

  for (const ymd of weekDaysYmd) {
    const dayId = weekdayDayIdFromYmd(ymd, timeZone) as DayId | null;
    if (!dayId) continue;
    for (const [a, b] of intervalsForWorkingDay(workingHours, dayId)) {
      any = true;
      minMin = Math.min(minMin, a);
      maxMin = Math.max(maxMin, b);
    }
  }

  const inWeek = new Set(weekDaysYmd);
  for (const r of appointments) {
    const ymd = ymdInTimeZone(r.date, timeZone);
    if (!inWeek.has(ymd)) continue;
    any = true;
    const m = minutesSinceMidnightInZone(r.date, timeZone);
    const dur = r.service_duration ?? 30;
    minMin = Math.min(minMin, m);
    maxMin = Math.max(maxMin, m + dur);
  }

  if (!any || !Number.isFinite(minMin) || !Number.isFinite(maxMin)) {
    return { gridStartHour: GRID_START_HOUR, gridEndHour: GRID_END_HOUR };
  }

  const startMin = Math.max(0, minMin - PAD_MIN);
  const endMin = Math.min(24 * 60, maxMin + PAD_MIN);

  const gridStartHour = Math.max(0, Math.floor(startMin / 60));
  const gridEndHour = Math.min(
    24,
    Math.max(gridStartHour + 1, Math.ceil(endMin / 60))
  );

  if (gridEndHour <= gridStartHour) {
    return { gridStartHour: GRID_START_HOUR, gridEndHour: GRID_END_HOUR };
  }

  return { gridStartHour, gridEndHour };
}

/**
 * Da li postoji smislen raspored u podešavanjima (za overlay u kalendaru).
 * Prazan objekat ili undefined — bez senčenja.
 */
export function orgHasWorkingHoursSchedule(
  workingHours: Record<string, unknown> | undefined | null
): boolean {
  if (workingHours == null || typeof workingHours !== "object") {
    return false;
  }
  return Object.keys(workingHours).length > 0;
}

/**
 * Minuti u okviru [windowStartMin, windowEndMin] koji nisu u otvorenim intervalima.
 * Otvoreni intervali su [a, b) kao u slot logici (kraj `close` je ekskluzivan).
 */
export function closedMinuteRangesInWindow(
  windowStartMin: number,
  windowEndMin: number,
  openIntervals: [number, number][]
): [number, number][] {
  if (windowEndMin <= windowStartMin) {
    return [];
  }
  if (openIntervals.length === 0) {
    return [[windowStartMin, windowEndMin]];
  }

  const sorted = [...openIntervals]
    .map(
      ([a, b]) =>
        [
          Math.max(windowStartMin, a),
          Math.min(windowEndMin, b),
        ] as [number, number]
    )
    .filter(([a, b]) => b > a)
    .sort((x, y) => x[0] - y[0]);

  const merged: [number, number][] = [];
  for (const seg of sorted) {
    const last = merged[merged.length - 1];
    if (!last || seg[0] > last[1]) {
      merged.push([seg[0], seg[1]]);
    } else {
      last[1] = Math.max(last[1], seg[1]);
    }
  }

  const closed: [number, number][] = [];
  let c = windowStartMin;
  for (const [a, b] of merged) {
    if (c < a) {
      closed.push([c, a]);
    }
    c = Math.max(c, b);
    if (c >= windowEndMin) {
      break;
    }
  }
  if (c < windowEndMin) {
    closed.push([c, windowEndMin]);
  }
  return closed.filter(([a, b]) => b > a);
}

export type ClosedOverlayRect = { top: number; height: number };

/** Vertikalni pravougaonici (px) za senčenje van radnog vremena u jednoj koloni. */
export function closedOverlayPxForDay(params: {
  dateYmd: string;
  timeZone: string;
  workingHours: Record<string, unknown> | undefined;
  gridStartMin: number;
  gridEndMin: number;
  pxPerHour?: number;
}): ClosedOverlayRect[] {
  const {
    dateYmd,
    timeZone,
    workingHours,
    gridStartMin,
    gridEndMin,
    pxPerHour = PX_PER_HOUR,
  } = params;

  if (!orgHasWorkingHoursSchedule(workingHours)) {
    return [];
  }

  const dayId = weekdayDayIdFromYmd(dateYmd, timeZone) as DayId | null;
  const open = dayId ? intervalsForWorkingDay(workingHours, dayId) : [];
  const closedMin = closedMinuteRangesInWindow(
    gridStartMin,
    gridEndMin,
    open
  );

  return closedMin.map(([a, b]) => ({
    top: ((a - gridStartMin) / 60) * pxPerHour,
    height: Math.max(0, ((b - a) / 60) * pxPerHour),
  }));
}
