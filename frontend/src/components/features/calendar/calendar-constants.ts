import type { AppointmentStatus } from "@/types/appointment";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Zakazano",
  completed: "Završeno",
  no_show: "Nije došao",
};

/** Status badge — primary za zakazano; zeleno / crveno za ostale. */
export function statusBadgeClass(status: AppointmentStatus) {
  switch (status) {
    case "scheduled":
      return "border-primary/45 bg-primary/15 text-primary shadow-none";
    case "completed":
      return "border-emerald-500/45 bg-emerald-600/22 text-emerald-50 shadow-none";
    case "no_show":
      return "border-red-500/45 bg-red-600/20 text-red-100 shadow-none";
    default:
      return "";
  }
}

export function statusAccentBorder(status: AppointmentStatus) {
  switch (status) {
    case "scheduled":
      return "border-l-primary";
    case "completed":
      return "border-l-emerald-500";
    case "no_show":
      return "border-l-red-500";
    default:
      return "border-l-primary/60";
  }
}

export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 22;
/** Raspored smena: ekskluzivni kraj mreže (kolone 08:00 … 20:00 kada je početak 8). */
export const SHIFT_PLANNER_END_HOUR = 21;
export const PX_PER_HOUR = 48;
/** Veći slotovi na telefonu (čitljivost + drag). */
export const PX_PER_HOUR_COMPACT = 58;
