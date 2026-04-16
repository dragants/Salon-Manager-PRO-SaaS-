"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BarChart3, ChevronLeft } from "lucide-react";
import { AnalyticsChartSkeleton } from "@/components/features/dashboard/analytics-chart-skeleton";

const AnalyticsSeriesChart = dynamic(
  () =>
    import("@/components/features/dashboard/analytics-series-chart").then((m) => ({
      default: m.AnalyticsSeriesChart,
    })),
  { ssr: false, loading: () => <AnalyticsChartSkeleton /> }
);
import { buttonVariants } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import { cn } from "@/lib/utils";
import { getAnalytics } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRsd } from "@/lib/formatMoney";
import { useAuth } from "@/providers/auth-provider";
import type { AnalyticsResponse } from "@/types/analytics";

export default function AnalyticsPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [range, setRange] = useState<7 | 30>(30);

  const showFinancials = user?.role !== "worker";

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAnalytics()
      .then((res) => {
        if (!cancelled) {
          setData(res.data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setError(getApiErrorMessage(e, "Analitika nije učitana."));
          setData(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  if (authLoading || !user) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">Učitavanje…</p>
    );
  }

  const series = range === 7 ? data?.series7 ?? [] : data?.series30 ?? [];

  return (
    <div className="flex flex-col gap-8">
      <SectionHeader
        title="Pregled poslovanja"
        description={
          <span className="inline-flex items-center gap-2">
            <BarChart3 className="size-4 text-sky-600" aria-hidden />
            Prihod po danu, top usluge i klijenti (završeni termini + uplate).
          </span>
        }
        action={
          <Link
            href="/dashboard"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "inline-flex items-center gap-2 rounded-xl border-slate-200"
            )}
          >
            <ChevronLeft className="size-4" aria-hidden />
            Dashboard
          </Link>
        }
      />

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Učitavanje analitike…
        </p>
      ) : error ? (
        <SurfaceCard
          padding="md"
          className="border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100"
        >
          {error}
        </SurfaceCard>
      ) : data ? (
        <>
          <SurfaceCard padding="md" className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Termini i prihod po danu
              </h2>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 dark:border-slate-600 dark:bg-slate-800/80">
                <button
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    range === 7
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                  onClick={() => setRange(7)}
                >
                  7 dana
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-medium transition",
                    range === 30
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                  onClick={() => setRange(30)}
                >
                  30 dana
                </button>
              </div>
            </div>
            <div className="min-w-0">
              <AnalyticsSeriesChart
                data={series}
                showRevenue={showFinancials}
              />
            </div>
          </SurfaceCard>

          <div className="grid gap-6 lg:grid-cols-2">
            <SurfaceCard padding="md">
              <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                Top usluge
              </h2>
              {data.top_services.length === 0 ? (
                <p className="text-sm text-slate-500">Nema podataka.</p>
              ) : (
                <ul className="space-y-2">
                  {data.top_services.map((s, i) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm last:border-0"
                    >
                      <span className="font-medium text-slate-800">
                        {i + 1}. {s.name}
                      </span>
                      <span className="tabular-nums text-slate-600">
                        {showFinancials ? (
                          <>
                            {formatRsd(s.revenue)}{" "}
                            <span className="text-slate-400">
                              · {s.booking_count} term.
                            </span>
                          </>
                        ) : (
                          <>{s.booking_count} termina</>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SurfaceCard>

            <SurfaceCard padding="md">
              <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-50">
                Top klijenti
              </h2>
              {data.top_clients.length === 0 ? (
                <p className="text-sm text-slate-500">Nema podataka.</p>
              ) : (
                <ul className="space-y-2">
                  {data.top_clients.map((c, i) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm last:border-0"
                    >
                      <span className="font-medium text-slate-800">
                        {i + 1}. {c.name}
                      </span>
                      <span className="tabular-nums text-slate-600">
                        {showFinancials ? (
                          <>
                            {formatRsd(c.revenue)}{" "}
                            <span className="text-slate-400">
                              · {c.visits} poseta
                            </span>
                          </>
                        ) : (
                          <>{c.visits} poseta</>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SurfaceCard>
          </div>

          <div className="flex justify-center">
            <Link
              href="/services"
              className={cn(
                buttonVariants({ variant: "outline", size: "default" }),
                "rounded-xl border-slate-200 dark:border-slate-600"
              )}
            >
              Upravljaj uslugama
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
