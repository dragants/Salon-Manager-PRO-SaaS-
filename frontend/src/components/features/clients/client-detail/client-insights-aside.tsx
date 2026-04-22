"use client";

import { clientInsights, formatDt } from "@/lib/clients-page-utils";
import type { ClientDetail } from "@/types/client";

type ClientInsightsAsideProps = {
  detail: ClientDetail;
};

/**
 * Bočni pregled uvida (terapija, poslednja poseta, sledeći termin, beleške).
 * Može se ponovo iskoristiti van kartice (npr. kompaktan pregled).
 */
export function ClientInsightsAside({ detail }: ClientInsightsAsideProps) {
  const ins = clientInsights(detail);

  return (
    <aside className="space-y-4 rounded-2xl border border-border/90 bg-gradient-to-b from-violet-50/90 via-white to-muted/80 p-4 dark:from-violet-950/30 dark:via-background/40 dark:to-background/60 lg:col-span-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Status terapije
        </p>
        <p className="mt-1 text-sm font-semibold leading-snug text-foreground">
          {ins.therapyStatus}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Poslednja poseta
        </p>
        <p className="mt-1 text-sm text-foreground">
          {ins.lastDone
            ? `${formatDt(ins.lastDone.date)} · ${ins.lastDone.service_name}`
            : "—"}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Sledeći termin
        </p>
        <p className="mt-1 text-sm text-foreground">
          {ins.next
            ? `${formatDt(ins.next.date)} · ${ins.next.service_name}`
            : "Nema zakazanog"}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Tip problema / cilj
        </p>
        <p className="mt-1 line-clamp-4 text-sm text-foreground">
          {ins.problemLine}
        </p>
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Terapeutske napomene
        </p>
        <p className="mt-1 line-clamp-5 whitespace-pre-wrap text-sm text-foreground">
          {ins.therapistNotes}
        </p>
      </div>
    </aside>
  );
}
