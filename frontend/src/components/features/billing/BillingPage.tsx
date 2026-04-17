"use client";

import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    price: "0 €",
    features: ["Start za manje salone", "Osnovni limiti po planu"],
  },
  {
    name: "Basic",
    price: "Jedna mesečna cena",
    features: ["Viši limit klijenata", "Više termina mesečno"],
  },
  {
    name: "Pro",
    price: "Napredniji kapacitet",
    features: ["Najviši limiti", "SMS i naprednije funkcije"],
  },
] as const;

/**
 * Pregled planova (marketinški blok). Stvarna aktivacija ide na /subscribe (Paddle).
 */
export function BillingPage() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      <SectionHeader
        title="Planovi"
        description="Izaberi nivo koji odgovara salonu. Naplata i aktivacija — na strani pretplate."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => (
          <SurfaceCard
            key={plan.name}
            padding="lg"
            className="flex flex-col border-border"
          >
            <h2 className="text-lg font-semibold text-foreground">{plan.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{plan.price}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-foreground">
              {plan.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-primary" aria-hidden>
                    ✓
                  </span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/subscribe"
              className={cn(
                buttonVariants({ variant: "brand", size: "default" }),
                "mt-6 flex h-11 w-full items-center justify-center no-underline"
              )}
            >
              Idi na pretplatu
            </Link>
          </SurfaceCard>
        ))}
      </div>
    </div>
  );
}
