import { describe, expect, it } from "vitest";
import { telHref, mapsSearchUrl } from "@/lib/contact-links";

describe("telHref", () => {
  it("formats a standard phone number", () => {
    expect(telHref("+381641234567")).toBe("tel:+381641234567");
  });

  it("strips spaces, dashes, parens, dots", () => {
    expect(telHref("+381 (64) 123-4567")).toBe("tel:+381641234567");
    expect(telHref("064.123.4567")).toBe("tel:0641234567");
  });

  it("returns null for null", () => {
    expect(telHref(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(telHref(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(telHref("")).toBeNull();
  });

  it("returns null for whitespace-only", () => {
    expect(telHref("   ")).toBeNull();
  });

  it("trims surrounding whitespace", () => {
    expect(telHref("  +38164  ")).toBe("tel:+38164");
  });
});

describe("mapsSearchUrl", () => {
  it("generates Google Maps URL for address", () => {
    const result = mapsSearchUrl("Knez Mihailova 12, Beograd");
    expect(result).toContain("google.com/maps/search");
    expect(result).toContain("Knez");
    expect(result).toContain("Beograd");
  });

  it("encodes special characters", () => {
    const result = mapsSearchUrl("Bulevar Kralja Aleksandra 73");
    expect(result).toContain(encodeURIComponent("Bulevar Kralja Aleksandra 73"));
  });

  it("returns null for null", () => {
    expect(mapsSearchUrl(null)).toBeNull();
  });

  it("returns null for undefined", () => {
    expect(mapsSearchUrl(undefined)).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(mapsSearchUrl("")).toBeNull();
  });

  it("returns null for whitespace-only", () => {
    expect(mapsSearchUrl("   ")).toBeNull();
  });

  it("trims the address", () => {
    const result = mapsSearchUrl("  Beograd  ");
    expect(result).toContain("Beograd");
    expect(result).not.toContain("++");
  });
});
