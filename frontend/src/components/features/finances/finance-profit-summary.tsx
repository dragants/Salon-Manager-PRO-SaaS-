"use client";

import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatRsd } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";

type FinanceProfitSummaryProps = {
  revenueMonth: number;
  revenuePrevMonth: number;
  effectiveCost: number;
  profitMonth: number;
  expensesMonthSum: number;
  expenseRowCount: number;
  onOpenOverhead: () => void;
};

export function FinanceProfitSummary({
  revenueMonth,
  revenuePrevMonth,
  effectiveCost,
  profitMonth,
  expensesMonthSum,
  expenseRowCount,
  onOpenOverhead,
}: FinanceProfitSummaryProps) {
  return (
    <SurfaceCard
      padding="lg"
      className="border-dashed border-sky-200/80 dark:border-sky-900/50"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Profit (mesec)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Prihod minus troškovi tekućeg meseca. Unosi se kroz stavke u bazi;
            ako nema stavki, koristi se okvirna procena u podešavanjima.
          </p>
        </div>
        <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-2xl lg:flex-1">
          {/* Revenue */}
          <div className="rounded-xl border border-slate-100 bg-muted/80 px-4 py-3 dark:bg-card/40">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Prihod
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-foreground">
              {formatRsd(revenueMonth)}
            </p>
            {revenuePrevMonth > 0 ? (
              <p
                className={cn(
                  "mt-1 flex items-center gap-1 text-[11px] font-semibold tabular-nums",
                  revenueMonth >= revenuePrevMonth
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-rose-700 dark:text-rose-400"
                )}
              >
                {revenueMonth >= revenuePrevMonth ? (
                  <TrendingUp className="size-3.5 shrink-0" aria-hidden />
                ) : (
                  <TrendingDown className="size-3.5 shrink-0" aria-hidden />
                )}
                {(() => {
                  const pct =
                    ((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100;
                  const r = Math.round(pct * 10) / 10;
                  const sign = r >= 0 ? "+" : "";
                  return `vs preth. mesec ${sign}${r}%`;
                })()}
              </p>
            ) : revenueMonth > 0 ? (
              <p className="mt-1 text-[11px] text-muted-foreground">
                Nema podataka za prethodni mesec
              </p>
            ) : null}
          </div>

          {/* Costs */}
          <button
            type="button"
            className="rounded-xl border border-slate-100 bg-amber-50/60 px-4 py-3 text-left transition hover:bg-amber-50 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
            onClick={onOpenOverhead}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Troškovi (mes.)
            </p>
            <p className="mt-1 flex items-center gap-1 text-lg font-bold tabular-nums text-foreground">
              <Wallet
                className="size-4 text-amber-700 dark:text-amber-400"
                aria-hidden
              />
              {formatRsd(effectiveCost)}
            </p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">
              {expensesMonthSum > 0
                ? `${expenseRowCount} stavki u bazi`
                : "Okvirna procena →"}
            </p>
          </button>

          {/* Profit */}
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              Profit
            </p>
            <p className="mt-1 text-lg font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
              {formatRsd(profitMonth)}
            </p>
          </div>
        </div>
      </div>
    </SurfaceCard>
  );
}
