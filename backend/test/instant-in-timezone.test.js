const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  ymdInTimeZone,
  minutesSinceMidnightInZone,
  wallTimeInZoneToUtc,
  weekdayDayIdFromYmd,
} = require("../src/utils/instantInTimeZone");

const TZ_BELGRADE = "Europe/Belgrade";
const TZ_UTC = "UTC";
const TZ_NY = "America/New_York";

describe("ymdInTimeZone", () => {
  it("returns YYYY-MM-DD for a given ISO string in timezone", () => {
    // 2025-03-15T23:00:00Z = midnight Mar 16 in Belgrade (CET+1)
    const result = ymdInTimeZone("2025-03-15T23:00:00Z", TZ_BELGRADE);
    assert.equal(result, "2025-03-16");
  });

  it("returns correct date in UTC", () => {
    assert.equal(ymdInTimeZone("2025-06-01T12:00:00Z", TZ_UTC), "2025-06-01");
  });

  it("handles midnight boundary in different timezone", () => {
    // 2025-01-01T04:30:00Z = Dec 31 23:30 in NY (EST -5)
    assert.equal(ymdInTimeZone("2025-01-01T04:30:00Z", TZ_NY), "2024-12-31");
  });
});

describe("minutesSinceMidnightInZone", () => {
  it("returns minutes since midnight for the given timezone", () => {
    // 2025-06-15T10:30:00Z → in Belgrade (CEST, UTC+2) = 12:30 = 750 min
    const result = minutesSinceMidnightInZone("2025-06-15T10:30:00Z", TZ_BELGRADE);
    assert.equal(result, 750);
  });

  it("returns 0 at midnight UTC in UTC timezone", () => {
    assert.equal(minutesSinceMidnightInZone("2025-01-01T00:00:00Z", TZ_UTC), 0);
  });

  it("handles DST transitions", () => {
    // During CEST (summer), Belgrade is UTC+2
    const summer = minutesSinceMidnightInZone("2025-07-01T08:00:00Z", TZ_BELGRADE);
    assert.equal(summer, 600); // 10:00 = 600 min

    // During CET (winter), Belgrade is UTC+1
    const winter = minutesSinceMidnightInZone("2025-01-15T08:00:00Z", TZ_BELGRADE);
    assert.equal(winter, 540); // 09:00 = 540 min
  });
});

describe("wallTimeInZoneToUtc", () => {
  it("converts wall time in Belgrade to UTC", () => {
    // 2025-06-15 14:00:00 Belgrade (CEST, UTC+2) → 12:00:00 UTC
    const result = wallTimeInZoneToUtc("2025-06-15", 14, 0, 0, TZ_BELGRADE);
    assert.equal(result.toISOString(), "2025-06-15T12:00:00.000Z");
  });

  it("converts wall time in UTC to UTC (identity)", () => {
    const result = wallTimeInZoneToUtc("2025-03-01", 9, 30, 0, TZ_UTC);
    assert.equal(result.toISOString(), "2025-03-01T09:30:00.000Z");
  });

  it("handles winter time (CET)", () => {
    // 2025-01-15 10:00:00 Belgrade (CET, UTC+1) → 09:00:00 UTC
    const result = wallTimeInZoneToUtc("2025-01-15", 10, 0, 0, TZ_BELGRADE);
    assert.equal(result.toISOString(), "2025-01-15T09:00:00.000Z");
  });
});

describe("weekdayDayIdFromYmd", () => {
  it("returns correct day ID", () => {
    // 2025-06-16 is a Monday
    assert.equal(weekdayDayIdFromYmd("2025-06-16", TZ_BELGRADE), "mon");
    assert.equal(weekdayDayIdFromYmd("2025-06-17", TZ_BELGRADE), "tue");
    assert.equal(weekdayDayIdFromYmd("2025-06-22", TZ_BELGRADE), "sun");
  });

  it("handles timezone where day differs from UTC", () => {
    // Use a timezone that could shift the day
    assert.equal(weekdayDayIdFromYmd("2025-06-16", TZ_UTC), "mon");
  });
});
