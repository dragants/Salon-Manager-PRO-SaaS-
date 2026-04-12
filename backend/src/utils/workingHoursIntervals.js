/**
 * Isti model intervala kao u frontend `intervalsForWorkingDay` / booking.service.
 * Otvoreni intervali [openMin, closeMin) — close je ekskluzivan za slot petlju u booking-u,
 * ovde koristimo [openMin, closeMin] kao u booking intervalsForDay (kraj može biti inkluzivan u proverama).
 */

function parseHm(s) {
  if (typeof s !== "string") return null;
  const [h, m] = s.split(":").map((x) => Number.parseInt(x, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
}

/**
 * @param {Record<string, unknown>} workingHours
 * @param {string} dayId mon|tue|...
 * @returns {[number, number][]}
 */
function intervalsForDay(workingHours, dayId) {
  const raw = workingHours?.[dayId];
  if (!raw || typeof raw !== "object" || raw.enabled === false) {
    return [];
  }
  const openMin = parseHm(typeof raw.open === "string" ? raw.open : undefined);
  const closeMin = parseHm(typeof raw.close === "string" ? raw.close : undefined);
  if (openMin == null || closeMin == null || closeMin <= openMin) {
    return [];
  }
  let intervals = [[openMin, closeMin]];
  const bs = parseHm(
    typeof raw.break_start === "string" ? raw.break_start : undefined
  );
  const be = parseHm(
    typeof raw.break_end === "string" ? raw.break_end : undefined
  );
  if (bs != null && be != null && be > bs) {
    const next = [];
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

/** Poslednji minut zatvaranja tog dana (npr. 20:00 → 1200). */
function maxOrgCloseMinutes(orgIntervals) {
  if (!orgIntervals || orgIntervals.length === 0) return null;
  return Math.max(...orgIntervals.map(([, c]) => c));
}

/** Da li ceo interval [startMin, endMin] staje u bar jedan otvoren segment salona. */
function rangeInsideOrgIntervals(startMin, endMin, orgIntervals) {
  if (!orgIntervals || orgIntervals.length === 0) return true;
  for (const [o, c] of orgIntervals) {
    if (startMin >= o && endMin <= c) return true;
  }
  return false;
}

module.exports = {
  intervalsForDay,
  maxOrgCloseMinutes,
  rangeInsideOrgIntervals,
  parseHm,
};
