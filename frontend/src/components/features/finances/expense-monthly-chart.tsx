"use client";

import { useMemo } from "react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatRsd } from "@/lib/formatMoney";
import { formatExpenseMonthLabel } from "./finances-utils";
import type { ExpenseMonthlyTotal } from "@/lib/api";

type ExpenseMonthlyChartProps = {
  data: ExpenseMonthlyTotal[];
  loading: boolean;
};

export function ExpenseMonthlyChart({ data, loading }: ExpenseMonthlyChartProps) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => a.month.localeCompare(b.month)),
    [data]
  );

  const max = useMemo(
    () => Math.max(1, ...data.map((t) => t.total_rsd)),
    [data]
  );

  return (
    <SurfaceCard padding="lg" className="overflow-hidden">
      <div className="mb-4">
        <h2 className="text-sm font-semibold text-foreground">
          Istorija troškova po mesecima
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Zbir evidentiranih troškova (poslednjih šest meseci, po kalendarskim
          mesecima).
        </p>
      </div>
      {loading && sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">Učitavanje…</p>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Još nema unetih troškova u ovom periodu.
        </p>
      ) : (
        <ul className="space-y-3">
          {sorted.map((row) => {
            const w = Math.round((row.total_rsd / max) * 100);
            return (
              <li key={row.month} className="space-y-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">
                    {formatExpenseMonthLabel(row.month)}
                  </span>
                  <span className="shrink-0 tabular-nums font-semibold text-foreground">
                    {formatRsd(row.total_rsd)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted dark:bg-card">
                  <div
                    className="h-full rounded-full bg-amber-500/90 dark:bg-amber-600/90"
                    style={{ width: `${w}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </SurfaceCard>
  );
}
