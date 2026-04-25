"use client";
import { useT } from "@/lib/i18n/locale";

import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SurfaceCard } from "@/components/ui/surface-card";
import { addDays, formatYyyyMmDd, todayLocal } from "@/lib/dateLocal";
import { cn } from "@/lib/utils";
import { todayYmdLocal } from "./booking-shared";

type StepSelectDateProps = {
  date: string;
  onDateChange: (date: string) => void;
  onNext: () => void;
  onBack: () => void;
};

export function StepSelectDate({
  date,
  onDateChange,
  onNext,
  onBack,
}: StepSelectDateProps) {
  const t = useT();
  return (
    <SurfaceCard
      padding="md"
      className="space-y-4 border-border/90 shadow-[var(--smp-shadow-soft)] ring-1 ring-primary/5"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <CalendarDays className="size-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Izaberi datum
          </h2>
          <p className="text-xs text-muted-foreground">
            Brzi izbor ili tačan datum u kalendaru.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { label: "Danas", d: 0 },
            { label: "Sutra", d: 1 },
            { label: "Za 2 dana", d: 2 },
          ] as const
        ).map(({ label, d }) => {
          const ymd = formatYyyyMmDd(addDays(todayLocal(), d));
          const picked = date === ymd;
          return (
            <button
              key={label}
              type="button"
              onClick={() => onDateChange(ymd)}
              className={cn(
                "rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold transition-all duration-200",
                picked
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_10px_28px_-12px_rgb(var(--primary)/0.55)] ring-2 ring-primary/25"
                  : "border-border bg-muted/40 text-foreground hover:border-primary/40 hover:bg-primary/5 dark:bg-muted/25"
              )}
            >
              {label}
            </button>
          );
        })}
      </div>

      <Input
        type="date"
        min={todayYmdLocal()}
        value={date}
        onChange={(e) => onDateChange(e.target.value)}
        className="border-border bg-card"
      />

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
          onClick={onNext}
        >
          Dalje
        </Button>
      </div>
    </SurfaceCard>
  );
}
