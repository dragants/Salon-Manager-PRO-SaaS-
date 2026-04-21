import {
  CreditCard,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react";
import { DashboardKpiCard } from "@/components/features/dashboard/dashboard-kpi-card";
import { formatRsd } from "@/lib/formatMoney";

type FinancesKpiCardsProps = {
  revenueToday: number;
  revenueMonth: number;
  revenuePrevMonth: number;
  clientCount: number;
  avgValue: number;
  revenueTrendHint: string;
};

export function FinancesKpiCards({
  revenueToday,
  revenueMonth,
  revenuePrevMonth,
  clientCount,
  avgValue,
  revenueTrendHint,
}: FinancesKpiCardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <DashboardKpiCard
        title="Današnji prihod"
        value={formatRsd(revenueToday)}
        icon={<PiggyBank className="size-5" />}
        accent="emerald"
        dominant
        hint="Završeni termini i uplate za danas"
      />
      <DashboardKpiCard
        title="Mesečni prihod"
        value={formatRsd(revenueMonth)}
        icon={
          revenuePrevMonth > 0 && revenueMonth < revenuePrevMonth ? (
            <TrendingDown className="size-5" />
          ) : (
            <TrendingUp className="size-5" />
          )
        }
        accent="sky"
        hint={revenueTrendHint}
      />
      <DashboardKpiCard
        title="Broj klijenata"
        value={clientCount}
        icon={<Users className="size-5" />}
        accent="violet"
        hint="Ukupno u organizaciji"
      />
      <DashboardKpiCard
        title="Prosečna vrednost"
        value={avgValue > 0 ? formatRsd(avgValue) : "—"}
        icon={<CreditCard className="size-5" />}
        accent="amber"
        hint="Mesec ÷ broj klijenata (orientaciono)"
      />
    </div>
  );
}
