"use client";

import { cn } from "@/lib/utils";

type KpiSparklineProps = {
  /** Vrednosti po danu; prazan niz = dekorativna kriva. */
  values: number[];
  className?: string;
  /** Za obojene KPI kartice (bela kriva). */
  variant?: "on-dark" | "on-card";
  /** Učitavanje analitike — blagi pulz. */
  loading?: boolean;
  /** Nema numeričkih podataka (npr. potraživanja) — blaga talasna linija. */
  decorative?: boolean;
};

function buildPath(
  values: number[],
  w: number,
  h: number,
  pad: number
): { line: string; area: string } {
  if (values.length === 0) {
    return { line: "", area: "" };
  }
  const nums = values.map((v) => (Number.isFinite(v) ? v : 0));
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const span = max - min || 1;
  const innerW = w - pad * 2;
  const innerH = h - pad * 2;
  const pts = nums.map((v, i) => {
    const x =
      nums.length === 1
        ? pad + innerW / 2
        : pad + (i / (nums.length - 1)) * innerW;
    const y = pad + (1 - (v - min) / span) * innerH;
    return { x, y };
  });
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const bottom = h - pad;
  const area = `${line} L ${pts[pts.length - 1]?.x ?? pad} ${bottom} L ${pts[0]?.x ?? pad} ${bottom} Z`;
  return { line, area };
}

function decorativeWavePath(w: number, h: number): { line: string; area: string } {
  const pad = 2;
  const y0 = h * 0.55;
  const y1 = h * 0.38;
  const y2 = h * 0.62;
  const line = `M ${pad} ${y0} Q ${w * 0.35} ${y1} ${w * 0.5} ${y0} T ${w - pad} ${y2}`;
  const area = `${line} L ${w - pad} ${h} L ${pad} ${h} Z`;
  return { line, area };
}

export function KpiSparkline({
  values,
  className,
  variant = "on-dark",
  loading = false,
  decorative = false,
}: KpiSparklineProps) {
  const w = 140;
  const h = 40;
  const { line, area } =
    decorative || values.length === 0
      ? decorativeWavePath(w, h)
      : buildPath(values, w, h, 2);

  const stroke =
    variant === "on-dark" ? "rgba(255,255,255,0.88)" : "rgb(var(--primary))";
  const strokeMuted =
    variant === "on-dark" ? "rgba(255,255,255,0.35)" : "rgb(var(--border))";
  const fill =
    variant === "on-dark"
      ? "rgba(255,255,255,0.14)"
      : "rgb(var(--primary) / 0.08)";
  const fillDecor =
    variant === "on-dark"
      ? "rgba(255,255,255,0.06)"
      : "rgb(var(--muted) / 0.5)";

  if (loading) {
    return (
      <div
        className={cn(
          "h-10 w-full max-w-[140px] rounded-md bg-white/10 animate-pulse",
          variant === "on-card" && "bg-muted/60",
          className
        )}
        aria-hidden
      />
    );
  }

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      className={cn("h-10 w-full max-w-[140px] shrink-0 overflow-visible", className)}
      preserveAspectRatio="none"
      aria-hidden
    >
      {decorative || values.length === 0 ? (
        <path d={area} fill={fillDecor} className="opacity-90" />
      ) : (
        <path d={area} fill={fill} className="opacity-100" />
      )}
      <path
        d={line}
        fill="none"
        strokeWidth={decorative || values.length === 0 ? 1.25 : 1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={decorative || values.length === 0 ? strokeMuted : stroke}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
