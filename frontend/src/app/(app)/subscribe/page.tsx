"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getBillingStatus, startBillingCheckout } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { BillingStatus } from "@/types/billing";

export default function SubscribePage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getBillingStatus();
      setStatus(data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Status nije učitan."));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onActivate() {
    setCheckoutLoading(true);
    setError(null);
    try {
      const { url } = await startBillingCheckout();
      if (url) {
        window.location.href = url;
      }
    } catch (e) {
      setError(getApiErrorMessage(e, "Aktivacija nije pokrenuta."));
    } finally {
      setCheckoutLoading(false);
    }
  }

  const st = status?.subscription_status ?? null;
  const ok = st === "active" || st === "trialing";

  if (loading) {
    return (
      <SurfaceCard padding="lg" className="mx-auto max-w-lg text-center">
        <p className="text-sm text-slate-600 dark:text-slate-400">Učitavanje…</p>
      </SurfaceCard>
    );
  }

  if (ok) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6 text-center">
        <SectionHeader
          title="Pretplata je aktivna"
          description="Možeš da nastaviš rad u aplikaciji."
        />
        <SurfaceCard padding="lg">
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "brand", size: "lg" }),
              "h-11 w-full max-w-sm justify-center no-underline"
            )}
          >
            Na dashboard
          </Link>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 text-center">
      <SectionHeader
        title="Aktivirajte pretplatu"
        description="Upravljajte terminima, klijentima i zaradom — jedna mesečna cena, bez skrivenih troškova."
      />
      <SurfaceCard padding="lg">
        {error ? (
          <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
            {error}
          </p>
        ) : null}
        <Button
          type="button"
          variant="brand"
          className="h-11 w-full max-w-sm"
          disabled={checkoutLoading}
          onClick={() => void onActivate()}
        >
          {checkoutLoading ? "Otvaranje plaćanja…" : "Aktiviraj pretplatu"}
        </Button>
        <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
          Naplata ide preko Paddle-a. Možeš i da podesiš karticu u podešavanjima.
        </p>
      </SurfaceCard>
      <Link
        href="/settings?tab=billing"
        className="text-sm font-medium text-sky-800 underline-offset-2 hover:underline dark:text-sky-400"
      >
        Više o naplati u podešavanjima
      </Link>
    </div>
  );
}
