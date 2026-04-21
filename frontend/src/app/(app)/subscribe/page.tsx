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
        <p className="text-sm text-muted-foreground">Učitavanje…</p>
      </SurfaceCard>
    );
  }

  if (ok) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-6 text-center">
        <SectionHeader
          title="Pretplata je aktivna"
          description={
            status?.billing_plan ? (
              <>
                Plan u sistemu:{" "}
                <strong className="capitalize">{status.billing_plan}</strong>.
                Možeš da nastaviš rad u aplikaciji.
              </>
            ) : (
              "Možeš da nastaviš rad u aplikaciji."
            )
          }
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
        {status?.client_limits?.enforced &&
        status.client_limits.max_clients != null ? (
          <p
            className={cn(
              "mb-4 rounded-xl border px-3 py-2 text-left text-sm",
              status.client_limits.at_limit
                ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100"
                : "border-border bg-muted text-foreground  dark:bg-card/50 "
            )}
          >
            <span className="font-semibold">Klijenti:</span>{" "}
            {status.client_limits.current_clients} /{" "}
            {status.client_limits.max_clients}
            {status.client_limits.plan === "free"
              ? " na besplatnom planu. Aktivnom pretplatom dobijaš znatno viši limit."
              : status.client_limits.plan === "basic"
                ? " na Basic planu. Pro daje još više kapaciteta."
                : " na Pro planu."}
          </p>
        ) : null}
        {status?.appointment_limits?.enforced &&
        status.appointment_limits.max_appointments_month != null ? (
          <p
            className={cn(
              "mb-4 rounded-xl border px-3 py-2 text-left text-sm",
              status.appointment_limits.at_limit
                ? "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/35 dark:text-amber-100"
                : "border-border bg-muted text-foreground  dark:bg-card/50 "
            )}
          >
            <span className="font-semibold">Termini (ovaj mesec):</span>{" "}
            {status.appointment_limits.current_appointments_month} /{" "}
            {status.appointment_limits.max_appointments_month}
            {status.appointment_limits.plan === "free"
              ? ` · mesec se računa u zoni ${status.appointment_limits.timezone}.`
              : status.appointment_limits.plan === "basic"
                ? ` · Basic; zona ${status.appointment_limits.timezone}.`
                : ` · Pro; zona ${status.appointment_limits.timezone}.`}
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
        <p className="mt-4 text-xs text-muted-foreground">
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
