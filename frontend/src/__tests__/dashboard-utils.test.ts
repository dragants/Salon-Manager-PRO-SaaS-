import { describe, expect, it } from "vitest";
import {
  orgTimeZone,
  displayNameFromEmail,
  emailLocalPart,
  cumulativeSeries,
  statusLabel,
  statusStyles,
  averageOpenMinutesPerDay,
  averageServiceDurationMinutes,
  estimatedSlotsPerDay,
  DEFAULT_TZ,
} from "@/components/features/dashboard/dashboard-utils";

describe("orgTimeZone", () => {
  it("returns setting when provided", () => {
    expect(orgTimeZone("America/New_York")).toBe("America/New_York");
  });
  it("returns default for null", () => {
    expect(orgTimeZone(null)).toBe(DEFAULT_TZ);
  });
  it("returns default for empty string", () => {
    expect(orgTimeZone("")).toBe(DEFAULT_TZ);
  });
  it("trims whitespace", () => {
    expect(orgTimeZone("  Europe/London  ")).toBe("Europe/London");
  });
});

describe("displayNameFromEmail", () => {
  it("capitalizes first part of email", () => {
    expect(displayNameFromEmail("marija@test.rs")).toBe("Marija");
  });
  it("splits on dots", () => {
    expect(displayNameFromEmail("marija.petrovic@test.rs")).toBe("Marija");
  });
  it("splits on dashes", () => {
    expect(displayNameFromEmail("marija-petrovic@test.rs")).toBe("Marija");
  });
  it("returns empty for undefined", () => {
    expect(displayNameFromEmail(undefined)).toBe("");
  });
  it("returns empty for empty string", () => {
    expect(displayNameFromEmail("")).toBe("");
  });
});

describe("emailLocalPart", () => {
  it("returns local part", () => {
    expect(emailLocalPart("user@example.com")).toBe("user");
  });
  it("returns empty for undefined", () => {
    expect(emailLocalPart(undefined)).toBe("");
  });
});

describe("cumulativeSeries", () => {
  it("accumulates values", () => {
    expect(cumulativeSeries([1, 2, 3])).toEqual([1, 3, 6]);
  });
  it("handles single value", () => {
    expect(cumulativeSeries([5])).toEqual([5]);
  });
  it("handles empty array", () => {
    expect(cumulativeSeries([])).toEqual([]);
  });
  it("handles zeros", () => {
    expect(cumulativeSeries([0, 0, 5])).toEqual([0, 0, 5]);
  });
});

describe("statusLabel", () => {
  it("returns label for each status", () => {
    expect(statusLabel("scheduled")).toBe("Zakazano");
    expect(statusLabel("completed")).toBe("Završeno");
    expect(statusLabel("no_show")).toBe("Nije došao");
    expect(statusLabel("cancelled")).toBe("Otkazano");
  });
  it("returns raw status for unknown", () => {
    expect(statusLabel("unknown" as any)).toBe("unknown");
  });
});

describe("statusStyles", () => {
  it("returns emerald for completed", () => {
    expect(statusStyles("completed")).toContain("emerald");
  });
  it("returns red for no_show", () => {
    expect(statusStyles("no_show")).toContain("red");
  });
  it("returns slate for cancelled", () => {
    expect(statusStyles("cancelled")).toContain("slate");
  });
  it("returns primary for scheduled", () => {
    expect(statusStyles("scheduled")).toContain("primary");
  });
});

describe("averageOpenMinutesPerDay", () => {
  it("calculates average for standard schedule", () => {
    const wh = {
      mon: { open: true, from: "09:00", to: "17:00" },
      tue: { open: true, from: "09:00", to: "17:00" },
      wed: { open: true, from: "09:00", to: "17:00" },
      thu: { open: true, from: "09:00", to: "17:00" },
      fri: { open: true, from: "09:00", to: "17:00" },
      sat: { open: false },
      sun: { open: false },
    };
    expect(averageOpenMinutesPerDay(wh)).toBe(480); // 8h * 60min
  });

  it("returns null for empty/undefined", () => {
    expect(averageOpenMinutesPerDay(undefined)).toBeNull();
    expect(averageOpenMinutesPerDay({})).toBeNull();
  });

  it("handles mixed schedules", () => {
    const wh = {
      mon: { open: true, from: "09:00", to: "17:00" }, // 480
      tue: { open: true, from: "10:00", to: "14:00" }, // 240
      wed: { open: false },
    };
    expect(averageOpenMinutesPerDay(wh)).toBe(360); // (480+240)/2
  });
});

describe("averageServiceDurationMinutes", () => {
  it("calculates average", () => {
    const services = [
      { id: 1, duration: 30 },
      { id: 2, duration: 60 },
      { id: 3, duration: 90 },
    ] as any[];
    expect(averageServiceDurationMinutes(services)).toBe(60);
  });

  it("returns null for empty", () => {
    expect(averageServiceDurationMinutes([])).toBeNull();
    expect(averageServiceDurationMinutes(undefined)).toBeNull();
  });
});

describe("estimatedSlotsPerDay", () => {
  it("calculates slots", () => {
    expect(estimatedSlotsPerDay(480, 60)).toBe(8);
    expect(estimatedSlotsPerDay(480, 30)).toBe(16);
  });

  it("returns null for missing data", () => {
    expect(estimatedSlotsPerDay(null, 60)).toBeNull();
    expect(estimatedSlotsPerDay(480, null)).toBeNull();
    expect(estimatedSlotsPerDay(null, null)).toBeNull();
  });

  it("returns null for zero duration", () => {
    expect(estimatedSlotsPerDay(480, 0)).toBeNull();
  });

  it("floors partial slots", () => {
    expect(estimatedSlotsPerDay(100, 30)).toBe(3); // 100/30 = 3.33
  });
});
