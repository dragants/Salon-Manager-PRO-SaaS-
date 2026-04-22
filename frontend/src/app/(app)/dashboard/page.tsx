"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  CalendarPlus,
  Clock,
  Moon,
  Sparkles,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { CalendarPageSkeleton } from "@/components/features/calendar/calendar-page-skeleton";
import { appointmentStaffLabel } from "@/components/features/calendar/calendar-utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { AnalyticsChartSkeleton } from "@/components/features/dashboard/analytics-chart-skeleton";
import { DashboardHeroStats } from "@/components/features/dashboard/dashboard-hero-stats";
import {
  getAnalytics,
  getAppointments,
  getDashboard,
  getServices,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRsd } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";
import {
  averageOpenMinutesPerDay,
  averageServiceDurationMinutes,
  estimatedSlotsPerDay,
} from "@/lib/working-hours-slots";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import type { AppointmentRow } from "@/types/appointment";
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

function cumulativeSeries(values: number[]): number[] {
  let sum = 0;
  return values.map((v) => {
    sum += v;
    return sum;
  });
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
  const [chartRange, setChartRange] = useState<7 | 30>(30);

  const showFinancialKpi = user?.role !== "worker";

  const dataEnabled = !authLoading && !!user;
  const tz = settings ? orgTimeZone(settings.timezone) : DEFAULT_TZ;

  const [dashQuery, analyticsQuery, todayQuery, servicesQuery] = useQueries({
    queries: [
      {
        queryKey: ["dashboard"] as const,
        queryFn: async () => (await getDashboard()).data,
        enabled: dataEnabled,
        staleTime: 35_000,
      },
      {
        queryKey: ["analytics"] as const,
        queryFn: async () => (await getAnalytics()).data,
        enabled: dataEnabled,
        staleTime: 45_000,
      },
      {
        queryKey: ["appointments", "today", tz] as const,
        queryFn: async () =>
          (await getAppointments({ day: "today", timezone: tz })).data,
        enabled: dataEnabled && !!settings,
        staleTime: 20_000,
      },
      {
        queryKey: ["services"] as const,
        queryFn: async () => (await getServices()).data,
        enabled: dataEnabled,
        staleTime: 60_000,
      },
    ],
  });

  const dash = dashQuery.data ?? null;
  const dashError = dashQuery.isError
    ? getApiErrorMessage(dashQuery.error, "Statistika nije učitana.")
    : null;
  const dashLoading = dashQuery.isPending;

  const analytics = analyticsQuery.data ?? null;
  const analyticsLoading = analyticsQuery.isPending;
  const analyticsError = analyticsQuery.isError
    ? getApiErrorMessage(analyticsQuery.error, "Analitika nije učitana.")
    : null;

  const todayList = todayQuery.data ?? null;
  const todayLoading = todayQuery.isPending;
  const todayError = todayQuery.isError
    ? getApiErrorMessage(todayQuery.error, "Današnji termini nisu učitani.")
    : null;

  const servicesLoading = servicesQuery.isPending;

  function retryDashboard() {
    if (!user) {
      return;
    }
    void dashQuery.refetch();
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

  const todayYmd = todayYmdInTz(tz);
  const appointmentsToday =
    analytics?.appointments_today ?? dash.todayAppointments;
  const revenueToday = analytics?.revenue_today ?? dash.revenue;
  const calendarDayUrl = `/calendar?day=${encodeURIComponent(todayYmd)}&view=day`;
  const calendarWeekUrl = `/calendar?day=${encodeURIComponent(todayYmd)}&view=week`;
  const greetName =
    emailLocalPart(user.email) || displayNameFromEmail(user.email);
  const busyToday = todayList?.length ?? 0;
  const servicesList = servicesQuery.data ?? null;
  const openMinutesPerDay = averageOpenMinutesPerDay(
    settings.working_hours as Record<string, unknown> | undefined
  );
  const avgServiceMin = averageServiceDurationMinutes(servicesList ?? undefined);
  const maxSlotsPerDay = estimatedSlotsPerDay(openMinutesPerDay, avgServiceMin);
  const slotWidgetVisible = !servicesLoading && maxSlotsPerDay != null;
  const freeSlotsEstimate = slotWidgetVisible
    ? Math.max(0, maxSlotsPerDay - busyToday)
    : null;

  const series30 = analytics?.series30 ?? [];
  const apptDailySpark =
    series30.length > 0
      ? series30.map((d) => d.appointments)
      : !analyticsLoading
        ? [0]
        : [];
  const clientsSparkline =
    apptDailySpark.length > 0
      ? cumulativeSeries(apptDailySpark)
      : !analyticsLoading
        ? [0]
        : [];
  const revenueDailySpark = showFinancialKpi
    ? series30.length > 0
      ? series30.map((d) => d.revenue)
      : !analyticsLoading
        ? [0]
        : []
    : null;

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

        {/* Glavni KPI — obojene kartice, sparkline, animirani brojevi */}
        <section className="col-span-12 mb-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                Pregled poslovanja
              </p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Ključni pokazatelji za danas i trend (30 dana)
              </p>
            </div>
          </div>
          <DashboardHeroStats
            clientsCount={analytics?.clients ?? dash.clients ?? 0}
            appointmentsToday={appointmentsToday}
            revenueToday={
              showFinancialKpi
                ? (revenueToday ?? analytics?.revenue_today ?? null)
                : null
            }
            showFinancial={showFinancialKpi}
            sparklines={{
              clients: clientsSparkline,
              appointments: apptDailySpark,
              revenue: revenueDailySpark,
            }}
            sparklinesLoading={analyticsLoading}
          />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/80 bg-card/90 px-4 py-3.5 text-sm shadow-[var(--smp-shadow-soft)] backdrop-blur-sm ring-1 ring-primary/5">
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <Clock className="size-4 shrink-0 text-primary" aria-hidden />
              <span>
                Sledeći termin u kalendaru:{" "}
                <strong className="text-foreground">
                  {dash.nextAppointment ?? "—"}
                </strong>
              </span>
            </div>
            {showFinancialKpi && !analyticsLoading && analytics ? (
              <span className="text-muted-foreground">
                Prihod (mesec):{" "}
                <strong className="tabular-nums text-foreground">
                  {formatRsd(
                    analytics.revenue_month ?? analytics.revenue ?? 0
                  )}
                </strong>
              </span>
            ) : null}
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
            className="dash-calendar-host col-span-12 flex h-[520px] flex-col overflow-hidden rounded-[22px] border border-border bg-card p-4 shadow-[var(--smp-shadow-soft)] ring-1 ring-black/[0.03] transition duration-200 hover:border-primary/30 hover:shadow-[var(--smp-shadow-hover)] lg:col-span-8"
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
                          className="dash-btn block rounded-xl border border-border border-l-[3px] border-l-primary bg-muted/40 p-3.5 transition hover:-translate-y-0.5 hover:border-primary/35 hover:bg-muted/55 hover:shadow-md"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-lg font-bold tabular-nums tracking-tight text-foreground">
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

            {slotWidgetVisible ? (
              <div className="dash-card flex min-h-[128px] flex-col justify-between p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  Brzi pregled
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-foreground">
                      {freeSlotsEstimate ?? 0}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Slobodnih slotova *
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-primary">
                      {busyToday}
                    </p>
                    <p className="text-sm text-muted-foreground">Termina danas</p>
                  </div>
                </div>
                <p className="text-xs leading-snug text-muted-foreground">
                  * Procena: radni sati / prosečno trajanje usluge, umanjeno za današnje
                  termine
                </p>
              </div>
            ) : null}
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

          <div className="col-span-12 flex min-h-[260px] flex-col gap-4 rounded-[20px] border border-border bg-card p-5 shadow-md transition duration-200 hover:shadow-lg lg:col-span-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Pregled meseca
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Prihod i najtraženije usluge
              </p>
            </div>
            {analyticsLoading ? (
              <div className="space-y-3" aria-busy="true">
                <div className="h-10 animate-pulse rounded-lg bg-muted" />
                <div className="h-28 animate-pulse rounded-lg bg-muted" />
              </div>
            ) : analyticsError ? (
              <p className="text-sm text-destructive">{analyticsError}</p>
            ) : analytics ? (
              <div className="flex min-h-0 flex-1 flex-col gap-5">
                {showFinancialKpi && analytics.revenue_month != null ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Prihod (mesec)
                    </p>
                    <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                      {formatRsd(analytics.revenue_month)}
                    </p>
                  </div>
                ) : null}
                <div className="min-h-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Top usluge
                  </p>
                  {(analytics.top_services ?? []).length > 0 ? (
                    <ul className="mt-2 space-y-2.5">
                      {(analytics.top_services ?? []).slice(0, 5).map((s) => (
                        <li
                          key={s.id}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <span className="min-w-0 truncate font-medium text-foreground">
                            {s.name}
                          </span>
                          <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                            {s.booking_count} zakaz. · {formatRsd(s.revenue)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Još nema podataka o uslugama za ovaj period.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
