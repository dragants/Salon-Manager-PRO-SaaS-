"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, TrendingUp, Users } from "lucide-react";
import { getDashboard } from "@/lib/api";
import { getApiErrorMessage } from "@/lib/api/errors";
import { formatRsd } from "@/lib/formatMoney";
import { useAuth } from "@/providers/auth-provider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
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
      className="app-stat-strip hidden px-4 py-3 md:block"
    >
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-start gap-3 px-2 sm:px-4 lg:px-6">
        {loading ? (
          <div className="flex flex-wrap gap-3">
            <Skeleton className="h-12 w-36 rounded-[10px]" />
            <Skeleton className="h-12 w-40 rounded-[10px]" />
            {showMoney ? <Skeleton className="h-12 w-48 rounded-[10px]" /> : null}
          </div>
        ) : err ? (
          <p className="text-sm text-destructive">{err}</p>
        ) : data ? (
          <div className="flex flex-wrap items-stretch gap-3">
            <Link href="/clients" className="app-stat-chip">
              <Users
                className="size-5 shrink-0 text-primary"
                aria-hidden
                strokeWidth={2.1}
              />
              {showMoney && typeof data.clients === "number" ? (
                <div className="min-w-0 text-left">
                  <p className="app-stat-chip__value leading-none">
                    {data.clients}
                  </p>
                  <p className="app-stat-chip__label">klijenata</p>
                </div>
              ) : (
                <span className="app-stat-chip__label text-foreground">Klijenti</span>
              )}
            </Link>
            <Link href="/calendar" className="app-stat-chip">
              <CalendarDays
                className="size-5 shrink-0 text-primary"
                strokeWidth={2.1}
                aria-hidden
              />
              <div className="min-w-0 text-left">
                <p className="app-stat-chip__value leading-none">
                  {data.todayAppointments}
                </p>
                <p className="app-stat-chip__label">termina danas</p>
              </div>
            </Link>
            {showMoney && typeof data.revenue === "number" ? (
              <div
                className={cn(
                  "app-stat-chip",
                  "cursor-default hover:border-border hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)]"
                )}
                role="status"
              >
                <TrendingUp
                  className="size-5 shrink-0 text-primary"
                  strokeWidth={2.1}
                  aria-hidden
                />
                <div className="min-w-0 text-left">
                  <p className="app-stat-chip__value text-primary leading-none">
                    {formatRsd(data.revenue)}
                  </p>
                  <p className="app-stat-chip__label">prihod danas</p>
                </div>
              </div>
            ) : null}
            {!showMoney && data.nextAppointment ? (
              <div
                className="app-stat-chip cursor-default hover:border-border"
                role="status"
              >
                <span className="app-stat-chip__label w-full sm:w-auto">
                  Sledeći:{" "}
                  <strong className="font-semibold text-foreground">
                    {data.nextAppointment}
                  </strong>
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
