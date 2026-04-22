"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRsd } from "@/lib/formatMoney";

type DashboardHeroStatsProps = {
  clientsCount: number;
  appointmentsToday: number;
  /** Prihod danas (samo admin). */
  revenueToday: number | null;
  showFinancial: boolean;
  className?: string;
};

/**
 * Glavni KPI traka — jaka hijerarhija, obojene kartice (SaaS nivo).
 */
export function DashboardHeroStats({
  clientsCount,
  appointmentsToday,
  revenueToday,
  showFinancial,
  className,
}: DashboardHeroStatsProps) {
  const promet =
    showFinancial && revenueToday != null
      ? formatRsd(revenueToday)
      : "—";
  const dug = showFinancial ? (
    <Link
      href="/finances"
      className="block rounded-lg outline-none ring-white/0 transition hover:ring-2 hover:ring-white/40 focus-visible:ring-2 focus-visible:ring-white/60"
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
    <div
      className={cn(
        "stats-grid mb-2",
        className
      )}
    >
      <div className="stat-card stat-card-kpi-clients">
        <p className="stat-card-label">Aktivni klijenti</p>
        <p className="stat-card-value tabular-nums">{clientsCount}</p>
        <p className="mt-1 text-sm font-medium text-white/85">
          U bazi salona
        </p>
      </div>
      <div className="stat-card stat-card-kpi-appointments">
        <p className="stat-card-label">Danas · termini</p>
        <p className="stat-card-value tabular-nums">{appointmentsToday}</p>
        <p className="mt-1 text-sm font-medium text-white/85">
          Zakazano za današnji dan
        </p>
      </div>
      <div className="stat-card stat-card-kpi-revenue">
        <p className="stat-card-label">Promet danas</p>
        <p className="stat-card-value tabular-nums">{promet}</p>
        <p className="mt-1 text-sm font-medium text-white/90">
          {showFinancial ? "Prihod i završeni tretmani" : "Samo admin"}
        </p>
      </div>
      <div className="stat-card stat-card-kpi-unpaid">
        <p className="stat-card-label">Neplaćeno / potraživanja</p>
        {dug}
      </div>
    </div>
  );
}
