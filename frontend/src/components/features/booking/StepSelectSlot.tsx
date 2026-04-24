"use client";

import { Check, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
import { WorkerAvatar } from "./booking-shared";
import type { PublicSlot } from "@/lib/api/public-booking";

type StepSelectSlotProps = {
  slots: PublicSlot[];
  slotsLoading: boolean;
  slotsError: string | null;
  fromShifts: boolean;
  selectedSlot: PublicSlot | null;
  onSelect: (slot: PublicSlot) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepSelectSlot({
  slots,
  slotsLoading,
  slotsError,
  fromShifts,
  selectedSlot,
  onSelect,
  onNext,
  onBack,
}: StepSelectSlotProps) {
  return (
    <SurfaceCard
      padding="md"
      className="space-y-4 border-border/90 shadow-[var(--smp-shadow-soft)] ring-1 ring-primary/5"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Clock className="size-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Slobodni termini
          </h2>
          <p className="text-xs text-muted-foreground">
            Izaberi vreme{fromShifts ? " i osobu" : ""} — izabrani termin je
            jasno označen.
          </p>
        </div>
      </div>

      {slotsLoading ? (
        <div className="flex flex-col items-center gap-3 py-8">
          <div
            className="size-9 animate-pulse rounded-full bg-sky-200/90 dark:bg-sky-900/60"
            aria-hidden
          />
          <p className="text-sm font-medium text-muted-foreground">
            Učitavanje termina…
          </p>
        </div>
      ) : slotsError ? (
        <p className="text-sm text-red-700 dark:text-red-300">{slotsError}</p>
      ) : slots.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nema slobodnih termina za ovaj dan. Izaberi drugi datum ili proveri
          radno vreme u podešavanjima salona.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {slots.map((slot) => {
            const isSelected =
              selectedSlot?.start === slot.start &&
              selectedSlot?.employee_id === slot.employee_id;
            const workerLabel = slot.employee_name ?? "Tim salona";
            return (
              <button
                key={`${slot.start}-${slot.employee_id ?? "x"}`}
                type="button"
                onClick={() => onSelect(slot)}
                className={cn(
                  "group relative flex flex-col gap-2 rounded-2xl border-2 px-3 py-3 text-left transition-all duration-200",
                  isSelected
                    ? "z-10 border-primary bg-gradient-to-b from-primary to-primary/90 text-primary-foreground shadow-[0_14px_44px_-18px_rgb(var(--primary)/0.75)] ring-4 ring-primary/30 scale-[1.02]"
                    : "border-border bg-card text-foreground hover:border-primary/45 hover:bg-primary/[0.06] hover:shadow-md active:scale-[0.98] dark:bg-card"
                )}
              >
                {isSelected ? (
                  <span className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary-foreground/20 text-primary-foreground backdrop-blur-[2px]">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                ) : null}
                <span
                  className={cn(
                    "pr-7 text-lg font-bold tabular-nums leading-none tracking-tight",
                    isSelected ? "text-primary-foreground" : "text-foreground"
                  )}
                >
                  {slot.label}
                </span>
                <div className="flex items-center gap-2">
                  <WorkerAvatar
                    name={workerLabel}
                    employeeId={slot.employee_id}
                    size="sm"
                    className={cn(
                      "ring-2",
                      isSelected
                        ? "ring-primary-foreground/35"
                        : "ring-background"
                    )}
                  />
                  <span
                    className={cn(
                      "line-clamp-2 min-w-0 flex-1 text-[11px] font-semibold leading-tight",
                      isSelected
                        ? "text-primary-foreground/95"
                        : "text-muted-foreground group-hover:text-foreground"
                    )}
                  >
                    {workerLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-11 flex-1 rounded-xl"
          onClick={onBack}
        >
          Nazad
        </Button>
        <Button
          type="button"
          variant="brand"
          className="h-11 flex-1 rounded-xl"
          disabled={!selectedSlot || slotsLoading}
          onClick={onNext}
        >
          Dalje
        </Button>
      </div>
    </SurfaceCard>
  );
}
