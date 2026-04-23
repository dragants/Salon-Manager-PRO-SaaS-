"use client";

import { useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { deleteExpense } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { appTableHeadClass, appTableRowClass } from "@/lib/app-ui";
import { formatRsd } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";
import { useTableHeadShadow } from "@/hooks/useTableHeadShadow";
import { useTableViewportWindow } from "@/hooks/useTableViewportWindow";
import type { ExpenseRow } from "@/types/expense";

type ExpensesTableProps = {
  rows: ExpenseRow[];
  loading: boolean;
  monthLabel: string;
  onAddClick: () => void;
  onReload: () => Promise<void>;
};

export function ExpensesTable({
  rows,
  loading,
  monthLabel,
  onAddClick,
  onReload,
}: ExpensesTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const headShadow = useTableHeadShadow(scrollRef);
  const tv = useTableViewportWindow(scrollRef, rows.length, 52, {
    minItems: 45,
  });
  const visible = tv.enabled ? rows.slice(tv.from, tv.to) : rows;

  return (
    <SurfaceCard padding="none" className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-foreground">
            Troškovi (baza)
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {monthLabel}. Stavke se čuvaju u PostgreSQL-u po organizaciji.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
          {!loading && rows.length > 0 ? (
            <p className="order-last shrink-0 text-xs font-medium text-muted-foreground sm:order-first sm:ml-auto">
              {rows.length} {rows.length === 1 ? "stavka" : "stavki"}
              {tv.enabled ? ` · prikaz ${tv.from + 1}–${tv.to}` : null}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="gap-2 rounded-xl sm:shrink-0"
            onClick={onAddClick}
          >
            <Plus className="size-4" aria-hidden />
            Evidentiraj trošak
          </Button>
        </div>
      </div>
      <div
        ref={scrollRef}
        className={cn(
          "overflow-x-auto",
          rows.length >= 45 && "max-h-[min(60vh,420px)] overflow-y-auto"
        )}
      >
        <table className="w-full min-w-[560px] text-left text-sm">
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
              <th className="px-5 py-3.5">Opis</th>
              <th className="px-5 py-3.5">Kategorija</th>
              <th className="px-5 py-3.5 text-right">Iznos</th>
              <th className="w-14 px-5 py-3.5" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr className={appTableRowClass}>
                <td className="px-5 py-8 text-center text-muted-foreground" colSpan={5}>
                  Učitavanje troškova…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr className={appTableRowClass}>
                <td className="px-5 py-8 text-center text-muted-foreground" colSpan={5}>
                  Nema unetih troškova za ovaj mesec. Koristi „Evidentiraj trošak" ili okvirnu procenu iznad.
                </td>
              </tr>
            ) : (
              <>
                {tv.topSpacer > 0 ? (
                  <tr aria-hidden>
                    <td colSpan={5} style={{ height: tv.topSpacer, padding: 0, border: 0 }} />
                  </tr>
                ) : null}
                {visible.map((ex) => (
                  <tr key={ex.id} className={cn(appTableRowClass, "h-[52px]")}>
                    <td className="px-5 py-3 tabular-nums text-foreground">{ex.spent_at}</td>
                    <td className="max-w-[200px] truncate px-5 py-3 font-medium text-foreground">{ex.title}</td>
                    <td className="px-5 py-3 text-muted-foreground">{ex.category?.trim() ? ex.category : "—"}</td>
                    <td className="px-5 py-3 text-right tabular-nums text-foreground">{formatRsd(ex.amount_rsd)}</td>
                    <td className="px-5 py-3 text-right">
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        className="rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                        aria-label="Obriši trošak"
                        onClick={() => {
                          void (async () => {
                            try {
                              await deleteExpense(ex.id);
                              await onReload();
                              toast.success("Trošak je obrisan.");
                            } catch (err) {
                              toast.error(getApiErrorMessage(err, "Brisanje nije uspelo."));
                            }
                          })();
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
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
