"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  CalendarDays,
  CalendarPlus,
  Clock,
  Moon,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { CalendarPageSkeleton } from "@/components/features/calendar/calendar-page-skeleton";
import { appointmentStaffLabel } from "@/components/features/calendar/calendar-utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { AnalyticsChartSkeleton } from "@/components/features/dashboard/analytics-chart-skeleton";
import { DashboardKpiCard } from "@/components/features/dashboard/dashboard-kpi-card";
import { getAnalytics, getAppointments, getDashboard } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRsd } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import type { AppointmentRow } from "@/types/appointment";
import type { AnalyticsResponse } from "@/types/analytics";
import type { DashboardSummary } from "@/types/dashboard";
import "./dashboard-shell.css";

const AnalyticsSeriesChart = dynamic(
  () =>
    import("@/components/features/dashboard/analytics-series-chart").then((m) => ({
      default: m.AnalyticsSeriesChart,
    })),
  { ssr: false, loading: () => <AnalyticsChartSkeleton /> }
);

const SalonCalendar = dynamic(
  () =>
    import("@/components/features/calendar/salon-calendar").then((m) => m.SalonCalendar),
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

function emailLocalPart(email: string | undefined): string {
  if (!email?.trim()) return "";
  return email.split("@")[0]?.trim() ?? "";
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
    return "border-emerald-800/50 bg-emerald-950/40 text-emerald-200";
  }
  if (status === "no_show") {
    return "border-red-800/50 bg-red-950/40 text-red-200";
  }
  return "border-primary/40 bg-primary/10 text-primary";
}

