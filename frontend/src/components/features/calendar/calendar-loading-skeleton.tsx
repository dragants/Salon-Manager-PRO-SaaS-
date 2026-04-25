"use client";
import { useT } from "@/lib/i18n/locale";

import { cn } from "@/lib/utils";

type Props = {
  view: "day" | "week";
  className?: string;
};

/** Skeleton dok se učitavaju termini — u skladu sa nedeljnim mrežom / listom dana. */
export function CalendarLoadingSkeleton({ view, className }: Props) {
  const t = useT();
  if (view === "day") {
    return (
      <div className={cn("space-y-3", className)} aria-busy="true" aria-label={t.common.loading}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-[var(--smp-radius-lg)] border border-border bg-card"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-[var(--smp-radius-lg)] border border-border bg-card p-3 shadow-[var(--smp-shadow-soft)]",
        className
      )}
      aria-busy="true"
      aria-label={t.calendar.loadingCalendar}
    >
      <div className="mb-2 h-4 w-48 animate-pulse rounded bg-muted" />
      <div className="flex gap-2">
        <div className="hidden w-9 shrink-0 flex-col gap-6 pt-8 sm:flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-2 w-7 animate-pulse rounded bg-muted"
            />
          ))}
        </div>
        <div className="grid min-h-[320px] w-full flex-1 grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg bg-gradient-to-b from-muted via-card to-muted"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
