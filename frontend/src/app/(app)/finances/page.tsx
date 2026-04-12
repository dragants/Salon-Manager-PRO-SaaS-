"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboard } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRsd } from "@/lib/formatMoney";
import { appTableHeadClass, appTableRowClass } from "@/lib/app-ui";
import { useAuth } from "@/providers/auth-provider";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import type { DashboardSummary } from "@/types/dashboard";

export default function FinancesPage() {
  const { user, loading: authLoading } = useAuth();
  const [dash, setDash] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user?.role === "worker") {
      setLoading(false);
      return;
    }
    let c = false;
    setLoading(true);
    getDashboard()
      .then((res) => {
        if (!c) {
          setDash(res.data);
        }
      })
      .catch((e) => {
        if (!c) {
          setError(getApiErrorMessage(e, "Podaci nisu učitani."));
        }
      })
      .finally(() => {
        if (!c) {
          setLoading(false);
        }
      });
    return () => {
      c = true;
    };
  }, [authLoading, user?.role]);

  if (authLoading || !user) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">Učitavanje…</p>
    );
  }

  if (user.role === "worker") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Finansije" />
        <SurfaceCard padding="lg" className="text-center text-sm text-slate-600 dark:text-slate-400">
          <p>Ovaj odeljak je dostupan samo administratoru salona.</p>
          <Link
            href="/dashboard"
            className="mt-4 inline-block font-semibold text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
          >
            Nazad na dashboard
          </Link>
        </SurfaceCard>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Finansije"
        description="Pregled prihoda u dinarima (RSD). Zbir u realnom vremenu kao na dashboardu; detaljni izveštaji mogu uslediti kasnije."
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">Učitavanje…</p>
      ) : dash ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SurfaceCard padding="md">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Prihod danas
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {formatRsd(dash.revenue ?? 0)}
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Završeni termini (cena usluge) + ručne uplate za današnji dan u
                zoni organizacije — isto kao na{" "}
                <Link
                  href="/dashboard"
                  className="font-medium text-sky-700 underline-offset-2 hover:underline dark:text-sky-400"
                >
                  dashboardu
                </Link>
                .
              </p>
            </SurfaceCard>
            <SurfaceCard padding="md">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Klijenti (ukupno)
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {dash.clients ?? "—"}
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Broj registrovanih klijenata u salonu.
              </p>
            </SurfaceCard>
            <SurfaceCard padding="md">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Današnji termini
              </p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-slate-900 dark:text-slate-50">
                {dash.todayAppointments}
              </p>
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-400">
                Broj zakazanih termina za današnji dan (u zoni salona).
              </p>
            </SurfaceCard>
          </div>

          <SurfaceCard padding="none" className="overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-700">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Transakcije / uplate
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Pojedinačna knjiga uplata biće povezana u sledećoj iteraciji API-ja.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead>
                  <tr className={appTableHeadClass}>
                    <th className="px-5 py-3.5">Datum</th>
                    <th className="px-5 py-3.5">Opis</th>
                    <th className="px-5 py-3.5 text-right">Iznos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={appTableRowClass}>
                    <td
                      className="px-5 py-8 text-center text-slate-500 dark:text-slate-400"
                      colSpan={3}
                    >
                      Još nema prikaza pojedinačnih transakcija — koristi zbir
                      „Prihod danas“ iznad.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </SurfaceCard>
        </>
      ) : null}
    </div>
  );
}
