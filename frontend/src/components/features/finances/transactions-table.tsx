"use client";

import { useRef } from "react";
import { CalendarRange } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SurfaceCard } from "@/components/ui/surface-card";
import { appTableHeadClass, appTableRowClass } from "@/lib/app-ui";
import { formatRsd } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";
import { useTableHeadShadow } from "@/hooks/useTableHeadShadow";
import { useTableViewportWindow } from "@/hooks/useTableViewportWindow";
import {
  apptPrice,
  formatApptWhen,
  txnStatus,
} from "./finances-utils";
import type { AppointmentRow } from "@/types/appointment";

type TransactionsTableProps = {
  rows: AppointmentRow[];
  loading: boolean;
  rangeFrom: string;
  rangeTo: string;
  tz: string;
};

export function TransactionsTable({
  rows,
  loading,
  rangeFrom,
  rangeTo,
  tz,
}: TransactionsTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headShadow = useTableHeadShadow(scrollRef);
  const tv = useTableViewportWindow(scrollRef, rows.length, 49, {
    minItems: 45,
  });
  const visible = tv.enabled ? rows.slice(tv.from, tv.to) : rows;

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Transakcije</h2>
          <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarRange className="size-3.5 shrink-0" aria-hidden />
            {rangeFrom === rangeTo ? rangeFrom : `${rangeFrom} — ${rangeTo}`}
          </p>
        </div>
        {!loading && rows.length > 0 ? (
          <p className="shrink-0 text-xs font-medium text-muted-foreground">
            {rows.length} termina
            {tv.enabled ? ` · prikaz ${tv.from + 1}–${tv.to}` : null}
          </p>
        ) : null}
      </div>
      <div
        ref={scrollRef}
        className={cn(
          "overflow-x-auto",
          rows.length >= 45 && "max-h-[min(70vh,520px)] overflow-y-auto"
        )}
      >
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead
            className={cn(
              appTableHeadClass,
              "sticky top-0 z-20 bg-card/95 backdrop-blur-sm",
              headShadow &&
                "shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] dark:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.45)]"
            )}
          >
            <tr className="border-b border-border/90">
              <th className="px-5 py-3.5">Datum</th>
              <th className="px-5 py-3.5">Klijent</th>
              <th className="px-5 py-3.5">Usluga</th>
              <th className="px-5 py-3.5 text-right">Cena</th>
              <th className="px-5 py-3.5">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className={appTableRowClass}>
                <td className="px-5 py-8 text-center text-muted-foreground" colSpan={5}>
                  Učitavanje termina…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr className={appTableRowClass}>
                <td className="px-5 py-8 text-center text-muted-foreground" colSpan={5}>
                  Nema termina u ovom periodu.
                </td>
              </tr>
            ) : (
              <>
                {tv.topSpacer > 0 ? (
                  <tr aria-hidden>
                    <td colSpan={5} style={{ height: tv.topSpacer, padding: 0, border: 0 }} />
                  </tr>
                ) : null}
                {visible.map((a) => {
                  const st = txnStatus(a);
                  return (
                    <tr key={a.id} className={appTableRowClass}>
                      <td className="px-5 py-3.5 text-foreground">
                        {formatApptWhen(a.date, tz)}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-foreground">
                        {a.client_name ?? `Klijent #${a.client_id}`}
                      </td>
                      <td className="px-5 py-3.5 text-foreground">
                        {a.service_name ?? `Usluga #${a.service_id}`}
                      </td>
                      <td className="px-5 py-3.5 text-right tabular-nums text-foreground">
                        {formatRsd(apptPrice(a))}
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant="outline" className={cn("font-medium", st.badgeClass)}>
                          {st.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
                {tv.bottomSpacer > 0 ? (
                  <tr aria-hidden>
                    <td colSpan={5} style={{ height: tv.bottomSpacer, padding: 0, border: 0 }} />
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>
    </SurfaceCard>
  );
}
