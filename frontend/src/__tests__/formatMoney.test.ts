import { describe, expect, it } from "vitest";
import { formatRsd } from "@/lib/formatMoney";

describe("formatRsd", () => {
  it("formats a positive number", () => {
    const result = formatRsd(1500);
    expect(result).toContain("1.500");
    expect(result).toContain("RSD");
  });

  it("formats zero", () => {
    const result = formatRsd(0);
    expect(result).toContain("0");
    expect(result).toContain("RSD");
  });

  it("formats a string number", () => {
    const result = formatRsd("2500.50");
    expect(result).toContain("2.501"); // rounds to nearest integer
    expect(result).toContain("RSD");
  });

  it("returns dash for null", () => {
    expect(formatRsd(null)).toBe("—");
  });

  it("returns dash for undefined", () => {
    expect(formatRsd(undefined)).toBe("—");
  });

  it("returns dash for NaN string", () => {
    expect(formatRsd("abc")).toBe("—");
  });

  it("returns dash for empty string", () => {
    expect(formatRsd("")).toBe("—");
  });

  it("formats negative number", () => {
    const result = formatRsd(-500);
    expect(result).toContain("500");
    expect(result).toContain("RSD");
  });

  it("handles large numbers with thousands separator", () => {
    const result = formatRsd(1234567);
    expect(result).toContain("1.234.567");
  });
});
