"use client";

import { CircleCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BookingSuccess as BookingSuccessData } from "./booking-shared";

type BookingSuccessProps = {
  salonName: string;
  data: BookingSuccessData;
  onReset: () => void;
};

export function BookingSuccess({
  salonName,
  data,
  onReset,
}: BookingSuccessProps) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 text-center">
      <div className="flex size-20 items-center justify-center rounded-3xl bg-emerald-100/80 shadow-inner dark:bg-emerald-900/40">
        <CircleCheck
          className="size-10 text-emerald-600 dark:text-emerald-300"
          aria-hidden
        />
      </div>
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Termin je rezervisan!
        </h2>
        <p className="mt-3 text-sm font-medium text-foreground/80">
          {data.summary}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{data.notifyHint}</p>
      </div>
      <Button
        type="button"
        variant="brand"
        className="h-11 w-full max-w-xs rounded-xl"
        onClick={onReset}
      >
        Zakaži novi termin
      </Button>
      <p className="text-xs text-muted-foreground/70">
        {salonName} — hvala na poverenju!
      </p>
    </div>
  );
}
