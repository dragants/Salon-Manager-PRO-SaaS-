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
  /** Kompaktan red (npr. ugrađen kalendar na dashboardu). */
  minimal?: boolean;
  /** Naslov u minimal režimu (podrazum. „Nedeljni kalendar“). */
  title?: string;
  headerClassName?: string;
};

export default function CalendarHeader({
  view,
  onViewChange,
  timeZone,
  onToday,
  onPrev,
  onNext,
  onAddClick,
  minimal = false,
  title = "Nedeljni kalendar",
  headerClassName,
}: Props) {
  if (minimal) {
    return (
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-3",
          headerClassName
        )}
      >
        <h2 className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="flex rounded-[var(--lux-radius-md)] border border-border bg-muted/50 p-0.5">
            <button
              type="button"
              onClick={() => onViewChange("day")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                view === "day"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              Dan
            </button>
            <button
              type="button"
              onClick={() => onViewChange("week")}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                view === "week"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted/80 hover:text-foreground"
              )}
            >
              Nedelja
            </button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg text-xs"
            onClick={onToday}
          >
            Danas
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-8 rounded-lg"
            onClick={onPrev}
            aria-label="Prethodno"
          >
            <ChevronLeft className="size-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            className="size-8 rounded-lg"
            onClick={onNext}
            aria-label="Sledeće"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            type="button"
            variant="brand"
            size="sm"
            className="h-9 rounded-xl px-4"
            onClick={onAddClick}
          >
            <Plus className="size-4" />
            Dodaj termin
          </Button>
        </div>
        <p className="sr-only">Zona {timeZone}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-2xl space-y-1">
        <h1 className="font-heading text-[length:var(--lux-text-h2)] font-semibold text-foreground">
          Kalendar
        </h1>
        <p className="text-sm text-muted-foreground">
          {view === "week"
            ? "Cela nedelja (pon–ned). Prevuci blok termina na drugi dan da promeniš datum; vreme u koracima od 15 min."
            : "Jedan dan odjednom. Ispod svakog termina su dugmad Zakazano, Završeno, Nije došao."}{" "}
          Zona <span className="font-medium text-foreground">{timeZone}</span>.
        </p>
        <p className="text-xs leading-snug text-muted-foreground">
          {view === "week"
            ? "Na maloj kartici u mreži: Z = zakazano, V = završeno, × = nije došao. Nema posebnog „odloženo“ — odložiti znači novi datum (prevlačenje) ili izmena početka u „Dan“."
            : "„Plaćeno“ nije status termina; dnevni prihod je u Finansijama. Da pomeriš termin, pređi na Nedelju i prevuci ga ili promeni datum/vreme."}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-[var(--lux-radius-md)] border border-border bg-card/80 p-0.5 shadow-[var(--lux-shadow-soft)]">
          <button
            type="button"
            onClick={() => onViewChange("day")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              view === "day"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            )}
          >
            Dan
          </button>
          <button
            type="button"
            onClick={() => onViewChange("week")}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              view === "week"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-white/[0.06] hover:text-foreground"
            )}
          >
            Nedelja
          </button>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onToday}>
          Danas
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={onPrev}
          aria-label="Prethodno"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={onNext}
          aria-label="Sledeće"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button type="button" size="sm" variant="brand" onClick={onAddClick}>
          <Plus className="size-4" />
          Dodaj termin
        </Button>
      </div>
    </div>
  );
}
