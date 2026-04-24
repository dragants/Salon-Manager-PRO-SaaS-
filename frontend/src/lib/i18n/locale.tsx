/**
 * Salon Manager PRO — Reactive i18n
 *
 * Provides `useT()` hook and `<LocaleProvider>` context.
 * Locale changes re-render all consuming components without page reload.
 *
 * Usage:
 *   // In root layout:
 *   <LocaleProvider> ... </LocaleProvider>
 *
 *   // In any component:
 *   import { useT } from "@/lib/i18n/locale";
 *   const t = useT();
 *   t.common.save // "Sačuvaj" | "Save"
 */

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { sr } from "./sr";
import { en } from "./en";

export type Locale = "sr" | "en";
export type Translations = typeof sr;

const STORAGE_KEY = "smpro-locale";
const DEFAULT_LOCALE: Locale = "sr";

const locales: Record<Locale, Translations> = {
  sr,
  en: en as unknown as Translations,
};

/* ── Pure helpers (no React) ── */

export function getStoredLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "en" || v === "sr") return v;
  } catch {
    /* noop */
  }
  return DEFAULT_LOCALE;
}

function persistLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* noop */
  }
}

export function getTranslations(locale?: Locale): Translations {
  return locales[locale ?? getStoredLocale()] ?? locales.sr;
}

/* ── Context ── */

type LocaleContextValue = {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: sr,
  setLocale: () => {},
});

/* ── Provider ── */

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(getStoredLocale());
  }, []);

  const setLocale = useCallback((l: Locale) => {
    persistLocale(l);
    setLocaleState(l);
  }, []);

  const t = useMemo(() => locales[locale] ?? locales.sr, [locale]);

  const value = useMemo(
    () => ({ locale, t, setLocale }),
    [locale, t, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
  );
}

/* ── Hooks ── */

export function useT(): Translations {
  return useContext(LocaleContext).t;
}

export function useLocale(): {
  locale: Locale;
  setLocale: (l: Locale) => void;
} {
  const { locale, setLocale } = useContext(LocaleContext);
  return { locale, setLocale };
}

/**
 * Legacy alias — keep backward compat with existing code.
 * @deprecated Use `useT()` instead.
 */
export function useTranslations(): Translations {
  return useT();
}

export const AVAILABLE_LOCALES: { code: Locale; label: string; flag: string }[] =
  [
    { code: "sr", label: "Srpski", flag: "🇷🇸" },
    { code: "en", label: "English", flag: "🇬🇧" },
  ];
