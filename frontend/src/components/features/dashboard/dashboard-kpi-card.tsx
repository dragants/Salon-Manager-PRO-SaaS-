import type { ReactNode } from "react";
import { TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export type DashboardKpiAccent =
  | "sky"
  | "emerald"
  | "violet"
  | "amber"
  | "rose"
  | "slate";

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

const sparkColors: Record<DashboardKpiAccent, string> = {
  sky: "rgb(91 33 182)",
  emerald: "rgb(16 185 129)",
  violet: "rgb(139 92 246)",
  amber: "rgb(245 158 11)",
  rose: "rgb(244 63 94)",
  slate: "rgb(100 116 139)",
};

/* ── Mini SVG sparkline ── */

function Sparkline({
  data,
  color,
  className,
}: {
  data: number[];
  color: string;
  className?: string;
}) {
  if (data.length < 2) return null;

  const w = 80;
  const h = 28;
  const pad = 2;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
    const y = h - pad - ((v - min) / range) * (h - 2 * pad);
    return `${x},${y}`;
  });

  const fillPoints = [
    `${pad},${h}`,
    ...points,
    `${w - pad},${h}`,
  ].join(" ");

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      aria-hidden
    >
      <polygon
        points={fillPoints}
        fill={color}
        fillOpacity="0.08"
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {(() => {
        const last = points[points.length - 1];
        const [cx, cy] = last.split(",").map(Number);
        return (
          <circle
            cx={cx}
            cy={cy}
            r="2"
            fill={color}
          />
        );
      })()}
    </svg>
  );
}

/* ── Trend badge ── */

function TrendBadge({
  percent,
  positive,
}: {
  percent: number;
  positive: boolean;
}) {
  const isUp = percent >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
        isUp && positive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : isUp && !positive
            ? "bg-red-500/10 text-red-600 dark:text-red-400"
            : !isUp && positive
              ? "bg-red-500/10 text-red-600 dark:text-red-400"
              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      )}
    >
      {isUp ? (
        <TrendingUp className="size-3" aria-hidden />
      ) : (
        <TrendingDown className="size-3" aria-hidden />
      )}
      {Math.abs(percent)}%
    </span>
  );
}

/* ── Card ── */

type DashboardKpiCardProps = {
  title: string;
  value: ReactNode;
  icon: ReactNode;
  accent: DashboardKpiAccent;
  hint?: string;
  dominant?: boolean;
  valueClassName?: string;
  /** Mini sparkline data (e.g. last 7 days). At least 2 points. */
  sparkData?: number[];
  /** Trend percentage vs previous period. Positive = up. */
  trendPercent?: number;
  /** Whether "up" is good (true for revenue/clients) or bad (false for no-shows). */
  trendPositive?: boolean;
};

export function DashboardKpiCard({
  title,
  value,
  icon,
  accent,
  hint,
  dominant = false,
  valueClassName,
  sparkData,
  trendPercent,
  trendPositive = true,
}: DashboardKpiCardProps) {
  return (
    <div
      className={cn(
        "group relative min-h-[100px] overflow-hidden rounded-[var(--smp-radius-lg)] border border-border border-l-4 bg-gradient-to-br p-4 transition-all duration-200 sm:p-5",
        "shadow-[var(--smp-shadow-soft)]",
        "hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[var(--smp-shadow-hover)]",
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
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground">
              {title}
            </p>
            {trendPercent !== undefined ? (
              <TrendBadge
                percent={trendPercent}
                positive={trendPositive}
              />
            ) : null}
          </div>
          <div
            className={cn(
              "mt-1.5 font-bold tracking-tight text-foreground",
              valueClassName ??
                "text-[26px] leading-none tabular-nums sm:text-[28px]"
            )}
          >
            {value}
          </div>
          {hint ? (
            <p className="mt-1.5 text-sm leading-snug text-muted-foreground">
              {hint}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div
            className="flex size-11 items-center justify-center rounded-xl bg-muted text-primary shadow-inner ring-1 ring-border transition group-hover:bg-primary/10 group-hover:ring-primary/25"
            aria-hidden
          >
            {icon}
          </div>
          {sparkData && sparkData.length >= 2 ? (
            <Sparkline
              data={sparkData}
              color={sparkColors[accent]}
              className="opacity-70 transition group-hover:opacity-100"
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
