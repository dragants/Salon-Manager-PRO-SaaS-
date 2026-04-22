"use client";

import { formatRsd } from "@/lib/formatMoney";

export { ClientListCardsSaaS as ClientDirectoryTiles } from "./client-list-cards-saas";
export type { ClientListCardsSaaSProps as ClientDirectoryTilesProps } from "./client-list-cards-saas";

export type ClientsKpiStatsProps = {
  clientsCount: number;
  appointmentsToday: number;
  revenueToday: number;
  showFinancial: boolean;
};

/**
 * Tri KPI kartice (ljubičasta / zelena / žuta) — nezavisno od liste kartica.
 */
export function ClientsKpiStats({
  clientsCount,
  appointmentsToday,
  revenueToday,
  showFinancial,
}: ClientsKpiStatsProps) {
  return (
    <div className="cl-kpi" role="group" aria-label="Pregled salona">
      <div className="cl-kpi__card cl-kpi__card--purple">
        <p className="cl-kpi__eyebrow">Aktivni klijenti</p>
        <p className="cl-kpi__value tabular-nums">{clientsCount}</p>
        <p className="cl-kpi__sub">U bazi</p>
      </div>
      <div className="cl-kpi__card cl-kpi__card--green">
        <p className="cl-kpi__eyebrow">Danas</p>
        <p className="cl-kpi__value tabular-nums">{appointmentsToday}</p>
        <p className="cl-kpi__sub">Termina zakazano</p>
      </div>
      <div className="cl-kpi__card cl-kpi__card--amber">
        <p className="cl-kpi__eyebrow">Promet danas</p>
        <p className="cl-kpi__value tabular-nums">
          {showFinancial ? formatRsd(revenueToday) : "—"}
        </p>
        <p className="cl-kpi__sub">
          {showFinancial ? "RSD" : "Samo admin"}
        </p>
      </div>
    </div>
  );
}
