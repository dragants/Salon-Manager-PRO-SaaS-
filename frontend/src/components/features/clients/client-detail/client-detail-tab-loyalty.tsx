"use client";

import type { ClientDetail } from "@/types/client";

type ClientDetailTabLoyaltyProps = {
  detail: ClientDetail;
};

export function ClientDetailTabLoyalty({ detail }: ClientDetailTabLoyaltyProps) {
  return (
    <div className="space-y-3 py-2">
      {detail.loyalty_balances && detail.loyalty_balances.length > 0 ? (
        <ul className="space-y-3">
          {detail.loyalty_balances.map((b) => (
            <li
              key={b.program_id}
              className="rounded-xl border border-border bg-muted/80 px-4 py-3 dark:bg-card/40"
            >
              <p className="font-medium text-foreground">{b.program_name}</p>
              <p className="text-xs text-muted-foreground">
                {b.service_name} · cilj {b.visits_required} završenih poseta
              </p>
              <div className="mt-2 flex flex-wrap gap-4 text-sm">
                <span>
                  Pečati:{" "}
                  <strong className="tabular-nums">
                    {b.stamps} / {b.visits_required}
                  </strong>
                </span>
                <span>
                  Nagrade na čekanju:{" "}
                  <strong className="tabular-nums text-emerald-700 dark:text-emerald-400">
                    {b.rewards_available}
                  </strong>
                </span>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">
          Nema aktivnog loyalty programa ili još nema stanja za ovog klijenta.
          Podesi program u <strong>Podešavanja → Loyalty</strong>.
        </p>
      )}
    </div>
  );
}
