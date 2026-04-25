import { describe, expect, it } from "vitest";
import {
  STATUS_LABEL,
  statusLabel,
  statusBadgeClass,
  statusAccentBorder,
} from "@/components/features/calendar/calendar-constants";
import { sr } from "@/lib/i18n/sr";
import { en } from "@/lib/i18n/en";
import type { AppointmentStatus } from "@/types/appointment";

const ALL_STATUSES: AppointmentStatus[] = [
  "scheduled",
  "completed",
  "no_show",
  "cancelled",
];

describe("STATUS_LABEL", () => {
  it("has labels for all statuses", () => {
    for (const s of ALL_STATUSES) {
      expect(STATUS_LABEL[s]).toBeTruthy();
      expect(typeof STATUS_LABEL[s]).toBe("string");
    }
  });
});

describe("statusLabel", () => {
  it("returns fallback labels without translations", () => {
    expect(statusLabel("scheduled")).toBe("Zakazano");
    expect(statusLabel("completed")).toBe("Završeno");
    expect(statusLabel("no_show")).toBe("Nije došao");
    expect(statusLabel("cancelled")).toBe("Otkazano");
  });

  it("returns Serbian labels with sr translations", () => {
    expect(statusLabel("scheduled", sr)).toBe("Zakazano");
    expect(statusLabel("completed", sr)).toBe("Završeno");
  });

  it("returns English labels with en translations", () => {
    const t = en as unknown as typeof sr;
    expect(statusLabel("scheduled", t)).toBe("Scheduled");
    expect(statusLabel("completed", t)).toBe("Completed");
    expect(statusLabel("no_show", t)).toBe("No-show");
    expect(statusLabel("cancelled", t)).toBe("Cancelled");
  });
});

describe("statusBadgeClass", () => {
  it("returns non-empty class for all statuses", () => {
    for (const s of ALL_STATUSES) {
      expect(statusBadgeClass(s).length).toBeGreaterThan(0);
    }
  });

  it("returns primary class for scheduled", () => {
    expect(statusBadgeClass("scheduled")).toContain("primary");
  });

  it("returns emerald class for completed", () => {
    expect(statusBadgeClass("completed")).toContain("emerald");
  });

  it("returns red class for no_show", () => {
    expect(statusBadgeClass("no_show")).toContain("red");
  });

  it("returns slate class for cancelled", () => {
    expect(statusBadgeClass("cancelled")).toContain("slate");
  });
});

describe("statusAccentBorder", () => {
  it("returns border class for all statuses", () => {
    for (const s of ALL_STATUSES) {
      expect(statusAccentBorder(s)).toContain("border-l-");
    }
  });
});
