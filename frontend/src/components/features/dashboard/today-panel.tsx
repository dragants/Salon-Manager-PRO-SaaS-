"use client";

import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useT } from "@/lib/i18n/locale";
import { cn } from "@/lib/utils";
import { appointmentStaffLabel } from "@/components/features/calendar/calendar-utils";
import {
  formatApptTimeRange,
  statusLabel,
  statusStyles,
  todayHeadingInTz,
} from "./dashboard-utils";
import type { AppointmentRow } from "@/types/appointment";

type TodayAppointmentsPanelProps = {
  todayList: AppointmentRow[] | null;
  todayLoading: boolean;
  todayError: string | null;
  tz: string;
  calendarDayUrl: string;
};

export function TodayAppointmentsPanel({
  todayList,
  todayLoading,
  todayError,
  tz,
  calendarDayUrl,
}: TodayAppointmentsPanelProps) {
  const t = useT();
  const router = useRouter();

  return (
    <div className="dash-card flex min-h-[200px] flex-col p-5">
      <div className="border-b border-border pb-3">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          {t.common.today}
        </h2>
        <p className="mt-1 text-sm capitalize text-muted-foreground">
          {todayHeadingInTz(tz)}
        </p>
      </div>
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pt-3">
        {todayLoading ? (
          <div className="space-y-2" aria-busy="true">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : todayError ? (
          <p className="text-sm text-red-300">{todayError}</p>
        ) : todayList && todayList.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              {t.calendar.noAppointments}
            </p>
            <Button
              type="button"
              className="dash-btn rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:opacity-90"
              onClick={() => {
                toast.info(t.calendar.newAppointment);
                router.push(calendarDayUrl);
              }}
            >
              {t.calendar.newAppointment}
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
                      {formatApptTimeRange(a.date, a.service_duration, tz)}
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
  );
}

/* ── Quick overview panel ── */

type QuickOverviewPanelProps = {
  freeSlots: number | null;
  busyToday: number;
  visible: boolean;
};

export function QuickOverviewPanel({
  freeSlots,
  busyToday,
  visible,
}: QuickOverviewPanelProps) {
  if (!visible) return null;

  return (
    <div className="dash-card flex min-h-[128px] flex-col justify-between p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        Brzi pregled
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold tabular-nums text-foreground">
            {freeSlots ?? 0}
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
        * Procena: radni sati / prosečno trajanje usluge, umanjeno za današnje termine
      </p>
    </div>
  );
}
