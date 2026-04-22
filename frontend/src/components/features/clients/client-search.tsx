"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type {
  ClientDirectoryFilters,
  ClientLastVisitFilter,
  ClientLoyaltyFilter,
  ClientSpentFilter,
} from "./client-filters";

type ClientSearchProps = {
  search: string;
  onSearchChange: (value: string) => void;
  filters: ClientDirectoryFilters;
  onFiltersChange: (next: ClientDirectoryFilters) => void;
  filteredCount: number;
  totalCount: number;
  showFinancial: boolean;
  className?: string;
};

const LAST_VISIT_OPTIONS: { value: ClientLastVisitFilter; label: string }[] = [
  { value: "any", label: "Bilo kada" },
  { value: "never", label: "Bez završene posete" },
  { value: "30d", label: "Poseta ≤ 30 d." },
  { value: "90d", label: "Poseta ≤ 90 d." },
  { value: "365d", label: "Poseta ≤ god. dana" },
];

const LOYALTY_OPTIONS: { value: ClientLoyaltyFilter; label: string }[] = [
  { value: "any", label: "Svi" },
  { value: "none", label: "Bez loyalty stanja" },
  { value: "has_stamps", label: "Ima pečate" },
  { value: "has_reward", label: "Ima nagradu" },
];

const SPENT_OPTIONS: { value: ClientSpentFilter; label: string }[] = [
  { value: "any", label: "Bilo koji" },
  { value: "zero", label: "0 RSD" },
  { value: "low", label: "1 – 20.000 RSD" },
  { value: "mid", label: "20.001 – 100.000 RSD" },
  { value: "high", label: "Preko 100.000 RSD" },
];

export function ClientSearch({
  search,
  onSearchChange,
  filters,
  onFiltersChange,
  filteredCount,
  totalCount,
  showFinancial,
  className,
}: ClientSearchProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <Label htmlFor="client-search-input" className="text-foreground">
            Pretraga
          </Label>
          <Input
            id="client-search-input"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Ime, telefon, e-mail, beleška…"
            className="max-w-xl rounded-xl border-border bg-card text-base"
            aria-label="Pretraga klijenata"
          />
        </div>
        <p className="shrink-0 text-sm font-medium text-muted-foreground lg:pb-2">
          <span className="tabular-nums font-semibold text-foreground">
            {filteredCount}
          </span>{" "}
          od {totalCount} klijenata
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="filter-last-visit" className="text-xs text-muted-foreground">
            Poslednja poseta (završen termin)
          </Label>
          <select
            id="filter-last-visit"
            value={filters.lastVisit}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                lastVisit: e.target.value as ClientLastVisitFilter,
              })
            }
            className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          >
            {LAST_VISIT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="filter-loyalty" className="text-xs text-muted-foreground">
            Loyalty
          </Label>
          <select
            id="filter-loyalty"
            value={filters.loyalty}
            onChange={(e) =>
              onFiltersChange({
                ...filters,
                loyalty: e.target.value as ClientLoyaltyFilter,
              })
            }
            className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
          >
            {LOYALTY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        {showFinancial ? (
          <div className="space-y-1.5">
            <Label htmlFor="filter-spent" className="text-xs text-muted-foreground">
              Ukupno potrošeno (završeni termini)
            </Label>
            <select
              id="filter-spent"
              value={filters.totalSpent}
              onChange={(e) =>
                onFiltersChange({
                  ...filters,
                  totalSpent: e.target.value as ClientSpentFilter,
                })
              }
              className="flex h-10 w-full rounded-xl border border-border bg-card px-3 text-sm text-foreground"
            >
              {SPENT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="hidden rounded-xl border border-dashed border-border/80 bg-muted/30 px-3 py-2 text-xs text-muted-foreground sm:block lg:flex lg:items-end">
            Filter potrošnje dostupan administratoru.
          </div>
        )}
      </div>
    </div>
  );
}
