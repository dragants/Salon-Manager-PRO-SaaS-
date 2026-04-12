"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  CalendarRange,
  Clock3,
  Moon,
  Percent,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AnalyticsChartSkeleton } from "@/components/dashboard/analytics-chart-skeleton";
import { DashboardKpiCard } from "@/components/dashboard/dashboard-kpi-card";
import { DashboardThemeToggle } from "@/components/dashboard/dashboard-theme-toggle";
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

function userInitials(email: string | undefined): string {
  if (!email?.trim()) return "?";
  const local = email.split("@")[0] ?? "";
  const clean = local.replace(/[^a-zA-Z0-9]/g, "");
  if (clean.length >= 2) {
    return (clean[0] + clean[1]).toUpperCase();
  }
  return email.charAt(0).toUpperCase();
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
  return "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-800 dark:bg-sky-950/50 dark:text-sky-200";
}

function DashboardSkeleton() {
  return (
    <div className="animate-pulse space-y-8 px-1">
      <div className="h-36 rounded-3xl bg-slate-200/80 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl bg-slate-200/70 dark:bg-slate-800"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="h-96 rounded-2xl bg-slate-200/70 dark:bg-slate-800 lg:col-span-2" />
        <div className="h-96 rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
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
  const themeTint = settings.theme_color?.trim() || "#0ea5e9";
  const calendarDayUrl = `/calendar?day=${encodeURIComponent(todayYmd)}&view=day`;

  return (
    <div className="space-y-8 pb-12">
      {/* Hero */}
      <section
        className="relative overflow-hidden rounded-3xl px-5 py-8 text-white shadow-[0_20px_50px_-15px_rgba(15,23,42,0.45)] ring-1 ring-white/15 sm:px-8 sm:py-10"
        style={{
          background: `linear-gradient(135deg, rgb(15 23 42) 0%, color-mix(in srgb, ${themeTint} 35%, rgb(15 23 42)) 45%, rgb(15 23 42) 100%)`,
        }}
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full opacity-30 blur-3xl"
          style={{
            background: `radial-gradient(circle, ${themeTint}, transparent 65%)`,
          }}
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-3">
            <p className="flex items-center gap-2 text-sm font-medium text-white/85">
              <Sparkles className="size-4 shrink-0 text-amber-200" aria-hidden />
              {settings.name}
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              {greetingSr()}, {displayNameFromEmail(user.email)}{" "}
              <span className="inline-block" aria-hidden>
                {"\u{1F44B}"}
              </span>
            </h1>
            <p className="mt-2 text-blue-100">
              Danas:{" "}
              <b className="font-semibold text-white">
                {appointmentsToday}{" "}
                {appointmentsToday === 1 ? "termin" : "termina"}
              </b>
              {showFinancialKpi ? (
                <>
                  {" "}
                  • Prihod:{" "}
                  <b className="font-semibold text-white">
                    {formatRsd(revenueToday)}
                  </b>
                </>
              ) : null}
            </p>
            <p className="max-w-xl text-base text-white/80">
              Pregled poslovanja i raspored na jednom mestu.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                href={calendarDayUrl}
                className={cn(
                  buttonVariants({ size: "sm" }),
                  "inline-flex items-center gap-2 rounded-xl border-0 bg-white text-slate-900 shadow-md hover:bg-white/95"
                )}
              >
                <CalendarPlus className="size-4" aria-hidden />
                Novi termin
              </Link>
              <Link
                href={calendarDayUrl}
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "inline-flex items-center gap-2 rounded-xl border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                )}
              >
                <CalendarDays className="size-4" aria-hidden />
                Otvori kalendar
              </Link>
              <Link
                href="/clients"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "inline-flex items-center gap-2 rounded-xl border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                )}
              >
                <UserPlus className="size-4" aria-hidden />
                Novi klijent
              </Link>
              <Link
                href="/analytics"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "inline-flex items-center gap-2 rounded-xl border-white/40 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 hover:text-white"
                )}
              >
                <TrendingUp className="size-4" aria-hidden />
                Analitika
              </Link>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-start lg:flex-col lg:items-end">
            <div className="flex items-center gap-2">
              <DashboardThemeToggle />
              <div
                className="flex size-12 items-center justify-center rounded-2xl bg-white/15 text-sm font-bold uppercase tracking-tight text-white ring-2 ring-white/25 backdrop-blur-sm"
                title={user.email}
              >
                {userInitials(user.email)}
              </div>
            </div>
            <p className="hidden max-w-[14rem] truncate text-right text-xs text-white/65 lg:block">
              {user.email}
            </p>
          </div>
        </div>
      </section>

      {/* KPI */}
      <div
        className={cn(
          "grid gap-4 sm:grid-cols-2",
          showFinancialKpi
            ? "lg:grid-cols-3 xl:grid-cols-6"
            : "lg:grid-cols-2 xl:grid-cols-4"
        )}
      >
        <DashboardKpiCard
          title="Termini danas"
          value={appointmentsToday}
          accent="sky"
          icon={<CalendarRange className="size-5" />}
        />
        {showFinancialKpi &&
        typeof dash.revenue === "number" &&
        typeof dash.clients === "number" ? (
          <>
            <DashboardKpiCard
              title="Prihod danas"
              value={formatRsd(revenueToday)}
              accent="emerald"
              dominant
              icon={<Wallet className="size-5" />}
            />
            <DashboardKpiCard
              title="Prihod (mesec)"
              value={
                analyticsLoading
                  ? "—"
                  : formatRsd(
                      analytics?.revenue_month ?? analytics?.revenue ?? 0
                    )
              }
              accent="violet"
              icon={<TrendingUp className="size-5" />}
            />
            <DashboardKpiCard
              title="No-show"
              value={
                analyticsLoading ? "—" : `${analytics?.no_show_percent ?? 0}%`
              }
              accent="amber"
              icon={<Percent className="size-5" />}
            />
            <DashboardKpiCard
              title="Klijenti"
              value={analytics?.clients ?? dash.clients}
              accent="rose"
              icon={<Users className="size-5" />}
            />
          </>
        ) : (
          <>
            <DashboardKpiCard
              title="No-show"
              value={
                analyticsLoading ? "—" : `${analytics?.no_show_percent ?? 0}%`
              }
              accent="amber"
              icon={<Percent className="size-5" />}
            />
            <DashboardKpiCard
              title="Klijenti"
              value={analytics?.clients ?? "—"}
              accent="rose"
              icon={<Users className="size-5" />}
            />
          </>
        )}
        <DashboardKpiCard
          title="Sledeći termin"
          value={dash.nextAppointment ?? "—"}
          accent="slate"
          icon={<Clock3 className="size-5" />}
          hint="Iz kratkog pregleda"
        />
      </div>

      {/* Chart + today */}
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
          className="flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
        >
          <div className="border-b border-slate-100 pb-4 dark:border-slate-700">
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
        </SurfaceCard>
      </div>
    </div>
  );
}
