import { describe, expect, it, beforeEach, vi } from "vitest";
import { getStoredLocale, getTranslations } from "@/lib/i18n/locale";
import { sr } from "@/lib/i18n/sr";
import { en } from "@/lib/i18n/en";

describe("i18n: getStoredLocale", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("returns 'sr' as default", () => {
    expect(getStoredLocale()).toBe("sr");
  });

  it("returns 'en' when stored", () => {
    localStorage.setItem("smpro-locale", "en");
    expect(getStoredLocale()).toBe("en");
  });

  it("returns 'sr' for invalid stored value", () => {
    localStorage.setItem("smpro-locale", "fr");
    expect(getStoredLocale()).toBe("sr");
  });
});

describe("i18n: getTranslations", () => {
  it("returns Serbian translations for 'sr'", () => {
    const t = getTranslations("sr");
    expect(t.common.save).toBe("Sačuvaj");
    expect(t.common.cancel).toBe("Otkaži");
  });

  it("returns English translations for 'en'", () => {
    const t = getTranslations("en");
    expect(t.common.save).toBe("Save");
    expect(t.common.cancel).toBe("Cancel");
  });

  it("defaults to 'sr' for undefined locale", () => {
    const t = getTranslations();
    expect(t.common.save).toBe("Sačuvaj");
  });
});

describe("i18n: translation structure parity", () => {
  function getKeys(obj: Record<string, unknown>, prefix = ""): string[] {
    const keys: string[] = [];
    for (const [k, v] of Object.entries(obj)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === "object" && !Array.isArray(v)) {
        keys.push(...getKeys(v as Record<string, unknown>, path));
      } else {
        keys.push(path);
      }
    }
    return keys;
  }

  it("en.ts has all top-level sections from sr.ts", () => {
    const srSections = Object.keys(sr);
    const enSections = Object.keys(en);
    for (const section of srSections) {
      expect(enSections).toContain(section);
    }
  });

  it("common section keys match between sr and en", () => {
    const srKeys = getKeys(sr.common as unknown as Record<string, unknown>);
    const enKeys = getKeys(en.common as unknown as Record<string, unknown>);
    for (const key of srKeys) {
      expect(enKeys, `Missing en.common.${key}`).toContain(key);
    }
  });

  it("calendar section keys match between sr and en", () => {
    const srKeys = Object.keys(sr.calendar);
    const enKeys = Object.keys(en.calendar);
    for (const key of srKeys) {
      expect(enKeys, `Missing en.calendar.${key}`).toContain(key);
    }
  });

  it("booking section keys match between sr and en", () => {
    const srKeys = Object.keys(sr.booking);
    const enKeys = Object.keys(en.booking);
    for (const key of srKeys) {
      expect(enKeys, `Missing en.booking.${key}`).toContain(key);
    }
  });

  it("nav.sidebar.items keys match between sr and en", () => {
    const srKeys = Object.keys(sr.nav.sidebar.items);
    const enKeys = Object.keys(en.nav.sidebar.items);
    for (const key of srKeys) {
      expect(enKeys, `Missing en.nav.sidebar.items.${key}`).toContain(key);
    }
  });

  it("status labels exist in both languages", () => {
    expect(sr.common.status.scheduled).toBeTruthy();
    expect(sr.common.status.completed).toBeTruthy();
    expect(sr.common.status.no_show).toBeTruthy();
    expect(sr.common.status.cancelled).toBeTruthy();

    expect(en.common.status.scheduled).toBeTruthy();
    expect(en.common.status.completed).toBeTruthy();
    expect(en.common.status.no_show).toBeTruthy();
    expect(en.common.status.cancelled).toBeTruthy();
  });

  it("no empty string values in sr translations", () => {
    const srKeys = getKeys(sr as unknown as Record<string, unknown>);
    for (const key of srKeys) {
      const parts = key.split(".");
      let val: unknown = sr;
      for (const p of parts) val = (val as Record<string, unknown>)[p];
      if (typeof val === "string") {
        expect(val.length, `sr.${key} is empty`).toBeGreaterThan(0);
      }
    }
  });
});
