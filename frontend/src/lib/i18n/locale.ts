/**
 * Salon Manager PRO — i18n utility
 *
 * Tanak sloj za prebacivanje jezika (sr / en).
 * Čuva izbor u localStorage. Default je "sr".
 *
 * Korišćenje:
 *   import { useTranslations } from "@/lib/i18n/locale";
 *   const t = useTranslations();
 *   t.common.save // "Sačuvaj" ili "Save"
 */

import { sr } from "./sr";
import { en } from "./en";

export type Locale = "sr" | "en";
export type Translations = typeof sr;

const STORAGE_KEY = "smpro-locale";

const locales: Record<Locale, Translations> = {
  sr,
  en: en as unknown as Translations,
};

/** Dohvati trenutni locale iz localStorage (SSR-safe). */
export function getLocale(): Locale {
  if (typeof window === "undefined") return "sr";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "en" || stored === "sr") return stored;
  } catch {
    // localStorage nedostupan
  }
  return "sr";
}

/** Postavi locale u localStorage. */
export function setLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // pass
  }
}

/** Dohvati prevode za trenutni locale. */
export function getTranslations(locale?: Locale): Translations {
  const l = locale ?? getLocale();
  return locales[l] ?? locales.sr;
}

/**
 * React hook — vraća prevode za trenutni locale.
 * Za sada čita jednom pri mount-u. Za reaktivno
 * prebacivanje, okini re-render iz language switcher-a.
 */
export function useTranslations(): Translations {
  // SSR-safe: uvek vrati sr na serveru
  if (typeof window === "undefined") return sr;
  return getTranslations();
}

/** Lista dostupnih jezika. */
export const AVAILABLE_LOCALES: { code: Locale; label: string }[] = [
  { code: "sr", label: "Srpski" },
  { code: "en", label: "English" },
];
