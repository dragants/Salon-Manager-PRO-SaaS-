"use client";

import { cn } from "@/lib/utils";

type Props = {
  view: "day" | "week";
  className?: string;
};

/** Skeleton dok se učitavaju termini — u skladu sa nedeljnim mrežom / listom dana. */
export function CalendarLoadingSkeleton({ view, className }: Props) {
  if (view === "day") {
    return (
      <div className={cn("space-y-3", className)} aria-busy="true" aria-label="Učitavanje">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-xl border border-sky-100/80 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-sky-100 bg-white p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40",
        className
      )}
      aria-busy="true"
      aria-label="Učitavanje kalendara"
    >
      <div className="mb-2 h-4 w-48 animate-pulse rounded bg-slate-200 dark:bg-slate-700" />
      <div className="flex gap-2">
        <div className="hidden w-9 shrink-0 flex-col gap-6 pt-8 sm:flex">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-2 w-7 animate-pulse rounded bg-slate-200 dark:bg-slate-700"
            />
          ))}
        </div>
        <div className="grid min-h-[320px] w-full flex-1 grid-cols-7 gap-1">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-lg bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-900"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
