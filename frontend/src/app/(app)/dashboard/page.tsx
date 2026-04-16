"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  Clock3,
  Moon,
  Package,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { CalendarPageSkeleton } from "@/components/calendar/calendar-page-skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnalyticsChartSkeleton } from "@/components/dashboard/analytics-chart-skeleton";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { SurfaceCard } from "@/components/ui/surface-card";
import { getAnalytics, getAppointments, getDashboard } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRsd } from "@/lib/formatMoney";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import { appointmentStaffLabel } from "@/components/calendar/calendar-utils";
import type { AppointmentRow } from "@/types/appointment";
import type { AnalyticsResponse } from "@/types/analytics";
import type { DashboardSummary } from "@/types/dashboard";

const AnalyticsSeriesChart = dynamic(
  () =>
    import("@/components/dashboard/analytics-series-chart").then((m) => ({
      default: m.AnalyticsSeriesChart,
    })),
  { ssr: false, loading: () => <AnalyticsChartSkeleton /> }
);

const SalonCalendar = dynamic(
  () =>
    import("@/components/calendar/salon-calendar").then((m) => m.SalonCalendar),
  { ssr: false, loading: () => <CalendarPageSkeleton /> }
);

const DEFAULT_TZ = "Europe/Belgrade";

function orgTimeZone(settingsTz: string | null | undefined): string {
  return settingsTz?.trim() ? settingsTz.trim() : DEFAULT_TZ;
}

