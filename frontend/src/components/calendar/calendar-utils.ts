import type { AppointmentRow } from "@/types/appointment";

/** Prikaz imena radnika na terminu (ime ili email). */
export function appointmentStaffLabel(
  row: Pick<AppointmentRow, "staff_display_name" | "staff_email">
): string | null {
  const n = row.staff_display_name?.trim();
  if (n) return n;
  const e = row.staff_email?.trim();
  return e || null;
}

export function browserTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** YYYY-MM-DD za trenutak u IANA zoni (usklađeno sa backend filterom). */
export function ymdInTimeZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

/** Dugi prikaz kalendarskog YYYY-MM-DD u datoj IANA zoni (ne zavisi od TZ pregledača). */
export function formatYmdLongInZone(
  ymd: string,
  timeZone: string,
  locale = "sr-Latn-RS"
): string {
  const [y, m, d] = ymd.split("-").map(Number);
  if (
    y == null ||
    m == null ||
    d == null ||
    Number.isNaN(y) ||
    Number.isNaN(m) ||
    Number.isNaN(d)
  ) {
    return ymd;
  }
  const noonUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone,
  }).format(noonUtc);
}

export function minutesSinceMidnightInZone(
  iso: string,
  timeZone: string
): number {
  const d = new Date(iso);
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(d);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

function getHmsInZone(iso: string, timeZone: string) {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  const second = Number(parts.find((p) => p.type === "second")?.value ?? 0);
  return { hour, minute, second };
}

/** UTC trenutak koji u `timeZone` ima dati kalendar datum i lokalno vreme. */
function wallTimeInZoneToUtc(
  ymd: string,
  hour: number,
  minute: number,
  second: number,
  timeZone: string
): Date {
  const [y, mo, d] = ymd.split("-").map(Number);
  let utcMs = Date.UTC(y, mo - 1, d, hour, minute, second);
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    hour12: false,
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  for (let i = 0; i < 24; i++) {
    const dt = new Date(utcMs);
    const parts = Object.fromEntries(
      formatter.formatToParts(dt).map((p) => [p.type, p.value])
    ) as Record<string, string>;
    const fy = Number(parts.year);
    const fm = Number(parts.month);
    const fd = Number(parts.day);
    const fh = Number(parts.hour);
    const fmi = Number(parts.minute);
    const fs = Number(parts.second);
    if (
      fy === y &&
      fm === mo &&
      fd === d &&
      fh === hour &&
      fmi === minute &&
      fs === second
    ) {
      return dt;
    }
    const dayDiff =
      (Date.UTC(y, mo - 1, d) - Date.UTC(fy, fm - 1, fd)) / 86400000;
    const secDiff =
      (hour - fh) * 3600 + (minute - fmi) * 60 + (second - fs);
    utcMs += dayDiff * 86400000 + secDiff * 1000;
  }
  return new Date(utcMs);
}

/** Novi ISO trenutak: isto lokalno vreme u zoni, novi datum (YYYY-MM-DD). */
export function isoAtYmdPreservingWallClockInZone(
  sourceIso: string,
  targetYmd: string,
  timeZone: string
): string {
  const { hour, minute, second } = getHmsInZone(sourceIso, timeZone);
  return wallTimeInZoneToUtc(
    targetYmd,
    hour,
    minute,
    second,
    timeZone
  ).toISOString();
}

/** Podrazumevani korak mreže pri pomeranju termina (min). */
export const CALENDAR_SNAP_SLOT_MINUTES = 15;

/** Zaokruži minute od ponoći na najbliži slot (npr. 15 min), unutar istog dana. */
export function snapMinutesSinceMidnight(
  minutes: number,
  slotMinutes: number
): number {
  const snapped = Math.round(minutes / slotMinutes) * slotMinutes;
  const maxStart = 24 * 60 - slotMinutes;
  return Math.max(0, Math.min(snapped, maxStart));
}

export function isoFromYmdAndMinutesInZone(
  ymd: string,
  minutesSinceMidnight: number,
  timeZone: string
): string {
  const h = Math.floor(minutesSinceMidnight / 60);
  const m = minutesSinceMidnight % 60;
  return wallTimeInZoneToUtc(ymd, h, m, 0, timeZone).toISOString();
}

/**
 * Novi datum + isto „wall clock“ vreme kao izvor, zatim snap vremena na slot u zoni.
 */
export function rescheduleIsoWithSnap(
  sourceIso: string,
  targetYmd: string,
  timeZone: string,
  slotMinutes: number = CALENDAR_SNAP_SLOT_MINUTES
): string {
  const preserved = isoAtYmdPreservingWallClockInZone(
    sourceIso,
    targetYmd,
    timeZone
  );
  const min = minutesSinceMidnightInZone(preserved, timeZone);
  const snapped = snapMinutesSinceMidnight(min, slotMinutes);
  return isoFromYmdAndMinutesInZone(targetYmd, snapped, timeZone);
}

/** Isti radnik / ista „staza“ (uključujući oba neraspoređena). */
function sameStaffBucket(
  a: number | null | undefined,
  b: number | null | undefined
): boolean {
  const na = a == null ? null : Number(a);
  const nb = b == null ? null : Number(b);
  return na === nb;
}

/** Kratki dan u zoni za YYYY-MM-DD (podne u zoni) → mon..sun. */
export function weekdayDayIdFromYmd(
  ymd: string,
  timeZone: string
):
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun"
  | null {
  const noonIso = isoFromYmdAndMinutesInZone(ymd, 12 * 60, timeZone);
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(new Date(noonIso));
  const map: Record<
    string,
    "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun"
  > = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
    Sun: "sun",
  };
  return map[short] ?? null;
}

/**
 * Da li novi interval [proposedStart, proposedEnd) preklapa termin istog dana
 * za istog radnika (null = neraspoređeno; različiti radnici se ne bi trebalo sudarati).
 */
export function hasOverlapWithOthers(
  movingId: number,
  proposedIso: string,
  movingDurationMin: number,
  allRows: AppointmentRow[],
  timeZone: string,
  targetYmd: string,
  movingStaffUserId?: number | null
): boolean {
  const proposedStart = minutesSinceMidnightInZone(proposedIso, timeZone);
  const proposedEnd = proposedStart + movingDurationMin;

  for (const other of allRows) {
    if (other.id === movingId) {
      continue;
    }
    if (ymdInTimeZone(other.date, timeZone) !== targetYmd) {
      continue;
    }
    if (
      !sameStaffBucket(movingStaffUserId ?? null, other.staff_user_id ?? null)
    ) {
      continue;
    }
    const oStart = minutesSinceMidnightInZone(other.date, timeZone);
    const oDur = other.service_duration ?? 30;
    const oEnd = oStart + oDur;
    if (proposedStart < oEnd && proposedEnd > oStart) {
      return true;
    }
  }
  return false;
}

