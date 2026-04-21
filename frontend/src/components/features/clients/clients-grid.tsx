"use client";

import Link from "next/link";
import type { Client } from "@/types/client";

/** Mapira se na `poslednji_kontekst` iz specifikacije — kod nas je to beleška (notes). */
export function getStatus(client: Client): "new" | "active" {
  if (!client.notes?.trim()) return "new";
  return "active";
}

export function getStatusLabel(client: Client): string {
  if (!client.notes?.trim()) return "Novi";
  return "Aktivan";
}

export function formatClientCardDate(date: string | null | undefined): string {
  if (!date) return "—";
  try {
    return new Date(date).toLocaleDateString("sr-RS");
  } catch {
    return "—";
  }
}

export type ClientsGridProps = {
  clients: Client[];
  onOpen: (client: Client) => void;
  calendarHref?: string;
};

/**
 * Grid kartica klijenata — struktura i klase po specifikaciji (clients-grid / client-card).
 */
export function ClientsGrid({
  clients,
  onOpen,
  calendarHref = "/calendar",
}: ClientsGridProps) {
  return (
    <div className="clients-grid">
      {clients.map((c) => {
        const st = getStatus(c);
        return (
          <div key={c.id} className="client-card">
            <div className="top">
              <div className="avatar" aria-hidden>
                {(c.name?.trim().charAt(0) || "?").toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="client-card-name">{c.name}</h3>
                <span className={`status ${st}`}>{getStatusLabel(c)}</span>
              </div>
            </div>

            <p className="note">
              {c.notes?.trim() || "Nema beleške"}
            </p>

            <div className="meta">
              <span className="tabular-nums">
                📅 {formatClientCardDate(c.created_at)}
              </span>
              <span className="tabular-nums">
                📞 {c.phone?.trim() || "—"}
              </span>
            </div>

            <button
              type="button"
              className="main-btn"
              onClick={() => onOpen(c)}
            >
              Otvori karton
            </button>

            <Link href={calendarHref} className="client-card-secondary">
              + Zakaži termin
            </Link>
          </div>
        );
      })}
    </div>
  );
}
