"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRightLeft, Download, Plus } from "lucide-react";
import { toast } from "sonner";
import { AnalyticsChartSkeleton } from "@/components/features/dashboard/analytics-chart-skeleton";
import { FinancesKpiCards } from "@/components/features/finances/finances-kpi-cards";
import { FinanceProfitSummary } from "@/components/features/finances/finance-profit-summary";
import { ExpensesTable } from "@/components/features/finances/expenses-table";
import { ExpenseMonthlyChart } from "@/components/features/finances/expense-monthly-chart";
import { TransactionsTable } from "@/components/features/finances/transactions-table";
import { FinanceInsightCards } from "@/components/features/finances/finance-insight-cards";
import {
  ExpenseDialog,
  OverheadDialog,
  PaymentDialog,
} from "@/components/features/finances/finance-dialogs";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { SurfaceCard } from "@/components/ui/surface-card";
import {
  createExpense,
  getAnalytics,
  getAppointments,
  getDashboard,
  getExpenseMonthlyTotals,
  getExpenses,
  type ExpenseMonthlyTotal,
} from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
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
import { cn } from "@/lib/utils";
import {
  downloadTransactionsCsv,
  firstOfMonthYmdInTz,
  lastDayOfMonthYmd,
  orgTimeZone,
  todayYmdInTz,
  type PeriodFilter,
} from "@/components/features/finances/finances-utils";
import { useAuth } from "@/providers/auth-provider";
import { useOrganization } from "@/providers/organization-provider";
import type { AnalyticsResponse, AnalyticsSeriesPoint } from "@/types/analytics";
import type { AppointmentRow } from "@/types/appointment";
import type { DashboardSummary } from "@/types/dashboard";
import type { ExpenseRow } from "@/types/expense";

const AnalyticsSeriesChart = dynamic(
  () =>
    import("@/components/features/dashboard/analytics-series-chart").then(
      (m) => ({ default: m.AnalyticsSeriesChart })
    ),
  { ssr: false, loading: () => <AnalyticsChartSkeleton /> }
);

