"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, TrendingUp, Users } from "lucide-react";
import { getDashboard } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRsd } from "@/lib/formatMoney";
import { cn } from "@/lib/utils";
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
    <div
      className={cn(
        "hidden border-b border-zinc-200/80 bg-gradient-to-r from-white/90 via-zinc-50/90 to-white/90 px-4 py-2.5 backdrop-blur-md dark:border-zinc-800 dark:from-zinc-950/90 dark:via-zinc-900/80 dark:to-zinc-950/90 md:block"
      )}
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-2 sm:px-4 lg:px-6">
        {loading ? (
          <div className="flex flex-wrap gap-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-32" />
            {showMoney ? <Skeleton className="h-5 w-36" /> : null}
          </div>
        ) : err ? (
          <p className="text-xs text-zinc-500">{err}</p>
        ) : data ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
            <Link
              href="/clients"
              className="flex items-center gap-2 text-zinc-600 transition-all duration-200 ease-out hover:scale-[1.02] hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              <Users className="size-4 text-zinc-400" aria-hidden />
              {showMoney && typeof data.clients === "number" ? (
                <span>
                  <strong className="font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                    {data.clients}
                  </strong>{" "}
                  klijenata
                </span>
              ) : (
                <span className="text-zinc-500">Klijenti</span>
              )}
            </Link>
            <Link
              href="/calendar"
              className="flex items-center gap-2 rounded-lg bg-amber-50/90 px-2 py-0.5 text-amber-950 ring-1 ring-amber-200/80 transition-all duration-200 ease-out hover:scale-[1.02] hover:shadow-md dark:bg-amber-950/30 dark:text-amber-100 dark:ring-amber-800/60"
            >
              <CalendarDays className="size-4 text-amber-700 dark:text-amber-300" aria-hidden />
              <span>
                <strong className="font-semibold tabular-nums">
                  {data.todayAppointments}
                </strong>{" "}
                termina danas
              </span>
            </Link>
            {showMoney && typeof data.revenue === "number" ? (
              <span className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                <span>
                  Prihod danas:{" "}
                  <strong className="font-semibold tabular-nums text-emerald-800 dark:text-emerald-300">
                    {formatRsd(data.revenue)}
                  </strong>
                </span>
              </span>
            ) : null}
            {!showMoney && data.nextAppointment ? (
              <span className="text-xs text-zinc-500">
                Sledeći:{" "}
                <strong className="text-zinc-800 dark:text-zinc-200">
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
