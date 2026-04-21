const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const {
  parseHm,
  intervalsForDay,
  maxOrgCloseMinutes,
  rangeInsideOrgIntervals,
} = require("../src/utils/workingHoursIntervals");

describe("parseHm", () => {
  it("parses valid HH:MM strings", () => {
    assert.equal(parseHm("09:00"), 540);
    assert.equal(parseHm("0:00"), 0);
    assert.equal(parseHm("23:59"), 1439);
    assert.equal(parseHm("12:30"), 750);
  });

  it("returns null for invalid input", () => {
    assert.equal(parseHm(""), null);
    assert.equal(parseHm("abc"), null);
    assert.equal(parseHm(undefined), null);
    assert.equal(parseHm(null), null);
    assert.equal(parseHm(123), null);
  });
});

describe("intervalsForDay", () => {
  it("returns open-close interval for a normal day", () => {
    const wh = { mon: { enabled: true, open: "09:00", close: "17:00" } };
    assert.deepEqual(intervalsForDay(wh, "mon"), [[540, 1020]]);
  });

  it("returns empty for disabled day", () => {
    const wh = { mon: { enabled: false, open: "09:00", close: "17:00" } };
    assert.deepEqual(intervalsForDay(wh, "mon"), []);
  });

  it("returns empty for missing day", () => {
    assert.deepEqual(intervalsForDay({}, "tue"), []);
    assert.deepEqual(intervalsForDay(null, "tue"), []);
  });

  it("splits interval around break", () => {
    const wh = {
      wed: {
        enabled: true,
        open: "09:00",
        close: "17:00",
        break_start: "12:00",
        break_end: "13:00",
      },
    };
    const result = intervalsForDay(wh, "wed");
    assert.deepEqual(result, [
      [540, 720],   // 09:00-12:00
      [780, 1020],  // 13:00-17:00
    ]);
  });

  it("handles break at the very start of the day", () => {
    const wh = {
      thu: {
        enabled: true,
        open: "09:00",
        close: "17:00",
        break_start: "09:00",
        break_end: "10:00",
      },
    };
    const result = intervalsForDay(wh, "thu");
    assert.deepEqual(result, [[600, 1020]]); // 10:00-17:00
  });

  it("handles break at the very end of the day", () => {
    const wh = {
      fri: {
        enabled: true,
        open: "09:00",
        close: "17:00",
        break_start: "16:00",
        break_end: "17:00",
      },
    };
    const result = intervalsForDay(wh, "fri");
    assert.deepEqual(result, [[540, 960]]); // 09:00-16:00
  });

  it("ignores invalid break (start >= end)", () => {
    const wh = {
      sat: {
        enabled: true,
        open: "10:00",
        close: "18:00",
        break_start: "14:00",
        break_end: "14:00",
      },
    };
    assert.deepEqual(intervalsForDay(wh, "sat"), [[600, 1080]]);
  });

  it("returns empty when close <= open", () => {
    const wh = { sun: { enabled: true, open: "17:00", close: "09:00" } };
    assert.deepEqual(intervalsForDay(wh, "sun"), []);
  });
});

describe("maxOrgCloseMinutes", () => {
  it("returns the latest closing minute", () => {
    assert.equal(maxOrgCloseMinutes([[540, 720], [780, 1080]]), 1080);
  });

  it("returns null for empty intervals", () => {
    assert.equal(maxOrgCloseMinutes([]), null);
    assert.equal(maxOrgCloseMinutes(null), null);
  });
});

describe("rangeInsideOrgIntervals", () => {
  const intervals = [[540, 720], [780, 1020]]; // 09-12, 13-17

  it("returns true when range fits inside one interval", () => {
    assert.equal(rangeInsideOrgIntervals(540, 600, intervals), true); // 09:00-10:00
    assert.equal(rangeInsideOrgIntervals(780, 900, intervals), true); // 13:00-15:00
  });

  it("returns false when range spans a break", () => {
    assert.equal(rangeInsideOrgIntervals(700, 800, intervals), false); // 11:40-13:20
  });

  it("returns false when range is outside working hours", () => {
    assert.equal(rangeInsideOrgIntervals(480, 540, intervals), false); // 08:00-09:00
  });

  it("returns true when no intervals defined (no constraints)", () => {
    assert.equal(rangeInsideOrgIntervals(0, 1440, []), true);
    assert.equal(rangeInsideOrgIntervals(0, 1440, null), true);
  });
});
