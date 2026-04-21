"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRightLeft,
  CalendarRange,
  Crown,
  Download,
  Plus,
  Trash2,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { AnalyticsChartSkeleton } from "@/components/features/dashboard/analytics-chart-skeleton";
import { FinancesKpiCards } from "@/components/features/finances/finances-kpi-cards";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  createExpense,
  deleteExpense,
  getAnalytics,
  getAppointments,
  getDashboard,
  getExpenseMonthlyTotals,
  getExpenses,
  type ExpenseMonthlyTotal,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { appTableHeadClass, appTableRowClass } from "@/lib/app-ui";
import {
  addDays,
  formatYyyyMmDd,
  parseYyyyMmDd,
  startOfWeekMonday,
} from "@/lib/dateLocal";
import {
  getMonthlyOverheadRsd,
  setMonthlyOverheadRsd,
} from "@/lib/finance-overhead";
import { formatRsd } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";
import { useTableHeadShadow } from "@/hooks/useTableHeadShadow";
import { useTableViewportWindow } from "@/hooks/useTableViewportWindow";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import type { AnalyticsResponse, AnalyticsSeriesPoint } from "@/types/analytics";
import type { AppointmentRow } from "@/types/appointment";
import type { DashboardSummary } from "@/types/dashboard";
import type { ExpenseRow } from "@/types/expense";

const AnalyticsSeriesChart = dynamic(
  () =>
    import("@/components/features/dashboard/analytics-series-chart").then((m) => ({
      default: m.AnalyticsSeriesChart,
    })),
  { ssr: false, loading: () => <AnalyticsChartSkeleton /> }
);

const DEFAULT_TZ = "Europe/Belgrade";
const MAX_MONTHLY_OVERHEAD_RSD = 999_999_999;

function formatExpenseMonthLabel(ym: string): string {
  const [yStr, mStr] = ym.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
    return ym;
  }
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    month: "short",
    year: "numeric",
  }).format(new Date(y, m - 1, 1));
}

type PeriodFilter = "day" | "week" | "month";

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

function firstOfMonthYmdInTz(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "";
  const m = parts.find((p) => p.type === "month")?.value ?? "";
  return `${y}-${m}-01`;
}

function lastDayOfMonthYmd(year: number, month1to12: number): string {
  const last = new Date(year, month1to12, 0).getDate();
  return `${year}-${String(month1to12).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

function apptPrice(a: AppointmentRow): number {
  const p = a.service_price;
  if (p == null) {
    return 0;
  }
  if (typeof p === "number") {
    return p;
  }
  const n = Number(String(p).replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function txnStatus(a: AppointmentRow): { label: string; badgeClass: string } {
  if (a.status === "completed") {
    return {
      label: "Plaćeno",
      badgeClass:
        "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-100",
    };
  }
  if (a.status === "scheduled") {
    return {
      label: "Na čekanju",
      badgeClass:
        "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
    };
  }
  return {
    label: "Otkazano",
    badgeClass:
      "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
  };
}

function formatApptWhen(iso: string, timeZone: string): string {
  try {
    return new Intl.DateTimeFormat("sr-Latn-RS", {
      timeZone,
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function csvEscapeCell(v: string): string {
  const s = v.replaceAll('"', '""');
  return `"${s}"`;
}

function downloadTransactionsCsv(
  rows: AppointmentRow[],
  tz: string,
  filename: string
) {
  const header = ["datum", "klijent", "usluga", "cena_rsd", "status"];
  const lines = [header.join(";")];
  for (const a of rows) {
    const st = txnStatus(a);
    lines.push(
      [
        csvEscapeCell(formatApptWhen(a.date, tz)),
        csvEscapeCell(a.client_name ?? `Klijent #${a.client_id}`),
        csvEscapeCell(a.service_name ?? `Usluga #${a.service_id}`),
        csvEscapeCell(String(apptPrice(a))),
        csvEscapeCell(st.label),
      ].join(";")
    );
  }
  const bom = "\uFEFF";
  const blob = new Blob([bom + lines.join("\n")], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success("CSV je preuzet (Excel-friendly UTF-8).");
}

