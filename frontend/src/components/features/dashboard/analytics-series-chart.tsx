"use client";
import { useT } from "@/lib/i18n/locale";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AnalyticsSeriesPoint } from "@/types/analytics";
import { cn } from "@/lib/utils";

function tickDay(day: string): string {
  if (day.length >= 10) {
    return `${day.slice(8, 10)}.${day.slice(5, 7)}`;
  }
  return day;
}

type Props = {
  data: AnalyticsSeriesPoint[];
  showRevenue: boolean;
  variant?: "default" | "luxury";
  className?: string;
};

export function AnalyticsSeriesChart({
  data,
  showRevenue,
  variant = "default",
  className,
}: Props) {
  const t = useT();
  const lux = variant === "luxury";
  const chartHeight = lux ? 260 : 320;
  const gradId = lux ? "revenueAreaLuxury" : "revenueAreaGradient";
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) {
    return (
      <p
        className={cn("py-12 text-center text-sm text-muted-foreground")}
      >
        Nema podataka za izabrani period.
      </p>
    );
  }

  const chartData = rows.map((d) => ({
    ...d,
    label: tickDay(d.day),
  }));

  const tickFill = "rgb(154 138 96 / 0.95)";
  const gridStroke = "rgb(232 221 192 / 0.85)";
  const axisLine = "rgb(232 221 192 / 0.9)";
  const barFill = lux
    ? "rgb(51 65 85 / 0.45)"
    : "rgb(196 135 42 / 0.55)";
  const lineStroke = "rgb(138 94 26)";
  const cursorStroke = "rgb(196 135 42)";

  return (
    <div
      className={cn(
        "w-full min-w-0 shrink-0",
        lux ? "h-[260px]" : "h-[320px]",
        className
      )}
    >
      {/*
        Recharts 3: bez initialDimension prvi render šalje width/height -1 → konzolno upozorenje.
        minWidth/minHeight + initialDimension stabilizuju prvi paint u flex/grid layoutima.
      */}
      <ResponsiveContainer
        width="100%"
        height="100%"
        minWidth={0}
        minHeight={chartHeight}
        initialDimension={{ width: 360, height: chartHeight }}
        debounce={50}
      >
        <ComposedChart
          data={chartData}
          margin={{ top: 12, right: 14, left: 0, bottom: 4 }}
        >
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <>
                <stop offset="0%" stopColor="rgb(138 94 26)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="rgb(196 135 42)" stopOpacity={0} />
              </>
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="4 6"
            stroke={gridStroke}
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: tickFill }}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={{ stroke: axisLine }}
          />
          <YAxis
            yAxisId="a"
            allowDecimals={false}
            tick={{ fontSize: 10, fill: tickFill }}
            width={28}
            tickLine={false}
            axisLine={false}
          />
          {showRevenue ? (
            <YAxis
              yAxisId="b"
              orientation="right"
              tick={{ fontSize: 10, fill: tickFill }}
              width={48}
              tickLine={false}
              axisLine={false}
            />
          ) : null}
          <Tooltip
            cursor={{
              stroke: cursorStroke,
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid rgb(var(--border))",
              boxShadow:
                "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)",
              fontSize: "0.875rem",
              background: "rgb(var(--card))",
              color: "rgb(var(--text))",
            }}
            formatter={(value, name) => {
              const n = typeof value === "number" ? value : Number(value);
              if (name === "Prihod (RSD)") {
                return [`${n.toLocaleString("sr-Latn-RS")} RSD`, name];
              }
              return [n, name];
            }}
          />
          <Legend
            wrapperStyle={lux ? { color: "#a1a1aa", fontSize: "12px" } : undefined}
          />
          <Bar
            yAxisId="a"
            dataKey="appointments"
            name={t.calendar.title}
            fill={barFill}
            fillOpacity={lux ? 0.95 : 0.92}
            radius={[5, 5, 0, 0]}
            maxBarSize={30}
          />
          {showRevenue ? (
            <>
              <Area
                yAxisId="b"
                type="monotone"
                dataKey="revenue"
                name=""
                stroke="none"
                fill={`url(#${gradId})`}
                legendType="none"
              />
              <Line
                yAxisId="b"
                type="monotone"
                dataKey="revenue"
                name="Prihod (RSD)"
                stroke={lineStroke}
                strokeWidth={lux ? 2.5 : 3}
                dot={false}
                activeDot={{
                  r: 5,
                  strokeWidth: 2,
                  fill: "rgb(var(--card))",
                  stroke: lineStroke,
                }}
              />
            </>
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
