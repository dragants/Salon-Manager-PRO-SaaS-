import { describe, expect, it } from "vitest";
import {
  formatYyyyMmDd,
  parseYyyyMmDd,
  addDays,
  startOfWeekMonday,
} from "@/lib/dateLocal";

describe("formatYyyyMmDd", () => {
  it("formats a date correctly", () => {
    const d = new Date(2025, 5, 15); // June 15
    expect(formatYyyyMmDd(d)).toBe("2025-06-15");
  });

  it("pads single-digit month and day", () => {
    const d = new Date(2025, 0, 5); // Jan 5
    expect(formatYyyyMmDd(d)).toBe("2025-01-05");
  });

  it("handles Dec 31", () => {
    const d = new Date(2025, 11, 31);
    expect(formatYyyyMmDd(d)).toBe("2025-12-31");
  });
});

describe("parseYyyyMmDd", () => {
  it("parses yyyy-mm-dd string to Date", () => {
    const d = parseYyyyMmDd("2025-06-15");
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(5); // 0-indexed
    expect(d.getDate()).toBe(15);
  });

  it("parses Jan 1st", () => {
    const d = parseYyyyMmDd("2025-01-01");
    expect(d.getFullYear()).toBe(2025);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(1);
  });

  it("round-trips with formatYyyyMmDd", () => {
    const original = "2025-03-20";
    const d = parseYyyyMmDd(original);
    expect(formatYyyyMmDd(d)).toBe(original);
  });
});

describe("addDays", () => {
  it("adds positive days", () => {
    const d = new Date(2025, 5, 15);
    const result = addDays(d, 3);
    expect(result.getDate()).toBe(18);
  });

  it("adds zero days (same date)", () => {
    const d = new Date(2025, 5, 15);
    const result = addDays(d, 0);
    expect(formatYyyyMmDd(result)).toBe("2025-06-15");
  });

  it("subtracts days with negative", () => {
    const d = new Date(2025, 5, 15);
    const result = addDays(d, -5);
    expect(result.getDate()).toBe(10);
  });

  it("crosses month boundary", () => {
    const d = new Date(2025, 0, 30); // Jan 30
    const result = addDays(d, 3);
    expect(result.getMonth()).toBe(1); // Feb
    expect(result.getDate()).toBe(2);
  });

  it("crosses year boundary", () => {
    const d = new Date(2025, 11, 30); // Dec 30
    const result = addDays(d, 5);
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(0); // Jan
  });

  it("does not mutate original date", () => {
    const d = new Date(2025, 5, 15);
    addDays(d, 10);
    expect(d.getDate()).toBe(15); // unchanged
  });
});

describe("startOfWeekMonday", () => {
  it("returns Monday for a Wednesday", () => {
    const wed = new Date(2025, 5, 18); // Wed June 18, 2025
    const mon = startOfWeekMonday(wed);
    expect(mon.getDay()).toBe(1); // Monday
    expect(formatYyyyMmDd(mon)).toBe("2025-06-16");
  });

  it("returns Monday for a Monday", () => {
    const mon = new Date(2025, 5, 16); // Mon June 16
    const result = startOfWeekMonday(mon);
    expect(result.getDay()).toBe(1);
    expect(formatYyyyMmDd(result)).toBe("2025-06-16");
  });

  it("returns previous Monday for a Sunday", () => {
    const sun = new Date(2025, 5, 22); // Sun June 22
    const mon = startOfWeekMonday(sun);
    expect(mon.getDay()).toBe(1);
    expect(formatYyyyMmDd(mon)).toBe("2025-06-16");
  });

  it("handles month boundary (Sunday June 1 → Monday May 26)", () => {
    const sun = new Date(2025, 5, 1); // Sun June 1
    const mon = startOfWeekMonday(sun);
    expect(mon.getDay()).toBe(1);
    expect(mon.getMonth()).toBe(4); // May
    expect(mon.getDate()).toBe(26);
  });

  it("does not mutate original date", () => {
    const d = new Date(2025, 5, 18);
    startOfWeekMonday(d);
    expect(d.getDate()).toBe(18);
  });
});
