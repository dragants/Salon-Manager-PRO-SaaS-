import type {
  ShiftPlannerApiRow,
  ShiftPlannerShift,
  WorkShiftRow,
} from "@/types/shift";

export const DEFAULT_NEW_SHIFT_HOURS = 2;

export function decimalHourToHHMM(h: number): string {
  const totalMin = Math.round(Math.max(0, h) * 60);
  const hh = Math.floor(totalMin / 60) % 24;
  const mm = totalMin % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function shiftsToApiPayload(
  shifts: ShiftPlannerShift[]
): ShiftPlannerApiRow[] {
  return shifts.map((s) => ({
    employee_id: s.employee_id,
    date: s.date,
    start: decimalHourToHHMM(s.startHour),
    end: decimalHourToHHMM(s.startHour + s.durationHours),
  }));
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
  const startHour = sh + (Number.isFinite(sm) ? sm : 0) / 60;
  const endHour = eh + (Number.isFinite(em) ? em : 0) / 60;
  return {
    id: String(row.id),
    employee_id: row.user_id,
    date: dateYmd,
    startHour,
    durationHours: Math.max(0.25, endHour - startHour),
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
  return { startHour: s, durationHours: d };
}