export default function FinancesPage() {
  const { user, loading: authLoading } = useAuth();
  const { settings, patchSettingsWithOptimism } = useOrganization();
  const tz = orgTimeZone(settings?.timezone);

  const [dash, setDash] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>("week");
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [overheadOpen, setOverheadOpen] = useState(false);
  const [overheadRsd, setOverheadRsd] = useState(0);
  const [overheadDraft, setOverheadDraft] = useState("0");
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseTitle, setExpenseTitle] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseSpentAt, setExpenseSpentAt] = useState("");
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseMonthlyTotals, setExpenseMonthlyTotals] = useState<
    ExpenseMonthlyTotal[]
  >([]);
  const overheadMigratedRef = useRef(false);
  const txScrollRef = useRef<HTMLDivElement>(null);
  const txHeadShadow = useTableHeadShadow(txScrollRef);
  const txTv = useTableViewportWindow(txScrollRef, rows.length, 49, {
    minItems: 45,
  });
  const visibleTx = txTv.enabled ? rows.slice(txTv.from, txTv.to) : rows;

  const expensesScrollRef = useRef<HTMLDivElement>(null);
  const expensesHeadShadow = useTableHeadShadow(expensesScrollRef);
  const expensesTv = useTableViewportWindow(
    expensesScrollRef,
    expenseRows.length,
    52,
    { minItems: 45 }
  );
  const visibleExpenses = expensesTv.enabled
    ? expenseRows.slice(expensesTv.from, expensesTv.to)
    : expenseRows;

  useEffect(() => {
    if (!settings || overheadMigratedRef.current) return;
    const srv = settings.finance?.monthly_overhead_rsd ?? 0;
    if (srv > 0) {
      overheadMigratedRef.current = true;
      queueMicrotask(() => {
        setOverheadRsd(srv);
        setOverheadDraft(String(srv));
      });
      return;
    }
    const loc = getMonthlyOverheadRsd();
    if (loc > 0) {
      overheadMigratedRef.current = true;
      queueMicrotask(() => {
        setOverheadRsd(loc);
        setOverheadDraft(String(loc));
      });
      void (async () => {
        try {
          await patchSettingsWithOptimism({
            settings: { finance: { monthly_overhead_rsd: loc } },
          });
          setMonthlyOverheadRsd(0);
        } catch (err) {
          toast.error(
            getApiErrorMessage(err, "Sinhronizacija troškova nije uspela.")
          );
        }
      })();
      return;
    }
    overheadMigratedRef.current = true;
    queueMicrotask(() => {
      setOverheadRsd(0);
      setOverheadDraft("0");
    });
  }, [settings, patchSettingsWithOptimism]);

  const todayYmd = useMemo(() => todayYmdInTz(tz), [tz]);

  const monthRange = useMemo(() => {
    const first = firstOfMonthYmdInTz(tz);
    const [y, m] = first.split("-").map(Number);
    const to = lastDayOfMonthYmd(y, m);
    return { from: first, to };
  }, [tz]);

  const reloadExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      const [res, monthlyRes] = await Promise.all([
        getExpenses({
          from: monthRange.from,
          to: monthRange.to,
        }),
        getExpenseMonthlyTotals(6),
      ]);
      setExpenseRows(Array.isArray(res.data) ? res.data : []);
      setExpenseMonthlyTotals(
        Array.isArray(monthlyRes.data) ? monthlyRes.data : []
      );
    } catch (err) {
      setExpenseRows([]);
      setExpenseMonthlyTotals([]);
      toast.error(
        getApiErrorMessage(err, "Troškovi nisu učitani.")
      );
    } finally {
      setExpensesLoading(false);
    }
  }, [monthRange.from, monthRange.to]);

  const range = useMemo(() => {
    if (period === "day") {
      return { from: todayYmd, to: todayYmd };
    }
    if (period === "week") {
      const d = parseYyyyMmDd(todayYmd);
      const start = startOfWeekMonday(d);
      const from = formatYyyyMmDd(start);
      const to = formatYyyyMmDd(addDays(start, 6));
      return { from, to };
    }
    const first = firstOfMonthYmdInTz(tz);
    const [y, m] = first.split("-").map(Number);
    const to = lastDayOfMonthYmd(y, m);
    return { from: first, to };
  }, [period, todayYmd, tz]);

  const chartSeries = useMemo((): AnalyticsSeriesPoint[] => {
    if (!analytics) {
      return [];
    }
    if (period === "day") {
      const all = analytics.series30 ?? [];
      const hit = all.find((p) => p.day === todayYmd);
      return hit ? [hit] : [];
    }
    if (period === "week") {
      return analytics.series7 ?? [];
    }
    return analytics.series30 ?? [];
  }, [analytics, period, todayYmd]);

  useEffect(() => {
    if (authLoading) {
      return;
    }
    if (user?.role === "worker") {
      queueMicrotask(() => setLoading(false));
      return;
    }
    let c = false;
    queueMicrotask(() => {
      if (!c) {
        setLoading(true);
      }
    });
    Promise.all([getDashboard(), getAnalytics()])
      .then(([dRes, aRes]) => {
        if (!c) {
          setDash(dRes.data);
          setAnalytics(aRes.data);
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

  useEffect(() => {
    if (authLoading || user?.role === "worker") {
      return;
    }
    let c = false;
    queueMicrotask(() => {
      if (!c) {
        setRowsLoading(true);
      }
    });
    getAppointments({ from: range.from, to: range.to, timezone: tz })
      .then((res) => {
        if (!c) {
          const list = Array.isArray(res.data) ? res.data : [];
          const sorted = [...list].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setRows(sorted);
        }
      })
      .catch(() => {
        if (!c) {
          setRows([]);
        }
      })
      .finally(() => {
        if (!c) {
          setRowsLoading(false);
        }
      });
    return () => {
      c = true;
    };
  }, [authLoading, user?.role, range.from, range.to, tz]);

  useEffect(() => {
    if (authLoading || user?.role === "worker") {
      return;
    }
    void reloadExpenses();
  }, [authLoading, user?.role, reloadExpenses]);

  const showRevenue = user?.role !== "worker";

  const revenueToday =
    dash?.revenue ??
    analytics?.revenue_today ??
    analytics?.revenue ??
    0;
  const revenueMonth = analytics?.revenue_month ?? 0;
  const revenuePrevMonth = analytics?.revenue_previous_month ?? 0;
  const revenueTrendHint = useMemo(() => {
    const cur = Math.max(0, revenueMonth);
    const prev = Math.max(0, revenuePrevMonth);
    if (prev <= 0 && cur <= 0) {
      return "Tekući mesec u zoni salona · nema poređenja sa prethodnim";
    }
    if (prev <= 0 && cur > 0) {
      return "Tekući mesec u zoni salona · prvi mesec sa prihodom za trend";
    }
    const pct = ((cur - prev) / prev) * 100;
    const rounded = Math.round(pct * 10) / 10;
    const sign = pct >= 0 ? "+" : "";
    const verb = pct >= 0 ? "rast" : "pad";
    return `Tekući mesec u zoni salona · vs prethodni: ${sign}${rounded}% (${verb})`;
  }, [revenueMonth, revenuePrevMonth]);

  const expenseMonthlySorted = useMemo(
    () =>
      [...expenseMonthlyTotals].sort((a, b) => a.month.localeCompare(b.month)),
    [expenseMonthlyTotals]
  );
  const expenseMonthlyMax = useMemo(
    () =>
      Math.max(1, ...expenseMonthlyTotals.map((t) => t.total_rsd)),
    [expenseMonthlyTotals]
  );

  const clientCount = analytics?.clients ?? dash?.clients ?? 0;
  const avgValue =
    clientCount > 0 && revenueMonth > 0
      ? Math.round(revenueMonth / clientCount)
      : 0;

  const expensesMonthSum = useMemo(
    () => expenseRows.reduce((s, e) => s + e.amount_rsd, 0),
    [expenseRows]
  );

  /** Ako ima stavki u bazi za mesec, one važe; inače fallback na procenu u podešavanjima. */
  const effectiveCost =
    expensesMonthSum > 0 ? expensesMonthSum : overheadRsd;

  const profitMonth = Math.max(0, revenueMonth - effectiveCost);

  const bestDayInfo = useMemo(() => {
    const series = analytics?.series30 ?? [];
    if (series.length === 0) {
      return null;
    }
    let best = series[0]!;
    for (const p of series) {
      if (p.revenue > best.revenue) {
        best = p;
      }
    }
    if (!best || best.revenue <= 0) {
      return null;
    }
    const weekday = new Intl.DateTimeFormat("sr-Latn-RS", {
      weekday: "long",
      timeZone: tz,
    }).format(new Date(`${best.day}T12:00:00`));
    return { weekday, revenue: best.revenue, day: best.day };
  }, [analytics?.series30, tz]);

  const topClient = analytics?.top_clients?.[0] ?? null;

  if (authLoading || !user) {
    return (
      <p className="text-sm text-slate-600 dark:text-slate-400">Učitavanje…</p>
    );
  }

  if (user.role === "worker") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Finansije" />
        <SurfaceCard
          padding="lg"
          className="text-center text-sm text-slate-600 dark:text-slate-400"
        >
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
        description="Prihod, trend i transakcije po periodu. Kartice prikazuju današnji i mesečni zbir; grafikon i tabela prate izabrani filter."
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-600 dark:text-slate-400">Učitavanje…</p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div
              className="inline-flex rounded-xl border border-zinc-200/90 bg-zinc-50/80 p-1 dark:border-zinc-800 dark:bg-zinc-900/50"
              role="group"
              aria-label="Period prikaza"
            >
              {(
                [
                  ["day", "Danas"],
                  ["week", "Nedelja"],
                  ["month", "Mesec"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPeriod(key)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    period === key
                      ? "bg-white text-zinc-900 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="gap-2 rounded-xl"
                disabled={rowsLoading || rows.length === 0}
                onClick={() =>
                  downloadTransactionsCsv(
                    rows,
                    tz,
                    `transakcije_${range.from}_${range.to}.csv`
                  )
                }
              >
                <Download className="size-4" aria-hidden />
                Export CSV
              </Button>
              <Button
                type="button"
                variant="brand"
                className="gap-2 rounded-xl shadow-md"
                onClick={() => setPaymentOpen(true)}
              >
                <Plus className="size-4" aria-hidden />
                Dodaj uplatu
              </Button>
            </div>
          </div>

          <FinancesKpiCards
            revenueToday={revenueToday}
            revenueMonth={revenueMonth}
            revenuePrevMonth={revenuePrevMonth}
            clientCount={clientCount}
            avgValue={avgValue}
            revenueTrendHint={revenueTrendHint}
          />

          <SurfaceCard padding="lg" className="border-dashed border-sky-200/80 dark:border-sky-900/50">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Profit (mesec)
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Prihod minus troškovi tekućeg meseca. Unosi se kroz stavke u
                  bazi; ako nema stavki, koristi se okvirna procena u
                  podešavanjima.
                </p>
              </div>
              <div className="grid w-full gap-3 sm:grid-cols-3 lg:max-w-2xl lg:flex-1">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Prihod
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    {formatRsd(revenueMonth)}
                  </p>
                  {revenuePrevMonth > 0 ? (
                    <p
                      className={cn(
                        "mt-1 flex items-center gap-1 text-[11px] font-semibold tabular-nums",
                        revenueMonth >= revenuePrevMonth
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400"
                      )}
                    >
                      {revenueMonth >= revenuePrevMonth ? (
                        <TrendingUp className="size-3.5 shrink-0" aria-hidden />
                      ) : (
                        <TrendingDown className="size-3.5 shrink-0" aria-hidden />
                      )}
                      {(() => {
                        const pct =
                          ((revenueMonth - revenuePrevMonth) /
                            revenuePrevMonth) *
                          100;
                        const r = Math.round(pct * 10) / 10;
                        const sign = r >= 0 ? "+" : "";
                        return `vs preth. mesec ${sign}${r}%`;
                      })()}
                    </p>
                  ) : revenueMonth > 0 ? (
                    <p className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Nema podataka za prethodni mesec
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-slate-100 bg-amber-50/60 px-4 py-3 text-left transition hover:bg-amber-50 dark:border-slate-800 dark:bg-amber-950/30 dark:hover:bg-amber-950/50"
                  onClick={() => {
                    setOverheadDraft(String(overheadRsd));
                    setOverheadOpen(true);
                  }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Troškovi (mes.)
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-lg font-bold tabular-nums text-slate-900 dark:text-slate-50">
                    <Wallet className="size-4 text-amber-700 dark:text-amber-400" aria-hidden />
                    {formatRsd(effectiveCost)}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-600 dark:text-slate-400">
                    {expensesMonthSum > 0
                      ? `${expenseRows.length} stavki u bazi`
                      : "Okvirna procena →"}
                  </p>
                </button>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-4 py-3 dark:border-emerald-900/50 dark:bg-emerald-950/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Profit
                  </p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-emerald-900 dark:text-emerald-100">
                    {formatRsd(profitMonth)}
                  </p>
                </div>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard padding="none" className="overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Troškovi (baza)
                </h2>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Tekući mesec ({monthRange.from} — {monthRange.to}). Stavke se
                  čuvaju u PostgreSQL-u po organizaciji.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                {!expensesLoading && expenseRows.length > 0 ? (
                  <p className="order-last shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400 sm:order-first sm:ml-auto">
                    {expenseRows.length}{" "}
                    {expenseRows.length === 1 ? "stavka" : "stavki"}
                    {expensesTv.enabled
                      ? ` · prikaz ${expensesTv.from + 1}–${expensesTv.to}`
                      : null}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2 rounded-xl sm:shrink-0"
                  onClick={() => {
                    setExpenseTitle("");
                    setExpenseAmount("");
                    setExpenseCategory("");
                    setExpenseSpentAt(todayYmd);
                    setExpenseOpen(true);
                  }}
                >
                  <Plus className="size-4" aria-hidden />
                  Evidentiraj trošak
                </Button>
              </div>
            </div>
            <div
              ref={expensesScrollRef}
              className={cn(
                "overflow-x-auto",
                expenseRows.length >= 45 &&
                  "max-h-[min(60vh,420px)] overflow-y-auto"
              )}
            >
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead
                  className={cn(
                    appTableHeadClass,
                    "sticky top-0 z-20 bg-white/95 backdrop-blur-sm dark:bg-zinc-950/95",
                    expensesHeadShadow &&
                      "shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] dark:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.45)]"
                  )}
                >
                  <tr className="border-b border-slate-200/90 dark:border-slate-800">
                    <th className="px-5 py-3.5">Datum</th>
                    <th className="px-5 py-3.5">Opis</th>
                    <th className="px-5 py-3.5">Kategorija</th>
                    <th className="px-5 py-3.5 text-right">Iznos</th>
                    <th className="w-14 px-5 py-3.5" />
                  </tr>
                </thead>
                <tbody>
                  {expensesLoading ? (
                    <tr className={appTableRowClass}>
                      <td
                        className="px-5 py-8 text-center text-slate-500 dark:text-slate-400"
                        colSpan={5}
                      >
                        Učitavanje troškova…
                      </td>
                    </tr>
                  ) : expenseRows.length === 0 ? (
                    <tr className={appTableRowClass}>
                      <td
                        className="px-5 py-8 text-center text-slate-500 dark:text-slate-400"
                        colSpan={5}
                      >
                        Nema unetih troškova za ovaj mesec. Koristi „Evidentiraj
                        trošak“ ili okvirnu procenu iznad.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {expensesTv.topSpacer > 0 ? (
                        <tr aria-hidden>
                          <td
                            colSpan={5}
                            style={{
                              height: expensesTv.topSpacer,
                              padding: 0,
                              border: 0,
                            }}
                          />
                        </tr>
                      ) : null}
                      {visibleExpenses.map((ex) => (
                        <tr
                          key={ex.id}
                          className={cn(appTableRowClass, "h-[52px]")}
                        >
                          <td className="px-5 py-3 tabular-nums text-slate-700 dark:text-slate-300">
                            {ex.spent_at}
                          </td>
                          <td className="max-w-[200px] truncate px-5 py-3 font-medium text-slate-900 dark:text-slate-50">
                            {ex.title}
                          </td>
                          <td className="px-5 py-3 text-slate-600 dark:text-slate-400">
                            {ex.category?.trim() ? ex.category : "—"}
                          </td>
                          <td className="px-5 py-3 text-right tabular-nums text-slate-900 dark:text-slate-50">
                            {formatRsd(ex.amount_rsd)}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <Button
                              type="button"
                              size="icon-sm"
                              variant="ghost"
                              className="rounded-xl text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                              aria-label="Obriši trošak"
                              onClick={() => {
                                void (async () => {
                                  try {
                                    await deleteExpense(ex.id);
                                    await reloadExpenses();
                                    toast.success("Trošak je obrisan.");
                                  } catch (err) {
                                    toast.error(
                                      getApiErrorMessage(
                                        err,
                                        "Brisanje nije uspelo."
                                      )
                                    );
                                  }
                                })();
                              }}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                      {expensesTv.bottomSpacer > 0 ? (
                        <tr aria-hidden>
                          <td
                            colSpan={5}
                            style={{
                              height: expensesTv.bottomSpacer,
                              padding: 0,
                              border: 0,
                            }}
                          />
                        </tr>
                      ) : null}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>

          <SurfaceCard padding="lg" className="overflow-hidden">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Istorija troškova po mesecima
              </h2>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Zbir evidentiranih troškova (poslednjih šest meseci, po
                kalendarskim mesecima).
              </p>
            </div>
            {expensesLoading && expenseMonthlySorted.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Učitavanje…
              </p>
            ) : expenseMonthlySorted.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Još nema unetih troškova u ovom periodu.
              </p>
            ) : (
              <ul className="space-y-3">
                {expenseMonthlySorted.map((row) => {
                  const w = Math.round(
                    (row.total_rsd / expenseMonthlyMax) * 100
                  );
                  return (
                    <li key={row.month} className="space-y-1">
                      <div className="flex items-baseline justify-between gap-3 text-sm">
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {formatExpenseMonthLabel(row.month)}
                        </span>
                        <span className="shrink-0 tabular-nums font-semibold text-slate-900 dark:text-slate-50">
                          {formatRsd(row.total_rsd)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                        <div
                          className="h-full rounded-full bg-amber-500/90 dark:bg-amber-600/90"
                          style={{ width: `${w}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </SurfaceCard>

          {bestDayInfo || topClient ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {bestDayInfo ? (
                <SurfaceCard padding="md" className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-200">
                    <CalendarRange className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Najbolji dan (30 dana)
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-900 dark:text-slate-50">
                      {bestDayInfo.weekday.charAt(0).toUpperCase() +
                        bestDayInfo.weekday.slice(1)}{" "}
                      <span className="text-slate-500">
                        ({formatRsd(bestDayInfo.revenue)})
                      </span>
                    </p>
                  </div>
                </SurfaceCard>
              ) : null}
              {topClient ? (
                <SurfaceCard padding="md" className="flex gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-800 dark:bg-violet-950/50 dark:text-violet-200">
                    <Crown className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Top klijent
                    </p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-900 dark:text-slate-50">
                      {topClient.name}
                      <span className="text-slate-500">
                        {" "}
                        ({formatRsd(topClient.revenue)})
                      </span>
                    </p>
                  </div>
                </SurfaceCard>
              ) : null}
            </div>
          ) : null}

          <SurfaceCard padding="lg" className="min-w-0 overflow-hidden">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                Prihod po danima
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {period === "day"
                  ? "Današnji dan"
                  : period === "week"
                    ? "Poslednjih 7 dana"
                    : "Poslednjih 30 dana"}
              </p>
            </div>
            <div className="min-w-0">
              <AnalyticsSeriesChart data={chartSeries} showRevenue={showRevenue} />
            </div>
          </SurfaceCard>

          <SurfaceCard padding="none" className="overflow-hidden">
            <div className="flex flex-col gap-1 border-b border-slate-100 px-5 py-4 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  Transakcije
                </h2>
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                  <CalendarRange className="size-3.5 shrink-0" aria-hidden />
                  {range.from === range.to
                    ? range.from
                    : `${range.from} — ${range.to}`}
                </p>
              </div>
              {!rowsLoading && rows.length > 0 ? (
                <p className="shrink-0 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {rows.length} termina
                  {txTv.enabled
                    ? ` · prikaz ${txTv.from + 1}–${txTv.to}`
                    : null}
                </p>
              ) : null}
            </div>
            <div
              ref={txScrollRef}
              className={cn(
                "overflow-x-auto",
                rows.length >= 45 && "max-h-[min(70vh,520px)] overflow-y-auto"
              )}
            >
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead
                  className={cn(
                    appTableHeadClass,
                    "sticky top-0 z-20 bg-white/95 backdrop-blur-sm dark:bg-zinc-950/95",
                    txHeadShadow &&
                      "shadow-[0_6px_12px_-4px_rgba(0,0,0,0.12)] dark:shadow-[0_6px_12px_-4px_rgba(0,0,0,0.45)]"
                  )}
                >
                  <tr className="border-b border-slate-200/90 dark:border-slate-800">
                    <th className="px-5 py-3.5">Datum</th>
                    <th className="px-5 py-3.5">Klijent</th>
                    <th className="px-5 py-3.5">Usluga</th>
                    <th className="px-5 py-3.5 text-right">Cena</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsLoading ? (
                    <tr className={appTableRowClass}>
                      <td
                        className="px-5 py-8 text-center text-slate-500 dark:text-slate-400"
                        colSpan={5}
                      >
                        Učitavanje termina…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr className={appTableRowClass}>
                      <td
                        className="px-5 py-8 text-center text-slate-500 dark:text-slate-400"
                        colSpan={5}
                      >
                        Nema termina u ovom periodu.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {txTv.topSpacer > 0 ? (
                        <tr aria-hidden>
                          <td
                            colSpan={5}
                            style={{
                              height: txTv.topSpacer,
                              padding: 0,
                              border: 0,
                            }}
                          />
                        </tr>
                      ) : null}
                      {visibleTx.map((a) => {
                        const st = txnStatus(a);
                        return (
                          <tr key={a.id} className={appTableRowClass}>
                            <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                              {formatApptWhen(a.date, tz)}
                            </td>
                            <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-50">
                              {a.client_name ?? `Klijent #${a.client_id}`}
                            </td>
                            <td className="px-5 py-3.5 text-slate-700 dark:text-slate-300">
                              {a.service_name ?? `Usluga #${a.service_id}`}
                            </td>
                            <td className="px-5 py-3.5 text-right tabular-nums text-slate-900 dark:text-slate-50">
                              {formatRsd(apptPrice(a))}
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge
                                variant="outline"
                                className={cn("font-medium", st.badgeClass)}
                              >
                                {st.label}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                      {txTv.bottomSpacer > 0 ? (
                        <tr aria-hidden>
                          <td
                            colSpan={5}
                            style={{
                              height: txTv.bottomSpacer,
                              padding: 0,
                              border: 0,
                            }}
                          />
                        </tr>
                      ) : null}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </SurfaceCard>

          <SurfaceCard padding="md" className="flex flex-wrap items-center gap-3 border-dashed">
            <ArrowRightLeft className="size-5 text-slate-400" aria-hidden />
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Potrebna je detaljnija knjiga uplata? Povezaćemo je sa API-jem u sledećoj
              iteraciji — zbir na dashboardu i ovde ostaje usklađen.
            </p>
          </SurfaceCard>
        </>
      )}

      <Dialog open={overheadOpen} onOpenChange={setOverheadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Okvirni mesečni trošak (fallback)</DialogTitle>
            <DialogDescription>
              Koristi kada još nemaš pojedinačne stavke u tabeli troškova. Čim
              dodaš bar jednu stavku u mesecu, profit koristi zbir iz baze, ne
              ovo polje.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="overhead">Iznos u RSD</Label>
            <Input
              id="overhead"
              inputMode="numeric"
              value={overheadDraft}
              onChange={(e) => setOverheadDraft(e.target.value)}
            />
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setOverheadOpen(false)}>
              Otkaži
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={() => {
                const raw = String(overheadDraft)
                  .trim()
                  .replace(/\s/g, "")
                  .replace(",", ".");
                const n = Number(raw);
                if (!Number.isFinite(n) || n < 0) {
                  toast.error("Unesi validan nenegativan iznos.");
                  return;
                }
                const v = Math.min(
                  Math.round(n),
                  MAX_MONTHLY_OVERHEAD_RSD
                );
                void (async () => {
                  try {
                    await patchSettingsWithOptimism({
                      settings: { finance: { monthly_overhead_rsd: v } },
                    });
                    setMonthlyOverheadRsd(0);
                    setOverheadRsd(v);
                    setOverheadDraft(String(v));
                    setOverheadOpen(false);
                    toast.success("Troškovi su sačuvani na nalogu.");
                  } catch (err) {
                    toast.error(
                      getApiErrorMessage(err, "Čuvanje troškova nije uspelo.")
                    );
                  }
                })();
              }}
            >
              Sačuvaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={expenseOpen} onOpenChange={setExpenseOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novi trošak</DialogTitle>
            <DialogDescription>
              Evidencija rashoda za tekući mesec (i ostale periode koje biraš
              datumom).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div className="space-y-2">
              <Label htmlFor="ex-title">Opis</Label>
              <Input
                id="ex-title"
                value={expenseTitle}
                onChange={(e) => setExpenseTitle(e.target.value)}
                placeholder="npr. Zakup prostora"
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-amt">Iznos (RSD)</Label>
              <Input
                id="ex-amt"
                inputMode="numeric"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-cat">Kategorija (opciono)</Label>
              <Input
                id="ex-cat"
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
                placeholder="npr. zakup, marketing"
                maxLength={80}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ex-date">Datum troška</Label>
              <Input
                id="ex-date"
                type="date"
                value={expenseSpentAt}
                onChange={(e) => setExpenseSpentAt(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setExpenseOpen(false)}
            >
              Otkaži
            </Button>
            <Button
              type="button"
              variant="brand"
              disabled={expenseSaving}
              onClick={() => {
                const title = expenseTitle.trim();
                if (title.length < 1) {
                  toast.error("Unesi opis troška.");
                  return;
                }
                const n = Number(String(expenseAmount).replace(",", "."));
                const amt = Number.isFinite(n) && n >= 0 ? Math.round(n) : -1;
                if (amt < 0) {
                  toast.error("Unesi ispravan iznos.");
                  return;
                }
                if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseSpentAt)) {
                  toast.error("Izaberi datum.");
                  return;
                }
                setExpenseSaving(true);
                void (async () => {
                  try {
                    await createExpense({
                      title,
                      amount_rsd: amt,
                      category: expenseCategory.trim() || null,
                      spent_at: expenseSpentAt,
                    });
                    await reloadExpenses();
                    setExpenseOpen(false);
                    toast.success("Trošak je sačuvan.");
                  } catch (err) {
                    toast.error(
                      getApiErrorMessage(err, "Čuvanje troška nije uspelo.")
                    );
                  } finally {
                    setExpenseSaving(false);
                  }
                })();
              }}
            >
              Sačuvaj
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dodaj uplatu</DialogTitle>
            <DialogDescription>
              Ručni unos uplate (gotovina, kartica) biće povezan sa izveštajima u
              narednom izdanju. Do tida evidentiraj završene termine u kalendaru —
              prihod se automatski računa iz cena usluga.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={() => setPaymentOpen(false)}>
              Zatvori
            </Button>
            <Button
              type="button"
              variant="brand"
              onClick={() => {
                setPaymentOpen(false);
                toast.message("Hvala — ručne uplate su na planu.", {
                  description: "Označi termin kao završen da se prihod ažurira.",
                });
              }}
            >
              Razumem
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