function todayYmdInTz(timeZone: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function todayHeadingInTz(timeZone: string): string {
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

function greetingSr(): string {
  const h = new Date().getHours();
  if (h < 12) return "Dobro jutro";
  if (h < 18) return "Dobar dan";
  return "Dobro veče";
}

function displayNameFromEmail(email: string | undefined): string {
  if (!email?.trim()) return "";
  const local = email.split("@")[0] ?? "";
  const part = local.split(/[._-]/)[0] ?? local;
  if (!part) return email;
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase();
}

function formatApptTimeRange(
  iso: string,
  durationMin: number | undefined,
  timeZone: string
): string {
  const start = new Date(iso);
  const fmt = new Intl.DateTimeFormat("sr-Latn-RS", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  });
  const startStr = fmt.format(start);
  if (durationMin == null || durationMin <= 0) {
    return startStr;
  }
  const end = new Date(start.getTime() + durationMin * 60_000);
  return `${startStr}–${fmt.format(end)}`;
}

function statusLabel(status: AppointmentRow["status"]): string {
  if (status === "completed") return "Završeno";
  if (status === "no_show") return "Nije se pojavio";
  return "Zakazano";
}

function statusStyles(status: AppointmentRow["status"]): string {
  if (status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
  }
  if (status === "no_show") {
    return "border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200";
  }
  return "border-amber-200 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/45 dark:text-amber-100";
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8 px-1">
      <div className="h-24 rounded-2xl bg-zinc-200/80 dark:bg-zinc-800" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800"
          />
        ))}
      </div>
      <div className="h-12 rounded-xl bg-zinc-200/70 dark:bg-zinc-800" />
      <div className="h-[min(70vh,560px)] rounded-2xl bg-zinc-200/70 dark:bg-zinc-800" />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-96 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800 lg:col-span-2" />
        <div className="h-96 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    settings,
    loading: orgLoading,
    refreshSettings,
  } = useOrganization();
  const [dash, setDash] = useState<DashboardSummary | null>(null);
  const [dashLoading, setDashLoading] = useState(true);
  const [dashError, setDashError] = useState<string | null>(null);
  const [todayList, setTodayList] = useState<AppointmentRow[] | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayError, setTodayError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [chartRange, setChartRange] = useState<7 | 30>(30);

  const showFinancialKpi = user?.role !== "worker";

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }
    let cancelled = false;
    setDashLoading(true);
    setDashError(null);
    getDashboard()
      .then((res) => {
        if (!cancelled) {
          setDash(res.data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setDashError(getApiErrorMessage(e, "Statistika nije učitana."));
          setDash(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setDashLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user) {
      return;
    }
    let cancelled = false;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    getAnalytics()
      .then((res) => {
        if (!cancelled) {
          setAnalytics(res.data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setAnalyticsError(
            getApiErrorMessage(e, "Analitika nije učitana.")
          );
          setAnalytics(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setAnalyticsLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user]);

  useEffect(() => {
    if (authLoading || !user || !settings) {
      return;
    }
    const tz = orgTimeZone(settings.timezone);
    let cancelled = false;
    setTodayLoading(true);
    setTodayError(null);
    getAppointments({ day: "today", timezone: tz })
      .then((res) => {
        if (!cancelled) {
          setTodayList(res.data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setTodayError(
            getApiErrorMessage(e, "Današnji termini nisu učitani.")
          );
          setTodayList(null);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setTodayLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, settings]);

  function retryDashboard() {
    if (!user) {
      return;
    }
    setDashLoading(true);
    setDashError(null);
    getDashboard()
      .then((res) => setDash(res.data))
      .catch((e) => {
        setDashError(getApiErrorMessage(e, "Statistika nije učitana."));
        setDash(null);
      })
      .finally(() => setDashLoading(false));
  }

  if (authLoading || !user) {
    return <DashboardSkeleton />;
  }

  if (orgLoading) {
    return <DashboardSkeleton />;
  }

  if (!settings) {
    return (
      <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 px-6 py-5 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
        <p>Podešavanja organizacije nisu učitana.</p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-amber-300"
          onClick={() => void refreshSettings()}
        >
          Ponovo učitaj
        </Button>
      </div>
    );
  }

  if (dashLoading) {
    return <DashboardSkeleton />;
  }

  if (dashError || !dash) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
          {dashError ?? "Statistika nije dostupna."}
        </div>
        <Button
          type="button"
          variant="outline"
          className="rounded-xl border-sky-200"
          onClick={retryDashboard}
        >
          Pokušaj ponovo
        </Button>
      </div>
    );
  }

  const tz = orgTimeZone(settings.timezone);
  const todayYmd = todayYmdInTz(tz);
  const appointmentsToday =
    analytics?.appointments_today ?? dash.todayAppointments;
  const revenueToday = analytics?.revenue_today ?? dash.revenue;
  const calendarDayUrl = `/calendar?day=${encodeURIComponent(todayYmd)}&view=day`;
  const calendarWeekUrl = `/calendar?day=${encodeURIComponent(todayYmd)}&view=week`;

  return (
    <div className="space-y-8 pb-12">
      <section className="flex flex-col gap-4 border-b border-zinc-200/90 pb-8 dark:border-zinc-800 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {settings.name}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            {greetingSr()}, {displayNameFromEmail(user.email)}
          </h1>
          <p className="text-sm capitalize text-zinc-600 dark:text-zinc-400">
            {todayHeadingInTz(tz)}
            {showFinancialKpi ? (
              <>
                <span className="mx-2 text-zinc-300 dark:text-zinc-600">
                  ·
                </span>
                Prihod danas:{" "}
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {formatRsd(revenueToday)}
                </span>
              </>
            ) : null}
          </p>
        </div>
        <Link
          href="/analytics"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "self-start rounded-xl border-zinc-200 sm:self-auto dark:border-zinc-700"
          )}
        >
          <TrendingUp className="size-4" aria-hidden />
          Analitika
        </Link>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardKpiCard
          title="Danas zakazano"
          value={appointmentsToday}
          accent="sky"
          icon={<CalendarRange className="size-5" />}
          hint={
            appointmentsToday === 1 ? "1 termin danas" : "Termina na današnji dan"
          }
        />
        <DashboardKpiCard
          title="Ukupno klijenata"
          value={analytics?.clients ?? dash.clients}
          accent="rose"
          icon={<Users className="size-5" />}
        />
        <DashboardKpiCard
          title="Prihod (mesec)"
          value={
            !showFinancialKpi
              ? "—"
              : analyticsLoading
                ? "—"
                : formatRsd(
                    analytics?.revenue_month ?? analytics?.revenue ?? 0
                  )
          }
          accent="emerald"
          dominant={showFinancialKpi && !analyticsLoading}
          icon={<Wallet className="size-5" />}
          hint={!showFinancialKpi ? "Dostupno administratoru" : undefined}
        />
        <DashboardKpiCard
          title="Sledeći termin"
          value={dash.nextAppointment ?? "—"}
          accent="slate"
          icon={<Clock3 className="size-5" />}
          hint="Najbliži u rasporedu"
        />
      </div>

      {!analyticsLoading && analytics ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No-show (30 d.):{" "}
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {analytics.no_show_percent ?? 0}%
          </span>
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Link
          href={calendarWeekUrl}
          className={cn(
            buttonVariants({ size: "sm" }),
            "h-11 flex-1 items-center justify-center gap-2 rounded-xl sm:h-10 sm:flex-initial sm:px-5"
          )}
        >
          <CalendarPlus className="size-4" aria-hidden />
          Nova rezervacija
        </Link>
        <Link
          href="/clients"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-11 flex-1 items-center justify-center gap-2 rounded-xl border-zinc-200 bg-white sm:h-10 sm:flex-initial sm:px-5 dark:border-zinc-700 dark:bg-zinc-950"
          )}
        >
          <UserPlus className="size-4" aria-hidden />
          Novi klijent
        </Link>
        <Link
          href="/services"
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "h-11 flex-1 items-center justify-center gap-2 rounded-xl border-zinc-200 bg-white sm:h-10 sm:flex-initial sm:px-5 dark:border-zinc-700 dark:bg-zinc-950"
          )}
        >
          <Package className="size-4" aria-hidden />
          Nova usluga
        </Link>
      </div>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Nedeljni kalendar
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Prevuci termine da promeniš vreme · boje po statusu
            </p>
          </div>
          <Link
            href={calendarWeekUrl}
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "rounded-xl text-zinc-600 dark:text-zinc-400"
            )}
          >
            <CalendarDays className="size-4" aria-hidden />
            Puni ekran
          </Link>
        </div>
        <div className="card-stripe max-h-[min(78vh,720px)] overflow-y-auto overflow-x-hidden">
          <Suspense fallback={<CalendarPageSkeleton />}>
            <SalonCalendar />
          </Suspense>
        </div>
      </section>

      {/* Trend + današnji */}
      <div className="grid gap-6 lg:grid-cols-3 lg:items-stretch">
        <SurfaceCard
          padding="md"
          className="flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md lg:col-span-2"
        >
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Trend poslovanja
              </h2>
              <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-400">
                Termini{showFinancialKpi ? " i prihod" : ""} — 7 ili 30 dana.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href="/analytics"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "rounded-xl border-slate-200 no-underline dark:border-slate-600"
                )}
              >
                Puna analitika
              </Link>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50/90 p-0.5 dark:border-slate-600 dark:bg-slate-800/80">
                <button
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    chartRange === 7
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                  onClick={() => setChartRange(7)}
                >
                  7 dana
                </button>
                <button
                  type="button"
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                    chartRange === 30
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  )}
                  onClick={() => setChartRange(30)}
                >
                  30 dana
                </button>
              </div>
            </div>
          </div>
          <div className="min-h-[300px] flex-1 pt-4 sm:min-h-[320px]">
            {analyticsLoading ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-slate-500 dark:text-slate-400">
                <Moon className="mr-2 size-4 animate-pulse opacity-40" />
                Učitavanje grafikona…
              </div>
            ) : analyticsError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                {analyticsError}
              </div>
            ) : analytics ? (
              <div className="rounded-xl border border-slate-200/90 bg-gradient-to-b from-slate-100/95 to-white p-2 shadow-inner dark:border-slate-600 dark:from-slate-800/80 dark:to-slate-900/50 sm:p-3">
                <AnalyticsSeriesChart
                  data={
                    (chartRange === 7
                      ? analytics.series7
                      : analytics.series30) ?? []
                  }
                  showRevenue={showFinancialKpi}
                />
              </div>
            ) : null}
          </div>
        </SurfaceCard>

        <SurfaceCard
          padding="md"
          className="relative flex flex-col overflow-hidden border-amber-200/50 bg-gradient-to-br from-amber-50/50 via-white to-white shadow-[0_8px_30px_-8px_rgba(251,146,60,0.25)] transition-all duration-200 ease-out hover:-translate-y-1 hover:shadow-[0_20px_44px_-12px_rgba(251,146,60,0.35)] dark:border-amber-900/35 dark:from-amber-950/30 dark:via-zinc-950 dark:to-zinc-950 dark:shadow-[0_8px_30px_-8px_rgba(251,146,60,0.12)] dark:hover:shadow-[0_20px_44px_-12px_rgba(251,146,60,0.2)]"
        >
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(251,191,36,0.14),transparent_55%)] dark:bg-[radial-gradient(ellipse_90%_60%_at_50%_-30%,rgba(251,191,36,0.08),transparent_55%)]"
            aria-hidden
          />
          <div className="relative flex flex-col">
          <div className="border-b border-slate-100/80 pb-4 dark:border-slate-700/80">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Današnji termini
            </h2>
            <p className="mt-0.5 text-sm capitalize text-slate-600 dark:text-slate-400">
              {todayHeadingInTz(tz)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 border-b border-slate-100 py-3 dark:border-slate-700">
            <Link
              href={calendarDayUrl}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "rounded-xl border-slate-200 text-slate-900 no-underline dark:border-slate-600 dark:text-slate-100"
              )}
            >
              Kalendar
            </Link>
            <Link
              href="/settings"
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "rounded-xl text-slate-700 dark:text-slate-300"
              )}
            >
              Podešavanja
            </Link>
          </div>
          <div className="min-h-[200px] flex-1 space-y-2 overflow-y-auto pt-3">
            {todayLoading ? (
              <div className="space-y-3" aria-busy="true" aria-label="Učitavanje termina">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[4.25rem] animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-700/80"
                  />
                ))}
              </div>
            ) : todayError ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                {todayError}
              </div>
            ) : todayList && todayList.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <p className="mb-4 text-slate-500 dark:text-slate-400">
                  Nema termina danas
                </p>
                <Button
                  type="button"
                  variant="brand"
                  className="h-11 rounded-xl px-5"
                  onClick={() => {
                    toast.info("Kalendar je otvoren — zakaži prvi termin");
                    router.push(calendarDayUrl);
                  }}
                >
                  + Dodaj prvi termin
                </Button>
              </div>
            ) : (
              <ul className="space-y-2">
                {todayList?.map((a) => (
                  <li key={a.id}>
                    <Link
                      href={`${calendarDayUrl}&appt=${a.id}`}
                      className="block rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition hover:border-sky-200 hover:bg-white hover:shadow-md dark:border-slate-700 dark:bg-slate-800/50 dark:hover:border-sky-700 dark:hover:bg-slate-800"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-base font-semibold tabular-nums text-slate-900 dark:text-slate-50">
                          {formatApptTimeRange(
                            a.date,
                            a.service_duration,
                            tz
                          )}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide",
                            statusStyles(a.status)
                          )}
                        >
                          {statusLabel(a.status)}
                        </span>
                      </div>
                      <p className="mt-1.5 font-medium text-slate-900 dark:text-slate-100">
                        {a.client_name ?? `Klijent #${a.client_id}`}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {a.service_name ?? `Usluga #${a.service_id}`}
                      </p>
                      {appointmentStaffLabel(a) ? (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
                          {appointmentStaffLabel(a)}
                        </p>
                      ) : null}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
          </div>
        </SurfaceCard>
      </div>
    </div>
  );
}
