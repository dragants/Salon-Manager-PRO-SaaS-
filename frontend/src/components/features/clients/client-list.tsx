"use client";

import {
  ClientDirectoryTiles,
  ClientsKpiStats,
} from "@/components/features/clients/client-directory";
import type { Client } from "@/types/client";
import type { AnalyticsResponse } from "@/types/analytics";

type ClientListProps = {
  clients: Client[];
  searchQuery: string;
  onOpenCard: (id: number) => void;
  analytics: AnalyticsResponse | null;
  /** Ukupan broj klijenata u organizaciji (za KPI, ne filtrirano). */
  orgClientsCount: number;
  showFinancial: boolean;
};

/**
 * KPI kartice + mreža kartica klijenata (posle pretrage i filtera).
 */
export function ClientList({
  clients,
  searchQuery,
  onOpenCard,
  analytics,
  orgClientsCount,
  showFinancial,
}: ClientListProps) {
  return (
    <>
      <ClientsKpiStats
        clientsCount={analytics?.clients ?? orgClientsCount}
        appointmentsToday={analytics?.appointments_today ?? 0}
        revenueToday={analytics?.revenue_today ?? 0}
        showFinancial={showFinancial}
      />

      {clients.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          {searchQuery.trim()
            ? `Nema rezultata za „${searchQuery.trim()}“ i izabrane filtere.`
            : "Nema klijenata koji odgovaraju filterima."}
        </p>
      ) : (
        <ClientDirectoryTiles clients={clients} onOpenCard={onOpenCard} />
      )}
    </>
  );
}
