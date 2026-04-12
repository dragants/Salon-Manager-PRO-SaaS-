"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  view: "day" | "week";
  onViewChange: (v: "day" | "week") => void;
  timeZone: string;
  onToday: () => void;
  onPrev: () => void;
  onNext: () => void;
  onAddClick: () => void;
};

export default function CalendarHeader({
  view,
  onViewChange,
  timeZone,
  onToday,
  onPrev,
  onNext,
  onAddClick,
}: Props) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-2xl space-y-1">
        <h1 className="text-2xl font-semibold text-sky-950">Kalendar</h1>
        <p className="text-sm text-sky-800/75">
          {view === "week"
            ? "Cela nedelja (pon–ned). Prevuci blok termina na drugi dan da promeniš datum; vreme u koracima od 15 min."
            : "Jedan dan odjednom. Ispod svakog termina su dugmad Zakazano, Završeno, Nije došao."}{" "}
          Zona <span className="font-medium text-sky-900">{timeZone}</span>.
        </p>
        <p className="text-xs leading-snug text-sky-700/85">
          {view === "week"
            ? "Na maloj kartici u mreži: Z = zakazano, V = završeno, × = nije došao. Nema posebnog „odloženo“ — odložiti znači novi datum (prevlačenje) ili izmena početka u „Dan“."
            : "„Plaćeno“ nije status termina; dnevni prihod je u Finansijama. Da pomeriš termin, pređi na Nedelju i prevuci ga ili promeni datum/vreme."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-2xl border border-sky-200/90 bg-white p-0.5 shadow-sm dark:border-slate-600 dark:bg-slate-900/60">
          <button
            type="button"
            onClick={() => onViewChange("day")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
              view === "day"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-sky-800 hover:bg-sky-50 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            Dan
          </button>
          <button
            type="button"
            onClick={() => onViewChange("week")}
            className={cn(
              "rounded-xl px-3 py-1.5 text-sm font-medium transition-colors",
              view === "week"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-sky-800 hover:bg-sky-50 dark:text-slate-300 dark:hover:bg-slate-800"
            )}
          >
            Nedelja
          </button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-sky-200"
          onClick={onToday}
        >
          Danas
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="border-sky-200"
          onClick={onPrev}
          aria-label="Prethodno"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          className="border-sky-200"
          onClick={onNext}
          aria-label="Sledeće"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="brand"
          onClick={onAddClick}
        >
          <Plus className="size-4" />
          Dodaj termin
        </Button>
      </div>
    </div>
  );
}
