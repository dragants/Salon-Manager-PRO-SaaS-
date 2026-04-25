import { describe, expect, it } from "vitest";
import {
  hueFromString,
  initialsFromName,
  todayYmdLocal,
} from "@/components/features/booking/booking-shared";

describe("hueFromString", () => {
  it("returns a number between 0 and 359", () => {
    const hue = hueFromString("test");
    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });

  it("is deterministic (same input, same output)", () => {
    expect(hueFromString("Marija")).toBe(hueFromString("Marija"));
  });

  it("different strings produce different hues (usually)", () => {
    const a = hueFromString("Alice");
    const b = hueFromString("Bob");
    expect(a).not.toBe(b);
  });

  it("handles empty string", () => {
    const hue = hueFromString("");
    expect(hue).toBe(0);
  });

  it("handles unicode characters", () => {
    const hue = hueFromString("Đorđe Šćepanović");
    expect(hue).toBeGreaterThanOrEqual(0);
    expect(hue).toBeLessThan(360);
  });
});

describe("initialsFromName", () => {
  it("returns two initials for first + last name", () => {
    expect(initialsFromName("Marija Petrović")).toBe("MP");
  });

  it("returns first two chars for single name", () => {
    expect(initialsFromName("Dragan")).toBe("DR");
  });

  it("returns ? for empty string", () => {
    expect(initialsFromName("")).toBe("?");
  });

  it("returns ? for whitespace-only", () => {
    expect(initialsFromName("   ")).toBe("?");
  });

  it("uses first letter of first two words for >2 words", () => {
    expect(initialsFromName("Ana Marija Petrović")).toBe("AM");
  });

  it("handles single character name", () => {
    const result = initialsFromName("A");
    expect(result.length).toBe(1);
    expect(result).toBe("A");
  });

  it("uppercases results", () => {
    expect(initialsFromName("ana petrović")).toBe("AP");
  });
});

describe("todayYmdLocal", () => {
  it("returns yyyy-mm-dd format", () => {
    const result = todayYmdLocal();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns today's date", () => {
    const today = new Date();
    const expected = today.toLocaleDateString("en-CA");
    expect(todayYmdLocal()).toBe(expected);
  });
});
