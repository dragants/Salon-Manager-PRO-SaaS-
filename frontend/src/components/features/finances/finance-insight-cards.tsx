"use client";

import { CalendarRange, Crown } from "lucide-react";
import { SurfaceCard } from "@/components/ui/surface-card";
import { formatRsd } from "@/lib/formatMoney";

type BestDayInfo = {
  weekday: string;
  revenue: number;
  day: string;
};

type TopClientInfo = {
  id: number;
  name: string;
  revenue: number;
  visits: number;
};

type FinanceInsightCardsProps = {
  bestDay: BestDayInfo | null;
  topClient: TopClientInfo | null;
};

export function FinanceInsightCards({
  bestDay,
  topClient,
}: FinanceInsightCardsProps) {
  if (!bestDay && !topClient) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {bestDay ? (
        <SurfaceCard padding="md" className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
            <CalendarRange className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Najbolji dan (30 dana)
            </p>
            <p className="mt-1 text-sm font-medium text-foreground">
              {bestDay.weekday.charAt(0).toUpperCase() +
                bestDay.weekday.slice(1)}{" "}
              <span className="text-muted-foreground">
                ({formatRsd(bestDay.revenue)})
              </span>
            </p>
          </div>
        </SurfaceCard>
      ) : null}
      {topClient ? (
        <SurfaceCard padding="md" className="flex gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200">
            <Crown className="size-5" aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Top klijent
            </p>
            <p className="mt-1 truncate text-sm font-medium text-foreground">
              {topClient.name}
              <span className="text-muted-foreground">
                {" "}
                ({formatRsd(topClient.revenue)})
              </span>
            </p>
          </div>
        </SurfaceCard>
      ) : null}
    </div>
  );
}
