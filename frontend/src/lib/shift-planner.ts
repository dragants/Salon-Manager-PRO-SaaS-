import { weekdayDayIdFromYmd } from "@/components/features/calendar/calendar-utils";
import { parseWorkingHoursFromApi } from "@/components/features/settings/working-hours-editor";
import type {
  ShiftPlannerApiRow,
  ShiftPlannerShift,
  WorkShiftRow,
} from "@/types/shift";
import type { OrgTeamMember } from "@/types/user";

export const DEFAULT_NEW_SHIFT_HOURS = 2;

function minutesToHHMM(totalMin: number): string {
  const m = ((totalMin % (24 * 60)) + 24 * 60) % (24 * 60);
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function decimalHourToHHMM(h: number): string {
  return minutesToHHMM(Math.round(Math.max(0, h) * 60));
}

/** Prikaz i API: kraj = start + trajanje u jednom zaokruživanju (izbegava 12:59 umesto 13:00). */
export function shiftTimeLabels(
  startHour: number,
  durationHours: number
): { start: string; end: string } {
  const startMin = Math.round(startHour * 60);
  const endMin = Math.round(startHour * 60 + durationHours * 60);
  return {
    start: minutesToHHMM(startMin),
    end: minutesToHHMM(endMin),
  };
}

function parseHmToMinutes(s: string): number {
  const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return 0;
  }
  return h * 60 + m;
}

/** Pozicija na vremenskoj traci (isti HH:MM kao shiftTimeLabels). */
export function shiftLayoutPct(
  startHour: number,
  durationHours: number,
  hourStart: number,
  hourEnd: number
): { leftPct: number; widthPct: number } {
  const { start, end } = shiftTimeLabels(startHour, durationHours);
  const startMin = parseHmToMinutes(start);
  const endMin = parseHmToMinutes(end);
  const range = hourEnd - hourStart;
  const leftPct = ((startMin / 60 - hourStart) / range) * 100;
  const widthPct = ((endMin - startMin) / 60 / range) * 100;
  return { leftPct, widthPct };
}

export function shiftsToApiPayload(
  shifts: ShiftPlannerShift[]
): ShiftPlannerApiRow[] {
  return shifts.map((s) => {
    const { start, end } = shiftTimeLabels(s.startHour, s.durationHours);
    return {
      employee_id: s.employee_id,
      date: s.date,
      start,
      end,
    };
  });
}

export function snapToQuarterHours(h: number): number {
  return Math.round(h * 4) / 4;
}

/** Mapira red iz GET /shifts u blok za ShiftPlanner. */
export function workShiftToPlanner(
  row: WorkShiftRow,
  dateYmd: string
): ShiftPlannerShift {
  const [sh, sm] = row.start.split(":").map((x) => Number.parseInt(x, 10));
  const [eh, em] = row.end.split(":").map((x) => Number.parseInt(x, 10));
  const startMin = sh * 60 + (Number.isFinite(sm) ? sm : 0);
  const endMin = eh * 60 + (Number.isFinite(em) ? em : 0);
  const durMin = Math.max(15, endMin - startMin);
  return {
    id: String(row.id),
    employee_id: row.user_id,
    date: dateYmd,
    startHour: startMin / 60,
    durationHours: durMin / 60,
  };
}

export function clampShiftToTimeline(
  startHour: number,
  durationHours: number,
  hourStart: number,
  hourEnd: number
): { startHour: number; durationHours: number } {
  let s = snapToQuarterHours(startHour);
  let d = Math.max(0.25, snapToQuarterHours(durationHours));
  s = Math.max(hourStart, Math.min(hourEnd - 0.25, s));
  d = Math.max(0.25, Math.min(hourEnd - s, d));
  const startMin = Math.round(s * 60);
  const endMin = Math.round(s * 60 + d * 60);
  const durMin = Math.max(15, endMin - startMin);
  return { startHour: startMin / 60, durationHours: durMin / 60 };
}

function hmToMin(s: string): number {
  const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) {
    return 0;
  }
  return h * 60 + m;
}

