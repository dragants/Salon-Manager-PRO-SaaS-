import { describe, expect, it } from "vitest";
import {
  orgTimeZone,
  lastDayOfMonthYmd,
  formatExpenseMonthLabel,
  DEFAULT_TZ,
  MAX_MONTHLY_OVERHEAD_RSD,
} from "@/components/features/finances/finances-utils";

describe("orgTimeZone", () => {
  it("returns setting when provided", () => {
    expect(orgTimeZone("America/New_York")).toBe("America/New_York");
  });

  it("returns default for null", () => {
    expect(orgTimeZone(null)).toBe(DEFAULT_TZ);
  });

  it("returns default for undefined", () => {
    expect(orgTimeZone(undefined)).toBe(DEFAULT_TZ);
  });

  it("returns default for empty string", () => {
    expect(orgTimeZone("")).toBe(DEFAULT_TZ);
  });

  it("returns default for whitespace", () => {
    expect(orgTimeZone("   ")).toBe(DEFAULT_TZ);
  });

  it("trims whitespace from setting", () => {
    expect(orgTimeZone("  Europe/London  ")).toBe("Europe/London");
  });

  it("default is Europe/Belgrade", () => {
    expect(DEFAULT_TZ).toBe("Europe/Belgrade");
  });
});

describe("lastDayOfMonthYmd", () => {
  it("January has 31 days", () => {
    expect(lastDayOfMonthYmd(2025, 1)).toBe("2025-01-31");
  });

  it("February has 28 days in non-leap year", () => {
    expect(lastDayOfMonthYmd(2025, 2)).toBe("2025-02-28");
  });

  it("February has 29 days in leap year", () => {
    expect(lastDayOfMonthYmd(2024, 2)).toBe("2024-02-29");
  });

  it("April has 30 days", () => {
    expect(lastDayOfMonthYmd(2025, 4)).toBe("2025-04-30");
  });

  it("December has 31 days", () => {
    expect(lastDayOfMonthYmd(2025, 12)).toBe("2025-12-31");
  });

  it("pads single-digit month", () => {
    expect(lastDayOfMonthYmd(2025, 3)).toBe("2025-03-31");
  });
});

describe("formatExpenseMonthLabel", () => {
  it("formats valid month", () => {
    const result = formatExpenseMonthLabel("2025-06");
    expect(result).toBeTruthy();
    expect(result.length).toBeGreaterThan(3);
  });

  it("returns raw string for invalid input", () => {
    expect(formatExpenseMonthLabel("bad")).toBe("bad");
  });

  it("returns raw string for month 0", () => {
    expect(formatExpenseMonthLabel("2025-00")).toBe("2025-00");
  });

  it("returns raw string for month 13", () => {
    expect(formatExpenseMonthLabel("2025-13")).toBe("2025-13");
  });
});

describe("MAX_MONTHLY_OVERHEAD_RSD", () => {
  it("is a large positive number", () => {
    expect(MAX_MONTHLY_OVERHEAD_RSD).toBeGreaterThan(0);
    expect(MAX_MONTHLY_OVERHEAD_RSD).toBe(999_999_999);
  });
});
