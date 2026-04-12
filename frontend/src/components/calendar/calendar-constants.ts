import type { AppointmentStatus } from "@/types/appointment";

export const STATUS_LABEL: Record<AppointmentStatus, string> = {
  scheduled: "Zakazano",
  completed: "Završeno",
  no_show: "Nije došao",
};

/** SaaS: plavo = zakazano, zeleno = završeno, crveno = no-show */
export function statusBadgeClass(status: AppointmentStatus) {
  switch (status) {
    case "scheduled":
      return "border-sky-300 bg-sky-50 text-sky-950 shadow-sky-100/80";
    case "completed":
      return "border-emerald-300 bg-emerald-50 text-emerald-950 shadow-emerald-100/80";
    case "no_show":
      return "border-red-300 bg-red-50 text-red-950 shadow-red-100/80";
    default:
      return "";
  }
}

export function statusAccentBorder(status: AppointmentStatus) {
  switch (status) {
    case "scheduled":
      return "border-l-sky-500";
    case "completed":
      return "border-l-emerald-500";
    case "no_show":
      return "border-l-red-500";
    default:
      return "border-l-sky-300";
  }
}

export const GRID_START_HOUR = 7;
export const GRID_END_HOUR = 22;
export const PX_PER_HOUR = 48;
/** Veći slotovi na telefonu (čitljivost + drag). */
export const PX_PER_HOUR_COMPACT = 58;
