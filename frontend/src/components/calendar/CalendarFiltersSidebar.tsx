"use client";

import { Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { AppointmentStatus } from "@/types/appointment";
import { STATUS_LABEL } from "./calendar-constants";

export type CalendarStatusFilter = "all" | AppointmentStatus;

type Props = {
  statusFilter: CalendarStatusFilter;
  onStatusFilterChange: (v: CalendarStatusFilter) => void;
  search: string;
  onSearchChange: (v: string) => void;
};

const STATUS_OPTIONS: { value: CalendarStatusFilter; label: string }[] = [
  { value: "all", label: "Svi statusi" },
  { value: "scheduled", label: STATUS_LABEL.scheduled },
  { value: "completed", label: STATUS_LABEL.completed },
  { value: "no_show", label: STATUS_LABEL.no_show },
];

export default function CalendarFiltersSidebar({
  statusFilter,
  onStatusFilterChange,
  search,
  onSearchChange,
}: Props) {
  return (
    <aside className="w-full shrink-0 space-y-5 rounded-xl border border-sky-100 bg-white p-4 shadow-sm lg:w-56">
      <div className="flex items-center gap-2 text-sm font-semibold text-sky-950">
        <Filter className="size-4 text-sky-600" aria-hidden />
        Filteri
      </div>

      <p className="text-xs leading-relaxed text-sky-700/90">
        Termini se uvek učitavaju samo za izabrani dan (prikaz Dan) ili za celu
        nedelju (prikaz Nedelja). Ovde biraš koji statusi da budu vidljivi među
        tim terminima — ne otvara sve datume odjednom.
      </p>

      <div className="space-y-2">
        <Label className="text-xs text-sky-700">Status termina</Label>
        <div className="flex flex-col gap-1">
          {STATUS_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onStatusFilterChange(value)}
              className={cn(
                "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                statusFilter === value
                  ? "bg-sky-600 font-medium text-white shadow-sm"
                  : "text-sky-800 hover:bg-sky-50"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cal-filter-search" className="text-xs text-sky-700">
          Pretraga
        </Label>
        <Input
          id="cal-filter-search"
          placeholder="Klijent ili usluga…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="border-sky-200"
        />
      </div>
    </aside>
  );
}