function newDraftShiftId(memberId: number, partIndex: number): string {
  const u =
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${memberId}-${partIndex}`;
  return `draft-${memberId}-${partIndex}-${u}`;
}

/** Intervali u minutima od ponoći; segment [s,e) bez preklapanja sa pauzom [p,q). */
function splitSegmentsExcludingPause(
  segments: { start: number; end: number }[],
  pauseStart: number,
  pauseEnd: number
): { start: number; end: number }[] {
  if (!(pauseEnd > pauseStart)) {
    return segments;
  }
  const out: { start: number; end: number }[] = [];
  for (const { start: s, end: e } of segments) {
    if (e <= s) {
      continue;
    }
    const lo = Math.max(s, pauseStart);
    const hi = Math.min(e, pauseEnd);
    if (hi > lo) {
      if (lo > s) {
        out.push({ start: s, end: lo });
      }
      if (e > hi) {
        out.push({ start: hi, end: e });
      }
    } else {
      out.push({ start: s, end: e });
    }
  }
  return out;
}

/**
 * Predlog dnevnih smena iz Podešavanja → Raspored (worker_profile.working_hours),
 * kada u bazi još nema redova u work_shifts za taj datum.
 * Pauza iz profila radnika i pauza iz Podešavanja → Radno vreme salona razbijaju blokove.
 */
export function suggestShiftsFromTeamWeeklyHours(
  team: OrgTeamMember[],
  dateYmd: string,
  timeZone: string,
  hourStart: number,
  hourEnd: number,
  orgWorkingHours?: Record<string, unknown> | null
): ShiftPlannerShift[] {
  const dayId = weekdayDayIdFromYmd(dateYmd, timeZone);
  if (!dayId) {
    return [];
  }
  const orgRows = parseWorkingHoursFromApi(
    (orgWorkingHours ?? {}) as Record<string, unknown>
  );
  const orgDay = orgRows.find((r) => r.id === dayId);
  const orgPause =
    orgDay?.enabled &&
    orgDay.breakStart?.trim() &&
    orgDay.breakEnd?.trim()
      ? {
          p: hmToMin(orgDay.breakStart.trim()),
          q: hmToMin(orgDay.breakEnd.trim()),
        }
      : null;
  const out: ShiftPlannerShift[] = [];
  for (const m of team) {
    const rows = parseWorkingHoursFromApi(
      (m.worker_profile?.working_hours ?? {}) as Record<string, unknown>
    );
    const row = rows.find((r) => r.id === dayId);
    if (!row || !row.enabled) {
      continue;
    }
    const openMin = hmToMin(row.open);
    const closeMin = hmToMin(row.close);
    if (closeMin <= openMin) {
      continue;
    }

    const segments: { start: number; end: number }[] = [];
    const bs = row.breakStart?.trim();
    const be = row.breakEnd?.trim();
    if (bs && be) {
      const b1 = hmToMin(bs);
      const b2 = hmToMin(be);
      if (b2 > b1 && b1 < closeMin && b2 > openMin) {
        const bb1 = Math.max(openMin, b1);
        const bb2 = Math.min(closeMin, b2);
        if (bb2 > bb1) {
          if (bb1 > openMin) {
            segments.push({ start: openMin, end: bb1 });
          }
          if (closeMin > bb2) {
            segments.push({ start: bb2, end: closeMin });
          }
          if (segments.length === 0) {
            segments.push({ start: openMin, end: closeMin });
          }
        } else {
          segments.push({ start: openMin, end: closeMin });
        }
      } else {
        segments.push({ start: openMin, end: closeMin });
      }
    } else {
      segments.push({ start: openMin, end: closeMin });
    }

    let resolved =
      orgPause && orgPause.q > orgPause.p
        ? splitSegmentsExcludingPause(segments, orgPause.p, orgPause.q)
        : segments;

    let partIndex = 0;
    for (const seg of resolved) {
      const startHour = seg.start / 60;
      const durationHours = (seg.end - seg.start) / 60;
      if (durationHours < 0.25) {
        continue;
      }
      const clamped = clampShiftToTimeline(
        startHour,
        durationHours,
        hourStart,
        hourEnd
      );
      if (clamped.durationHours < 0.25) {
        continue;
      }
      out.push({
        id: newDraftShiftId(m.id, partIndex),
        employee_id: m.id,
        date: dateYmd,
        startHour: clamped.startHour,
        durationHours: clamped.durationHours,
      });
      partIndex += 1;
    }
  }
  return out;
}
