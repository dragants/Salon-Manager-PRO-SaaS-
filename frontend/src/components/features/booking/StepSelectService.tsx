"use client";

import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";

type ServiceItem = {
  id: number;
  name: string;
  price: string | number;
  duration: number;
};

type StepSelectServiceProps = {
  services: ServiceItem[];
  serviceId: number | "";
  onSelect: (id: number) => void;
  onNext: () => void;
};

export function StepSelectService({
  services,
  serviceId,
  onSelect,
  onNext,
}: StepSelectServiceProps) {
  return (
    <SurfaceCard
      padding="md"
      className="space-y-4 border-border/90 shadow-[var(--smp-shadow-soft)] ring-1 ring-primary/5"
    >
      <div className="flex items-center gap-2">
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="size-4" aria-hidden />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">
            Izaberi uslugu
          </h2>
          <p className="text-xs text-muted-foreground">
            Jedan klik — odmah vidiš trajanje i cenu.
          </p>
        </div>
      </div>

      {services.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Ovaj salon još nema javnih usluga za rezervaciju.
        </p>
      ) : (
        <div className="grid gap-2.5">
          {services.map((s) => {
            const selected = serviceId === s.id;
            const priceNum = Number(
              String(s.price).replace(/\s/g, "").replace(",", ".")
            );
            const priceLabel = Number.isFinite(priceNum)
              ? `${priceNum.toLocaleString("sr-RS")} RSD`
              : `${s.price} RSD`;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                className={cn(
                  "group flex w-full items-start gap-3 rounded-2xl border-2 p-4 text-left transition-all duration-200",
                  selected
                    ? "border-primary bg-gradient-to-br from-primary/12 via-card to-card shadow-[0_12px_36px_-18px_rgb(var(--primary)/0.45)] ring-4 ring-primary/15"
                    : "border-border bg-card hover:border-primary/40 hover:bg-primary/[0.04] hover:shadow-md active:scale-[0.99]"
                )}
              >
                <div
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-2xl transition-colors",
                    selected
                      ? "bg-primary text-primary-foreground shadow-[0_8px_20px_-8px_rgb(var(--primary)/0.55)]"
                      : "bg-primary/10 text-primary group-hover:bg-primary/15"
                  )}
                >
                  <Sparkles className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug text-foreground">
                    {s.name}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/80">
                      {Number(s.duration)} min
                    </span>
                    <span className="mx-1.5 text-border">·</span>
                    <span>{priceLabel}</span>
                  </p>
                </div>
                <div
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-transparent bg-muted/60 text-transparent group-hover:border-border group-hover:text-muted-foreground"
                  )}
                >
                  <Check className="size-4" strokeWidth={2.75} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <Button
        type="button"
        variant="brand"
        className="h-11 w-full rounded-xl"
        disabled={services.length === 0 || serviceId === ""}
        onClick={onNext}
      >
        Dalje
      </Button>
    </SurfaceCard>
  );
}
