"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, TrendingUp, Users } from "lucide-react";
import { getDashboard } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRsd } from "@/lib/formatMoney";
import { useAuth } from "@/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import type { DashboardSummary } from "@/types/dashboard";

export function PageStatsStrip() {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    setErr(null);
    getDashboard()
      .then((r) => {
        if (!cancelled) {
          setData(r.data);
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setErr(getApiErrorMessage(e, ""));
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
  }, [user]);

  if (!user) {
    return null;
  }

  const showMoney = user.role === "admin";

  return (
    <div className="hidden border-b border-border bg-muted/50 px-4 py-3 text-foreground md:block">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-2 sm:px-4 lg:px-6">
        {loading ? (
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-40" />
            {showMoney ? <Skeleton className="h-6 w-44" /> : null}
          </div>
        ) : err ? (
          <p className="text-sm text-destructive">{err}</p>
        ) : data ? (
          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 text-base leading-snug">
            <Link
              href="/clients"
              className="flex items-center gap-2.5 rounded-lg px-1 py-0.5 text-foreground transition-colors hover:bg-background/80 hover:text-primary"
            >
              <Users className="size-5 shrink-0 text-primary" aria-hidden />
              {showMoney && typeof data.clients === "number" ? (
                <span className="text-foreground">
                  <strong className="text-lg font-bold tabular-nums text-foreground">
                    {data.clients}
                  </strong>{" "}
                  <span className="text-sm font-medium text-muted-foreground">
                    klijenata
                  </span>
                </span>
              ) : (
                <span className="text-sm font-medium text-muted-foreground">
                  Klijenti
                </span>
              )}
            </Link>
            <Link
              href="/calendar"
              className="flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary/10 px-3 py-1.5 text-foreground shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/15"
            >
              <CalendarDays className="size-5 shrink-0 text-primary" aria-hidden />
              <span>
                <strong className="text-lg font-bold tabular-nums text-foreground">
                  {data.todayAppointments}
                </strong>{" "}
                <span className="text-sm font-medium text-muted-foreground">
                  termina danas
                </span>
              </span>
            </Link>
            {showMoney && typeof data.revenue === "number" ? (
              <span className="flex items-center gap-2.5 text-foreground">
                <TrendingUp
                  className="size-5 shrink-0 text-emerald-600 dark:text-emerald-400"
                  aria-hidden
                />
                <span className="text-sm font-medium text-muted-foreground">
                  Prihod danas:{" "}
                  <strong className="text-lg font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                    {formatRsd(data.revenue)}
                  </strong>
                </span>
              </span>
            ) : null}
            {!showMoney && data.nextAppointment ? (
              <span className="text-sm text-muted-foreground">
                Sledeći:{" "}
                <strong className="font-semibold text-foreground">
                  {data.nextAppointment}
                </strong>
              </span>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