export default function FinancesPage() {
  const { user, loading: authLoading } = useAuth();
  const { settings, patchSettingsWithOptimism } = useOrganization();
  const tz = orgTimeZone(settings?.timezone);

  /* ── Core data ── */
  const [dash, setDash] = useState<DashboardSummary | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [rows, setRows] = useState<AppointmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [period, setPeriod] = useState<PeriodFilter>("week");

  /* ── Expenses ── */
  const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([]);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expenseMonthlyTotals, setExpenseMonthlyTotals] = useState<ExpenseMonthlyTotal[]>([]);

  /* ── Overhead ── */
  const [overheadRsd, setOverheadRsd] = useState(0);
  const [overheadDraft, setOverheadDraft] = useState("0");
  const overheadMigratedRef = useRef(false);

  /* ── Dialogs ── */
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [overheadOpen, setOverheadOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: "",
    amount: "",
    category: "",
    spentAt: "",
  });

  /* ── Derived ── */
  const todayYmd = useMemo(() => todayYmdInTz(tz), [tz]);

  const monthRange = useMemo(() => {
    const first = firstOfMonthYmdInTz(tz);
    const [y, m] = first.split("-").map(Number);
    const to = lastDayOfMonthYmd(y, m);
    return { from: first, to };
  }, [tz]);

  const range = useMemo(() => {
    if (period === "day") return { from: todayYmd, to: todayYmd };
    if (period === "week") {
      const d = parseYyyyMmDd(todayYmd);
      const start = startOfWeekMonday(d);
      return { from: formatYyyyMmDd(start), to: formatYyyyMmDd(addDays(start, 6)) };
    }
    return monthRange;
  }, [period, todayYmd, monthRange]);

  const chartSeries = useMemo((): AnalyticsSeriesPoint[] => {
    if (!analytics) return [];
    if (period === "day") {
      const hit = (analytics.series30 ?? []).find((p) => p.day === todayYmd);
      return hit ? [hit] : [];
    }
    return period === "week" ? (analytics.series7 ?? []) : (analytics.series30 ?? []);
  }, [analytics, period, todayYmd]);

  const showRevenue = user?.role !== "worker";
  const revenueToday = dash?.revenue ?? analytics?.revenue_today ?? analytics?.revenue ?? 0;
  const revenueMonth = analytics?.revenue_month ?? 0;
  const revenuePrevMonth = analytics?.revenue_previous_month ?? 0;
  const clientCount = analytics?.clients ?? dash?.clients ?? 0;
  const avgValue = clientCount > 0 && revenueMonth > 0 ? Math.round(revenueMonth / clientCount) : 0;
  const expensesMonthSum = useMemo(() => expenseRows.reduce((s, e) => s + e.amount_rsd, 0), [expenseRows]);
  const effectiveCost = expensesMonthSum > 0 ? expensesMonthSum : overheadRsd;
  const profitMonth = Math.max(0, revenueMonth - effectiveCost);

  const revenueTrendHint = useMemo(() => {
    const cur = Math.max(0, revenueMonth);
    const prev = Math.max(0, revenuePrevMonth);
    if (prev <= 0 && cur <= 0) return "Tekući mesec u zoni salona · nema poređenja sa prethodnim";
    if (prev <= 0 && cur > 0) return "Tekući mesec u zoni salona · prvi mesec sa prihodom za trend";
    const pct = ((cur - prev) / prev) * 100;
    const r = Math.round(pct * 10) / 10;
    return `Tekući mesec u zoni salona · vs prethodni: ${r >= 0 ? "+" : ""}${r}% (${pct >= 0 ? "rast" : "pad"})`;
  }, [revenueMonth, revenuePrevMonth]);

  const bestDayInfo = useMemo(() => {
    const series = analytics?.series30 ?? [];
    if (series.length === 0) return null;
    let best = series[0]!;
    for (const p of series) { if (p.revenue > best.revenue) best = p; }
    if (!best || best.revenue <= 0) return null;
    const weekday = new Intl.DateTimeFormat("sr-Latn-RS", { weekday: "long", timeZone: tz }).format(new Date(`${best.day}T12:00:00`));
    return { weekday, revenue: best.revenue, day: best.day };
  }, [analytics?.series30, tz]);

  const topClient = analytics?.top_clients?.[0] ?? null;

  /* ── Data fetching ── */
  const reloadExpenses = useCallback(async () => {
    setExpensesLoading(true);
    try {
      const [res, monthlyRes] = await Promise.all([
        getExpenses({ from: monthRange.from, to: monthRange.to }),
        getExpenseMonthlyTotals(6),
      ]);
      setExpenseRows(Array.isArray(res.data) ? res.data : []);
      setExpenseMonthlyTotals(Array.isArray(monthlyRes.data) ? monthlyRes.data : []);
    } catch (err) {
      setExpenseRows([]);
      setExpenseMonthlyTotals([]);
      toast.error(getApiErrorMessage(err, "Troškovi nisu učitani."));
    } finally {
      setExpensesLoading(false);
    }
  }, [monthRange.from, monthRange.to]);

  useEffect(() => {
    if (!settings || overheadMigratedRef.current) return;
    const srv = settings.finance?.monthly_overhead_rsd ?? 0;
    if (srv > 0) {
      overheadMigratedRef.current = true;
      queueMicrotask(() => { setOverheadRsd(srv); setOverheadDraft(String(srv)); });
      return;
    }
    const loc = getMonthlyOverheadRsd();
    if (loc > 0) {
      overheadMigratedRef.current = true;
      queueMicrotask(() => { setOverheadRsd(loc); setOverheadDraft(String(loc)); });
      void (async () => {
        try {
          await patchSettingsWithOptimism({ settings: { finance: { monthly_overhead_rsd: loc } } });
          setMonthlyOverheadRsd(0);
        } catch (err) { toast.error(getApiErrorMessage(err, "Sinhronizacija troškova nije uspela.")); }
      })();
      return;
    }
    overheadMigratedRef.current = true;
    queueMicrotask(() => { setOverheadRsd(0); setOverheadDraft("0"); });
  }, [settings, patchSettingsWithOptimism]);

  useEffect(() => {
    if (authLoading) return;
    if (user?.role === "worker") { queueMicrotask(() => setLoading(false)); return; }
    let c = false;
    queueMicrotask(() => { if (!c) setLoading(true); });
    Promise.all([getDashboard(), getAnalytics()])
      .then(([dRes, aRes]) => { if (!c) { setDash(dRes.data); setAnalytics(aRes.data); } })
      .catch((e) => { if (!c) setError(getApiErrorMessage(e, "Podaci nisu učitani.")); })
      .finally(() => { if (!c) setLoading(false); });
    return () => { c = true; };
  }, [authLoading, user?.role]);

  useEffect(() => {
    if (authLoading || user?.role === "worker") return;
    let c = false;
    queueMicrotask(() => { if (!c) setRowsLoading(true); });
    getAppointments({ from: range.from, to: range.to, timezone: tz })
      .then((res) => {
        if (!c) {
          const list = Array.isArray(res.data) ? res.data : [];
          setRows([...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
      })
      .catch(() => { if (!c) setRows([]); })
      .finally(() => { if (!c) setRowsLoading(false); });
    return () => { c = true; };
  }, [authLoading, user?.role, range.from, range.to, tz]);

  useEffect(() => {
    if (authLoading || user?.role === "worker") return;
    void reloadExpenses();
  }, [authLoading, user?.role, reloadExpenses]);

  /* ── Guards ── */
  if (authLoading || !user) return <p className="text-sm text-muted-foreground">Učitavanje…</p>;

  if (user.role === "worker") {
    return (
      <div className="space-y-6">
        <SectionHeader title="Finansije" />
        <SurfaceCard padding="lg" className="text-center text-sm text-muted-foreground">
          <p>Ovaj odeljak je dostupan samo administratoru salona.</p>
          <Link href="/dashboard" className="mt-4 inline-block font-semibold text-sky-700 underline-offset-2 hover:underline dark:text-sky-400">
            Nazad na dashboard
          </Link>
        </SurfaceCard>
      </div>
    );
  }

  /* ── Render ── */
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
        <p className="text-sm text-muted-foreground">Učitavanje…</p>
      ) : (
        <>
          {/* Period filter + actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
            <div className="inline-flex rounded-xl border border-border/90 bg-muted/80 p-1 dark:bg-card/50" role="group" aria-label="Period prikaza">
              {([["day", "Danas"], ["week", "Nedelja"], ["month", "Mesec"]] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPeriod(key)}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
                    period === key
                      ? "bg-card text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" className="gap-2 rounded-xl" disabled={rowsLoading || rows.length === 0}
                onClick={() => downloadTransactionsCsv(rows, tz, `transakcije_${range.from}_${range.to}.csv`)}>
                <Download className="size-4" aria-hidden /> Export CSV
              </Button>
              <Button type="button" variant="brand" className="gap-2 rounded-xl shadow-md" onClick={() => setPaymentOpen(true)}>
                <Plus className="size-4" aria-hidden /> Dodaj uplatu
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

          <FinanceProfitSummary
            revenueMonth={revenueMonth}
            revenuePrevMonth={revenuePrevMonth}
            effectiveCost={effectiveCost}
            profitMonth={profitMonth}
            expensesMonthSum={expensesMonthSum}
            expenseRowCount={expenseRows.length}
            onOpenOverhead={() => {
              setOverheadDraft(String(overheadRsd));
              setOverheadOpen(true);
            }}
          />

          <ExpensesTable
            rows={expenseRows}
            loading={expensesLoading}
            monthLabel={`Tekući mesec (${monthRange.from} — ${monthRange.to})`}
            onAddClick={() => {
              setExpenseForm({ title: "", amount: "", category: "", spentAt: todayYmd });
              setExpenseOpen(true);
            }}
            onReload={reloadExpenses}
          />

          <ExpenseMonthlyChart data={expenseMonthlyTotals} loading={expensesLoading} />

          <FinanceInsightCards bestDay={bestDayInfo} topClient={topClient} />

          <SurfaceCard padding="lg" className="min-w-0 overflow-hidden">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-foreground">Prihod po danima</h2>
              <p className="text-xs text-muted-foreground">
                {period === "day" ? "Današnji dan" : period === "week" ? "Poslednjih 7 dana" : "Poslednjih 30 dana"}
              </p>
            </div>
            <div className="min-w-0">
              <AnalyticsSeriesChart data={chartSeries} showRevenue={showRevenue} />
            </div>
          </SurfaceCard>

          <TransactionsTable rows={rows} loading={rowsLoading} rangeFrom={range.from} rangeTo={range.to} tz={tz} />

          <SurfaceCard padding="md" className="flex flex-wrap items-center gap-3 border-dashed">
            <ArrowRightLeft className="size-5 text-muted-foreground/70" aria-hidden />
            <p className="text-sm text-muted-foreground">
              Potrebna je detaljnija knjiga uplata? Povezaćemo je sa API-jem u sledećoj iteraciji.
            </p>
          </SurfaceCard>
        </>
      )}

      {/* Dialogs */}
      <OverheadDialog
        open={overheadOpen}
        onOpenChange={setOverheadOpen}
        draft={overheadDraft}
        onDraftChange={setOverheadDraft}
        onSave={async (v) => {
          try {
            await patchSettingsWithOptimism({ settings: { finance: { monthly_overhead_rsd: v } } });
            setMonthlyOverheadRsd(0);
            setOverheadRsd(v);
            setOverheadDraft(String(v));
            setOverheadOpen(false);
            toast.success("Troškovi su sačuvani na nalogu.");
          } catch (err) { toast.error(getApiErrorMessage(err, "Čuvanje troškova nije uspelo.")); }
        }}
      />

      <ExpenseDialog
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        state={expenseForm}
        onChange={(patch) => setExpenseForm((prev) => ({ ...prev, ...patch }))}
        saving={expenseSaving}
        onSave={async () => {
          const title = expenseForm.title.trim();
          if (title.length < 1) { toast.error("Unesi opis troška."); return; }
          const n = Number(String(expenseForm.amount).replace(",", "."));
          const amt = Number.isFinite(n) && n >= 0 ? Math.round(n) : -1;
          if (amt < 0) { toast.error("Unesi ispravan iznos."); return; }
          if (!/^\d{4}-\d{2}-\d{2}$/.test(expenseForm.spentAt)) { toast.error("Izaberi datum."); return; }
          setExpenseSaving(true);
          try {
            await createExpense({ title, amount_rsd: amt, category: expenseForm.category.trim() || null, spent_at: expenseForm.spentAt });
            await reloadExpenses();
            setExpenseOpen(false);
            toast.success("Trošak je sačuvan.");
          } catch (err) { toast.error(getApiErrorMessage(err, "Čuvanje troška nije uspelo.")); }
          finally { setExpenseSaving(false); }
        }}
      />

      <PaymentDialog open={paymentOpen} onOpenChange={setPaymentOpen} />
    </div>
  );
}