function DashboardSkeleton() {
  return (
    <div className="dash-grid animate-pulse">
      <div className="col-span-12 h-32 rounded-2xl bg-muted" />
      <div className="col-span-12 grid grid-cols-12 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="col-span-12 h-[100px] rounded-2xl bg-muted sm:col-span-6 xl:col-span-3"
          />
        ))}
      </div>
      <div className="col-span-12 h-[520px] rounded-[20px] bg-muted lg:col-span-8" />
      <div className="col-span-12 space-y-6 lg:col-span-4">
        <div className="h-[200px] rounded-2xl bg-muted" />
        <div className="h-[120px] rounded-2xl bg-muted" />
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
          setAnalyticsError(getApiErrorMessage(e, "Analitika nije učitana."));
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
    return (
      <div className="dashboard-shell">
        <DashboardSkeleton />
      </div>
    );
  }

  if (orgLoading) {
    return (
      <div className="dashboard-shell">
        <DashboardSkeleton />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="dashboard-shell">
        <div className="mx-auto max-w-[1280px] space-y-3 rounded-2xl border border-primary/25 bg-card px-6 py-5 text-sm text-muted-foreground">
          <p>Podešavanja organizacije nisu učitana.</p>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="dash-btn border-border text-foreground hover:bg-muted"
            onClick={() => void refreshSettings()}
          >
            Ponovo učitaj
          </Button>
        </div>
      </div>
    );
  }

  if (dashLoading) {
    return (
      <div className="dashboard-shell">
        <DashboardSkeleton />
      </div>
    );
  }

  if (dashError || !dash) {
    return (
      <div className="dashboard-shell">
        <div className="mx-auto max-w-[1280px] space-y-4">
          <div className="rounded-2xl border border-red-900/50 bg-red-950/30 px-5 py-4 text-sm text-red-200">
            {dashError ?? "Statistika nije dostupna."}
          </div>
          <Button
            type="button"
            variant="outline"
            className="dash-btn border-border text-foreground hover:bg-muted"
            onClick={retryDashboard}
          >
            Pokušaj ponovo
          </Button>
        </div>
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
  const greetName =
    emailLocalPart(user.email) || displayNameFromEmail(user.email);
  const busyToday = todayList?.length ?? 0;
  const freeEstimate = Math.max(0, 14 - busyToday);

  return (
    <div className="dashboard-shell pb-16">
      <div className="dash-grid">
        {/* HERO */}
        <section className="col-span-12 mt-4 mb-7 grid grid-cols-12 gap-6">
          <div className="col-span-12 space-y-3 lg:col-span-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
              {settings.name}
            </p>
            <h1 className="font-heading text-[2.15rem] font-bold leading-[1.12] tracking-tight text-foreground sm:text-[2.35rem]">
              {greetingSr()},
              <br />
              {greetName} <span aria-hidden>👋</span>
            </h1>
            <p className="text-base capitalize text-muted-foreground">
              {todayHeadingInTz(tz)}
            </p>
            {showFinancialKpi ? (
              <p className="text-base text-muted-foreground">
                Prihod danas:{" "}
                <span className="font-semibold text-primary tabular-nums">
                  {formatRsd(revenueToday)}
                </span>
              </p>
            ) : null}
          </div>
          <div className="col-span-12 flex items-start justify-start lg:col-span-4 lg:justify-end">
            <Link
              href={calendarWeekUrl}
              className="dash-btn flex h-12 items-center justify-center gap-2 rounded-2xl bg-primary px-6 text-base font-semibold text-primary-foreground shadow-md transition hover:opacity-92"
            >
              <CalendarPlus className="size-5" aria-hidden />
              Nova rezervacija
            </Link>
          </div>
        </section>

        {/* KPI — zlatni akcent + status boje */}
        <section className="col-span-12 mb-8 grid grid-cols-12 gap-6">
          <div className="col-span-12 sm:col-span-6 xl:col-span-3">
            <DashboardKpiCard
              title="Danas zakazano"
              value={appointmentsToday}
              hint={
                appointmentsToday === 1
                  ? "Jedan termin zakazan za danas"
                  : "Ukupno termina u kalendaru za današnji dan"
              }
              accent="sky"
              icon={<CalendarDays className="size-5" />}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 xl:col-span-3">
            <DashboardKpiCard
              title="Ukupno klijenata"
              value={analytics?.clients ?? dash.clients}
              hint="Aktivnih kartica klijenata u sistemu"
              accent="slate"
              icon={<Users className="size-5" />}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 xl:col-span-3">
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
              hint={
                !showFinancialKpi
                  ? "Dostupno administratoru"
                  : "Tekući mesec"
              }
              accent="emerald"
              dominant={showFinancialKpi}
              icon={<Wallet className="size-5" />}
            />
          </div>
          <div className="col-span-12 sm:col-span-6 xl:col-span-3">
            <DashboardKpiCard
              title="Sledeći termin"
              value={dash.nextAppointment ?? "—"}
              hint="Naredni dolazak (tretman, masaža…)"
              accent="amber"
              icon={<Clock className="size-5" />}
              valueClassName="line-clamp-2 text-base font-bold leading-snug sm:text-lg"
            />
          </div>
        </section>

        {!analyticsLoading && analytics ? (
          <p className="col-span-12 -mt-4 text-sm text-muted-foreground">
            No-show (30 d.):{" "}
            <span className="font-medium text-foreground">
              {analytics.no_show_percent ?? 0}%
            </span>
          </p>
        ) : null}

        <div className="col-span-12 mb-6 flex flex-wrap gap-3">
          <Link
            href="/clients"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "dash-btn rounded-xl border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <UserPlus className="size-4" aria-hidden />
            Novi klijent
          </Link>
          <Link
            href="/services"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "dash-btn rounded-xl border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Sparkles className="size-4" aria-hidden />
            Nova usluga
          </Link>
          <Link
            href="/analytics"
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "dash-btn rounded-xl border-border bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <TrendingUp className="size-4" aria-hidden />
            Analitika
          </Link>
        </div>

        {/* Kalendar + desni panel */}
        <div className="col-span-12 grid grid-cols-12 gap-6">
          <div
            className="dash-calendar-host col-span-12 flex h-[520px] flex-col overflow-hidden rounded-[22px] border border-border bg-card p-4 shadow-[var(--lux-shadow-soft)] ring-1 ring-black/[0.03] transition duration-200 hover:border-primary/30 hover:shadow-[var(--lux-shadow-hover)] lg:col-span-8"
          >
            <Suspense fallback={<CalendarPageSkeleton />}>
              <SalonCalendar embedMode />
            </Suspense>
          </div>

          <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
            <div className="dash-card flex min-h-[200px] flex-col p-5">
              <div className="border-b border-border pb-3">
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Danas
                </h2>
                <p className="mt-1 text-sm capitalize text-muted-foreground">
                  {todayHeadingInTz(tz)}
                </p>
              </div>
              <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pt-3">
                {todayLoading ? (
                  <div className="space-y-2" aria-busy="true">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-14 animate-pulse rounded-xl bg-muted"
                      />
                    ))}
                  </div>
                ) : todayError ? (
                  <p className="text-sm text-red-300">{todayError}</p>
                ) : todayList && todayList.length === 0 ? (
                  <div className="flex flex-col items-center py-6 text-center">
                    <p className="mb-4 text-sm text-muted-foreground">
                      Nema termina danas
                    </p>
                    <Button
                      type="button"
                      className="dash-btn rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
                      onClick={() => {
                        toast.info("Kalendar — zakaži prvi termin");
                        router.push(calendarDayUrl);
                      }}
                    >
                      Dodaj prvi termin
                    </Button>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {todayList?.map((a) => (
                      <li key={a.id}>
                        <Link
                          href={`${calendarDayUrl}&appt=${a.id}`}
                          className="dash-btn block rounded-xl border border-border bg-muted/40 p-3.5 transition hover:border-primary/35 hover:bg-muted/55 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-base font-semibold tabular-nums text-foreground">
                              {formatApptTimeRange(
                                a.date,
                                a.service_duration,
                                tz
                              )}
                            </p>
                            <span
                              className={cn(
                                "shrink-0 rounded-full border px-2 py-0.5 text-[0.65rem] font-semibold uppercase",
                                statusStyles(a.status)
                              )}
                            >
                              {statusLabel(a.status)}
                            </span>
                          </div>
                          <p className="mt-1.5 text-base font-medium text-foreground">
                            {a.client_name ?? `Klijent #${a.client_id}`}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {a.service_name ?? `Usluga #${a.service_id}`}
                          </p>
                          {appointmentStaffLabel(a) ? (
                            <p className="mt-1 text-[0.65rem] text-muted-foreground">
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

            <div className="dash-card flex min-h-[128px] flex-col justify-between p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Brzi pregled
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">
                    {freeEstimate}
                  </p>
                  <p className="text-sm text-muted-foreground">Slobodnih slotova *</p>
                </div>
                <div>
                  <p className="text-2xl font-bold tabular-nums text-primary">
                    {busyToday}
                  </p>
                  <p className="text-sm text-muted-foreground">Termina danas</p>
                </div>
              </div>
              <p className="text-xs leading-snug text-muted-foreground">
                * Procena u odnosu na uobičajen dan u kalendaru
              </p>
            </div>
          </div>
        </div>

        {/* Grafikon + rezervisano */}
        <div className="col-span-12 mt-6 grid grid-cols-12 gap-6">
          <div className="col-span-12 flex min-h-[260px] flex-col rounded-[20px] border border-border bg-card p-4 shadow-md transition duration-200 hover:shadow-lg lg:col-span-8">
                <div className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Trend poslovanja
                </h2>
                <p className="text-sm text-muted-foreground">
                  Zakazivanja{showFinancialKpi ? " i prihod (RSD)" : ""}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/analytics"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "dash-btn rounded-xl border-border text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  Puna analitika
                </Link>
                <div className="flex rounded-xl border border-border bg-muted/60 p-0.5">
                  <button
                    type="button"
                    className={cn(
                      "dash-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                      chartRange === 7
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setChartRange(7)}
                  >
                    7 dana
                  </button>
                  <button
                    type="button"
                    className={cn(
                      "dash-btn rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                      chartRange === 30
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setChartRange(30)}
                  >
                    30 dana
                  </button>
                </div>
              </div>
            </div>
            <div className="min-h-[240px] min-w-0 flex-1 rounded-xl border border-border bg-muted/40 p-2">
              {analyticsLoading ? (
                <div className="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
                  <Moon className="mr-2 size-4 animate-pulse opacity-40" />
                  Učitavanje grafikona…
                </div>
              ) : analyticsError ? (
                <p className="p-4 text-sm text-destructive">{analyticsError}</p>
              ) : analytics ? (
                <AnalyticsSeriesChart
                  data={
                    (chartRange === 7
                      ? analytics.series7
                      : analytics.series30) ?? []
                  }
                  showRevenue={showFinancialKpi}
                  variant="luxury"
                />
              ) : null}
            </div>
          </div>

          <div className="col-span-12 hidden min-h-[260px] flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-muted/30 text-center lg:col-span-4 lg:flex">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Uskoro
            </p>
            <p className="mt-2 max-w-[12rem] text-sm text-muted-foreground">
              Rezervisano za buduće module (npr. ciljevi, obaveštenja).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
