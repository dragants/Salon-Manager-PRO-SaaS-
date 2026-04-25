import { describe, expect, it } from "vitest";
import { hexToRgbSpaceSeparated } from "@/lib/color-hex";

describe("hexToRgbSpaceSeparated", () => {
  it("parses 6-digit hex with #", () => {
    expect(hexToRgbSpaceSeparated("#ff5733")).toBe("255 87 51");
  });

  it("parses 6-digit hex without #", () => {
    expect(hexToRgbSpaceSeparated("ff5733")).toBe("255 87 51");
  });

  it("parses black", () => {
    expect(hexToRgbSpaceSeparated("#000000")).toBe("0 0 0");
  });

  it("parses white", () => {
    expect(hexToRgbSpaceSeparated("#ffffff")).toBe("255 255 255");
  });

  it("parses 3-digit shorthand with #", () => {
    expect(hexToRgbSpaceSeparated("#f00")).toBe("255 0 0");
  });

  it("parses 3-digit shorthand without #", () => {
    expect(hexToRgbSpaceSeparated("0af")).toBe("0 170 255");
  });

  it("is case insensitive", () => {
    expect(hexToRgbSpaceSeparated("#FF5733")).toBe("255 87 51");
    expect(hexToRgbSpaceSeparated("#Ff5733")).toBe("255 87 51");
  });

  it("trims whitespace", () => {
    expect(hexToRgbSpaceSeparated("  #ff5733  ")).toBe("255 87 51");
  });

  it("returns null for invalid input", () => {
    expect(hexToRgbSpaceSeparated("")).toBeNull();
    expect(hexToRgbSpaceSeparated("xyz")).toBeNull();
    expect(hexToRgbSpaceSeparated("#gggggg")).toBeNull();
    expect(hexToRgbSpaceSeparated("#12345")).toBeNull(); // 5 digits
  });

  it("returns null for rgb() format", () => {
    expect(hexToRgbSpaceSeparated("rgb(255,0,0)")).toBeNull();
  });
});
