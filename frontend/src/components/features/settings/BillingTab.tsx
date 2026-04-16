"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  getBillingStatus,
  openBillingPortal,
  startBillingCheckout,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { Button } from "@/components/ui/button";
import type { BillingStatus } from "@/types/billing";
import { SettingsCard } from "./SettingsCard";

function statusLabel(s: string | null): string {
  if (!s) return "Nepoznato";
  if (s === "active") return "Aktivna";
  if (s === "trialing") return "Probni period";
  if (s === "past_due") return "Dospelo plaćanje";
  if (s === "canceled") return "Otkazano";
  if (s === "unpaid") return "Neplaćeno";
  if (s === "inactive") return "Nije aktivirano";
  if (s === "incomplete" || s === "incomplete_expired") return "Nepotpuno";
  if (s === "paused") return "Pauzirano";
  return s;
}

export function BillingTab() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const checkoutFlag = searchParams.get("checkout");
  const portalFlag = searchParams.get("portal");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getBillingStatus();
      setStatus(data);
    } catch (e) {
      setError(getApiErrorMessage(e, "Status pretplate nije učitan."));
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function onSubscribe() {
    setCheckoutLoading(true);
    setError(null);
    try {
      const { url } = await startBillingCheckout();
      if (url) {
        window.location.href = url;
      }
    } catch (e) {
      setError(getApiErrorMessage(e, "Checkout nije pokrenut."));
    } finally {
      setCheckoutLoading(false);
    }
  }

  async function onOpenPortal() {
    setPortalLoading(true);
    setError(null);
    try {
      const { url } = await openBillingPortal();
      if (url) {
        window.location.href = url;
      }
    } catch (e) {
      setError(getApiErrorMessage(e, "Portal nije otvoren."));
    } finally {
      setPortalLoading(false);
    }
  }

  const st = status?.subscription_status ?? null;
  const ok = st === "active" || st === "trialing";
  const enforced = status?.subscription_enforced ?? false;
  const hasSubscription = Boolean(status?.has_subscription);
  /** Status u bazi može biti „active“ pre nego što webhook upiše Paddle subscription_id. */
  const showCheckout = !ok || (ok && !hasSubscription);
  const showPortal = hasSubscription;

  return (
    <div className="space-y-6">
      {checkoutFlag === "success" ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Plaćanje je završeno. Klikni „Osveži status“ kad webhook upiše pretplatu
          (obično odmah).
        </p>
      ) : null}
      {checkoutFlag === "cancel" ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Naplata je otkazana. Možeš pokušati ponovo kad god želiš.
        </p>
      ) : null}
      {portalFlag === "return" ? (
        <p className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">
          Vraćeni ste sa Paddle-a. Klikni „Osveži status“ ako si menjao pretplatu ili
          karticu.
        </p>
      ) : null}

      <SettingsCard
        title="Pretplata (Paddle)"
        description="Mesečna pretplata salona preko Paddle-a. Karticu i pretplatu menjaš na Paddle checkout-u; dugme „Upravljaj pretplatom“ kada postoji aktivna pretplata u sistemu."
      >
        {loading ? (
          <p className="text-sm text-zinc-500">Učitavanje…</p>
        ) : error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </p>
        ) : (
          <div className="space-y-4 max-w-lg">
            <div className="rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm">
              <p className="font-medium text-zinc-900">Status</p>
              <p className="mt-1 text-zinc-600">{statusLabel(st)}</p>
              {enforced && !ok ? (
                <p className="mt-2 text-xs text-amber-800">
                  Uključena je kontrola pretplate: bez aktivnog ili probnog perioda
                  aplikacija neće učitavati podatke (osim ove stranice i prijave).
                </p>
              ) : null}
            </div>
            {ok && !hasSubscription ? (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                Status u bazi je aktivan, ali Paddle pretplata još nije upisana (čeka
                se webhook ili osvežavanje). Otvori Paddle ispod ili klikni „Osveži
                status“.
              </p>
            ) : null}
            {ok && hasSubscription ? (
              <p className="text-sm text-zinc-600">
                Pretplata je aktivna. Za karticu ili izmene koristi Paddle (dugme
                ispod).
              </p>
            ) : !ok ? (
              <p className="text-sm text-zinc-600">
                Aktiviraj pretplatu da otvoriš Paddle i uneseš način plaćanja.
              </p>
            ) : null}
            {showCheckout ? (
              <Button
                type="button"
                className="bg-zinc-900 text-white hover:bg-zinc-800"
                disabled={checkoutLoading}
                onClick={() => void onSubscribe()}
              >
                {checkoutLoading
                  ? "Otvaram Paddle…"
                  : ok && !hasSubscription
                    ? "Poveži karticu (Paddle)"
                    : "Aktiviraj pretplatu"}
              </Button>
            ) : null}
            {showPortal ? (
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="border-zinc-200"
                  disabled={portalLoading}
                  onClick={() => void onOpenPortal()}
                >
                  {portalLoading ? "Otvaram portal…" : "Upravljaj pretplatom"}
                </Button>
              </div>
            ) : null}
            {hasSubscription && (st === "past_due" || st === "unpaid") ? (
              <p className="text-xs text-amber-800">
                Plaćanje nije prošlo. Otvori portal i ažuriraj način plaćanja.
              </p>
            ) : null}
            <Button
              type="button"
              variant="outline"
              className="border-zinc-200"
              onClick={() => void load()}
            >
              Osveži status
            </Button>
          </div>
        )}
      </SettingsCard>
    </div>
  );
}
