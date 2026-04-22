"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { AnimatedInteger, AnimatedRsd } from "./animated-kpi-value";
import { KpiSparkline } from "./kpi-sparkline";

export type DashboardHeroSparklines = {
  /** Kumulativna zakazivanja (30 d.) — vizuelno drugačije od dnevnog grafika. */
  clients: number[];
  appointments: number[];
  revenue: number[] | null;
};

type DashboardHeroStatsProps = {
  clientsCount: number;
  appointmentsToday: number;
  /** Prihod danas (samo admin). */
  revenueToday: number | null;
  showFinancial: boolean;
  sparklines: DashboardHeroSparklines;
  sparklinesLoading?: boolean;
  className?: string;
};

/**
 * Glavni KPI traka — hijerarhija, sparkline u kartici, animirani brojevi.
 */
export function DashboardHeroStats({
  clientsCount,
  appointmentsToday,
  revenueToday,
  showFinancial,
  sparklines,
  sparklinesLoading = false,
  className,
}: DashboardHeroStatsProps) {
  const dug = showFinancial ? (
    <Link
      href="/finances"
      className="group/link block rounded-lg outline-none ring-white/0 transition hover:ring-2 hover:ring-white/40 focus-visible:ring-2 focus-visible:ring-white/60"
    >
      <span className="stat-card-value block">—</span>
      <span className="mt-1 block text-xs font-medium text-white/85">
        Knjiženje i potraživanja u Finansijama →
      </span>
    </Link>
  ) : (
    <>
      <span className="stat-card-value">—</span>
      <p className="mt-1 text-sm font-medium text-white/85">
        Dostupno administratoru
      </p>
    </>
  );

  return (
    <div className={cn("stats-grid mb-2", className)}>
      <div className="stat-card stat-card-kpi-clients">
        <div className="relative z-[1] pr-[4.5rem]">
          <p className="stat-card-label">Aktivni klijenti</p>
          <p className="stat-card-value tabular-nums">
            <AnimatedInteger value={clientsCount} durationMs={680} />
          </p>
          <p className="mt-1 text-sm font-medium leading-snug text-white/85">
            U bazi salona
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
            Kumul. zakazivanja · 30 d.
          </p>
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 z-0 sm:bottom-3 sm:right-3">
          <KpiSparkline
            values={sparklines.clients}
            loading={sparklinesLoading}
            variant="on-dark"
          />
        </div>
      </div>

      <div className="stat-card stat-card-kpi-appointments">
        <div className="relative z-[1] pr-[4.5rem]">
          <p className="stat-card-label">Danas · termini</p>
          <p className="stat-card-value tabular-nums">
            <AnimatedInteger
              value={appointmentsToday}
              durationMs={640}
            />
          </p>
          <p className="mt-1 text-sm font-medium leading-snug text-white/85">
            Zakazano za današnji dan
          </p>
          <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
            Zakazivanja po danu · 30 d.
          </p>
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 z-0 sm:bottom-3 sm:right-3">
          <KpiSparkline
            values={sparklines.appointments}
            loading={sparklinesLoading}
            variant="on-dark"
          />
        </div>
      </div>

      <div className="stat-card stat-card-kpi-revenue">
        <div className="relative z-[1] pr-[4.5rem]">
          <p className="stat-card-label">Promet danas</p>
          <p className="stat-card-value tabular-nums leading-tight">
            {showFinancial && revenueToday != null ? (
              <AnimatedRsd value={revenueToday} durationMs={820} />
            ) : (
              "—"
            )}
          </p>
          <p className="mt-1 text-sm font-medium text-white/90">
            {showFinancial ? "Prihod i završeni tretmani" : "Samo admin"}
          </p>
          {showFinancial ? (
            <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
              Prihod · 30 d.
            </p>
          ) : null}
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 z-0 sm:bottom-3 sm:right-3">
          {showFinancial ? (
            <KpiSparkline
              values={sparklines.revenue ?? []}
              loading={sparklinesLoading}
              variant="on-dark"
            />
          ) : (
            <KpiSparkline values={[]} decorative variant="on-dark" />
          )}
        </div>
      </div>

      <div className="stat-card stat-card-kpi-unpaid">
        <div className="relative z-[1] pr-[4.5rem]">
          <p className="stat-card-label">Neplaćeno / potraživanja</p>
          {dug}
        </div>
        <div className="pointer-events-none absolute bottom-2 right-2 z-0 sm:bottom-3 sm:right-3">
          <KpiSparkline values={[]} decorative variant="on-dark" />
        </div>
      </div>
    </div>
  );
}
