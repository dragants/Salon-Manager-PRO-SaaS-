"use client";

import type { Client } from "@/types/client";
import "./client-list-cards-saas.css";

type StatusVariant = "success" | "warning" | "danger";

type ResolvedRow = { label: string; variant: StatusVariant };

/**
 * Ponašanje: bez telefona → opasno; inače bez napomene → upozorenje; inače ok.
 */
function resolveRowStatus(c: Client): ResolvedRow {
  if (!(c.phone ?? "").trim()) {
    return { label: "Bez broja", variant: "danger" };
  }
  if (!(c.notes ?? "").trim()) {
    return { label: "Novi", variant: "warning" };
  }
  return { label: "Aktivan", variant: "success" };
}

function noteLine(c: Client): string {
  return (c.notes ?? "").trim() || "Nema kratke napomene";
}

function phoneLine(c: Client): string {
  return (c.phone ?? "").trim() || "—";
}

export type ClientListCardsSaaSProps = {
  clients: Client[];
  onOpenCard: (id: number) => void;
  /** zadržano u API; trenutno se ne renderuje (po UI spec) */
  calendarHref?: string;
};

/**
 * Samo mreža kartica. Bez table, bez starog klijent JSX.
 */
export function ClientListCardsSaaS({
  clients,
  onOpenCard,
}: ClientListCardsSaaSProps) {
  if (clients.length === 0) {
    return null;
  }

  return (
    <section className="client-cards-v2" aria-label="Klijenti — kartice">
      <div className="ccv-grid" role="list">
        {clients.map((c) => {
          const s = resolveRowStatus(c);
          return (
            <article key={c.id} className="ccv-card" role="listitem">
              <p className="ccv-name">{c.name}</p>
              <span
                className={`ccv-badge ccv-badge--${s.variant}`}
                title="Status u salonu"
              >
                {s.label}
              </span>
              <p className="ccv-phone">{phoneLine(c)}</p>
              <p className="ccv-note">{noteLine(c)}</p>
              <button
                type="button"
                className="ccv-btn"
                onClick={() => onOpenCard(c.id)}
              >
                Otvori karton
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
