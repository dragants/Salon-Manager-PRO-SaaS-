/**
 * Isto „zidno“ vreme u IANA zoni → UTC Date (iteracija kao u frontend calendar-utils).
 */

function getHmsInZone(iso, timeZone) {
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

function wallTimeInZoneToUtc(ymd, hour, minute, second, timeZone) {
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
  for (let i = 0; i < 24; i += 1) {
    const dt = new Date(utcMs);
    const parts = Object.fromEntries(
      formatter.formatToParts(dt).map((p) => [p.type, p.value])
    );
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

function ymdInTimeZone(iso, timeZone) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(iso));
}

function minutesSinceMidnightInZone(iso, timeZone) {
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

function isoFromYmdAndMinutesInZone(ymd, minutesSinceMidnight, timeZone) {
  const h = Math.floor(minutesSinceMidnight / 60);
  const m = minutesSinceMidnight % 60;
  return wallTimeInZoneToUtc(ymd, h, m, 0, timeZone).toISOString();
}

/** Kratki eng. dan u zoni za dati kalendar datum (podne smanjuje DST rub). */
function weekdayDayIdFromYmd(ymd, timeZone) {
  const noon = wallTimeInZoneToUtc(ymd, 12, 0, 0, timeZone);
  const short = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(noon);
  const map = {
    Mon: "mon",
    Tue: "tue",
    Wed: "wed",
    Thu: "thu",
    Fri: "fri",
    Sat: "sat",
    Sun: "sun",
  };
  return map[short] || null;
}

module.exports = {
  wallTimeInZoneToUtc,
  ymdInTimeZone,
  minutesSinceMidnightInZone,
  isoFromYmdAndMinutesInZone,
  weekdayDayIdFromYmd,
};
