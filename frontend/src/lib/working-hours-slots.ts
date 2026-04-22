/**
 * Prostor za termine = radni minuti po danu / prosečno trajanje usluge.
 * Ako ne može da se proceni, vraćamo null (UI sakriva widget).
 */

function parseTimeToMinutes(s: string | undefined): number | null {
  if (!s || typeof s !== "string") return null;
  const t = s.trim();
  const m = t.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min) || h > 24) return null;
  return h * 60 + min;
}

type DayKey = (typeof dayKeys)[number];
const dayKeys = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
  "pon",
  "uto",
  "sre",
  "cet",
  "pet",
  "sub",
  "ned",
] as const;

/**
 * Ako working_hours sadrži bar jedan dan sa open+close, vraća prosečne minute po radnom danu
 * (zajedno / broj dana gde i open i postoje i validni su).
 */
export function averageOpenMinutesPerDay(
  workingHours: Record<string, unknown> | null | undefined
): number | null {
  if (!workingHours || typeof workingHours !== "object") {
    return null;
  }
  const chunks: number[] = [];
  for (const k of dayKeys) {
    const v = (workingHours as Record<string, unknown>)[k];
    if (!v || typeof v !== "object" || v === null) continue;
    const o = (v as Record<string, unknown>).open ?? (v as Record<string, unknown>).start;
    const c = (v as Record<string, unknown>).close ?? (v as Record<string, unknown>).end;
    const a =
      typeof o === "string" && typeof c === "string"
        ? { open: o, close: c }
        : (v as { open?: string; close?: string });
    if (!a.open || !a.close) continue;
    const startM = parseTimeToMinutes(a.open);
    const endM = parseTimeToMinutes(a.close);
    if (startM == null || endM == null || endM <= startM) continue;
    chunks.push(endM - startM);
  }
  if (chunks.length === 0) {
    return null;
  }
  return chunks.reduce((s, n) => s + n, 0) / chunks.length;
}

export function averageServiceDurationMinutes(
  services: { duration: number }[] | null | undefined
): number | null {
  if (!Array.isArray(services) || services.length === 0) {
    return null;
  }
  const valid = services.map((s) => s.duration).filter((d) => typeof d === "number" && d > 0);
  if (valid.length === 0) {
    return null;
  }
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

/**
 * Maks. broj slotova po danu (ceo broj) ili null.
 */
export function estimatedSlotsPerDay(
  openMinutesPerDay: number | null,
  avgServiceDurationMin: number | null
): number | null {
  if (
    openMinutesPerDay == null ||
    avgServiceDurationMin == null ||
    avgServiceDurationMin <= 0
  ) {
    return null;
  }
  return Math.max(0, Math.floor(openMinutesPerDay / avgServiceDurationMin));
}
