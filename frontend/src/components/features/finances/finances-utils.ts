import type { AppointmentRow } from "@/types/appointment";
import { toast } from "sonner";

export const DEFAULT_TZ = "Europe/Belgrade";
export const MAX_MONTHLY_OVERHEAD_RSD = 999_999_999;

export type PeriodFilter = "day" | "week" | "month";

export function formatExpenseMonthLabel(ym: string): string {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return ym;
  }
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

export function orgTimeZone(
  settingsTz: string | null | undefined,
): string {
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

export function firstOfMonthYmdInTz(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  return `${y}-${m}-01`;
}

export function lastDayOfMonthYmd(
  year: number,
  month1to12: number,
): string {
  const last = new Date(year, month1to12, 0).getDate();
  return `${year}-${String(month1to12).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

export function apptPrice(a: AppointmentRow): number {
  const p = a.service_price;
  if (p == null) return 0;
  if (typeof p === "number") return p;
  const n = Number(String(p).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function txnStatus(
  a: AppointmentRow,
): { label: string; badgeClass: string } {
  if (a.status === "completed") {
    return {
      label: "Plaćeno",
      badgeClass:
        "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100",
    };
  }
  if (a.status === "scheduled") {
    return {
      label: "Na čekanju",
      badgeClass:
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    };
  }
  return {
    label: "Otkazano",
    badgeClass: "border-border bg-muted text-foreground",
  };
}

export function formatApptWhen(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("sr-Latn-RS", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function csvEscapeCell(v: string): string {
  const s = v.replaceAll('"', '""');
  return `"${s}"`;
}

export function downloadTransactionsCsv(
  rows: AppointmentRow[],
  tz: string,
  filename: string,
) {
  const header = ["datum", "klijent", "usluga", "cena_rsd", "status"];
  const lines = [header.join(";")];
  for (const a of rows) {
    const st = txnStatus(a);
    lines.push(
      [
        csvEscapeCell(formatApptWhen(a.date, tz)),
        csvEscapeCell(a.client_name ?? `Klijent #${a.client_id}`),
        csvEscapeCell(a.service_name ?? `Usluga #${a.service_id}`),
        csvEscapeCell(String(apptPrice(a))),
        csvEscapeCell(st.label),
      ].join(";"),
    );
  }
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV je preuzet (Excel-friendly UTF-8).");
}
