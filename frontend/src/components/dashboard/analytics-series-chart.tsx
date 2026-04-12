"use client";

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

function tickDay(day: string): string {
  if (day.length >= 10) {
    return `${day.slice(8, 10)}.${day.slice(5, 7)}`;
  }
  return day;
}

type Props = {
  data: AnalyticsSeriesPoint[];
  showRevenue: boolean;
};

export function AnalyticsSeriesChart({ data, showRevenue }: Props) {
  const rows = Array.isArray(data) ? data : [];
  if (rows.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-sky-700/85">
        Nema podataka za izabrani period.
      </p>
    );
  }

  const chartData = rows.map((d) => ({
    ...d,
    label: tickDay(d.day),
  }));

  return (
    <div className="h-[320px] w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={chartData}
          margin={{ top: 12, right: 14, left: 0, bottom: 4 }}
        >
          <defs>
            <linearGradient id="revenueAreaGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="4 6"
            stroke="rgb(148 163 184 / 0.35)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10, fill: "rgb(51 65 85 / 0.9)" }}
            interval="preserveStartEnd"
            tickLine={false}
            axisLine={{ stroke: "rgb(148 163 184 / 0.5)" }}
          />
          <YAxis
            yAxisId="a"
            allowDecimals={false}
            tick={{ fontSize: 10, fill: "rgb(51 65 85 / 0.9)" }}
            width={28}
            tickLine={false}
            axisLine={false}
          />
          {showRevenue ? (
            <YAxis
              yAxisId="b"
              orientation="right"
              tick={{ fontSize: 10, fill: "rgb(51 65 85 / 0.9)" }}
              width={48}
              tickLine={false}
              axisLine={false}
            />
          ) : null}
          <Tooltip
            cursor={{ stroke: "#3b82f6", strokeWidth: 1, strokeDasharray: "4 4" }}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid rgb(191 219 254)",
              boxShadow:
                "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.08)",
              fontSize: "0.875rem",
              background: "rgb(255 255 255 / 0.98)",
            }}
            formatter={(value, name) => {
              const n = typeof value === "number" ? value : Number(value);
              if (name === "Prihod (RSD)") {
                return [`${n.toLocaleString("sr-Latn-RS")} RSD`, name];
              }
              return [n, name];
            }}
          />
          <Legend />
          <Bar
            yAxisId="a"
            dataKey="appointments"
            name="Termini"
            fill="#38bdf8"
            fillOpacity={0.92}
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
                fill="url(#revenueAreaGradient)"
                legendType="none"
              />
              <Line
                yAxisId="b"
                type="monotone"
                dataKey="revenue"
                name="Prihod (RSD)"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 2, fill: "#fff", stroke: "#3b82f6" }}
              />
            </>
          ) : null}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
