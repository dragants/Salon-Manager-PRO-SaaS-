"use client";

import Link from "next/link";
import { formatRsd } from "@/lib/formatMoney";
import type { Client } from "@/types/client";
import { cn } from "@/lib/utils";

/** dd.MM. (npr. 12.04.) */
function shortDateFromIso(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("sr-Latn-RS", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "—";
  }
}

type BadgeState = { tone: "active" | "new" | "alert"; label: string };

function clientBadge(c: Client): BadgeState {
  const phone = (c.phone ?? "").trim();
  if (!phone) {
    return { tone: "alert", label: "Bez broja" };
  }
  if (!(c.notes ?? "").trim()) {
    return { tone: "new", label: "Novi" };
  }
  return { tone: "active", label: "Aktivan" };
}

export type ClientsKpiStatsProps = {
  clientsCount: number;
  appointmentsToday: number;
  revenueToday: number;
  showFinancial: boolean;
};

/**
 * Ista vizuelna logika kao dashboard hero — tri jake obojene kartice.
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

export type ClientDirectoryTilesProps = {
  clients: Client[];
  onOpenCard: (id: number) => void;
  calendarHref: string;
};

/**
 * Puna kartična mreža (bez table). Nova struktura — ne koristi stari clients-grid JSX.
 */
export function ClientDirectoryTiles({
  clients,
  onOpenCard,
  calendarHref,
}: ClientDirectoryTilesProps) {
  return (
    <ul className="cl-tiles" aria-label="Lista klijenata">
      {clients.map((c) => {
        const badge = clientBadge(c);
        const initial = (c.name?.trim().charAt(0) || "?").toUpperCase();
        const phone = (c.phone ?? "").trim() || "—";
        const lastNote = (c.notes ?? "").trim() || "Nema poslednje napomene";

        return (
          <li key={c.id} className="cl-tile">
            <div className="cl-tile__head">
              <div className="cl-tile__avatar" aria-hidden>
                {initial}
              </div>
              <div className="cl-tile__head-text">
                <h3 className="cl-tile__name">{c.name}</h3>
                <span
                  className={cn(
                    "cl-tile__badge",
                    badge.tone === "active" && "cl-tile__badge--ok",
                    badge.tone === "new" && "cl-tile__badge--new",
                    badge.tone === "alert" && "cl-tile__badge--alert"
                  )}
                >
                  {badge.label}
                </span>
              </div>
            </div>

            <p className="cl-tile__note">{lastNote}</p>

            <div className="cl-tile__meta">
              <span className="tabular-nums" title="Dodat u sistem">
                📅 {shortDateFromIso(c.created_at)}
              </span>
              <span className="cl-tile__phone tabular-nums" title="Telefon">
                📞 {phone}
              </span>
            </div>

            <button
              type="button"
              className="cl-tile__cta"
              onClick={() => onOpenCard(c.id)}
            >
              Otvori karton
            </button>

            <Link className="cl-tile__secondary" href={calendarHref}>
              + Zakaži termin
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
