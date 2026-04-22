"use client";

import { useCallback, useState } from "react";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  type Locale,
  AVAILABLE_LOCALES,
  getLocale,
  setLocale,
} from "@/lib/i18n/locale";

type LanguageSwitcherProps = {
  className?: string;
  /** Compact mode — shows only flag/code, no label. */
  compact?: boolean;
};

export function LanguageSwitcher({
  className,
  compact = false,
}: LanguageSwitcherProps) {
  const [current, setCurrent] = useState<Locale>(() => getLocale());

  const toggle = useCallback(() => {
    const next: Locale = current === "sr" ? "en" : "sr";
    setLocale(next);
    setCurrent(next);
    // Reload to apply translations everywhere
    window.location.reload();
  }, [current]);

  const currentLabel =
    AVAILABLE_LOCALES.find((l) => l.code === current)?.label ?? "Srpski";

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className={cn(
          "flex size-9 items-center justify-center rounded-[var(--smp-radius-md)] text-xs font-bold uppercase transition-colors hover:bg-muted",
          className
        )}
        title={`Jezik: ${currentLabel}`}
        aria-label={`Promeni jezik. Trenutno: ${currentLabel}`}
      >
        {current.toUpperCase()}
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
      aria-label={`Promeni jezik. Trenutno: ${currentLabel}`}
    >
      <Globe className="size-4 shrink-0 opacity-70" aria-hidden />
      <span>{currentLabel}</span>
      <span className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
        {current}
      </span>
    </button>
  );
}
