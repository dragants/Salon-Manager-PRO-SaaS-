"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { getServices } from "@/lib/api";
import { formatWorkingHoursBrief } from "@/components/features/settings/working-hours-editor";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";

const DISMISS_KEY = "salon_setup_banner_dismissed";

export function SetupBanner() {
  const { user } = useAuth();
  const { settings, loading } = useOrganization();
  const [serviceCount, setServiceCount] = useState<number | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      queueMicrotask(() => setDismissed(true));
    }
  }, []);

  useEffect(() => {
    if (user?.role !== "admin") {
      return;
    }
    let c = false;
    void getServices()
      .then((r) => {
        if (!c) {
          setServiceCount(Array.isArray(r.data) ? r.data.length : 0);
        }
      })
      .catch(() => {
        if (!c) {
          setServiceCount(0);
        }
      });
    return () => {
      c = true;
    };
  }, [user?.role]);

  if (user?.role !== "admin" || dismissed || loading) {
    return null;
  }
  if (serviceCount === null) {
    return null;
  }

  const hoursBrief = formatWorkingHoursBrief(
    settings?.working_hours as Record<string, unknown> | undefined
  );
  const hoursWeak =
    hoursBrief.includes("Još nije") || hoursBrief.includes("Nema uključenih");

  const stepsLeft = (serviceCount === 0 ? 1 : 0) + (hoursWeak ? 1 : 0);
  if (stepsLeft === 0) {
    return null;
  }

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }

  function startOnboarding() {
    sessionStorage.setItem("salon_onboarding_pending", "1");
  }

  return (
    <div className="border-b border-amber-200/90 bg-gradient-to-r from-amber-50 via-white to-amber-50 px-4 py-2.5 dark:border-amber-900/50 dark:from-amber-950/40 dark:via-zinc-950 dark:to-amber-950/40 md:px-6">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-2 text-center sm:justify-between sm:text-left">
        <p className="text-sm text-amber-950 dark:text-amber-100">
          <span className="font-semibold">Završi podešavanje</span>
          <span className="text-amber-900/90 dark:text-amber-200/90">
            {" "}
            — preostalo je oko {stepsLeft}{" "}
            {stepsLeft === 1 ? "korak" : "koraka"} (usluge / radno vreme).
          </span>
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Link
            href="/onboarding"
            onClick={startOnboarding}
            className={cn(
              buttonVariants({ variant: "brand", size: "sm" }),
              "rounded-lg no-underline"
            )}
          >
            Nastavi čarobnjak
          </Link>
          <Link
            href="/settings?tab=services"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "rounded-lg border-amber-300 bg-white/80 no-underline dark:border-amber-800 dark:bg-zinc-900"
            )}
          >
            Podešavanja
          </Link>
          <button
            type="button"
            className="inline-flex size-8 items-center justify-center rounded-lg text-amber-800/80 hover:bg-amber-100/80 dark:text-amber-200 dark:hover:bg-amber-950/60"
            aria-label="Sakrij obaveštenje"
            onClick={dismiss}
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
