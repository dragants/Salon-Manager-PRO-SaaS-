import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DashboardKpiAccent =
  | "sky"
  | "emerald"
  | "violet"
  | "amber"
  | "rose"
  | "slate";

/** Leva ivica + gradient preko theme tokena (light/dark). */
const accentClass: Record<DashboardKpiAccent, string> = {
  sky: "border-l-primary from-primary/14 via-card to-muted/40",
  emerald:
    "border-l-emerald-500 from-emerald-500/12 via-card to-muted/40",
  violet:
    "border-l-violet-500 from-violet-500/12 via-card to-muted/40",
  amber:
    "border-l-primary from-primary/10 via-card to-muted/40",
  rose: "border-l-rose-500 from-rose-500/10 via-card to-muted/40",
  slate:
    "border-l-slate-500 from-slate-500/10 via-card to-muted/40",
};

type DashboardKpiCardProps = {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  accent: DashboardKpiAccent;
  hint?: string;
  /** Ističe karticu (npr. prihod). */
  dominant?: boolean;
  /** Za duži tekst (npr. sledeći termin) umesto tabular-2xl. */
  valueClassName?: string;
};

export function DashboardKpiCard({
  title,
  value,
  icon,
  accent,
  hint,
  dominant = false,
  valueClassName,
}: DashboardKpiCardProps) {
  return (
    <div
      className={cn(
        "group relative min-h-[100px] overflow-hidden rounded-[var(--lux-radius-lg)] border border-border border-l-4 bg-gradient-to-br p-4 transition-all duration-200 sm:p-5",
        "shadow-[var(--lux-shadow-soft)]",
        "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--lux-shadow-hover)]",
        accentClass[accent],
        dominant && "z-[1] ring-1 ring-primary/40"
      )}
    >
      <div
        className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full bg-primary/12 blur-2xl"
        aria-hidden
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {title}
          </p>
          <div
            className={cn(
              "mt-1.5 font-bold tracking-tight text-foreground",
              valueClassName ?? "text-[26px] leading-none tabular-nums sm:text-[28px]"
            )}
          >
            {value}
          </div>
          {hint ? (
            <p className="mt-1.5 text-sm leading-snug text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-primary shadow-inner ring-1 ring-border transition group-hover:bg-primary/10 group-hover:ring-primary/25"
          aria-hidden
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
