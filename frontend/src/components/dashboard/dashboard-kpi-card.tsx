import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type DashboardKpiAccent =
  | "sky"
  | "emerald"
  | "violet"
  | "amber"
  | "rose"
  | "slate";

const accentClass: Record<DashboardKpiAccent, string> = {
  sky: "border-l-sky-500 from-sky-50/80",
  emerald: "border-l-emerald-500 from-emerald-50/80",
  violet: "border-l-violet-500 from-violet-50/80",
  amber: "border-l-amber-500 from-amber-50/80",
  rose: "border-l-rose-500 from-rose-50/80",
  slate: "border-l-slate-400 from-slate-50/80",
};

type DashboardKpiCardProps = {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  accent: DashboardKpiAccent;
  hint?: string;
  /** Ističe karticu (npr. prihod danas). */
  dominant?: boolean;
};

export function DashboardKpiCard({
  title,
  value,
  icon,
  accent,
  hint,
  dominant = false,
}: DashboardKpiCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-zinc-200/90 border-l-4 bg-gradient-to-br to-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)] transition-all duration-200 dark:border-zinc-700/90 dark:to-zinc-950",
        "hover:-translate-y-0.5 hover:border-zinc-300/90 hover:shadow-[0_8px_28px_rgba(0,0,0,0.08)] dark:hover:border-zinc-600",
        accentClass[accent],
        dominant &&
          "z-[1] scale-[1.02] shadow-md ring-2 ring-emerald-300/45 dark:ring-emerald-700/50"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 tabular-nums dark:text-slate-50">
            {value}
          </p>
          {hint ? (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {hint}
            </p>
          ) : null}
        </div>
        <div
          className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-zinc-50 text-zinc-500 shadow-sm ring-1 ring-zinc-200/80 transition group-hover:text-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-700"
          aria-hidden
        >
          {icon}
        </div>
      </div>
    </div>
  );
}
