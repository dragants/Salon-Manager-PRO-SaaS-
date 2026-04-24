"use client";

import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AVAILABLE_LOCALES,
  useLocale,
  type Locale,
} from "@/lib/i18n/locale";

type LanguageSwitcherProps = {
  className?: string;
  compact?: boolean;
};

export function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const { locale, setLocale } = useLocale();

  function toggle() {
    const next: Locale = locale === "sr" ? "en" : "sr";
    setLocale(next);
  }

  const current = AVAILABLE_LOCALES.find((l) => l.code === locale);
  const label = current?.label ?? "Srpski";

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex size-9 items-center justify-center rounded-[var(--smp-radius-md)] text-xs font-bold uppercase transition-colors hover:bg-muted",
          className
        )}
        title={label}
        aria-label={`Language: ${label}`}
      >
        {locale.toUpperCase()}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        "flex items-center gap-2 rounded-[var(--smp-radius-md)] px-3 py-2 text-sm font-medium transition-colors hover:bg-muted",
        className
      )}
      aria-label={`Language: ${label}`}
    >
      <Globe className="size-4 shrink-0 opacity-70" aria-hidden />
      <span>{label}</span>
      <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
        {locale}
      </span>
    </button>
  );
}
